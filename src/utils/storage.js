/**
 * @file storage.js
 * @description Safe local storage persistence wrapper.
 */

/**
 * Save a key-value pair to localStorage safely.
 * @param {string} key - Storage key.
 * @param {unknown} value - Storage value.
 * @returns {void}
 */
export function persist(key, value) {
    try {
        const serialized = typeof value === 'object' ? JSON.stringify(value) : String(value);
        localStorage.setItem(key, serialized);
    } catch (err) {
        console.warn(`Unable to save key "${key}" to localStorage:`, err);
    }
}

/**
 * Retrieve a JSON array from localStorage safely.
 * @param {string} key - Storage key.
 * @returns {Array<string>} Parsed array or empty array on failure.
 */
export function readStoredArray(key) {
    try {
        const item = localStorage.getItem(key);
        if (!item) return [];
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
