/**
 * @purpose Gestiona la inicialización del tema del cliente al cargar de manera segura el tema preferido del usuario desde localStorage y aplicarlo a la raíz del elemento documental.
 * @purpose_en Manages client-side theme initialization by safely loading the user's preferred theme from localStorage and applying it to the document root element.
 * @refactorable false
 * @classification UI Component
 * @complexity Low
 * @fingerprint exports:1,imports:1,sig:ujaht3
 * @lastUpdated 2026-06-23T23:26:29.960Z
 */

import React from 'react';

/**
 * 🌓 ThemeScript: Centralized client-side theme initialization
 * Safely loads the user's preferred theme from localStorage prior to full rendering,
 * preventing flash of unstyled content (FOUC).
 */
export function ThemeScript() {
  const code = `
    try {
      var match = document.cookie.match(/(?:^|; )abd_theme=([^;]*)/);
      var theme = (match && match[1]) || localStorage.getItem('theme') || 'dark';
      if (theme === 'system') {
        var isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        document.documentElement.className = isDark ? 'dark' : 'light';
      } else {
        document.documentElement.className = theme;
      }
    } catch (e) {}
  `;

  return (
    <script suppressHydrationWarning dangerouslySetInnerHTML={{ __html: code }} />
  );
}
