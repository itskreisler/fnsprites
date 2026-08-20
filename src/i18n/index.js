import { createI18n } from 'https://cdn.jsdelivr.net/npm/@kreisler/i18n@1.0.1/+esm'
import { es } from './langs/es.js'
import { en } from './langs/en.js'

const i18n = createI18n({
    defaultLocale: 'es',
    messages: { es, en }
})

export const { useTranslations, getAvailableLocales, getDefaultLocale } = i18n
