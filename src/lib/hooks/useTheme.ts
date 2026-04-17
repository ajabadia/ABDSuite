'use client';

import { useThemeContext, ThemeMode } from '@/lib/context/ThemeContext';

export type { ThemeMode };

export const useTheme = () => {
  return useThemeContext();
};
