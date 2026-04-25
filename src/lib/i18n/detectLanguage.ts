import type { Language } from './translations';

export const SUPPORTED_LANGS: Language[] = ['es', 'en', 'fr', 'de'];

/**
 * Lógica industrial de detección de idioma.
 * 1. Prioriza localStorage (preferencia manual guardada).
 * 2. navigator.languages (lista ordenada de preferencias del navegador).
 * 3. navigator.language (idioma principal del sistema).
 * 4. Fallback seguro a 'es'.
 */
export function detectLanguage(): Language {
  if (typeof window === 'undefined') return 'es';

  // 1) Preferencia manual previa
  const stored = localStorage.getItem('abdfn-lang') as Language | null;
  if (stored && SUPPORTED_LANGS.includes(stored)) {
    return stored;
  }

  // 2) navigator.languages (orden de preferencia)
  const candidates: string[] = [];
  if (Array.isArray(navigator.languages)) {
    candidates.push(...navigator.languages);
  }
  if (navigator.language) {
    candidates.push(navigator.language);
  }

  for (const cand of candidates) {
    const base = cand.split('-')[0] as Language;
    if (SUPPORTED_LANGS.includes(base)) {
      return base;
    }
  }

  // 3) Fallback seguro
  return 'es';
}
