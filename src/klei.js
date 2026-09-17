/**
 * @file klei.js
 * @description Main application i18n DOM patcher and observer.
 */

import {
    getTranslator,
    initLanguageSelector,
    patchSupportFooter,
    removeStaticvacantBranding,
    addCreatorCard,
    updateDomTranslations,
} from './ui/commonUi.js';

let t = getTranslator();

function patchThemeFilter() {
    const sel = document.getElementById('themeFilter');
    if (!sel) return;
    Array.from(sel.options).forEach(opt => {
        const themeKey = opt.value;
        if (themeKey !== 'all') {
            opt.textContent = t('theme.' + themeKey);
        }
    });
}

function patchStatusPills() {
    document.querySelectorAll('#statusPills .pill').forEach(pill => {
        const status = pill.dataset.status;
        const key = 'toolbar.' + status;
        const label = t(key);
        if (label && label !== key) pill.textContent = label;
    });
}

function patchSeasonFilter() {
    const sel = document.getElementById('seasonFilter');
    if (!sel) return;
    Array.from(sel.options).forEach(opt => {
        if (opt.value === 'all') opt.textContent = t('toolbar.allSeasons');
    });
}

function patchHideMasteredLabel() {
    document.querySelectorAll('.switch').forEach(sw => {
        const cb = sw.querySelector('input[type="checkbox"]');
        const sp = sw.querySelector('span');
        if (!cb || !sp) return;
        if (cb.id === 'hideMastered') sp.textContent = t('toolbar.hideMastered');
        else if (cb.id === 'showUnreleased') sp.textContent = t('toolbar.showUnreleased');
        else if (cb.id === 'lowFidelity') sp.textContent = t('toolbar.lowFidelity');
        else if (cb.id === 'openExports') sp.textContent = t('toolbar.downloadExports');
    });
}

function patchExportDropdown() {
    document.querySelectorAll('#exportDropdown .dropdown-menu button[data-export]').forEach(btn => {
        const mode = btn.dataset.export;
        const map = {
            collected: 'toolbar.collectionImage',
            missing: 'toolbar.missingSprites',
            unmastered: 'toolbar.unmasteredSprites',
            mastered: 'toolbar.masteredSprites',
            trade: 'toolbar.tradeCard',
        };
        const key = map[mode];
        if (key) {
            const textNode = btn.childNodes[btn.childNodes.length - 1];
            if (textNode) textNode.textContent = t(key);
        }
    });
    document.querySelectorAll('#exportDropdown .dropdown-menu button:not([data-export])').forEach(btn => {
        if (btn.id === 'exportBackupBtn') btn.textContent = t('toolbar.backupData');
    });
    const exportToggle = document.getElementById('exportToggle');
    if (exportToggle) exportToggle.textContent = t('toolbar.export');
}

function patchCopyDropdown() {
    document.querySelectorAll('#copyDropdown .dropdown-menu button').forEach(btn => {
        if (btn.id === 'copyTradeTextBtn') btn.textContent = t('toolbar.copyTradeText');
        else if (btn.id === 'copyTradeGridBtn') btn.textContent = t('toolbar.copyTradeGrid');
    });
    const copyToggle = document.getElementById('copyToggle');
    if (copyToggle) copyToggle.textContent = t('toolbar.copyTradeList');
}

function patchCodesBtn() {
    const codesBtn = document.getElementById('codesBtn');
    if (codesBtn) {
        const dot = codesBtn.querySelector('.notification-dot');
        const dotHTML = dot ? dot.outerHTML : '';
        codesBtn.innerHTML = t('toolbar.lobbyHacks') + dotHTML;
    }
}

function patchLabels() {
    t = getTranslator();
    patchThemeFilter();
    patchStatusPills();
    patchSeasonFilter();
    patchHideMasteredLabel();
    patchExportDropdown();
    patchCopyDropdown();
    patchCodesBtn();

    const importBtn = document.getElementById('importBtn');
    if (importBtn) importBtn.textContent = t('toolbar.import');
    const shareBtn = document.getElementById('shareBtn');
    if (shareBtn) shareBtn.textContent = t('toolbar.share');

    const sortSelect = document.getElementById('sortOrder');
    if (sortSelect) {
        const m = { theme: 'toolbar.sortTheme', sprite: 'toolbar.sortSprite', name: 'toolbar.sortName', rarity: 'toolbar.sortRarity' };
        Array.from(sortSelect.options).forEach(opt => {
            const key = m[opt.value];
            if (key) opt.textContent = t(key);
        });
    }
    const searchInput = document.getElementById('searchInput');
    if (searchInput) searchInput.placeholder = t('toolbar.searchPlaceholder');
    patchHackBadges();
}

function patchHackBadges() {
    document.querySelectorAll('.hack-badge').forEach(el => {
        el.textContent = t('card.hackAvailable');
    });
}

function patchViewBanner() {
    const viewBanner = document.getElementById('viewBanner');
    if (viewBanner) {
        const span = viewBanner.querySelector('span');
        if (span) span.textContent = t('viewMode.banner');
        const link = viewBanner.querySelector('a');
        if (link) link.textContent = t('viewMode.goToPersonal');
    }
}

function patchHeaderTitle() {
    const h1 = document.querySelector('.brand h1');
    if (h1) h1.textContent = t('app.title');
    document.title = t('app.title');
}

function patchProgressLabels() {
    document.querySelectorAll('.progress-label').forEach(el => {
        if (el.textContent === 'Collection' || el.textContent === 'COLECCIÓN' || el.textContent === 'Sammlung') {
            el.textContent = t('app.collection');
        } else if (el.textContent === 'Mastery' || el.textContent === 'MAESTRÍA' || el.textContent === 'Beherrschung') {
            el.textContent = t('app.mastery');
        }
    });
}

function waitAndPatch() {
    if (!document.querySelector('#spriteGrid')) {
        requestAnimationFrame(waitAndPatch);
        return;
    }

    t = getTranslator();
    initLanguageSelector();
    patchHeaderTitle();
    patchProgressLabels();
    patchLabels();
    patchViewBanner();
    patchSupportFooter();
    removeStaticvacantBranding();
    addCreatorCard();
    updateDomTranslations();
    observeGridChanges();
}

let hackRAF = null;
function scheduleHackPatch() {
    if (hackRAF) return;
    hackRAF = requestAnimationFrame(() => {
        hackRAF = null;
        patchHackBadges();
    });
}

function observeGridChanges() {
    const grid = document.getElementById('spriteGrid');
    if (!grid) return;
    const obs = new MutationObserver(scheduleHackPatch);
    obs.observe(grid, { childList: true, subtree: true });
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', waitAndPatch);
} else {
    waitAndPatch();
}
