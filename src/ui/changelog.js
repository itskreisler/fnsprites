/**
 * @file changelog.js
 * @description Update notes modal. Shows the latest changelog entry to new
 * users and re-shows it whenever a new version is pushed (the modal key is
 * the entry `version`, so bumping it invalidates the seen flag).
 *
 * The seen-flag lives in sessionStorage: it survives page reloads inside the
 * same tab/session but resets per new session, so an update is not lost for
 * users who reload during a session.
 */

import { getCurrentLocale, getTranslator } from './commonUi.js';

const SEEN_KEY = 'fnsprites_changelog_seen';
const MODAL_OVERLAY_ID = 'changelogOverlay';

/**
 * Latest changelog entries, newest first. Bilingual per item.
 * `version` must be unique per release; bump it to show the modal again.
 */
export const CHANGELOG = [
    {
        version: '2026-09-24',
        date: '2026-09-24',
        title: { es: 'Notas de actualización', en: 'Update notes', de: 'Update-Hinweise' },
        notes: [
            {
                es: 'Sincronización opcional con Google Drive: respaldo automático de tu colección con un clic.',
                en: 'Optional Google Drive sync: automatic backup of your collection with one click.',
                de: 'Optionaler Google-Drive-Sync: automatisches Backup deiner Sammlung mit einem Klick.',
            },
            {
                es: 'Importados 101 sprites de la Temporada Override (C7S4) y nuevo tema Bounty.',
                en: 'Imported 101 Override Season (C7S4) sprites plus the new Bounty theme.',
                de: '101 Override-Saison (C7S4) Sprites und das neue Bounty-Thema wurden importiert.',
            },
        ],
    },
];

function pickLocalized(item) {
    if (item && typeof item === 'object') {
        const locale = getCurrentLocale();
        return item[locale] || item.es || item.en || Object.values(item)[0] || '';
    }
    return String(item ?? '');
}

function buildModal(entry) {
    const t = getTranslator();
    const overlay = document.createElement('div');
    overlay.id = MODAL_OVERLAY_ID;
    overlay.className = 'changelog-overlay';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.setAttribute('aria-label', t('changelog.header'));

    const modal = document.createElement('div');
    modal.className = 'changelog-modal';
    overlay.appendChild(modal);

    const header = document.createElement('div');
    header.className = 'changelog-header';

    const title = document.createElement('h2');
    title.className = 'changelog-title';
    title.textContent = pickLocalized(entry.title);
    header.appendChild(title);

    const version = document.createElement('span');
    version.className = 'changelog-meta';
    version.textContent = [entry.date, entry.version].filter(Boolean).filter((v, i, a) => a.indexOf(v) === i).join(' · ');
    header.appendChild(version);

    modal.appendChild(header);

    const list = document.createElement('ul');
    list.className = 'changelog-list';
    for (const note of entry.notes || []) {
        const li = document.createElement('li');
        li.textContent = pickLocalized(note);
        list.appendChild(li);
    }
    modal.appendChild(list);

    const footer = document.createElement('div');
    footer.className = 'changelog-footer';
    const gotIt = document.createElement('button');
    gotIt.type = 'button';
    gotIt.className = 'btn btn-accent';
    gotIt.textContent = t('changelog.gotIt');
    footer.appendChild(gotIt);
    modal.appendChild(footer);

    function close() {
        overlay.classList.add('closing');
        overlay.addEventListener('transitionend', () => overlay.remove(), { once: true });
        setTimeout(() => overlay.remove(), 300);
        document.removeEventListener('keydown', onKey);
    }
    function onKey(e) {
        if (e.key === 'Escape') close();
    }
    gotIt.addEventListener('click', close);
    overlay.addEventListener('click', (e) => { if (e.target === overlay) close(); });
    document.addEventListener('keydown', onKey);

    return { overlay, close };
}

/**
 * Show the changelog modal once per version within the current session.
 * Marks it as seen as soon as it is rendered so reloads don't re-trigger it.
 */
export function initChangelogModal() {
    const current = CHANGELOG[0];
    if (!current) return;

    let seen = null;
    try {
        seen = sessionStorage.getItem(SEEN_KEY);
    } catch (_) {
        // storage unavailable (private mode): still show on first paint
        return;
    }
    if (seen === current.version) return;

    const { overlay } = buildModal(current);
    document.body.appendChild(overlay);
    requestAnimationFrame(() => overlay.classList.add('visible'));

    try {
        sessionStorage.setItem(SEEN_KEY, current.version);
    } catch (_) {
        /* ignore */
    }
}