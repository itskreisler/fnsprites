import { useTranslations } from './i18n/index.js'
import { applyTranslations } from './i18n/dom.js'

const STORE_KEY = 'fn_locale'
const LANG_BTN_ID = 'fn-lang-btn'

let currentLocale = localStorage.getItem(STORE_KEY) || (navigator.language.startsWith('es') ? 'es' : 'en')
document.documentElement.lang = currentLocale
let t = useTranslations(currentLocale)

function patchThemeFilter() {
    const sel = document.getElementById('themeFilter')
    if (!sel) return
    Array.from(sel.options).forEach(opt => {
        const themeKey = opt.value
        if (themeKey !== 'all') {
            opt.textContent = t('theme.' + themeKey)
        }
    })
}

function patchStatusPills() {
    document.querySelectorAll('#statusPills .pill').forEach(pill => {
        const status = pill.dataset.status
        const key = 'toolbar.' + status
        const label = t(key)
        if (label && label !== key) pill.textContent = label
    })
}

function patchSeasonFilter() {
    const sel = document.getElementById('seasonFilter')
    if (!sel) return
    Array.from(sel.options).forEach(opt => {
        if (opt.value === 'all') opt.textContent = t('toolbar.allSeasons')
    })
}

function patchHideMasteredLabel() {
    document.querySelectorAll('.switch').forEach(sw => {
        const cb = sw.querySelector('input[type="checkbox"]')
        const sp = sw.querySelector('span')
        if (!cb || !sp) return
        if (cb.id === 'hideMastered') sp.textContent = t('toolbar.hideMastered')
        else if (cb.id === 'showUnreleased') sp.textContent = t('toolbar.showUnreleased')
        else if (cb.id === 'lowFidelity') sp.textContent = t('toolbar.lowFidelity')
        else if (cb.id === 'openExports') sp.textContent = t('toolbar.downloadExports')
    })
}

function patchExportDropdown() {
    document.querySelectorAll('#exportDropdown .dropdown-menu button[data-export]').forEach(btn => {
        const mode = btn.dataset.export
        const map = {
            collected: 'toolbar.collectionImage',
            missing: 'toolbar.missingSprites',
            unmastered: 'toolbar.unmasteredSprites',
            mastered: 'toolbar.masteredSprites',
            trade: 'toolbar.tradeCard',
        }
        const key = map[mode]
        if (key) {
            const textNode = btn.childNodes[btn.childNodes.length - 1]
            if (textNode) textNode.textContent = t(key)
        }
    })
    document.querySelectorAll('#exportDropdown .dropdown-menu button:not([data-export])').forEach(btn => {
        if (btn.id === 'exportBackupBtn') btn.textContent = t('toolbar.backupData')
    })
    const exportToggle = document.getElementById('exportToggle')
    if (exportToggle) exportToggle.textContent = t('toolbar.export')
}

function patchCopyDropdown() {
    document.querySelectorAll('#copyDropdown .dropdown-menu button').forEach(btn => {
        if (btn.id === 'copyTradeTextBtn') btn.textContent = t('toolbar.copyTradeText')
        else if (btn.id === 'copyTradeGridBtn') btn.textContent = t('toolbar.copyTradeGrid')
    })
    const copyToggle = document.getElementById('copyToggle')
    if (copyToggle) copyToggle.textContent = t('toolbar.copyTradeList')
}

function patchCodesBtn() {
    const codesBtn = document.getElementById('codesBtn')
    if (codesBtn) {
        // Preserve the notification dot
        const dot = codesBtn.querySelector('.notification-dot')
        const dotHTML = dot ? dot.outerHTML : ''
        codesBtn.innerHTML = t('toolbar.lobbyHacks') + dotHTML
    }
}

function patchLabels() {
    patchThemeFilter()
    patchStatusPills()
    patchSeasonFilter()
    patchHideMasteredLabel()
    patchExportDropdown()
    patchCopyDropdown()
    patchCodesBtn()
    const importBtn = document.getElementById('importBtn')
    if (importBtn) importBtn.textContent = t('toolbar.import')
    const shareBtn = document.getElementById('shareBtn')
    if (shareBtn) shareBtn.textContent = t('toolbar.share')
    const sortSelect = document.getElementById('sortOrder')
    if (sortSelect) {
        const m = { theme: 'toolbar.sortTheme', sprite: 'toolbar.sortSprite', name: 'toolbar.sortName', rarity: 'toolbar.sortRarity' }
        Array.from(sortSelect.options).forEach(opt => {
            const key = m[opt.value]
            if (key) opt.textContent = t(key)
        })
    }
    const searchInput = document.getElementById('searchInput')
    if (searchInput) searchInput.placeholder = t('toolbar.searchPlaceholder')
    patchHackBadges()
}

function patchHackBadges() {
    document.querySelectorAll('.hack-badge').forEach(el => {
        el.textContent = t('card.hackAvailable')
    })
}

function patchViewBanner() {
    const viewBanner = document.getElementById('viewBanner')
    if (viewBanner) {
        const span = viewBanner.querySelector('span')
        if (span) span.textContent = t('viewMode.banner')
        const link = viewBanner.querySelector('a')
        if (link) link.textContent = t('viewMode.goToPersonal')
    }
}

