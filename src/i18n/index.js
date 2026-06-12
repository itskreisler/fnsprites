import { createI18n } from '@kreisler/i18n'
import { es } from '@src/i18n/langs/es'
import { en } from '@src/i18n/langs/en'
import { z } from 'zod'

export const translations = {
    es,
    en
}

export const i18n = createI18n({
    defaultLocale: 'es',
    messages: {
        es,
        en
    }
})

export const { getAvailableLocales, getDefaultLocale, useTranslations } = i18n

export const localeSchema = z.enum(getAvailableLocales())
