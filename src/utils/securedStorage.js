/**
 * @file securedStorage.js
 * @description Capa de storage cifrado sobre el wrapper agnóstico (storage.js).
 *
 * Los valores se cifran con AES-256-GCM (WebCrypto) antes de persistir en
 * localStorage. La clave maestra es aleatoria, se genera una vez, se guarda
 * (cifrar con una clave que vive en el mismo origen no protege contra XSS de
 * tu propio origen; sí ante lectura casual del storage) y se deriva a una
 * clave AES-256 vía SHA-256.
 *
 * WebCrypto es asíncrono: todas las operaciones devuelven Promises.
 */

import { storageGet, storageSet, storageDelete, TypesStorages } from './storage.js';
import { randomBytes, sha256Hex, aesGcmEncrypt, aesGcmDecrypt, toBase64 } from './crypto.js';

const MASTER_KEY_ID = 'fn_sec_master';
const DEFAULT_PREFIX = null;
let masterKeyMaterial = null;

/**
 * Resolve (generating if needed) the AES key material (64 hex chars).
 * @returns {Promise<string>}
 */
async function getKeyMaterial() {
    if (masterKeyMaterial) return masterKeyMaterial;
    let raw = storageGet(DEFAULT_PREFIX, MASTER_KEY_ID, TypesStorages.LOCAL_STORAGE);
    if (!raw) {
        raw = toBase64(randomBytes(32));
        storageSet(DEFAULT_PREFIX, MASTER_KEY_ID, raw, TypesStorages.LOCAL_STORAGE);
    }
    masterKeyMaterial = await sha256Hex(raw);
    return masterKeyMaterial;
}

/**
 * Encrypt and store a value.
 * @param {string|null} prefix - Namespace prefix.
 * @param {string} key - Storage key.
 * @param {unknown} value - Value to encrypt & store (JSON-serialized).
 * @returns {Promise<void>}
 */
export async function securedSet(prefix, key, value) {
    const keyMaterial = await getKeyMaterial();
    const cipher = await aesGcmEncrypt(JSON.stringify(value), keyMaterial);
    storageSet(prefix, key, cipher, TypesStorages.LOCAL_STORAGE);
}

/**
 * Read and decrypt a stored value.
 * @param {string|null} prefix - Namespace prefix.
 * @param {string} key - Storage key.
 * @returns {Promise<unknown|null>} Parsed value or null if missing/tampered.
 */
export async function securedGet(prefix, key) {
    const cipher = storageGet(prefix, key, TypesStorages.LOCAL_STORAGE);
    if (!cipher) return null;
    const keyMaterial = await getKeyMaterial();
    let plain;
    try {
        plain = await aesGcmDecrypt(cipher, keyMaterial);
    } catch (_) {
        return null; // clave rotada/corrupta: trata como no existente
    }
    try {
        return JSON.parse(plain);
    } catch (_) {
        return null;
    }
}

/**
 * Delete a secured value.
 * @param {string|null} prefix - Namespace prefix.
 * @param {string} key - Storage key.
 * @returns {void}
 */
export function securedDelete(prefix, key) {
    storageDelete(prefix, key, TypesStorages.LOCAL_STORAGE);
}