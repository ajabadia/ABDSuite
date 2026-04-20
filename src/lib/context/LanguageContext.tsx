'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Language, translations } from '@/lib/i18n/translations';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (path: string, params?: Record<string, string | number>) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

interface LanguageProviderProps {
  children: React.ReactNode;
  initialLang?: Language;
}

export const LanguageProvider: React.FC<LanguageProviderProps> = ({ children, initialLang = 'es' }) => {
  const [language, setLanguage] = useState<Language>(initialLang);

  // Load from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('abdfn-lang') as Language;
    if (saved && ['es', 'en', 'fr', 'de'].includes(saved)) {
      setLanguage(saved);
    } else {
      // Auto-detect browser language
      const browserLang = navigator.language.split('-')[0] as Language;
      if (['es', 'en', 'fr', 'de'].includes(browserLang)) {
        setLanguage(browserLang);
      }
    }
  }, []);

  // Save to localStorage on change
  useEffect(() => {
    localStorage.setItem('abdfn-lang', language);
  }, [language]);

  /**
   * Helper to get nested translation strings and replace params
   * e.g. t('logs.summary', { s: 5, e: 0, k: 1 })
   */
  const t = useCallback((path: string, params?: Record<string, string | number>): string => {
    const keys = path.split('.');
    let current: any = translations[language];

    for (const key of keys) {
      if (current[key] === undefined) {
        // Fallback to English if key missing
        console.warn(`Translation missing for ${path} in ${language}`);
        current = translations['en'];
        for (const k of keys) {
          if (current[k] === undefined) return path;
          current = current[k];
        }
        break;
      }
      current = current[key];
    }

    if (typeof current !== 'string') return path;

    // Replace params: {s} or {{s}} -> value
    let result = current;
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        const valStr = String(value);
        // Handle both standard {key} and double {{key}}
        result = result.split(`{{${key}}}`).join(valStr);
        result = result.split(`{${key}}`).join(valStr);
      });
    }

    return result;
  }, [language]);

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
