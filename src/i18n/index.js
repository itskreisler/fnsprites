/**
 * @module i18n
 * @description Vanilla i18n — reimplementation of @kreisler/i18n API.
 * Zero dependencies, zero network requests.
 */

import { es } from './langs/es.js'
import { en } from './langs/en.js'

/**
 * Resolve a dot-notated path on a nested object.
 * @param {Record<string, unknown>} obj - Root object to traverse.
 * @param {string} path - Dot-separated key path (e.g. `"toolbar.export"`).
 * @returns {unknown} The value at the path, or `undefined`.
 */
function getByPath(obj, path) {
    return path.split('.').reduce((o, k) => o?.[k], obj)
}

/**
 * Replace positional `{0}`, `{1}` and named `{foo}` placeholders.
 * @param {string} str - Template string.
 * @param {Array<string|number>} positional - Positional arguments.
 * @param {Record<string, string|number>} [named] - Named arguments object.
 * @returns {string} Interpolated string.
 */
function interpolate(str, positional, named) {
    return str
        .replace(/\{(\d+)\}/g, (_, i) => positional[i] ?? `{${i}}`)
        .replace(/\{(\w+)\}/g, (_, name) => named?.[name] ?? `{${name}}`)
}

/**
 * @typedef {Object} I18nConfig
 * @property {string} defaultLocale - Fallback locale key.
 * @property {Record<string, Record<string, unknown>>} messages - Locale → key-value translations.
 */

/**
 * @typedef {Object} I18nInstance
 * @property {(locale: string) => TranslationFn} useTranslations - Get a translator for a locale.
 * @property {() => string[]} getAvailableLocales - List registered locale keys.
 * @property {() => string} getDefaultLocale - Return the default locale key.
 */

/**
 * @callback TranslationFn
 * @param {string} key - Dot-notated translation key (e.g. `"toolbar.export"`).
 * @param {...(string|number|Record<string, string|number>)} args - Positional or named interpolation args.
 * @returns {string} Translated string, or the raw key if not found.
 */

/**
 * Create an i18n instance.
 * @param {I18nConfig} config
 * @returns {I18nInstance}
 */
export function createI18n(config) {
    const { defaultLocale = 'es', messages = {} } = config

    /**
     * @param {string} locale
     * @returns {TranslationFn}
     */
    function useTranslations(locale) {
        /** @type {Record<string, unknown>} */
        const dict = messages[locale] || messages[defaultLocale] || {}
        return (key, ...args) => {
            const val = getByPath(dict, key)
            if (typeof val !== 'string') return key
            /** @type {Record<string, string|number>|undefined} */
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

/** @type {I18nInstance} */
const i18n = createI18n({
    defaultLocale: 'es',
    messages: { es, en }
})

export const { useTranslations, getAvailableLocales, getDefaultLocale } = i18n
