/**
 * @file codes-app.js
 * @description Lobby Hacks subpage application logic using Tailwind CSS classes.
 */

import { STORAGE_KEYS } from './src/constants.js';
import { copyToClipboard, copySupportCode } from './src/utils/clipboard.js';
import { storageGet, storageSet, TypesStorages } from './src/utils/storage.js';
import { getTranslator, initOfflineAndPWA } from './src/ui/commonUi.js';

const LS_GET = (key) => storageGet(null, key, TypesStorages.LOCAL_STORAGE);
const LS_SET = (key, value) => storageSet(null, key, value, TypesStorages.LOCAL_STORAGE);

function getRedeemedCodes() {
    try {
        const item = LS_GET(STORAGE_KEYS.redeemedCodes);
        return item ? JSON.parse(item) : [];
    } catch {
        return [];
    }
}

function saveRedeemedCodes(codes) {
    LS_SET(STORAGE_KEYS.redeemedCodes, codes);
}

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

function redeemAll() {
    if (typeof baseCodes === 'undefined') return;
    const allCodes = baseCodes.map(c => c.code);
    saveRedeemedCodes(allCodes);
    renderCodes();
}

function unredeemAll() {
    saveRedeemedCodes([]);
    renderCodes();
}

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
        list.innerHTML = `<div class="codes-empty p-6 text-center text-slate-400 italic">${t('codes.empty')}</div>`;
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
        sectionGroup.className = 'code-category-group bg-dark-600/90 border border-fn-purple/30 border-t-2 border-t-fn-purple rounded-xl p-3 sm:p-4 shadow-lg flex flex-col gap-3';

        const sectionHeader = document.createElement('div');
        sectionHeader.className = 'code-category-header text-base sm:text-lg font-bold uppercase tracking-wider text-fn-purple text-center pb-2 border-b border-white/10';
        sectionHeader.textContent = categoryTitle;
        sectionGroup.appendChild(sectionHeader);

        const itemsContainer = document.createElement('div');
        itemsContainer.className = 'code-category-items flex flex-col gap-2.5';

        grouped[catKey].forEach(item => {
            const isRedeemed = redeemed.includes(item.code);
            const row = document.createElement('div');
            row.className = `code-row flex flex-col sm:grid sm:grid-cols-[1fr_1.2fr_auto] items-stretch sm:items-center gap-2 sm:gap-4 p-3 bg-white/5 border-l-2 border-l-fn-purple rounded-lg transition-all ${isRedeemed ? 'opacity-40' : 'hover:bg-white/10'}`;

            row.innerHTML = `
                <span class="code-value font-bold text-white tracking-wide cursor-pointer hover:text-fn-cyan break-all text-sm sm:text-base" title="${t('codes.copyCode')}">${item.code}</span>
                <span class="code-reward font-sans text-xs sm:text-sm text-slate-300">${item.reward}</span>
                <div class="code-card-actions flex items-center gap-2 pt-2 sm:pt-0 border-t sm:border-t-0 border-white/10 justify-end w-full sm:w-auto">
                    <button type="button" class="btn btn-copy flex-1 sm:flex-none h-9 px-3 bg-dark-600 border border-white/10 rounded-lg text-xs font-bold uppercase hover:bg-dark-700">${t('codes.copyCode')}</button>
                    <button type="button" class="btn btn-redeem flex-1 sm:flex-none h-9 px-3 ${isRedeemed ? 'bg-dark-600 border-white/10 text-slate-400' : 'bg-fn-purple/20 border-fn-purple text-fn-purple'} border rounded-lg text-xs font-bold uppercase hover:opacity-80">
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

function initToolbar() {
    const redeemAllBtn = document.getElementById('redeemAllBtn');
    const unredeemAllBtn = document.getElementById('unredeemAllBtn');
    const alertToggle = document.getElementById('alertNewCodesToggle');
    const hideRedeemedToggle = document.getElementById('hideRedeemedToggle');

    if (redeemAllBtn) redeemAllBtn.addEventListener('click', redeemAll);
    if (unredeemAllBtn) unredeemAllBtn.addEventListener('click', unredeemAll);

    if (alertToggle) {
        const storedSetting = LS_GET(STORAGE_KEYS.alertNewCodes);
        alertToggle.checked = storedSetting !== null ? JSON.parse(storedSetting) : true;

        alertToggle.addEventListener('change', (e) => {
            LS_SET(STORAGE_KEYS.alertNewCodes, JSON.stringify(e.target.checked));
        });
    }

    if (hideRedeemedToggle) {
        const storedSetting = LS_GET(STORAGE_KEYS.hideRedeemedCodes);
        hideRedeemedToggle.checked = storedSetting !== null ? JSON.parse(storedSetting) : true;

        hideRedeemedToggle.addEventListener('change', (e) => {
            LS_SET(STORAGE_KEYS.hideRedeemedCodes, JSON.stringify(e.target.checked));
            renderCodes();
        });
    }
}

document.addEventListener('DOMContentLoaded', () => {
    initToolbar();
    renderCodes();
    initOfflineAndPWA();

    const supportBtn = document.getElementById('supportCodeBtn');
    if (supportBtn) {
        supportBtn.addEventListener('click', (e) => {
            e.preventDefault();
            const t = getTranslator();
            copySupportCode(supportBtn, t('toasts.codeCopied'));
        });
    }
});
