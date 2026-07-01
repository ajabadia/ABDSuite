/**
 * @purpose Gestiona la configuración de solicitudes de i18n centralizadas para todo el conjunto ABD Suite.
 * @purpose_en Manages centralized i18n request configuration for the entire ABD Suite.
 * @refactorable false
 * @classification Business Service
 * @complexity Low
 * @fingerprint exports:0,imports:2,sig:1abdmxn
 * @lastUpdated 2026-06-30T05:49:21.475Z
 */
import { getRequestConfig } from 'next-intl/server';
import { routing } from './routing.js';

export default getRequestConfig(async ({ requestLocale }) => {
  let locale = await requestLocale;

  if (!locale || !routing.locales.includes(locale as typeof routing.locales[number])) {
    locale = routing.defaultLocale;
  }

  const { locales: allMessages } = await import('./index.js');
  const messages = allMessages[locale as keyof typeof allMessages];

  return {
    locale,
    messages,
    timeZone: 'Europe/Madrid',
  };
});