function patchSupportFooter() {
    const supportMsg = document.querySelector('.support-message')
    if (supportMsg) {
        const codeBtn = supportMsg.querySelector('.btn-copy-code')
        const codeText = codeBtn ? codeBtn.textContent.trim() : 'KLEI'
        const link = supportMsg.querySelector('.item-shop-link')
        supportMsg.innerHTML = ''
        supportMsg.appendChild(document.createTextNode(t('support.useCode') + ' '))
        const btn = document.createElement('button')
        btn.type = 'button'
        btn.className = 'btn-copy-code'
        btn.id = 'supportCodeBtn'
        btn.textContent = codeText
        supportMsg.appendChild(btn)
        supportMsg.appendChild(document.createTextNode(' ' + t('support.itemShop') + ' '))
        if (link) {
            supportMsg.appendChild(link)
        }
        supportMsg.appendChild(document.createTextNode(' ' + t('support.supportMe')))
    }
    const epicPartner = document.querySelector('.epic-partner')
    if (epicPartner) epicPartner.textContent = t('support.epicPartner')
}

function rebuildLabels() {
    patchLabels()
    applyTranslations(t)
}

function addLangBtn() {
    if (document.getElementById(LANG_BTN_ID)) return
    const shareBtn = document.getElementById('shareBtn')
    if (!shareBtn) return
    const btn = document.createElement('button')
    btn.id = LANG_BTN_ID
    btn.type = 'button'
    btn.className = 'btn lang-btn'
    btn.textContent = currentLocale === 'es' ? 'EN' : 'ES'
    shareBtn.parentNode.insertBefore(btn, shareBtn.nextSibling)
    btn.addEventListener('click', () => {
        currentLocale = currentLocale === 'es' ? 'en' : 'es'
        localStorage.setItem(STORE_KEY, currentLocale)
        document.documentElement.lang = currentLocale
        t = useTranslations(currentLocale)
        btn.textContent = currentLocale === 'es' ? 'EN' : 'ES'
        rebuildLabels()
        window.location.reload()
    })
}

function patchHeaderTitle() {
    const h1 = document.querySelector('.brand h1')
    if (h1) h1.textContent = t('app.title')
    document.title = t('app.title')
}

function patchProgressLabels() {
    document.querySelectorAll('.progress-label').forEach(el => {
        if (el.textContent === 'Collection' || el.textContent === 'COLECCIÓN') el.textContent = t('app.collection')
        else if (el.textContent === 'Mastery' || el.textContent === 'MAESTRÍA') el.textContent = t('app.mastery')
    })
}

function addCreatorCard() {
    if (document.querySelector('.creator-card')) return
    const sidebar = document.querySelector('.app > .app')
    if (!sidebar) return

    const card = document.createElement('div')
    card.className = 'panel creator-card'
    card.style.cssText = 'text-align:center;padding:16px;margin-top:16px;border:2px solid var(--border);border-radius:8px'

    const title = document.createElement('div')
    title.style.cssText = 'font-size:18px;font-weight:700;color:#ffd700;margin-bottom:8px'
    title.textContent = t('creator.madeBy')
    card.appendChild(title)

    const link = document.createElement('a')
    link.href = 'https://youtube.com/@itskreisler'
    link.target = '_blank'
    link.style.cssText = 'display:block;width:64px;height:64px;border-radius:50%;overflow:hidden;margin:0 auto;border:2px solid var(--border)'

    const img = document.createElement('img')
    img.src = 'siteimages/staticsprite.png'
    img.alt = 'Kreisler'
    img.style.cssText = 'width:100%;height:100%;object-fit:cover'
    link.appendChild(img)
    card.appendChild(link)

    const subBtn = document.createElement('a')
    subBtn.href = 'https://www.fortnite.com/item-shop?creator-code=klei'
    subBtn.target = '_blank'
    subBtn.textContent = t('creator.code')
    subBtn.style.cssText = 'display:inline-block;background:#ff0000;color:#fff;font-weight:700;padding:6px 16px;margin-top:8px;border-radius:4px;text-decoration:none;font-size:14px'
    card.appendChild(subBtn)

    const help = document.createElement('div')
    help.style.cssText = 'font-size:13px;color:#a0aec0;margin-top:8px'
    help.textContent = t('creator.helpText')
    card.appendChild(help)

    const footer = document.querySelector('.app > :last-child')
    if (footer) footer.parentNode.appendChild(card)
    else document.querySelector('.app')?.appendChild(card)
}

function removeStaticvacantBranding() {
    document.querySelectorAll('a[href*="staticvacant"]').forEach(a => {
        a.href = a.href.replace('staticvacant.github.io/fnsprites', 'itskreisler.github.io/fnsprites')
    })
}

function waitAndPatch() {
    if (!document.querySelector('#spriteGrid') && !document.querySelector('#codesList')) {
        requestAnimationFrame(waitAndPatch)
        return
    }

    addLangBtn()
    patchHeaderTitle()
    patchProgressLabels()
    patchLabels()
    patchViewBanner()
    patchSupportFooter()
    removeStaticvacantBranding()
    addCreatorCard()
    applyTranslations(t)
    observeGridChanges()
}

function observeGridChanges() {
    const grid = document.getElementById('spriteGrid')
    if (!grid) return
    const obs = new MutationObserver(() => {
        patchLabels()
        patchProgressLabels()
    })
    obs.observe(grid, { childList: true, subtree: true })
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', waitAndPatch)
} else {
    waitAndPatch()
}
