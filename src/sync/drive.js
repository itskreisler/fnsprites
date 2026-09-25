/**
 * @file drive.js
 * @description Sincronización aislada con Google Drive (scope drive.file).
 *
 * Flujo: GIS token client (implicit) -> Google Drive REST API v3.
 * El token se guarda CIFRADO (WebCrypto AES-256-GCM) en localStorage.
 *
 * API expuesta (sin UI): configureDrive, loadGisScript, getAccessToken,
 * signOut, isSignedIn, restoreSession, getAuthStatus, getAccountInfo,
 * findFile, uploadObject, downloadObject, removeFile, saveBackup, loadBackup,
 * mergePayloads, mergeStates, createAutosaver, buildPayload, isValidPayload.
 * UI/estado viven en syncController.js; sandbox manual en test.html.
 */

import { securedDelete, securedGet, securedSet } from '../utils/securedStorage.js';

export const DRIVE_SCOPE = 'https://www.googleapis.com/auth/drive.file';
export const DEFAULT_FILENAME = 'fnsprites-backup.json';
export const GIS_SRC = 'https://accounts.google.com/gsi/client';
export const BACKUP_APP_ID = 'fnsprites';
export const BACKUP_VERSION = 1;

const API_BASE = 'https://www.googleapis.com/drive/v3';
const UPLOAD_BASE = 'https://www.googleapis.com/upload/drive/v3';
const USERINFO_URL = 'https://openidconnect.googleapis.com/v1/userinfo';

/**
 * El token se persiste CIFRADO (AES-256-GCM vía WebCrypto) en localStorage,
 * para sobrevivir a recargas Y a la apertura de nuevas pestañas, y protegerse
 * ante lectura casual del storage. Cifrado/descifrado es asíncrono.
 */
const TOKEN_STORAGE_KEY = 'fnsprites_drive_token';
const TOKEN_PREFIX = 'sync';

let config = null;
let tokenClient = null;
let accessToken = null;
let tokenExpiresAt = 0;
let lastTokenResp = null;
let tokenWaiters = null;
let restorePromise = null;

async function storeStoredToken() {
    try {
        await securedSet(TOKEN_PREFIX, TOKEN_STORAGE_KEY, { access_token: accessToken, expires_at: tokenExpiresAt });
    } catch (_) {}
}

function clearStoredToken() {
    securedDelete(TOKEN_PREFIX, TOKEN_STORAGE_KEY);
}

async function restoreStoredToken() {
    try {
        const data = await securedGet(TOKEN_PREFIX, TOKEN_STORAGE_KEY);
        if (data && data.access_token && data.expires_at > Date.now()) {
            accessToken = data.access_token;
            tokenExpiresAt = data.expires_at;
            lastTokenResp = { access_token: data.access_token };
        } else {
            if (data) clearStoredToken();
        }
    } catch (_) {
        clearStoredToken();
    }
}

/**
 * Resolve a pending (or new) restore of the stored token. Idempotent.
 * @returns {Promise<void>}
 */
export function restoreSession() {
    if (!restorePromise) {
        restorePromise = restoreStoredToken().catch(() => {});
        restorePromise.finally(() => { restorePromise = null; });
    }
    return restorePromise;
}

let tokenRequestPending = false;

/* ---------- SDK ---------- */

export function isGisLoaded() {
    return typeof window !== 'undefined' && !!window.google?.accounts?.oauth2;
}

export function loadGisScript() {
    return new Promise((resolve, reject) => {
        if (isGisLoaded()) return resolve();
        let script = document.querySelector('script[data-gsi]');
        if (!script) {
            script = document.createElement('script');
            script.src = GIS_SRC;
            script.async = true;
            script.dataset.gsi = '1';
            document.head.appendChild(script);
        }
        script.onload = () => (isGisLoaded() ? resolve() : reject(new Error('GIS cargado pero google.accounts.oauth2 no está disponible')));
        script.onerror = () => reject(new Error('No se pudo cargar GIS desde accounts.google.com'));
    });
}

export function isConfigured() {
    return !!config;
}

export function configureDrive(options) {
    const cfg = options || {};
    if (!cfg.clientId) throw new Error('clientId requerido: es el "OAuth Client ID" (tipo Web application) de Google Cloud Console');
    config = {
        clientId: cfg.clientId,
        scope: cfg.scope || DRIVE_SCOPE,
        filename: cfg.filename || DEFAULT_FILENAME,
    };
    tokenClient = null;
    accessToken = null;
    tokenExpiresAt = 0;
    tokenWaiters = null;
    tokenRequestPending = false;
    restorePromise = null;
    restoreSession();
    return { ...config };
}

