// Vanilla i18n — reimplementation of @kreisler/i18n API (createI18n / useTranslations)
// Zero dependencies, zero network requests.
import { es } from './langs/es.js'
import { en } from './langs/en.js'

function getByPath(obj, path) {
    return path.split('.').reduce((o, k) => o?.[k], obj)
}

function interpolate(str, positional, named) {
    return str
        .replace(/\{(\d+)\}/g, (_, i) => positional[i] ?? `{${i}}`)
        .replace(/\{(\w+)\}/g, (_, name) => named?.[name] ?? `{${name}}`)
}

export function createI18n(config) {
    const { defaultLocale = 'es', messages = {} } = config

    function useTranslations(locale) {
        const dict = messages[locale] || messages[defaultLocale] || {}
        return (key, ...args) => {
            const val = getByPath(dict, key)
            if (typeof val !== 'string') return key
            const named = args.find(a => typeof a === 'object' && a !== null && !Array.isArray(a))
            const positional = args.filter(a => typeof a !== 'object' || a === null || Array.isArray(a))
            return interpolate(val, positional, named)
        }
    }

    return {
        useTranslations,
        getAvailableLocales: () => Object.keys(messages),
        getDefaultLocale: () => defaultLocale,
    }
}

const i18n = createI18n({
    defaultLocale: 'es',
    messages: { es, en }
})

export const { useTranslations, getAvailableLocales, getDefaultLocale } = i18n
