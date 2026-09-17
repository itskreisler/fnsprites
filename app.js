/**
 * @file app.js
 * @description Main application controller and UI state coordinator.
 */

import {
    STORAGE_KEYS,
    THEME_ORDER,
    RARITY_ORDER,
    STATUS_FILTERS,
    SORT_METHODS,
    ICONS,
    URLS,
} from './src/constants.js';

import { persist, readStoredArray, uniqueValidIds } from './src/utils/storage.js';
import { compressCollection, decompressCollection } from './src/utils/encoder.js';
import { copyToClipboard, copySupportCode } from './src/utils/clipboard.js';
import { showToast } from './src/utils/toast.js';
import {
    getFamilyKey,
    getSpriteIdSet,
    getSeasonData,
    getOrderedIndex,
    getCharName,
    getUiThemeLabel,
    escapeHTML,
    isIOS,
} from './src/utils/helpers.js';

import { exportCanvasImage } from './src/export/canvasExport.js';
import { generateTradeText, generateTradeGridText } from './src/export/tradeText.js';
import { getTranslator } from './src/ui/commonUi.js';

/* ===================================================
   State Management
   =================================================== */

/**
 * Global reactive UI state object.
 */
const state = {
    obtained: [],
    mastered: [],
    lost: [],
    viewMode: false,
    filters: { search: '', theme: 'all', season: 'all', status: 'all' },
    settings: {
        hideMastered: false,
        sortOrder: 'theme',
        showUnreleased: false,
        lowFidelity: false,
        openExports: false,
    },
};

/* ===================================================
   DOM Cache
   =================================================== */

const dom = {
    viewBanner: document.getElementById('viewBanner'),
    grid: document.getElementById('spriteGrid'),
    searchInput: document.getElementById('searchInput'),
    themeFilter: document.getElementById('themeFilter'),
    sortOrder: document.getElementById('sortOrder'),
    statusPills: document.getElementById('statusPills'),
    hideMastered: document.getElementById('hideMastered'),
    showUnreleased: document.getElementById('showUnreleased'),
    lowFidelity: document.getElementById('lowFidelity'),
    seasonFilter: document.getElementById('seasonFilter'),
    openExports: document.getElementById('openExports'),
    exportModeSwitch: document.getElementById('exportModeSwitch'),
    exportDropdown: document.getElementById('exportDropdown'),
    exportToggle: document.getElementById('exportToggle'),
    copyDropdown: document.getElementById('copyDropdown'),
    copyToggle: document.getElementById('copyToggle'),
    shareBtn: document.getElementById('shareBtn'),
    copyTradeTextBtn: document.getElementById('copyTradeTextBtn'),
    copyTradeGridBtn: document.getElementById('copyTradeGridBtn'),
    collectionRatio: document.getElementById('collectionRatio'),
    collectionFill: document.getElementById('collectionFill'),
    masteryRatio: document.getElementById('masteryRatio'),
    masteryFill: document.getElementById('masteryFill'),
    exportBackupBtn: document.getElementById('exportBackupBtn'),
    importBtn: document.getElementById('importBtn'),
    importInput: document.getElementById('importInput'),
};

/* ===================================================
   Persistence & Collection Helpers
   =================================================== */

/** Save active collection state to LocalStorage. */
function saveCollection() {
    persist(STORAGE_KEYS.obtained, state.obtained);
    persist(STORAGE_KEYS.mastered, state.mastered);
    persist(STORAGE_KEYS.lost, state.lost);
}