/* ---------- Auth (token flow) ---------- */

function getTokenClient() {
    if (!config) throw new Error('configureDrive() primero');
    if (!isGisLoaded()) throw new Error('GIS no cargado: llama loadGisScript()');
    if (!tokenClient) {
        tokenClient = window.google.accounts.oauth2.initTokenClient({
            client_id: config.clientId,
            scope: config.scope,
            callback: handleTokenResponse,
        });
    }
    return tokenClient;
}

function handleTokenResponse(resp) {
    tokenRequestPending = false;
    if (resp.error) {
        const err = new Error(resp.error + (resp.error_description ? ' — ' + resp.error_description : ''));
        flushTokenWaiters(err);
        return;
    }
    accessToken = resp.access_token;
    tokenExpiresAt = (resp.expires_in ? Date.now() + resp.expires_in * 1000 : Date.now() + 3600_000);
    lastTokenResp = resp;
    storeStoredToken();
    flushTokenWaiters(null);
}

function flushTokenWaiters(err) {
    const waiters = tokenWaiters;
    tokenWaiters = null;
    if (!waiters) return;
    waiters.forEach((w) => (err ? w.reject(err) : w.resolve(lastTokenResp)));
}

export function isSignedIn() {
    return !!(accessToken && Date.now() < tokenExpiresAt);
}

export function getAccessToken({ consent = false } = {}) {
    return new Promise((resolve, reject) => {
        restoreSession().then(() => {
            if (isSignedIn()) return resolve(lastTokenResp || { access_token: accessToken });
            tokenWaiters = tokenWaiters || [];
            tokenWaiters.push({ resolve, reject });
            if (tokenRequestPending) return;
            try {
                tokenRequestPending = true;
                getTokenClient().requestAccessToken(consent ? { prompt: 'consent' } : undefined);
            } catch (err) {
                tokenRequestPending = false;
                flushTokenWaiters(err);
            }
        });
    });
}

export function signOut() {
    try {
        if (accessToken && window.google?.accounts?.oauth2) window.google.accounts.oauth2.revoke(accessToken, () => {});
        if (window.google?.accounts?.id?.disableAutoSelect) window.google.accounts.id.disableAutoSelect();
    } catch (e) { /* noop */ }
    accessToken = null;
    tokenExpiresAt = 0;
    tokenClient = null;
    tokenWaiters = null;
    tokenRequestPending = false;
    clearStoredToken();
}

export function getAuthStatus() {
    return {
        configured: !!config,
        sdkLoaded: isGisLoaded(),
        signedIn: isSignedIn(),
        clientId: config ? config.clientId : null,
        expiresAt: tokenExpiresAt || null,
    };
}

/* ---------- Cuenta (email) ---------- */

function decodeTokenPayload(jwt) {
    const part = jwt.split('.')[1];
    const b64 = part.replace(/-/g, '+').replace(/_/g, '/');
    const padded = b64.padEnd(Math.ceil(b64.length / 4) * 4, '=');
    const bytes = atob(padded);
    const arr = new Uint8Array(bytes.length);
    for (let i = 0; i < bytes.length; i++) arr[i] = bytes.charCodeAt(i);
    return new TextDecoder().decode(arr);
}

/**
 * Resolve the connected Google account email (used for the sync status label).
 * Tries the id_token claim first, then the OIDC userinfo endpoint.
 * @returns {Promise<{email: string} | null>} null if unavailable.
 */
export async function getAccountInfo() {
    if (!isSignedIn()) return null;
    const idToken = lastTokenResp && lastTokenResp.id_token;
    if (idToken) {
        try {
            const payload = JSON.parse(decodeTokenPayload(idToken));
            if (payload && payload.email) return { email: payload.email };
        } catch (_) {}
    }
    try {
        const res = await apiFetch(`${USERINFO_URL}?alt=json`);
        const data = await res.json();
        return (data && data.email) ? { email: data.email } : null;
    } catch (_) {
        return null;
    }
}

/* ---------- Drive REST ---------- */

