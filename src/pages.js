import { useTranslations } from '@src/i18n/index.js'
import { applyTranslations } from '@src/i18n/dom.js'

const STORE_KEY = 'fn_locale'
const LANG_BTN_ID = 'fn-lang-btn'

let currentLocale = localStorage.getItem(STORE_KEY) || (navigator.language.startsWith('es') ? 'es' : 'en')
document.documentElement.lang = currentLocale
let t = useTranslations(currentLocale)

function addLangBtn() {
    if (document.getElementById(LANG_BTN_ID)) return
    const slot = document.querySelector('.lang-slot')
    if (!slot) return
    const btn = document.createElement('button')
    btn.id = LANG_BTN_ID
    btn.type = 'button'
    btn.className = 'btn lang-btn'
    btn.textContent = currentLocale === 'es' ? 'EN' : 'ES'
    btn.setAttribute('aria-label', currentLocale === 'es' ? 'Switch to English' : 'Cambiar a espa\u00F1ol')
    slot.appendChild(btn)
    btn.addEventListener('click', () => {
        currentLocale = currentLocale === 'es' ? 'en' : 'es'
        localStorage.setItem(STORE_KEY, currentLocale)
        window.location.reload()
    })
}

function init() {
    addLangBtn()
    applyTranslations(t)
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init)
} else {
    init()
}