/** Load state and preferences from LocalStorage. */
function load() {
    const validIds = getSpriteIdSet();
    state.obtained = uniqueValidIds(readStoredArray(STORAGE_KEYS.obtained), validIds);
    state.mastered = uniqueValidIds(readStoredArray(STORAGE_KEYS.mastered), validIds)
        .filter(id => state.obtained.includes(id));
    state.lost = uniqueValidIds(readStoredArray(STORAGE_KEYS.lost), validIds)
        .filter(id => !state.obtained.includes(id));

    state.filters.search = localStorage.getItem(STORAGE_KEYS.search) || '';
    state.filters.theme = localStorage.getItem(STORAGE_KEYS.theme) || 'all';
    state.filters.season = localStorage.getItem(STORAGE_KEYS.season) || 'all';

    let savedStatus = localStorage.getItem(STORAGE_KEYS.status) || 'all';
    if (savedStatus === 'obtained') savedStatus = 'owned';
    state.filters.status = STATUS_FILTERS.includes(savedStatus) ? savedStatus : 'all';

    state.settings.hideMastered = localStorage.getItem(STORAGE_KEYS.hideMastered) === 'true';

    let savedSort = localStorage.getItem(STORAGE_KEYS.sortOrder);
    if (!savedSort) {
        const legacyGroup = localStorage.getItem(STORAGE_KEYS.legacyGroupTheme);
        savedSort = legacyGroup === 'false' ? 'sprite' : 'theme';
    }
    state.settings.sortOrder = SORT_METHODS.includes(savedSort) ? savedSort : 'theme';

    state.settings.showUnreleased = localStorage.getItem(STORAGE_KEYS.showUnreleased) === 'true';
    state.settings.lowFidelity = localStorage.getItem(STORAGE_KEYS.lowFidelity) === 'true';
    state.settings.openExports = localStorage.getItem(STORAGE_KEYS.openExports) === 'true';
}

/** Apply internal state values to controls in the DOM. */
function applyStateToDOM() {
    const t = getTranslator();

    if (dom.searchInput) dom.searchInput.value = state.filters.search;
    if (dom.themeFilter) dom.themeFilter.value = state.filters.theme;
    if (dom.seasonFilter) dom.seasonFilter.value = state.filters.season;
    if (dom.sortOrder) dom.sortOrder.value = state.settings.sortOrder;
    if (dom.hideMastered) dom.hideMastered.checked = state.settings.hideMastered;
    if (dom.showUnreleased) dom.showUnreleased.checked = state.settings.showUnreleased;
    if (dom.lowFidelity) dom.lowFidelity.checked = state.settings.lowFidelity;
    document.body.classList.toggle('low-fidelity', state.settings.lowFidelity);

    if (isIOS()) {
        if (dom.exportModeSwitch) dom.exportModeSwitch.hidden = true;
    } else if (dom.openExports) {
        dom.openExports.checked = !state.settings.openExports;
        const switchLabel = dom.exportModeSwitch?.querySelector('span');
        if (switchLabel) {
            switchLabel.textContent = t('toolbar.downloadExports');
        }
    }

    if (dom.statusPills) {
        dom.statusPills.querySelectorAll('.pill').forEach(pill => {
            const match = pill.dataset.status === state.filters.status;
            pill.classList.toggle('active', match);
            pill.setAttribute('aria-pressed', String(match));
        });
    }
}

/** Check for active unredeemed lobby hack codes. */
function checkUnredeemedCodes() {
    const notifDot = document.getElementById('codesNotification');
    const codesBtn = document.getElementById('codesBtn');
    if (typeof baseCodes === 'undefined') return;

    let showAlerts = true;
    try {
        const storedSetting = localStorage.getItem(STORAGE_KEYS.alertNewCodes);
        if (storedSetting !== null) {
            showAlerts = JSON.parse(storedSetting);
        }
    } catch {
        showAlerts = true;
    }

    if (!showAlerts) {
        if (notifDot) notifDot.hidden = true;
        if (codesBtn) codesBtn.classList.remove('btn-hack-active');
        return;
    }

    let redeemed = [];
    try {
        redeemed = JSON.parse(localStorage.getItem(STORAGE_KEYS.redeemedCodes)) || [];
    } catch {
        redeemed = [];
    }

    const hasUnredeemed = baseCodes.some(c => c.active && !redeemed.includes(c.code));
    if (notifDot) notifDot.hidden = !hasUnredeemed;

    const hasUncollectedReward = baseCodes.some(c =>
        c.active &&
        !redeemed.includes(c.code) &&
        c.internalreward &&
        !isObtained(c.internalreward)
    );

    if (codesBtn) {
        codesBtn.classList.toggle('btn-hack-active', hasUncollectedReward);
    }
}

/* ===================================================
   Sprite Collection Pure Helpers
   =================================================== */

function getReleasedSprites() {
    if (typeof baseSprites === 'undefined') return [];
    return baseSprites.filter(sprite => {
        if (sprite.unreleased) return false;
        if (state.filters.season !== 'all' && (sprite.season || 'Unknown') !== state.filters.season) return false;
        return true;
    });
}