async function apiFetch(url, { method = 'GET', body } = {}) {
    const token = (await getAccessToken()).access_token;
    const res = await fetch(url, {
        method,
        body,
        headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) {
        let msg = `Drive ${method} ${url} falló (${res.status})`;
        try {
            const parsed = await res.json();
            msg += ' — ' + (parsed.error?.message || JSON.stringify(parsed.error));
        } catch (e) {
            const text = await res.text().catch(() => '');
            if (text) msg += ' — ' + text.slice(0, 160);
        }
        throw new Error(msg);
    }
    return res;
}

export async function findFile() {
    const escaped = config.filename.replace(/'/g, "\\'");
    const q = `name='${escaped}' and trashed=false`;
    const res = await apiFetch(
        `${API_BASE}/files?q=${encodeURIComponent(q)}&spaces=drive&fields=files(id,name,modifiedTime,size,mimeType)&pageSize=1`
    );
    const json = await res.json();
    return (json.files && json.files[0]) || null;
}

export async function uploadObject(data, fileId) {
    const metadata = new Blob(
        [JSON.stringify({ name: config.filename, mimeType: 'application/json' })],
        { type: 'application/json; charset=UTF-8' }
    );
    const file = new Blob([JSON.stringify(data)], { type: 'application/json; charset=UTF-8' });
    const fd = new FormData();
    fd.append('metadata', metadata);
    fd.append('file', file);

    const url = fileId
        ? `${UPLOAD_BASE}/files/${fileId}?uploadType=multipart`
        : `${UPLOAD_BASE}/files?uploadType=multipart`;
    const res = await apiFetch(url, { method: fileId ? 'PATCH' : 'POST', body: fd });
    return res.json();
}

export async function downloadObject(fileId) {
    const res = await apiFetch(`${API_BASE}/files/${fileId}?alt=media`);
    return res.json();
}

export async function removeFile(fileId) {
    await apiFetch(`${API_BASE}/files/${fileId}`, { method: 'DELETE' });
}

/* ---------- Payloads del tracker ---------- */

export function buildPayload(state) {
    return {
        app: BACKUP_APP_ID,
        version: BACKUP_VERSION,
        savedAt: new Date().toISOString(),
        state,
    };
}

export function isValidPayload(p) {
    return !!p && typeof p === 'object' && p.app === BACKUP_APP_ID && !!p.state && typeof p.state === 'object';
}

export async function saveBackup(state, { fileId } = {}) {
    const payload = buildPayload(state);
    const target = fileId || (await findFile())?.id;
    const res = await uploadObject(payload, target);
    return { fileId: res.id, payload };
}

export async function loadBackup() {
    const file = await findFile();
    if (!file) return null;
    const payload = await downloadObject(file.id);
    return { file, payload };
}

/* ---------- Merge ---------- */

const ARRAY_KEYS = ['obtained', 'mastered', 'lost'];

export function mergeStates(localState, remoteState, { mode = 'union' } = {}) {
    if (!localState) return remoteState || null;
    if (!remoteState) return localState;
    if (mode === 'local') return localState;
    if (mode === 'remote') return remoteState;
    const out = { ...remoteState };
    for (const k of ARRAY_KEYS) {
        const a = Array.isArray(localState[k]) ? localState[k] : [];
        const b = Array.isArray(remoteState[k]) ? remoteState[k] : [];
        out[k] = [...new Set([...a, ...b])];
    }
    return out;
}

export function mergePayloads(local, remote) {
    if (!local) return remote || null;
    if (!remote) return local;
    const remoteNewer = (remote.savedAt || '') > (local.savedAt || '');
    const newer = remoteNewer ? remote : local;
    const older = remoteNewer ? local : remote;
    return {
        ...newer,
        savedAt: newer.savedAt,
        state: mergeStates(older.state, newer.state),
    };
}

/* ---------- Autosave con debounce ---------- */

export function createAutosaver(stateProvider, { fileId, delay = 800, onResult, onError } = {}) {
    let timer = null;
    const saveNow = async () => {
        try {
            const state = typeof stateProvider === 'function' ? stateProvider() : stateProvider;
            const res = await saveBackup(state, { fileId });
            const ref = { ...res };
            onResult && onResult(ref);
            return ref;
        } catch (err) {
            onError && onError(err);
            throw err;
        }
    };
    return {
        schedule() {
            clearTimeout(timer);
            timer = setTimeout(saveNow, delay);
        },
        flush() {
            clearTimeout(timer);
            return saveNow();
        },
    };
}