/**
 * @file commonUi.js
 * @description Shared UI patching logic and language selector management.
 */

import { STORAGE_KEYS, URLS, CREATOR_CODE } from '../constants.js';
import { useTranslations } from '../i18n/index.js';
import { applyTranslations } from '../i18n/dom.js';
import { showToast } from '../utils/toast.js';

const LANG_BTN_ID = 'fn-lang-btn';
const LANG_LABELS = { es: '🇪🇸 ES', en: '🇬🇧 EN', de: '🇩🇪 DE' };

let currentLocale = localStorage.getItem(STORAGE_KEYS.locale) || (navigator.language.startsWith('es') ? 'es' : 'en');
document.documentElement.lang = currentLocale;
let t = useTranslations(currentLocale);

/**
 * Get the active translation function `t(key, ...args)`.
 * @returns {(key: string, ...args: any[]) => string} Translation function.
 */
export function getTranslator() {
    return t;
}

/**
 * Get current active locale key.
 * @returns {string} Locale key ('es', 'en', 'de').
 */
export function getCurrentLocale() {
    return currentLocale;
}

/**
 * Inject the language selector dropdown into the page navigation.
 * @param {HTMLElement|null} targetContainer - Target container element to append language selector.
 * @returns {void}
 */
export function initLanguageSelector(targetContainer = null) {
    if (document.getElementById(LANG_BTN_ID)) return;

    const container = targetContainer || document.getElementById('shareBtn')?.parentNode || document.querySelector('.actions');
    if (!container) return;

    const sel = document.createElement('select');
    sel.id = LANG_BTN_ID;
    sel.className = 'lang-select';
    sel.setAttribute('aria-label', 'Language');
    sel.style.cssText = 'background:#1a1a2e;color:#e0e0e0;border:1px solid #444;border-radius:4px;padding:4px 6px;font-size:13px;cursor:pointer';

    for (const [code, label] of Object.entries(LANG_LABELS)) {
        const opt = document.createElement('option');
        opt.value = code;
        opt.textContent = label;
        if (code === currentLocale) opt.selected = true;
        sel.appendChild(opt);
    }

    const shareBtn = document.getElementById('shareBtn');
    if (shareBtn && shareBtn.parentNode === container) {
        container.insertBefore(sel, shareBtn.nextSibling);
    } else {
        container.appendChild(sel);
    }

    sel.addEventListener('change', () => {
        currentLocale = sel.value;
        localStorage.setItem(STORAGE_KEYS.locale, currentLocale);
        document.documentElement.lang = currentLocale;
        t = useTranslations(currentLocale);
        window.location.reload();
    });
}

/**
 * Patch support footer message and Epic Partner note.
 * @returns {void}
 */
export function patchSupportFooter() {
    const supportMsg = document.querySelector('.support-message');
    if (supportMsg) {
        const codeBtn = supportMsg.querySelector('.btn-copy-code');
        const codeText = codeBtn ? codeBtn.textContent.trim() : CREATOR_CODE;
        let link = supportMsg.querySelector('.item-shop-link');

        supportMsg.innerHTML = '';
        supportMsg.appendChild(document.createTextNode(t('support.useCode') + ' '));

        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'btn-copy-code';
        btn.id = 'supportCodeBtn';
        btn.textContent = codeText;
        supportMsg.appendChild(btn);

        supportMsg.appendChild(document.createTextNode(' ' + t('support.inThe') + ' '));

        if (!link) {
            link = document.createElement('a');
            link.className = 'item-shop-link';
            link.target = '_blank';
            link.rel = 'noopener noreferrer';
            link.href = URLS.creatorShop;
        }
        link.textContent = t('support.itemShop');
        supportMsg.appendChild(link);

        supportMsg.appendChild(document.createTextNode(' ' + t('support.supportMe')));
    }

    const epicPartner = document.querySelector('.epic-partner');
    if (epicPartner) {
        epicPartner.textContent = t('support.epicPartner');
    }
}

/**
 * Replace legacy staticvacant URLs with current fork domain.
 * @returns {void}
 */
export function removeStaticvacantBranding() {
    document.querySelectorAll('a[href*="staticvacant"]').forEach(a => {
        a.href = a.href.replace('staticvacant.github.io/fnsprites', 'itskreisler.github.io/fnsprites');
    });
}

/**
 * Append creator info card to sidebar/footer.
 * @returns {void}
 */
export function addCreatorCard() {
    if (document.querySelector('.creator-card')) return;
    const sidebar = document.querySelector('.app > .app') || document.querySelector('.app');
    if (!sidebar) return;

    const card = document.createElement('div');
    card.className = 'panel creator-card';
    card.style.cssText = 'text-align:center;padding:16px;margin-top:16px;border:2px solid var(--border);border-radius:8px';

    const title = document.createElement('div');
    title.style.cssText = 'font-size:18px;font-weight:700;color:#ffd700;margin-bottom:8px';
    title.textContent = t('creator.madeBy');
    card.appendChild(title);

    const link = document.createElement('a');
    link.href = URLS.youtube;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    link.style.cssText = 'display:block;width:64px;height:64px;border-radius:50%;overflow:hidden;margin:0 auto;border:2px solid var(--border)';

    const img = document.createElement('img');
    img.src = 'siteimages/staticsprite.png';
    img.alt = 'Kreisler';
    img.style.cssText = 'width:100%;height:100%;object-fit:cover';
    link.appendChild(img);
    card.appendChild(link);

    const subBtn = document.createElement('a');
    subBtn.href = URLS.creatorShop;
    subBtn.target = '_blank';
    subBtn.rel = 'noopener noreferrer';
    subBtn.textContent = t('creator.code');
    subBtn.style.cssText = 'display:inline-block;background:#ff0000;color:#fff;font-weight:700;padding:6px 16px;margin-top:8px;border-radius:4px;text-decoration:none;font-size:14px';
    card.appendChild(subBtn);

    const help = document.createElement('div');
    help.style.cssText = 'font-size:13px;color:#a0aec0;margin-top:8px';
    help.textContent = t('creator.helpText');
    card.appendChild(help);

    sidebar.appendChild(card);
}

/**
 * Apply DOM translations using current translator.
 * @returns {void}
 */
export function updateDomTranslations() {
    applyTranslations(t);
}

/**
 * Initializes offline/online connectivity listeners and Service Worker registration.
 */
export function initOfflineAndPWA() {
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('./sw.js').catch((err) => {
                console.warn('Service Worker registration failed:', err);
            });
        });
    }

    window.addEventListener('online', () => {
        showToast(t('offline.onlineStatus'));
    });

    window.addEventListener('offline', () => {
        showToast(t('offline.offlineStatus'));
    });
}