function getActiveThemes(sprites = getReleasedSprites()) {
    return sprites
        .reduce((themes, sprite) => {
            if (!themes.includes(sprite.theme)) themes.push(sprite.theme);
            return themes;
        }, [])
        .sort((a, b) => getOrderedIndex(THEME_ORDER, a) - getOrderedIndex(THEME_ORDER, b));
}

function getCollectionCounts(sprites = getReleasedSprites()) {
    return {
        total: sprites.length,
        collected: sprites.filter(sprite => isObtained(sprite.id) || isLost(sprite.id)).length,
        mastered: sprites.filter(sprite => isMastered(sprite.id)).length,
    };
}

function getFamilyThemeMap(sprites = getReleasedSprites()) {
    return sprites.reduce((map, sprite) => {
        const familyKey = getFamilyKey(sprite);
        if (!map.has(familyKey)) map.set(familyKey, new Map());
        map.get(familyKey).set(sprite.theme, sprite);
        return map;
    }, new Map());
}

function isObtained(id) {
    return state.obtained.includes(id);
}

function isMastered(id) {
    return state.mastered.includes(id);
}

function isLost(id) {
    return state.lost.includes(id);
}

/* ===================================================
   Progress Display
   =================================================== */

function updateProgress() {
    const { total, collected, mastered } = getCollectionCounts();

    if (dom.collectionRatio) dom.collectionRatio.textContent = `${collected} / ${total}`;
    if (dom.collectionFill) dom.collectionFill.style.width = total > 0 ? `${(collected / total) * 100}%` : '0%';
    if (dom.masteryRatio) dom.masteryRatio.textContent = `${mastered} / ${total}`;
    if (dom.masteryFill) dom.masteryFill.style.width = total > 0 ? `${(mastered / total) * 100}%` : '0%';
}

/* ===================================================
   Filtering & Sorting Logic
   =================================================== */

function filterSprites() {
    if (typeof baseSprites === 'undefined') return [];
    const search = state.filters.search.trim().toLowerCase();

    return baseSprites.filter(sprite => {
        if (state.settings.hideMastered && isMastered(sprite.id)) return false;
        if (!state.settings.showUnreleased && sprite.unreleased) return false;
        if (state.viewMode && (!isObtained(sprite.id) || sprite.unreleased)) return false;

        const matchesSearch = !search || sprite.name.toLowerCase().includes(search);
        const matchesTheme = state.filters.theme === 'all' || sprite.theme === state.filters.theme;
        const matchesSeason = state.filters.season === 'all' || (sprite.season || 'Unknown') === state.filters.season;

        let matchesStatus = true;
        if (!state.viewMode) {
            const isOwned = isObtained(sprite.id);
            const isSpriteLost = isLost(sprite.id);
            if (state.filters.status === 'owned') matchesStatus = isOwned;
            if (state.filters.status === 'lost') matchesStatus = isSpriteLost;
            if (state.filters.status === 'missing') matchesStatus = !isOwned && !isSpriteLost;
        }

        return matchesSearch && matchesTheme && matchesSeason && matchesStatus;
    });
}

function sortSprites(items, method) {
    const sorted = [...items];
    if (method === 'theme') {
        return sorted.sort((a, b) => {
            const idxA = getOrderedIndex(THEME_ORDER, a.theme);
            const idxB = getOrderedIndex(THEME_ORDER, b.theme);
            if (idxA !== idxB) return idxA - idxB;
            return 0;
        });
    }
    if (method === 'sprite') {
        return sorted.sort((a, b) => {
            const familyA = getFamilyKey(a);
            const familyB = getFamilyKey(b);
            if (familyA !== familyB) return familyA.localeCompare(familyB);
            return getOrderedIndex(THEME_ORDER, a.theme) - getOrderedIndex(THEME_ORDER, b.theme);
        });
    }
    if (method === 'name') {
        return sorted.sort((a, b) => a.name.localeCompare(b.name));
    }
    if (method === 'rarity') {
        return sorted.sort((a, b) => {
            const idxA = getOrderedIndex(RARITY_ORDER, a.rarity);
            const idxB = getOrderedIndex(RARITY_ORDER, b.rarity);
            if (idxA !== idxB) return idxA - idxB;
            return a.name.localeCompare(b.name);
        });
    }
    return sorted;
}

