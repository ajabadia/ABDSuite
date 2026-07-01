/**
 * @purpose Gestiona la configuración de routing para la aplicación ABDi18n utilizando `next-intl`.
 * @purpose_en Defines routing configuration for the ABDi18n application using `next-intl`.
 * @refactorable false
 * @classification Data/Constants
 * @complexity Low
 * @fingerprint exports:1,imports:1,sig:16v754u
 * @lastUpdated 2026-06-29T22:23:51.121Z
 */

import { defineRouting } from 'next-intl/routing';

export const routing = defineRouting({
  locales: ['es', 'en'],
  defaultLocale: 'es',
  localePrefix: 'always',
});
