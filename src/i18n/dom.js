export function applyTranslations(t) {
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.dataset.i18n
        const raw = t(key)
        if (raw && raw !== key) {
            el.textContent = raw
        }
    })
    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
        const key = el.dataset.i18nPlaceholder
        const raw = t(key)
        if (raw && raw !== key) {
            el.placeholder = raw
        }
    })
    document.querySelectorAll('[data-i18n-title]').forEach(el => {
        const key = el.dataset.i18nTitle
        const raw = t(key)
        if (raw && raw !== key) {
            el.title = raw
        }
    })
}
