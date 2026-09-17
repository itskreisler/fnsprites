/**
 * @file encoder.js
 * @description Base64/Bitpack compression and decompression for sharing sprite collections.
 */

const B64_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';

/**
 * Encode a binary string into URL-safe base64 characters.
 * @param {string} bits - Binary string (e.g. "101100").
 * @returns {string} Encoded string.
 */
export function encodeBits(bits) {
    let paddedBits = bits;
    while (paddedBits.length % 6 !== 0) {
        paddedBits += '0';
    }
    let code = '';
    for (let i = 0; i < paddedBits.length; i += 6) {
        const val = parseInt(paddedBits.substring(i, i + 6), 2);
        code += B64_CHARS[val];
    }
    return code.replace(/A+$/, '');
}

/**
 * Decode a URL-safe base64 string back to binary bits.
 * @param {string} code - Encoded string.
 * @returns {string} Decoded binary string.
 */
export function decodeBits(code) {
    if (!code) return '';
    let bits = '';
    for (let i = 0; i < code.length; i++) {
        const val = B64_CHARS.indexOf(code[i]);
        if (val === -1) return '';
        bits += val.toString(2).padStart(6, '0');
    }
    return bits;
}

/**
 * Compress collection arrays into a URL share string.
 * @param {Array<{id: string}>} sprites - Full ordered array of base sprites.
 * @param {string[]} obtained - List of obtained sprite IDs.
 * @param {string[]} mastered - List of mastered sprite IDs.
 * @returns {string} Compressed share string.
 */
export function compressCollection(sprites, obtained, mastered) {
    let obtainedBits = '';
    let masteredBits = '';

    sprites.forEach(s => {
        obtainedBits += obtained.includes(s.id) ? '1' : '0';
        masteredBits += mastered.includes(s.id) ? '1' : '0';
    });

    const obtainedCode = encodeBits(obtainedBits);
    const masteredCode = encodeBits(masteredBits);

    if (!masteredCode) {
        return obtainedCode;
    }
    return `${obtainedCode}~${masteredCode}`;
}

/**
 * Decompress a URL share code into obtained and mastered ID arrays.
 * @param {Array<{id: string}>} sprites - Full ordered array of base sprites.
 * @param {string} code - Compressed share code.
 * @returns {{obtained: string[], mastered: string[]}} Decoded collection arrays.
 */
export function decompressCollection(sprites, code) {
    if (!code) return { obtained: [], mastered: [] };

    const parts = code.split('~');
    if (parts.length > 2) {
        return { obtained: [], mastered: [] };
    }

    const obtainedCode = parts[0];
    const masteredCode = parts[1] || '';

    if (!/^[A-Za-z0-9\-_]*$/.test(obtainedCode) || !/^[A-Za-z0-9\-_]*$/.test(masteredCode)) {
        return { obtained: [], mastered: [] };
    }

    try {
        const obtainedBits = decodeBits(obtainedCode);
        const masteredBits = decodeBits(masteredCode);

        const obtained = [];
        const mastered = [];

        sprites.forEach((s, idx) => {
            const isObtained = obtainedBits[idx] === '1';
            const isMastered = masteredBits[idx] === '1';

            if (isObtained) {
                obtained.push(s.id);
                if (isMastered) {
                    mastered.push(s.id);
                }
            }
        });

        return { obtained, mastered };
    } catch {
        return { obtained: [], mastered: [] };
    }
}