/* ===================================================
   Rendering Components
   =================================================== */

function populateThemeFilter() {
    if (!dom.themeFilter || typeof baseSprites === 'undefined') return;
    const t = getTranslator();
    const themes = getActiveThemes(baseSprites);
    const selectedTheme = themes.includes(state.filters.theme) ? state.filters.theme : 'all';

    dom.themeFilter.replaceChildren(
        new Option(t('toolbar.allSeasons') || 'All themes', 'all'),
        ...themes.map(theme => new Option(t('theme.' + theme) || getUiThemeLabel(theme), theme))
    );
    state.filters.theme = selectedTheme;
}

function renderGrid() {
    if (!dom.grid) return;
    const t = getTranslator();
    let items = filterSprites();
    items = sortSprites(items, state.settings.sortOrder);

    let redeemed = [];
    try {
        redeemed = JSON.parse(localStorage.getItem(STORAGE_KEYS.redeemedCodes)) || [];
    } catch {
        redeemed = [];
    }

    const hackableRewards = new Set(
        (typeof baseCodes !== 'undefined' ? baseCodes : [])
            .filter(c => c.active && !redeemed.includes(c.code) && c.internalreward)
            .map(c => c.internalreward)
    );

    const frag = document.createDocumentFragment();

    for (const sprite of items) {
        const obtained = isObtained(sprite.id);
        const mastered = isMastered(sprite.id);
        const lost = isLost(sprite.id);
        const hasHack = !obtained && hackableRewards.has(sprite.id);

        const card = document.createElement('div');
        card.dataset.id = sprite.id;

        const classes = ['card', `rarity-${sprite.rarity}`, `theme-${sprite.theme}`];
        if (obtained) classes.push('obtained');
        if (mastered) classes.push('mastered');
        if (lost) classes.push('lost');
        if (hasHack) classes.push('hack-available');
        card.className = classes.join(' ');

        if (!state.viewMode) {
            card.tabIndex = 0;
            card.setAttribute('role', 'button');
            card.setAttribute('aria-pressed', String(obtained));

            const ariaAction = obtained ? t('card.removeCollection', { name: sprite.name }) : t('card.addCollection', { name: sprite.name });
            card.setAttribute('aria-label', ariaAction);
        }

        let cardHTML = buildCardHTML(sprite, obtained, mastered, lost, t);
        if (hasHack) {
            cardHTML = `<div class="hack-badge">${t('card.hackAvailable')}</div>` + cardHTML;
        }

        card.innerHTML = cardHTML;
        frag.appendChild(card);
    }

    dom.grid.innerHTML = '';
    dom.grid.appendChild(frag);
    fitCardNames();
    updateProgress();
}

function buildCardHTML(sprite, obtained, mastered, lost, t) {
    const rarityLabel = sprite.rarity === 'Mythic' ? 'MYTHIC' : sprite.rarity.toUpperCase();
    const imgPath = `sprites/${encodeURIComponent(sprite.id)}.png`;
    const safeName = escapeHTML(sprite.name);
    const safeRarity = escapeHTML(rarityLabel);
    const seasonData = getSeasonData(sprite.season);
    const safeSeasonName = escapeHTML(seasonData.name);

    let badge = '';
    if (lost) {
        badge = `<div class="card-badge lost-badge">${t('card.lost')}</div>`;
    } else if (sprite.unreleased) {
        badge = `<div class="card-badge unreleased-badge">${t('card.unreleased')}</div>`;
    } else if (mastered) {
        badge = `<div class="card-badge mastered-badge">${t('card.mastered')}</div>`;
    } else if (obtained) {
        badge = `<div class="card-badge collected">${t('card.collected')}</div>`;
    }

    let crownAction = '';
    if (obtained && !mastered && !lost && !state.viewMode) {
        const titleText = t('card.toggleMastery', { name: safeName });
        crownAction = `<button class="card-crown" type="button" title="${titleText}" aria-label="${titleText}">${ICONS.crown}</button>`;
    }

    let crownDisplay = '';
    if (mastered && !lost) {
        crownDisplay = `<div class="card-crown-display">${ICONS.crown}</div>`;
    }

    let lostAction = '';
    if ((obtained || mastered) && !lost && !state.viewMode) {
        const titleText = t('card.markLost', { name: safeName });
        lostAction = `<button class="card-lost" type="button" title="${titleText}" aria-label="${titleText}">${ICONS.lost}</button>`;
    }

    return `${badge}${crownAction}${lostAction}
        <div class="card-display">
            ${crownDisplay}
            <img src="${imgPath}" alt="${safeName}" loading="lazy">
            <div class="card-rarity">${safeRarity}</div>
            <div class="card-season" title="${safeSeasonName}">
                <img src="${seasonData.img}" alt="${safeSeasonName}" title="${safeSeasonName}">
            </div>
        </div>
        <div class="card-name"><span>${safeName}</span></div>`;
}

