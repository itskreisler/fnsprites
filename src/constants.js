/**
 * @file constants.js
 * @description Centralized constants and configuration strings to eliminate magic strings across the project.
 */

/**
 * LocalStorage keys.
 * @type {Record<string, string>}
 */
export const STORAGE_KEYS = {
    obtained: 'fn_obtained_sprites',
    mastered: 'fn_mastered_sprites',
    lost: 'fn_lost_sprites',
    search: 'fn_state_search',
    theme: 'fn_state_theme',
    status: 'fn_state_status_filter',
    hideMastered: 'fn_state_hide_mastered',
    sortOrder: 'fn_state_sort_order',
    showUnreleased: 'fn_state_unreleased',
    lowFidelity: 'fn_state_low_fidelity',
    openExports: 'fn_state_open_exports',
    season: 'fn_state_season',
    locale: 'fn_locale',
    alertNewCodes: 'fn_alert_new_codes',
    redeemedCodes: 'fn_redeemed_codes',
    hideRedeemedCodes: 'fn_hide_redeemed_codes',
    legacyGroupTheme: 'fn_state_group_theme',
};

/**
 * Canonical themes order.
 * @type {string[]}
 */
export const THEME_ORDER = ['Basic', 'Gold', 'Candy', 'Galaxy', 'Gem', 'Holofoil', 'Cube', 'Rift', 'Quack', 'Cheat', 'Hacker'];

/**
 * Canonical rarities order.
 * @type {string[]}
 */
export const RARITY_ORDER = ['Mythic', 'Legendary', 'Epic', 'Rare', 'Special'];

/**
 * Status filter values.
 * @type {string[]}
 */
export const STATUS_FILTERS = ['all', 'owned', 'lost', 'missing'];

/**
 * Sorting method options.
 * @type {string[]}
 */
export const SORT_METHODS = ['theme', 'sprite', 'name', 'rarity'];

/**
 * UI theme display mapping fallback.
 * @type {Record<string, string>}
 */
export const UI_THEME_LABELS = {
    Candy: 'Gummy',
    Hacker: 'Loot Hacker',
};

/**
 * Export image theme display mapping fallback.
 * @type {Record<string, string>}
 */
export const EXPORT_THEME_LABELS = {
    Basic: 'NORMAL',
    Candy: 'GUMMY',
    Hacker: 'LOOT HACKER',
};

/**
 * Trade text theme display mapping fallback.
 * @type {Record<string, string>}
 */
export const TRADE_THEME_LABELS = {
    Basic: 'Base',
    Candy: 'Gummy',
    Hacker: 'Loot Hacker',
};

/**
 * Application URLs.
 * @type {Record<string, string>}
 */
export const URLS = {
    tracker: 'https://itskreisler.github.io/fnsprites/',
    creatorShop: 'https://www.fortnite.com/item-shop?creator-code=klei',
    youtube: 'https://youtube.com/@itskreisler',
    upstreamSpritesData: 'https://rickventure.com/sprites-data.js',
    upstreamCodesData: 'https://rickventure.com/codes-data.js',
};

/**
 * Creator code branding string.
 * @type {string}
 */
export const CREATOR_CODE = 'KLEI';

/**
 * SVG icons.
 * @type {Record<string, string>}
 */
export const ICONS = {
    crown: '<svg class="crown-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M2 19h20v2H2v-2zM2 5l5 3.5L12 2l5 6.5L22 5v12H2V5z"/></svg>',
    lost: '<svg class="lost-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>',
};

/**
 * Canvas Export Layout Configuration.
 * @type {Record<string, number>}
 */
export const EXPORT_LAYOUT = {
    border: 4,
    sidePad: 8,
    minCanvasW: 240,
    compactHeaderW: 760,
    headerH: 50,
    compactHeaderH: 80,
    colHeaderH: 25,
    cardW: 110,
    cardH: 138,
    rowGap: 6,
    cardGap: 6,
    labelW: 90,
    colGap: 16,
    footerH: 32,
    maxSingleColumnRows: 6,
};
