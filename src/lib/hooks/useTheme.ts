'use client';

import { useThemeContext } from '@/lib/context/ThemeContext';

export const useTheme = () => {
  return useThemeContext();
};
