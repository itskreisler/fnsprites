/**
 * @file legal.js
 * @description Inicializa idioma y traducciones en las páginas legales
 * (privacy.html / terms.html) usando el mismo sistema i18n de la app.
 */

import { STORAGE_KEYS } from './constants.js';
import { useTranslations } from './i18n/index.js';
import { applyTranslations } from './i18n/dom.js';
import { storageGet, TypesStorages } from './utils/storage.js';

const currentLocale = storageGet(null, STORAGE_KEYS.locale, TypesStorages.LOCAL_STORAGE) || (navigator.language.startsWith('es') ? 'es' : 'en');
document.documentElement.lang = currentLocale;
applyTranslations(useTranslations(currentLocale));