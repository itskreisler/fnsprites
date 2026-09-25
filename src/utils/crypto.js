/**
 * @file crypto.js
 * @description Utilidades criptográficas basadas en WebCrypto (crypto.subtle).
 *
 * NOTA: `import * as CryptoUtils from 'crypto'` es un módulo de Node (Buffer,
 * createCipheriv...) que NO existe en el navegador. Aquí usamos el estándar
 * del navegador: cifrado autenticado AES-256-GCM con IV aleatorio y derivación
 * de clave por SHA-256. Requiere contexto seguro (HTTPS o localhost).
 */

const enc = new TextEncoder();
const dec = new TextDecoder();

/**
 * Generate cryptographically-random bytes.
 * @param {number} count - Number of bytes.
 * @returns {Uint8Array}
 */
export function randomBytes(count) {
    const bytes = new Uint8Array(count);
    crypto.getRandomValues(bytes);
    return bytes;
}

/**
 * Encode a byte array to base64.
 * @param {ArrayBuffer|Uint8Array} data - Raw bytes.
 * @returns {string}
 */
export function toBase64(data) {
    const bytes = data instanceof Uint8Array ? data : new Uint8Array(data);
    let bin = '';
    for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
    return btoa(bin);
}

/**
 * Decode a base64 string to a byte array.
 * @param {string} b64 - Base64 payload.
 * @returns {Uint8Array}
 */
export function fromBase64(b64) {
    const bin = atob(b64);
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    return bytes;
}

function hexToBytes(hex) {
    const bytes = new Uint8Array(hex.length / 2);
    for (let i = 0; i < bytes.length; i++) bytes[i] = parseInt(hex.substr(i * 2, 2), 16);
    return bytes;
}

/**
 * SHA-256 digest of a string, hex-encoded.
 * @param {string} text - Input string.
 * @returns {Promise<string>} Hex digest.
 */
export async function sha256Hex(text) {
    const digest = await crypto.subtle.digest('SHA-256', enc.encode(text));
    return Array.from(new Uint8Array(digest))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
}

async function importAesKey(keyMaterialHex) {
    if (!/^[0-9a-f]{64}$/i.test(keyMaterialHex)) {
        throw new Error('Clave AES inválida: se esperan 64 hex (32 bytes)');
    }
    return crypto.subtle.importKey(
        'raw',
        hexToBytes(keyMaterialHex),
        { name: 'AES-GCM' },
        false,
        ['encrypt', 'decrypt']
    );
}

/**
 * Encrypt text with AES-256-GCM. Output layout: [12-byte IV][ciphertext+tag] en base64.
 * @param {string} plaintext - Text to encrypt.
 * @param {string} keyMaterialHex - 64 hex chars (32-byte key material).
 * @returns {Promise<string>} Base64 (IV || ciphertext).
 */
export async function aesGcmEncrypt(plaintext, keyMaterialHex) {
    const key = await importAesKey(keyMaterialHex);
    const iv = randomBytes(12);
    const cipher = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, enc.encode(plaintext));
    const payload = new Uint8Array(iv.length + cipher.byteLength);
    payload.set(iv, 0);
    payload.set(new Uint8Array(cipher), iv.length);
    return toBase64(payload);
}

/**
 * Decrypt a payload produced by aesGcmEncrypt.
 * @param {string} payloadB64 - Base64 (IV || ciphertext).
 * @param {string} keyMaterialHex - 64 hex chars (32-byte key material).
 * @returns {Promise<string>} Decrypted text.
 */
export async function aesGcmDecrypt(payloadB64, keyMaterialHex) {
    const key = await importAesKey(keyMaterialHex);
    const payload = fromBase64(payloadB64);
    const iv = payload.slice(0, 12);
    const cipher = payload.slice(12);
    const plain = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, cipher);
    return dec.decode(plain);
}