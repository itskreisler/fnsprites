/**
 * @file syncController.js
 * @description UI + wiring for optional Google Drive backup sync.
 * Works standalone from app.js via hooks; degrades to no-op if the DOM
 * button is missing (or hidden in view-only mode).
 */

import { getTranslator } from '../ui/commonUi.js';
import { showToast } from '../utils/toast.js';
import { storageDelete, storageGet, storageSet, TypesStorages } from '../utils/storage.js';
import { DRIVE_CLIENT_ID } from './config.js';
import {
    DRIVE_SCOPE,
    buildPayload,
    configureDrive,
    createAutosaver,
    getAccessToken,
    getAccountInfo,
    isGisLoaded,
    isSignedIn,
    isValidPayload,
    loadBackup,
    loadGisScript,
    mergePayloads,
    mergeStates,
    restoreSession,
    signOut,
} from './drive.js';

const EMAIL_STORAGE_KEY = 'fnsprites_drive_email';

function maskEmail(email) {
    const at = email.indexOf('@');
    if (at <= 1) return email;
    return `${email[0]}***@${email.slice(at + 1)}`;
}

/**
 * Initialize the Drive sync controller.
 * @param {{getState: () => {obtained: string[], mastered: string[], lost: string[]}, applyRemoteState: (s: {obtained: string[], mastered: string[], lost: string[]}) => void}} hooks
 * @returns {{scheduleAutosave: () => void, flush: () => Promise<void>, refresh: () => void} | null}
 */
