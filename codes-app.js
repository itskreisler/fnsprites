/**
 * @file codes-app.js
 * @description Lobby Hacks page application logic and state management.
 */

import { STORAGE_KEYS } from './src/constants.js';
import { copyToClipboard, copySupportCode } from './src/utils/clipboard.js';
import { getTranslator } from './src/ui/commonUi.js';

/**
 * Get array of redeemed codes from LocalStorage.
 * @returns {string[]} List of redeemed code strings.
 */
function getRedeemedCodes() {
    try {
        const item = localStorage.getItem(STORAGE_KEYS.redeemedCodes);
        return item ? JSON.parse(item) : [];
    } catch {
        return [];
    }
}

/**
 * Save array of redeemed codes to LocalStorage.
 * @param {string[]} codes - Codes list.
 * @returns {void}
 */
function saveRedeemedCodes(codes) {
    localStorage.setItem(STORAGE_KEYS.redeemedCodes, JSON.stringify(codes));
}

/**
 * Toggle redemption status of a specific code.
 * @param {string} code - Target code string.
 * @returns {void}
 */
function toggleRedeem(code) {
    let redeemed = getRedeemedCodes();
    if (redeemed.includes(code)) {
        redeemed = redeemed.filter(c => c !== code);
    } else {
        redeemed.push(code);
    }
    saveRedeemedCodes(redeemed);
    renderCodes();
}

/**
 * Mark all active codes as redeemed.
 * @returns {void}
 */
function redeemAll() {
    if (typeof baseCodes === 'undefined') return;
    const allCodes = baseCodes.map(c => c.code);
    saveRedeemedCodes(allCodes);
    renderCodes();
}

/**
 * Unmark all redeemed codes.
 * @returns {void}
 */
function unredeemAll() {
    saveRedeemedCodes([]);
    renderCodes();
}

/**
 * Render codes table grouped by categories with i18n support.
 * @returns {void}
 */
function renderCodes() {
    const list = document.getElementById('codesList');
    const hideRedeemedToggle = document.getElementById('hideRedeemedToggle');
    if (!list || typeof baseCodes === 'undefined') return;

    const t = getTranslator();
    const redeemed = getRedeemedCodes();
    const hideRedeemed = hideRedeemedToggle ? hideRedeemedToggle.checked : true;

    list.innerHTML = '';

    const filteredCodes = baseCodes.filter(item => {
        if (hideRedeemed && redeemed.includes(item.code)) {
            return false;
        }
        return true;
    });

    if (filteredCodes.length === 0) {
        list.innerHTML = `<div class="codes-empty">${t('codes.empty')}</div>`;
        return;
    }

    const grouped = {};
    filteredCodes.forEach(item => {
        const catKey = item.category || 'cat4';
        if (!grouped[catKey]) grouped[catKey] = [];
        grouped[catKey].push(item);
    });

    const categoryOrders = typeof CATEGORY_ORDER !== 'undefined' ? CATEGORY_ORDER : ['cat1', 'cat2', 'cat3', 'cat4', 'cat5'];

    categoryOrders.forEach(catKey => {
        if (!grouped[catKey] || grouped[catKey].length === 0) return;

        const categoryTitle = t(`category.${catKey}`) || (typeof codeCategories !== 'undefined' ? codeCategories[catKey] : 'Miscellaneous');

        const sectionGroup = document.createElement('div');
        sectionGroup.className = 'code-category-group';

        const sectionHeader = document.createElement('div');
        sectionHeader.className = 'code-category-header';
        sectionHeader.textContent = categoryTitle;
        sectionGroup.appendChild(sectionHeader);

        const itemsContainer = document.createElement('div');
        itemsContainer.className = 'code-category-items';

        grouped[catKey].forEach(item => {
            const isRedeemed = redeemed.includes(item.code);
            const row = document.createElement('div');
            row.className = `code-row ${isRedeemed ? 'redeemed' : ''}`;

            row.innerHTML = `
                <span class="code-value" title="${t('codes.copyCode')}">${item.code}</span>
                <span class="code-reward">${item.reward}</span>
                <div class="code-card-actions">
                    <button type="button" class="btn btn-copy">${t('codes.copyCode')}</button>
                    <button type="button" class="btn btn-redeem ${isRedeemed ? '' : 'btn-accent'}">
                        ${isRedeemed ? t('codes.redeemed') : t('codes.markRedeemed')}
                    </button>
                </div>
            `;

            const codeValueEl = row.querySelector('.code-value');
            codeValueEl.addEventListener('click', () => copyToClipboard(item.code, codeValueEl, t('toasts.codeCopied'), ''));

            const copyBtn = row.querySelector('.btn-copy');
            copyBtn.addEventListener('click', () => copyToClipboard(item.code, copyBtn, t('toasts.codeCopied'), ''));

            const redeemBtn = row.querySelector('.btn-redeem');
            redeemBtn.addEventListener('click', () => toggleRedeem(item.code));

            itemsContainer.appendChild(row);
        });

        sectionGroup.appendChild(itemsContainer);
        list.appendChild(sectionGroup);
    });
}

/**
 * Initialize toolbar buttons and settings toggles.
 * @returns {void}
 */
function initToolbar() {
    const redeemAllBtn = document.getElementById('redeemAllBtn');
    const unredeemAllBtn = document.getElementById('unredeemAllBtn');
    const alertToggle = document.getElementById('alertNewCodesToggle');
    const hideRedeemedToggle = document.getElementById('hideRedeemedToggle');

    if (redeemAllBtn) redeemAllBtn.addEventListener('click', redeemAll);
    if (unredeemAllBtn) unredeemAllBtn.addEventListener('click', unredeemAll);

    if (alertToggle) {
        const storedSetting = localStorage.getItem(STORAGE_KEYS.alertNewCodes);
        alertToggle.checked = storedSetting !== null ? JSON.parse(storedSetting) : true;

        alertToggle.addEventListener('change', (e) => {
            localStorage.setItem(STORAGE_KEYS.alertNewCodes, JSON.stringify(e.target.checked));
        });
    }

    if (hideRedeemedToggle) {
        const storedSetting = localStorage.getItem(STORAGE_KEYS.hideRedeemedCodes);
        hideRedeemedToggle.checked = storedSetting !== null ? JSON.parse(storedSetting) : true;

        hideRedeemedToggle.addEventListener('change', (e) => {
            localStorage.setItem(STORAGE_KEYS.hideRedeemedCodes, JSON.stringify(e.target.checked));
            renderCodes();
        });
    }
}

document.addEventListener('DOMContentLoaded', () => {
    initToolbar();
    renderCodes();

    const supportBtn = document.getElementById('supportCodeBtn');
    if (supportBtn) {
        supportBtn.addEventListener('click', (e) => {
            e.preventDefault();
            const t = getTranslator();
            copySupportCode(supportBtn, t('toasts.codeCopied'));
        });
    }
});
