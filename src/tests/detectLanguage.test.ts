import { detectLanguage, SUPPORTED_LANGS } from '@/lib/i18n/detectLanguage';

/**
 * Test Jest para detectLanguage
 * Simula localStorage, navigator.languages y navigator.language.
 */

describe('detectLanguage', () => {
  const originalNavigator = typeof global !== 'undefined' ? global.navigator : undefined;
  const originalWindow = typeof global !== 'undefined' ? (global as any).window : undefined;

  beforeEach(() => {
    // Simular entorno de navegador básico
    (global as any).window = {} as any;

    const fakeNavigator = {
      language: 'es-ES',
      languages: ['es-ES', 'en-US'],
    };
    
    Object.defineProperty(global, 'navigator', {
      value: fakeNavigator,
      configurable: true,
      writable: true
    });

    // Mock simple de localStorage
    const store: Record<string, string> = {};
    (global as any).localStorage = {
      getItem: (k: string) => store[k] ?? null,
      setItem: (k: string, v: string) => {
        store[k] = v;
      },
      removeItem: (k: string) => {
        delete store[k];
      },
      clear: () => {
        Object.keys(store).forEach(k => delete store[k]);
      },
    };
  });

  afterEach(() => {
    // Restaurar globals
    Object.defineProperty(global, 'navigator', {
      value: originalNavigator,
      configurable: true,
    });
    (global as any).window = originalWindow;
    (global as any).localStorage = undefined;
  });

  it('usa el idioma guardado en localStorage si es soportado', () => {
    localStorage.setItem('abdfn-lang', 'fr');
    const lang = detectLanguage();
    expect(lang).toBe('fr');
  });

  it('ignora valores no soportados en localStorage y usa navigator.languages', () => {
    localStorage.setItem('abdfn-lang', 'it' as any);
    (navigator as any).languages = ['de-DE', 'en-US'];

    const lang = detectLanguage();
    expect(lang).toBe('de');
    expect(SUPPORTED_LANGS).toContain(lang);
  });

  it('usa navigator.language si no hay languages[]', () => {
    localStorage.removeItem('abdfn-lang');
    (navigator as any).languages = undefined;
    (navigator as any).language = 'en-US';

    const lang = detectLanguage();
    expect(lang).toBe('en');
  });

  it('hace fallback a es si nada coincide', () => {
    localStorage.removeItem('abdfn-lang');
    (navigator as any).languages = ['it-IT', 'pt-BR'];
    (navigator as any).language = 'zh-CN';

    const lang = detectLanguage();
    expect(lang).toBe('es');
  });

  it('devuelve es en entorno sin window (SSR)', () => {
    (global as any).window = undefined;
    const lang = detectLanguage();
    expect(lang).toBe('es');
  });
});