function fitCardNames() {
    if (!dom.grid) return;
    const spans = [...dom.grid.querySelectorAll('.card-name span')];
    if (!spans.length) return;

    const BATCH = 50;
    let idx = 0;

    function processBatch() {
        const end = Math.min(idx + BATCH, spans.length);
        for (let i = idx; i < end; i++) {
            const span = spans[i];
            const parent = span.parentElement;
            if (!parent || parent.clientWidth === 0) continue;
            let size = 14;
            span.style.fontSize = size + 'px';
            while (span.scrollWidth > parent.clientWidth && size > 8) {
                size -= 0.5;
                span.style.fontSize = size + 'px';
            }
        }
        idx = end;
        if (idx < spans.length) requestAnimationFrame(processBatch);
    }
    requestAnimationFrame(processBatch);
}

/* ===================================================
   Collection Actions
   =================================================== */

function toggleObtained(id) {
    if (isObtained(id)) {
        state.obtained = state.obtained.filter(x => x !== id);
        state.mastered = state.mastered.filter(x => x !== id);
    } else {
        state.obtained.push(id);
    }
    saveCollection();
    renderGrid();
}

function toggleMastery(id) {
    if (!isObtained(id)) return;
    if (isMastered(id)) {
        state.mastered = state.mastered.filter(x => x !== id);
    } else {
        state.mastered.push(id);
    }
    saveCollection();
    renderGrid();
}

function toggleLost(id) {
    if (isLost(id)) {
        state.lost = state.lost.filter(x => x !== id);
        if (!state.obtained.includes(id)) state.obtained.push(id);
    } else {
        state.obtained = state.obtained.filter(x => x !== id);
        state.mastered = state.mastered.filter(x => x !== id);
        if (!state.lost.includes(id)) state.lost.push(id);
    }
    saveCollection();
    renderGrid();
}

/* ===================================================
   Export Handlers
   =================================================== */

function getExportConfig(mode) {
    const t = getTranslator();
    const releasedSprites = getReleasedSprites();
    let rawItems = [];

    if (mode === 'collected') rawItems = releasedSprites.filter(sprite => isObtained(sprite.id));
    else if (mode === 'missing') rawItems = releasedSprites.filter(sprite => !isObtained(sprite.id));
    else if (mode === 'unmastered') rawItems = releasedSprites.filter(sprite => isObtained(sprite.id) && !isMastered(sprite.id));
    else if (mode === 'mastered') rawItems = releasedSprites.filter(sprite => isObtained(sprite.id) && isMastered(sprite.id));
    else if (mode === 'trade') rawItems = releasedSprites;

    const items = mode === 'trade' ? rawItems : sortSprites(rawItems, state.settings.sortOrder);

    const configs = {
        collected: {
            items, titleL1: t('exportTitle.trackerTitle'), titleL2: t('exportTitle.myCollection'),
            color: '#32cd32', filename: 'fnsprites-collection', emptyMsg: t('toasts.emptyExportCollection'),
        },
        missing: {
            items, titleL1: t('exportTitle.trackerTitle'), titleL2: t('exportTitle.lookingForThese'),
            color: '#ef4444', filename: 'fnsprites-missing', emptyMsg: t('toasts.emptyExportMissing'),
        },
        unmastered: {
            items, titleL1: t('exportTitle.trackerTitle'), titleL2: t('exportTitle.unmasteredSprites'),
            color: '#00f0ff', filename: 'fnsprites-unmastered', emptyMsg: t('toasts.emptyExportUnmastered'),
        },
        mastered: {
            items, titleL1: t('exportTitle.trackerTitle'), titleL2: t('exportTitle.masteredSprites'),
            color: '#ffd700', filename: 'fnsprites-mastered', emptyMsg: t('toasts.emptyExportMastered'),
        },
        trade: {
            items, titleL1: t('exportTitle.trackerTitle'), titleL2: t('exportTitle.tradeCard'),
            color: '#ffd700', filename: 'fnsprites-trade-card', emptyMsg: t('toasts.emptyExportTrade'),
        },
    };

    const config = configs[mode];
    if (!config || config.items.length === 0) {
        showToast(config?.emptyMsg || t('toasts.emptyExportTrade'), 'error');
        return null;
    }
    return config;
}

