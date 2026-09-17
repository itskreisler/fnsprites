/**
 * @file helpers.js
 * @description Helper pure functions for sprite management, labels, and formatting.
 */

import { THEME_ORDER, UI_THEME_LABELS, EXPORT_THEME_LABELS, TRADE_THEME_LABELS } from '../constants.js';

/**
 * Extract family key prefix from a sprite ID.
 * @param {{id: string}} sprite - Sprite object.
 * @returns {string} Family key prefix (e.g. "jonesy").
 */
export function getFamilyKey(sprite) {
    return sprite.id.split('_')[0];
}

/**
 * Get a Set of valid sprite IDs from an array of sprite objects.
 * @param {Array<{id: string}>} [sprites=window.baseSprites] - Array of sprites.
 * @returns {Set<string>} Set of IDs.
 */
export function getSpriteIdSet(sprites = window.baseSprites || []) {
    return new Set(sprites.map(s => s.id));
}

/**
 * Get season display name and image icon path.
 * @param {string} season - Season key.
 * @returns {{name: string, img: string}} Season metadata.
 */
export function getSeasonData(season) {
    if (season === 'Runners') return { name: 'Runners', img: 'siteimages/s_runners.png' };
    if (season === 'Override') return { name: 'Override', img: 'siteimages/s_override.png' };
    return { name: 'Unknown', img: 'siteimages/s_unknown.png' };
}

/**
 * Get index in an ordered list or Infinity if not found.
 * @param {string[]} order - Ordered list of values.
 * @param {string} value - Value to locate.
 * @returns {number} Index or Infinity.
 */
export function getOrderedIndex(order, value) {
    const index = order.indexOf(value);
    return index === -1 ? Infinity : index;
}

/**
 * Get display name for a character family key.
 * @param {string} charKey - Family key.
 * @param {Array<{id: string, name: string}>} [sprites=window.baseSprites] - Array of sprites.
 * @returns {string} Character name.
 */
export function getCharName(charKey, sprites = window.baseSprites || []) {
    const basicSprite = sprites.find(s => s.id === `${charKey}_basic`);
    return basicSprite ? basicSprite.name : charKey.charAt(0).toUpperCase() + charKey.slice(1);
}

/**
 * Format full display name for a sprite.
 * @param {string} name - Base character name.
 * @returns {string} Formatted name.
 */
export function getDisplayName(name) {
    return name === 'Burnt Peanut' ? name : `${name} Sprite`;
}

/**
 * Get fallback UI label for a theme key.
 * @param {string} theme - Theme key.
 * @returns {string} UI label.
 */
export function getUiThemeLabel(theme) {
    return UI_THEME_LABELS[theme] || theme;
}

/**
 * Get fallback export canvas label for a theme key.
 * @param {string} theme - Theme key.
 * @returns {string} Export label.
 */
export function getExportThemeLabel(theme) {
    return EXPORT_THEME_LABELS[theme] || theme.toUpperCase();
}

/**
 * Get fallback trade text label for a theme key.
 * @param {string} theme - Theme key.
 * @returns {string} Trade text label.
 */
export function getTradeThemeLabel(theme) {
    return TRADE_THEME_LABELS[theme] || theme;
}

/**
 * Safely escape string for HTML text node insertion.
 * @param {string|number} value - Input string or number.
 * @returns {string} Escaped HTML safe string.
 */
export function escapeHTML(value) {
    return String(value).replace(/[&<>'"]/g, char => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        "'": '&#39;',
        '"': '&quot;',
    }[char]));
}

/**
 * Check if current user platform is iOS (iPad/iPhone/iPod).
 * @returns {boolean} True if iOS.
 */
export function isIOS() {
    return /iPad|iPhone|iPod/.test(navigator.userAgent) ||
        (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
}
