/**
 * ABDFN SUITE - Internationalization Facade
 * ----------------------------------------
 * Este archivo actúa como punto de entrada para el sistema i18n modular. 
 * Las traducciones reales residen en /src/locales/*.json y son consolidadas por el loader.
 */

import { translations as modularTranslations } from './loader';

export type Language = 'es' | 'en' | 'fr' | 'de';

/**
 * Exportamos el objeto consolidado manteniendo el contrato original para no romper dependencias.
 */
export const translations = modularTranslations as any;