export function initDriveSync({ getState, applyRemoteState }) {
    const btn = document.getElementById('syncBtn');
    const statusEl = document.getElementById('syncStatus');
    if (!btn) return null;

    configureDrive({ clientId: DRIVE_CLIENT_ID, scope: `openid email profile ${DRIVE_SCOPE}` });

    let autosaver = null;
    let lastSyncAt = null;
    let accountEmail = null;
    let accountResolved = false;
    let revealEmail = false;
    let fetchingAccount = false;
    const label = btn.querySelector('.sync-label');

    try {
        accountEmail = storageGet(null, EMAIL_STORAGE_KEY, TypesStorages.LOCAL_STORAGE) || null;
    } catch (_) {}

    restoreSession().then(() => refresh());

    function setLabel(text) {
        if (label) label.textContent = text;
    }

    async function resolveAccount() {
        if (fetchingAccount || accountResolved) return;
        fetchingAccount = true;
        try {
            const info = await getAccountInfo();
            if (info && info.email) {
                accountEmail = info.email;
                try { storageSet(null, EMAIL_STORAGE_KEY, accountEmail, TypesStorages.LOCAL_STORAGE); } catch (_) {}
            }
        } catch (_) {}
        finally {
            fetchingAccount = false;
            accountResolved = true;
            refresh();
        }
    }

    function refresh() {
        const t = getTranslator();
        btn.hidden = false;
        const signedIn = isSignedIn();
        setLabel(t(signedIn ? 'sync.signOut' : 'sync.signIn'));
        btn.setAttribute('aria-pressed', String(signedIn));
        if (!statusEl) return;
        if (signedIn) {
            let text = accountEmail ? (revealEmail ? accountEmail : maskEmail(accountEmail)) : t('sync.connected');
            if (lastSyncAt) text += ' · ' + t('sync.lastSync', { time: lastSyncAt.toLocaleTimeString() });
            statusEl.textContent = text;
            statusEl.classList.toggle('sync-email', !!accountEmail);
            statusEl.title = accountEmail ? t('sync.toggleEmail') : '';
            statusEl.hidden = false;
            resolveAccount();
        } else {
            statusEl.hidden = true;
            revealEmail = false;
            statusEl.classList.remove('sync-email');
        }
    }

    function localSnapshot() {
        const s = getState();
        return { obtained: s.obtained, mastered: s.mastered, lost: s.lost };
    }

    function hasAnyData(state) {
        return !!(state && ((state.obtained && state.obtained.length)
            || (state.mastered && state.mastered.length)
            || (state.lost && state.lost.length)));
    }

    function formatBytes(bytes) {
        if (!Number.isFinite(bytes) || bytes <= 0) return '0 B';
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
        return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
    }

    function formatDateTime(iso) {
        if (!iso) return '—';
        const d = new Date(iso);
        if (Number.isNaN(d.getTime())) return '—';
        return `${d.toLocaleDateString()} ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    }

    function stateCounts(state) {
        state = state || {};
        return {
            owned: Array.isArray(state.obtained) ? state.obtained.length : 0,
            mastered: Array.isArray(state.mastered) ? state.mastered.length : 0,
            lost: Array.isArray(state.lost) ? state.lost.length : 0,
        };
    }

    function payloadMeta(payload, file) {
        const bytes = (file && Number(file.size)) || (payload
            ? new TextEncoder().encode(JSON.stringify(payload)).length : 0);
        return {
            date: formatDateTime((file && file.modifiedTime) || (payload && payload.savedAt)),
            size: formatBytes(bytes),
            counts: stateCounts(payload && payload.state),
        };
    }

    function buildConflictCard(label, meta, t) {
        const card = document.createElement('div');
        card.className = 'sync-conflict-card';
        const title = document.createElement('h3');
        title.textContent = label;
        card.appendChild(title);
        const rows = [
            [t('sync.modifiedAt'), meta.date],
            [t('sync.fileSize'), meta.size],
            [t('sync.ownedLabel'), String(meta.counts.owned)],
            [t('sync.masteredLabel'), String(meta.counts.mastered)],
            [t('sync.lostLabel'), String(meta.counts.lost)],
        ];
        for (const [lbl, val] of rows) {
            const row = document.createElement('div');
            row.className = 'sync-conflict-row';
            const l = document.createElement('span');
            l.className = 'lbl';
            l.textContent = lbl;
            const v = document.createElement('span');
            v.className = 'val';
            v.textContent = val;
            row.append(l, v);
            card.appendChild(row);
        }
        return card;
    }

    /**
     * Show a conflict-resolution modal asking which data to keep.
     * @param {Object} localPayload - Local backup payload ({app, version, savedAt, state}).
     * @param {Object} remotePayload - Remote backup payload from Drive.
     * @param {Object} [remoteFile] - Drive file metadata ({modifiedTime, size}).
     * @returns {Promise<'local'|'remote'|'merge'>}
     */
    function askSyncConflict(localPayload, remotePayload, remoteFile) {
        return new Promise((resolve) => {
            const t = getTranslator();
            const overlay = document.createElement('div');
            overlay.className = 'changelog-overlay';
            overlay.setAttribute('role', 'dialog');
            overlay.setAttribute('aria-modal', 'true');

            const modal = document.createElement('div');
            modal.className = 'changelog-modal';

            const header = document.createElement('div');
            header.className = 'changelog-header';
            const title = document.createElement('h2');
            title.className = 'changelog-title';
            title.textContent = t('sync.conflictTitle');
            header.appendChild(title);
            modal.appendChild(header);

            const body = document.createElement('p');
            body.className = 'sync-conflict-body';
            body.textContent = t('sync.conflictBody');
            modal.appendChild(body);

            const grid = document.createElement('div');
            grid.className = 'sync-conflict-grid';
            grid.appendChild(buildConflictCard(t('sync.localLabel'), payloadMeta(localPayload, null), t));
            grid.appendChild(buildConflictCard(t('sync.remoteLabel'), payloadMeta(remotePayload, remoteFile), t));
            modal.appendChild(grid);

            const mergedCounts = stateCounts(mergeStates(
                localPayload && localPayload.state,
                remotePayload && remotePayload.state
            ));
            const mergeInfo = document.createElement('p');
            mergeInfo.className = 'sync-conflict-merge';
            mergeInfo.textContent = `${t('sync.mergeResult')} ${t('sync.mergeResultCounts', {
                owned: mergedCounts.owned,
                mastered: mergedCounts.mastered,
                lost: mergedCounts.lost,
            })}`;
            modal.appendChild(mergeInfo);

            const footer = document.createElement('div');
            footer.className = 'changelog-footer';

            const finish = (choice) => {
                overlay.classList.add('closing');
                setTimeout(() => overlay.remove(), 250);
                document.removeEventListener('keydown', onKey);
                resolve(choice);
            };
            const options = [
                ['local', 'btn', t('sync.local')],
                ['remote', 'btn', t('sync.remote')],
                ['merge', 'btn btn-accent', t('sync.merge')],
            ];
            for (const [value, cls, label] of options) {
                const b = document.createElement('button');
                b.type = 'button';
                b.className = cls;
                b.textContent = label;
                b.addEventListener('click', () => finish(value));
                footer.appendChild(b);
            }
            function onKey(e) { if (e.key === 'Escape') finish('merge'); }
            document.addEventListener('keydown', onKey);
            overlay.addEventListener('click', (e) => { if (e.target === overlay) finish('merge'); });

            modal.appendChild(footer);
            overlay.appendChild(modal);
            document.body.appendChild(overlay);
            requestAnimationFrame(() => overlay.classList.add('visible'));
        });
    }

    async function connectAndMerge() {
        if (!isGisLoaded()) await loadGisScript();
        await getAccessToken();

        const t = getTranslator();
        autosaver = createAutosaver(localSnapshot, {
            onResult: () => { lastSyncAt = new Date(); refresh(); },
            onError: (err) => showToast(t('sync.error') + ': ' + err.message, 'error'),
        });
        lastSyncAt = null;

        try {
            const loaded = await loadBackup();
            if (loaded && isValidPayload(loaded.payload)) {
                const localPayload = buildPayload(localSnapshot());
                let choice = null;
                if (hasAnyData(localPayload.state) && hasAnyData(loaded.payload.state)) {
                    choice = await askSyncConflict(localPayload, loaded.payload, loaded.file);
                }
                let merged;
                if (choice === 'local') merged = localPayload;
                else if (choice === 'remote') merged = loaded.payload;
                else merged = mergePayloads(localPayload, loaded.payload);
                applyRemoteState(merged.state);
                if (choice === 'local') showToast(t('sync.keptLocal'), 'success');
                else if (choice === 'remote') showToast(t('sync.keptRemote'), 'success');
                else showToast(t('sync.merged'), 'success');
            }
        } catch (err) {
            showToast(t('sync.error') + ': ' + err.message, 'error');
        }

        await autosaver.flush();
        showToast(t('sync.signedIn'), 'success');
    }

    async function handleClick() {
        const t = getTranslator();
        if (isSignedIn()) {
            if (autosaver) autosaver.flush().catch(() => {});
            signOut();
            autosaver = null;
            lastSyncAt = null;
            accountEmail = null;
            accountResolved = false;
            try { storageDelete(null, EMAIL_STORAGE_KEY, TypesStorages.LOCAL_STORAGE); } catch (_) {}
            showToast(t('sync.signedOut'), 'info');
            refresh();
            return;
        }

        btn.disabled = true;
        setLabel(t('sync.signingIn'));
        try {
            await connectAndMerge();
        } catch (err) {
            showToast(t('sync.error') + ': ' + err.message, 'error');
        } finally {
            btn.disabled = false;
            refresh();
        }
    }

    btn.addEventListener('click', handleClick);
    if (statusEl) {
        statusEl.addEventListener('click', () => {
            if (!accountEmail) return;
            revealEmail = !revealEmail;
            refresh();
        });
    }
    refresh();

    return {
        scheduleAutosave() { if (autosaver) autosaver.schedule(); },
        flush() { return autosaver ? autosaver.flush() : Promise.resolve(); },
        refresh,
    };
}