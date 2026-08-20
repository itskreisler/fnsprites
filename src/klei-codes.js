import { useTranslations } from './i18n/index.js'
import { applyTranslations } from './i18n/dom.js'

const STORE_KEY = 'fn_locale'
const LANG_BTN_ID = 'fn-lang-btn'

let currentLocale = localStorage.getItem(STORE_KEY) || (navigator.language.startsWith('es') ? 'es' : 'en')
document.documentElement.lang = currentLocale
let t = useTranslations(currentLocale)

function patchHeaderTitle() {
    const h1 = document.querySelector('.brand h1')
    if (h1) h1.textContent = t('codes.title')
    document.title = t('codes.title')
}

function patchReturnBtn() {
    const returnBtn = document.querySelector('.actions .btn-accent')
    if (returnBtn) returnBtn.textContent = t('codes.return')
}

function patchToolbar() {
    const hideToggle = document.getElementById('hideRedeemedToggle')
    if (hideToggle) {
        const sp = hideToggle.closest('.switch')?.querySelector('span')
        if (sp) sp.textContent = t('codes.hideRedeemed')
    }
    const redeemAllBtn = document.getElementById('redeemAllBtn')
    if (redeemAllBtn) redeemAllBtn.textContent = t('codes.redeemAll')
    const unredeemAllBtn = document.getElementById('unredeemAllBtn')
    if (unredeemAllBtn) unredeemAllBtn.textContent = t('codes.unredeemAll')
}

function patchColumnHeaders() {
    const header = document.querySelector('.codes-table-header')
    if (header) {
        const spans = header.querySelectorAll('span')
        if (spans[0]) spans[0].textContent = t('codes.code')
        if (spans[1]) spans[1].textContent = t('codes.reward')
        if (spans[2]) spans[2].textContent = t('codes.actions')
    }
}

function patchEmptyState() {
    document.querySelectorAll('.codes-empty').forEach(el => {
        el.textContent = t('codes.empty')
    })
}

function patchCodeRows() {
    document.querySelectorAll('.code-row').forEach(row => {
        const copyBtn = row.querySelector('.btn-copy')
        if (copyBtn) copyBtn.textContent = t('codes.copyCode')
        const redeemBtn = row.querySelector('.btn-redeem')
        if (redeemBtn) {
            const isRedeemed = redeemBtn.classList.contains('btn-accent') === false
            if (isRedeemed) {
                redeemBtn.textContent = t('codes.redeemed')
            } else {
                redeemBtn.textContent = t('codes.markRedeemed')
            }
        }
    })
}

function patchSupportFooter() {
    const supportMsg = document.querySelector('.support-message')
    if (supportMsg) {
        const codeBtn = supportMsg.querySelector('.btn-copy-code')
        const codeText = codeBtn ? codeBtn.textContent.trim() : 'BATTER'
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
        if (link) supportMsg.appendChild(link)
        supportMsg.appendChild(document.createTextNode(' ' + t('support.supportMe')))
    }
    const epicPartner = document.querySelector('.epic-partner')
    if (epicPartner) epicPartner.textContent = t('support.epicPartner')
}

function addLangBtn() {
    if (document.getElementById(LANG_BTN_ID)) return
    const actions = document.querySelector('.actions')
    if (!actions) return
    const btn = document.createElement('button')
    btn.id = LANG_BTN_ID
    btn.type = 'button'
    btn.className = 'btn lang-btn'
    btn.textContent = currentLocale === 'es' ? 'EN' : 'ES'
    actions.prepend(btn)
    btn.addEventListener('click', () => {
        currentLocale = currentLocale === 'es' ? 'en' : 'es'
        localStorage.setItem(STORE_KEY, currentLocale)
        window.location.reload()
    })
}

function rebuildAll() {
    patchHeaderTitle()
    patchReturnBtn()
    patchToolbar()
    patchColumnHeaders()
    patchSupportFooter()
    applyTranslations(t)
    // Re-patch code rows after render
    setTimeout(() => {
        patchCodeRows()
        patchEmptyState()
    }, 100)
}

function waitAndPatch() {
    if (!document.querySelector('#codesList')) {
        requestAnimationFrame(waitAndPatch)
        return
    }
    addLangBtn()
    rebuildAll()
}

function observeCodeChanges() {
    const list = document.getElementById('codesList')
    if (!list) return
    const obs = new MutationObserver(() => {
        patchCodeRows()
        patchEmptyState()
    })
    obs.observe(list, { childList: true, subtree: true })
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        waitAndPatch()
        observeCodeChanges()
    })
} else {
    waitAndPatch()
    observeCodeChanges()
}