function getExportCardState(sprite, mode) {
    const isOwned = isObtained(sprite.id);
    const mastered = isMastered(sprite.id);

    if (mode === 'trade') return isOwned ? (mastered ? 'mastered' : 'owned') : 'missing_gray';
    if (mode === 'collected') return isOwned ? (mastered ? 'mastered' : 'owned') : 'empty';
    if (mode === 'missing') return !isOwned ? 'missing_color' : 'empty';
    if (mode === 'mastered') return mastered ? 'mastered' : 'empty';
    if (mode === 'unmastered') return isOwned && !mastered ? 'unmastered' : 'empty';
    return 'empty';
}

function handleExportImage(mode) {
    const t = getTranslator();
    const config = getExportConfig(mode);
    if (!config) return;

    exportCanvasImage({
        mode,
        config,
        releasedSprites: getReleasedSprites(),
        activeThemes: getActiveThemes(),
        openInNewTab: state.settings.openExports,
        getExportCardState,
        getCollectionCounts,
        i18nLabels: {
            generating: t('toasts.generatingExport'),
            openedInTab: t('toasts.imageOpenedTab'),
            exportSuccess: t('toasts.imageExported'),
            failedExport: t('toasts.failedExport'),
            collection: t('app.collection'),
            mastery: t('app.mastery'),
        },
    });
}

function setDropdownOpen(dropdown, toggle, open) {
    if (!dropdown || !toggle) return;
    dropdown.classList.toggle('open', open);
    toggle.setAttribute('aria-expanded', String(open));
}

function closeDropdowns() {
    setDropdownOpen(dom.exportDropdown, dom.exportToggle, false);
    setDropdownOpen(dom.copyDropdown, dom.copyToggle, false);
}

/* ===================================================
   Event Binding
   =================================================== */

