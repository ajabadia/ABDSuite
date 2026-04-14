'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';

export type ThemeMode = 'light' | 'dark' | 'system' | 'auto';
export type ResolvedTheme = 'light' | 'dark';

interface ThemeContextType {
  mode: ThemeMode;
  resolvedTheme: ResolvedTheme;
  setMode: (mode: ThemeMode) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [mode, setModeState] = useState<ThemeMode>('dark');
  const [resolvedTheme, setResolvedTheme] = useState<ResolvedTheme>('dark');

  const getSystemTheme = (): ResolvedTheme => {
    if (typeof window === 'undefined') return 'dark';
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  };

  const getTimeBasedTheme = (): ResolvedTheme => {
    const hour = new Date().getHours();
    return (hour >= 8 && hour < 20) ? 'light' : 'dark';
  };

  const resolveTheme = useCallback((currentMode: ThemeMode): ResolvedTheme => {
    switch (currentMode) {
      case 'light': return 'light';
      case 'dark': return 'dark';
      case 'system': return getSystemTheme();
      case 'auto': return getTimeBasedTheme();
      default: return 'dark';
    }
  }, []);

  const setMode = (newMode: ThemeMode) => {
    setModeState(newMode);
    const resolved = resolveTheme(newMode);
    setResolvedTheme(resolved);
    document.documentElement.setAttribute('data-theme', resolved);
    localStorage.setItem('abdfn-theme-mode', newMode);
  };

  // Initialize
  useEffect(() => {
    const saved = localStorage.getItem('abdfn-theme-mode') as ThemeMode;
    const initialMode = saved || 'dark';
    setModeState(initialMode);
    const resolved = resolveTheme(initialMode);
    setResolvedTheme(resolved);
    document.documentElement.setAttribute('data-theme', resolved);
  }, [resolveTheme]);

  // Listeners
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleSystemChange = () => {
      if (mode === 'system') {
        const r = getSystemTheme();
        setResolvedTheme(r);
        document.documentElement.setAttribute('data-theme', r);
      }
    };

    const interval = setInterval(() => {
      if (mode === 'auto') {
        const r = getTimeBasedTheme();
        if (r !== resolvedTheme) {
          setResolvedTheme(r);
          document.documentElement.setAttribute('data-theme', r);
        }
      }
    }, 60000);

    mediaQuery.addEventListener('change', handleSystemChange);
    return () => {
      mediaQuery.removeEventListener('change', handleSystemChange);
      clearInterval(interval);
    };
  }, [mode, resolvedTheme]);

  return (
    <ThemeContext.Provider value={{ mode, resolvedTheme, setMode }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useThemeContext = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useThemeContext must be used within a ThemeProvider');
  }
  return context;
};
