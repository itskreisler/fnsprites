/**
 * @file storage.js
 * @description Wrapper de almacenamiento agnóstico (localStorage / sessionStorage).
 *
 * Elige el tipo de almacenamiento en cada llamada vía TypesStorages; si un día
 * quieres mover una clave de storage, solo cambias el tipo en esa llamada, sin
 * tocar `localStorage`/`sessionStorage` a pelo en el resto del código.
 */

/* ---------- Tipos de almacenamiento ---------- */

export const TypesStorages = Object.freeze({
    LOCAL_STORAGE: 'localStorage',
    SESSION_STORAGE: 'sessionStorage',
});

const DEFAULT_TYPE = TypesStorages.LOCAL_STORAGE;

/**
 * Safe access to the underlying Storage object.
 * @private
 * @param {string} type - TypesStorages.* value.
 * @returns {Storage}
 */
function getStore(type) {
    const store = type === TypesStorages.SESSION_STORAGE
        ? (typeof sessionStorage !== 'undefined' ? sessionStorage : null)
        : (typeof localStorage !== 'undefined' ? localStorage : null);
    if (!store) throw new Error(`Storage "${type}" no disponible`);
    return store;
}

/**
 * Compose a namespaced storage key with an optional prefix.
 * @param {string|null} prefix - Namespace prefix (null to skip).
 * @param {string} key - Base key.
 * @returns {string}
 */
export function generateKeyWithPrefix(prefix, key) {
    if (prefix === null || prefix === undefined || prefix === '') return key;
    return `${prefix}-${key}`;
}

/**
 * Save a value to the selected storage (objects/arrays are JSON-serialized).
 * @param {string|null} prefix - Namespace prefix.
 * @param {string} key - Storage key.
 * @param {unknown} value - Value to store.
 * @param {string} [type=TypesStorages.LOCAL_STORAGE] - Storage destination.
 * @returns {void}
 */
export function storageSet(prefix, key, value, type = DEFAULT_TYPE) {
    try {
        const serialized = value !== null && typeof value === 'object' ? JSON.stringify(value) : String(value);
        getStore(type).setItem(generateKeyWithPrefix(prefix, key), serialized);
    } catch (err) {
        console.warn(`Unable to save key "${key}" to ${type}:`, err);
    }
}

/**
 * Retrieve a raw string from the selected storage.
 * @param {string|null} prefix - Namespace prefix.
 * @param {string} key - Storage key.
 * @param {string} [type=TypesStorages.LOCAL_STORAGE] - Storage source.
 * @returns {string|null}
 */
export function storageGet(prefix, key, type = DEFAULT_TYPE) {
    try {
        return getStore(type).getItem(generateKeyWithPrefix(prefix, key));
    } catch (_) {
        return null;
    }
}

/**
 * Remove a key from the selected storage.
 * @param {string|null} prefix - Namespace prefix.
 * @param {string} key - Storage key.
 * @param {string} [type=TypesStorages.LOCAL_STORAGE] - Storage source.
 * @returns {void}
 */
export function storageDelete(prefix, key, type = DEFAULT_TYPE) {
    try {
        getStore(type).removeItem(generateKeyWithPrefix(prefix, key));
    } catch (_) { /* noop */ }
}

/**
 * Clear the selected storage.
 * @param {string} [type=TypesStorages.LOCAL_STORAGE] - Storage to clear.
 * @returns {void}
 */
export function storageClear(type = DEFAULT_TYPE) {
    try {
        getStore(type).clear();
    } catch (_) { /* noop */ }
}

/* ---------- Backward-compatible helpers (localStorage only) ---------- */

/**
 * Save a key-value pair to localStorage safely.
 * @param {string} key - Storage key.
 * @param {unknown} value - Storage value.
 * @returns {void}
 */
export function persist(key, value) {
    storageSet(null, key, value, TypesStorages.LOCAL_STORAGE);
}

/**
 * Retrieve a JSON array from localStorage safely.
 * @param {string} key - Storage key.
 * @returns {Array<string>} Parsed array or empty array on failure.
 */
export function readStoredArray(key) {
    const item = storageGet(null, key, TypesStorages.LOCAL_STORAGE);
    if (!item) return [];
    try {
        const value = JSON.parse(item);
        return Array.isArray(value) ? value : [];
    } catch {
        return [];
    }
}

/**
 * Filter an array of IDs to unique entries present in valid ID set.
 * @param {Array<string>} ids - Input list of sprite IDs.
 * @param {Set<string>} validIds - Set of recognized sprite IDs.
 * @returns {Array<string>} Filtered unique array of valid sprite IDs.
 */
export function uniqueValidIds(ids, validIds) {
    if (!Array.isArray(ids)) return [];
    return [...new Set(ids)].filter(id => validIds.has(id));
}