function bindEvents() {
    if (!dom.grid) return;

    dom.grid.addEventListener('error', (e) => {
        if (e.target.tagName === 'IMG') {
            e.target.style.opacity = '0.2';
        }
    }, true);

    dom.grid.addEventListener('click', (e) => {
        if (state.viewMode) return;
        const crown = e.target.closest('.card-crown');
        const lostBtn = e.target.closest('.card-lost');
        const card = e.target.closest('.card');
        if (!card) return;

        const id = card.dataset.id;
        if (crown) {
            e.stopPropagation();
            toggleMastery(id);
        } else if (lostBtn) {
            e.stopPropagation();
            toggleLost(id);
        } else if (isLost(id)) {
            toggleLost(id);
        } else {
            toggleObtained(id);
        }
    });

    dom.grid.addEventListener('keydown', (e) => {
        if (state.viewMode || e.target.closest('.card-crown')) return;
        if (e.key !== 'Enter' && e.key !== ' ') return;

        const card = e.target.closest('.card');
        if (!card) return;

        e.preventDefault();
        toggleObtained(card.dataset.id);
    });

    if (dom.searchInput) {
        dom.searchInput.addEventListener('input', () => {
            state.filters.search = dom.searchInput.value;
            persist(STORAGE_KEYS.search, state.filters.search);
            renderGrid();
        });
    }

    if (dom.themeFilter) {
        dom.themeFilter.addEventListener('change', () => {
            state.filters.theme = dom.themeFilter.value;
            persist(STORAGE_KEYS.theme, state.filters.theme);
            renderGrid();
        });
    }

    if (dom.seasonFilter) {
        dom.seasonFilter.addEventListener('change', () => {
            state.filters.season = dom.seasonFilter.value;
            persist(STORAGE_KEYS.season, state.filters.season);
            renderGrid();
        });
    }

    if (dom.sortOrder) {
        dom.sortOrder.addEventListener('change', () => {
            state.settings.sortOrder = dom.sortOrder.value;
            persist(STORAGE_KEYS.sortOrder, state.settings.sortOrder);
            renderGrid();
        });
    }

    if (dom.statusPills) {
        dom.statusPills.addEventListener('click', (e) => {
            const pill = e.target.closest('.pill');
            if (!pill || state.viewMode) return;
            state.filters.status = pill.dataset.status;
            persist(STORAGE_KEYS.status, state.filters.status);
            applyStateToDOM();
            renderGrid();
        });
    }

    const switchKeys = ['hideMastered', 'showUnreleased', 'lowFidelity', 'openExports'];
    switchKeys.forEach(key => {
        if (!dom[key]) return;
        dom[key].addEventListener('change', () => {
            if (key === 'openExports') {
                state.settings.openExports = !dom.openExports.checked;
                persist(STORAGE_KEYS.openExports, state.settings.openExports);
                applyStateToDOM();
            } else {
                state.settings[key] = dom[key].checked;
                persist(STORAGE_KEYS[key], state.settings[key]);
                if (key === 'lowFidelity') {
                    document.body.classList.toggle('low-fidelity', dom[key].checked);
                }
                renderGrid();
            }
        });
    });

    if (dom.exportToggle) {
        dom.exportToggle.addEventListener('click', (e) => {
            e.stopPropagation();
            setDropdownOpen(dom.copyDropdown, dom.copyToggle, false);
            setDropdownOpen(dom.exportDropdown, dom.exportToggle, !dom.exportDropdown.classList.contains('open'));
        });
    }

    if (dom.exportDropdown) {
        dom.exportDropdown.querySelectorAll('[data-export]').forEach(btn => {
            btn.addEventListener('click', () => {
                handleExportImage(btn.dataset.export);
                setDropdownOpen(dom.exportDropdown, dom.exportToggle, false);
            });
        });
    }

    if (dom.copyToggle) {
        dom.copyToggle.addEventListener('click', (e) => {
            e.stopPropagation();
            setDropdownOpen(dom.exportDropdown, dom.exportToggle, false);
            setDropdownOpen(dom.copyDropdown, dom.copyToggle, !dom.copyDropdown.classList.contains('open'));
        });
    }

    document.addEventListener('click', (e) => {
        if (dom.exportDropdown && !dom.exportDropdown.contains(e.target)) {
            setDropdownOpen(dom.exportDropdown, dom.exportToggle, false);
        }
        if (dom.copyDropdown && !dom.copyDropdown.contains(e.target)) {
            setDropdownOpen(dom.copyDropdown, dom.copyToggle, false);
        }
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') closeDropdowns();
    });

    if (dom.exportBackupBtn) {
        dom.exportBackupBtn.addEventListener('click', () => {
            const t = getTranslator();
            const data = {
                obtained: state.obtained,
                mastered: state.mastered,
                lost: state.lost,
            };
            const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.download = 'fnsprites-backup.json';
            link.href = url;
            link.click();
            URL.revokeObjectURL(url);
            showToast(t('toasts.backupExported'), 'success');
            setDropdownOpen(dom.exportDropdown, dom.exportToggle, false);
        });
    }

    if (dom.importBtn) {
        dom.importBtn.addEventListener('click', () => {
            const t = getTranslator();
            if (state.viewMode) {
                showToast(t('viewMode.cannotImport'), 'error');
                return;
            }
            if (dom.importInput) dom.importInput.click();
        });
    }

    if (dom.importInput) {
        dom.importInput.addEventListener('change', (e) => {
            const t = getTranslator();
            const file = e.target.files[0];
            if (!file) return;

            const reader = new FileReader();
            reader.onload = (event) => {
                try {
                    const data = JSON.parse(event.target.result);
                    if (!data || !Array.isArray(data.obtained) || !Array.isArray(data.mastered)) {
                        throw new Error('Invalid backup file format');
                    }

                    const validIds = getSpriteIdSet();
                    const obtained = uniqueValidIds(data.obtained, validIds);
                    const obtainedIds = new Set(obtained);
                    const mastered = uniqueValidIds(data.mastered, validIds)
                        .filter(id => obtainedIds.has(id));
                    const lost = uniqueValidIds(data.lost || [], validIds)
                        .filter(id => !obtainedIds.has(id));

                    state.obtained = obtained;
                    state.mastered = mastered;
                    state.lost = lost;

                    saveCollection();
                    renderGrid();
                    showToast(t('toasts.importSuccess'), 'success');
                } catch (err) {
                    showToast(t('toasts.importError'), 'error');
                    console.error(err);
                }
                dom.importInput.value = '';
            };
            reader.readAsText(file);
        });
    }

    if (dom.copyTradeTextBtn) {
        dom.copyTradeTextBtn.addEventListener('click', (e) => {
            const t = getTranslator();
            const releasedSprites = getReleasedSprites();
            const text = generateTradeText({
                releasedSprites,
                familyKeys: Array.from(new Set(releasedSprites.map(getFamilyKey))),
                familyThemeMap: getFamilyThemeMap(releasedSprites),
                counts: getCollectionCounts(releasedSprites),
                isObtained,
                isMastered,
                i18nTitles: {
                    lookingFor: t('tradeText.lookingFor'),
                    have: t('tradeText.have'),
                    stillNeedToMaster: t('tradeText.stillNeedToMaster'),
                    collected: t('tradeText.collected'),
                    mastered: t('tradeText.mastered'),
                    trackYours: t('tradeText.trackYours'),
                },
            });

            copyToClipboard(text, e.currentTarget, t('toasts.tradeListCopied'), t('toasts.tradeListCopyError'));
            setDropdownOpen(dom.copyDropdown, dom.copyToggle, false);
        });
    }

    if (dom.copyTradeGridBtn) {
        dom.copyTradeGridBtn.addEventListener('click', (e) => {
            const t = getTranslator();
            const releasedSprites = getReleasedSprites();
            const text = generateTradeGridText({
                releasedSprites,
                activeThemes: getActiveThemes(releasedSprites),
                familyKeys: Array.from(new Set(releasedSprites.map(getFamilyKey))),
                familyThemeMap: getFamilyThemeMap(releasedSprites),
                counts: getCollectionCounts(releasedSprites),
                isObtained,
                isMastered,
                i18nTitles: {
                    collected: t('tradeText.collected'),
                    mastered: t('tradeText.mastered'),
                    trackYours: t('tradeText.trackYours'),
                },
            });

            copyToClipboard(text, e.currentTarget, t('toasts.tradeGridCopied'), t('toasts.tradeGridCopyError'));
            setDropdownOpen(dom.copyDropdown, dom.copyToggle, false);
        });
    }

    if (dom.shareBtn) {
        dom.shareBtn.addEventListener('click', (e) => {
            const t = getTranslator();
            if (typeof baseSprites === 'undefined') return;
            const code = compressCollection(baseSprites, state.obtained, state.mastered);
            const url = `${location.origin}${location.pathname}?c=${code}`;
            copyToClipboard(url, e.currentTarget, t('toasts.shareCopied'), t('toasts.shareCopyError'));
        });
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const supportBtn = document.getElementById('supportCodeBtn');
    if (supportBtn) {
        supportBtn.addEventListener('click', (e) => {
            e.preventDefault();
            const t = getTranslator();
            copySupportCode(supportBtn, t('toasts.codeCopied'));
        });
    }
});

/* ===================================================
   Initialization
   =================================================== */

function init() {
    if (typeof baseSprites === 'undefined') {
        console.error('baseSprites is not defined.');
        return;
    }

    const params = new URLSearchParams(location.search);
    const shareCode = params.get('c');

    if (shareCode) {
        state.viewMode = true;
        const decoded = decompressCollection(baseSprites, shareCode);
        state.obtained = decoded.obtained;
        state.mastered = decoded.mastered;
        if (dom.viewBanner) dom.viewBanner.hidden = false;
    } else {
        load();
    }

    populateThemeFilter();
    applyStateToDOM();
    renderGrid();
    bindEvents();
    checkUnredeemedCodes();
}

init();
