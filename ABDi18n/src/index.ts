/**
 * @purpose Gestiona datos locales para la aplicación importando y exportando archivos de idioma español e inglés.
 * @purpose_en Manages locale data for the application by importing and exporting Spanish and English language files.
 * @refactorable false
 * @classification Data/Constants
 * @complexity Low
 * @fingerprint exports:2,imports:2,sig:1ufzq7u
 * @lastUpdated 2026-06-30T05:49:19.951Z
 */

import es from './locales/es.json' with { type: 'json' };
import en from './locales/en.json' with { type: 'json' };

export const locales = { es, en };
export type LocaleType = typeof es;

export { routing } from './routing.js';
export { Link, redirect, usePathname, useRouter } from './navigation.js';
export { setLocaleCookie, formatDate, buildLocaleToggleHandler } from './utils.js';
