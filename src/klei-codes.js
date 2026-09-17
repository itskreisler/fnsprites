/**
 * @file klei-codes.js
 * @description Codes page i18n DOM patcher and observer.
 */

import {
    getTranslator,
    initLanguageSelector,
    patchSupportFooter,
    updateDomTranslations,
} from './ui/commonUi.js';

let t = getTranslator();

function patchHeaderTitle() {
    const h1 = document.querySelector('.brand h1');
    if (h1) h1.textContent = t('codes.title');
    document.title = t('codes.title');
}

function patchReturnBtn() {
    const returnBtn = document.querySelector('.actions .btn-accent');
    if (returnBtn) returnBtn.textContent = t('codes.return');
}

function patchToolbar() {
    const hideToggle = document.getElementById('hideRedeemedToggle');
    if (hideToggle) {
        const sp = hideToggle.closest('.switch')?.querySelector('span');
        if (sp) sp.textContent = t('codes.hideRedeemed');
    }
    const redeemAllBtn = document.getElementById('redeemAllBtn');
    if (redeemAllBtn) redeemAllBtn.textContent = t('codes.redeemAll');
    const unredeemAllBtn = document.getElementById('unredeemAllBtn');
    if (unredeemAllBtn) unredeemAllBtn.textContent = t('codes.unredeemAll');
}

function patchColumnHeaders() {
    const header = document.querySelector('.codes-table-header');
    if (header) {
        const spans = header.querySelectorAll('span');
        if (spans[0]) spans[0].textContent = t('codes.code');
        if (spans[1]) spans[1].textContent = t('codes.reward');
        if (spans[2]) spans[2].textContent = t('codes.actions');
    }
}

function patchEmptyState() {
    document.querySelectorAll('.codes-empty').forEach(el => {
        el.textContent = t('codes.empty');
    });
}

function patchCodeRows() {
    document.querySelectorAll('.code-row').forEach(row => {
        const copyBtn = row.querySelector('.btn-copy');
        if (copyBtn) copyBtn.textContent = t('codes.copyCode');
        const redeemBtn = row.querySelector('.btn-redeem');
        if (redeemBtn) {
            const isRedeemed = redeemBtn.classList.contains('btn-accent') === false;
            if (isRedeemed) {
                redeemBtn.textContent = t('codes.redeemed');
            } else {
                redeemBtn.textContent = t('codes.markRedeemed');
            }
        }
    });
}

function rebuildAll() {
    t = getTranslator();
    patchHeaderTitle();
    patchReturnBtn();
    patchToolbar();
    patchColumnHeaders();
    patchSupportFooter();
    updateDomTranslations();
    setTimeout(() => {
        patchCodeRows();
        patchEmptyState();
    }, 100);
}

function waitAndPatch() {
    if (!document.querySelector('#codesList')) {
        requestAnimationFrame(waitAndPatch);
        return;
    }
    initLanguageSelector();
    rebuildAll();
}

let patchRAF = null;
function schedulePatch() {
    if (patchRAF) return;
    patchRAF = requestAnimationFrame(() => {
        patchRAF = null;
        patchCodeRows();
        patchEmptyState();
    });
}

function observeCodeChanges() {
    const list = document.getElementById('codesList');
    if (!list) return;
    const obs = new MutationObserver(schedulePatch);
    obs.observe(list, { childList: true, subtree: true });
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        waitAndPatch();
        observeCodeChanges();
    });
} else {
    waitAndPatch();
    observeCodeChanges();
}
