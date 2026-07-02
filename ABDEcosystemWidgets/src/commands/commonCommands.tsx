/**
 * @purpose Gestiona y devuelve un arreglo de comandos comunes para la aplicación, incluyendo el cambio de idioma, la apertura de configuraciones y acciones de logout.
 * @purpose_en Builds and returns an array of common commands for the application, including language switching, settings opening, and logout actions.
 * @refactorable false
 * @classification Helper Utility
 * @complexity Low
 * @fingerprint exports:2,imports:2,sig:0xnv0o
 * @lastUpdated 2026-06-29T22:22:57.068Z
 */

import { Globe, Settings, LogOut } from 'lucide-react';
import type { Command } from '../navigation/CommandPalette.js';

export interface CommonCommandContext {
  locale: string;
  pathname: string;
  router: { replace: (href: string, opts?: Record<string, unknown>) => void };
  onLogout?: () => void | Promise<void>;
  onOpenSettings?: () => void;
  t?: (key: string) => string;
}

const cmdDict: Record<string, { es: string; en: string }> = {
  switchToEnglish: { es: 'Switch to English', en: 'Cambiar a Español' },
  changeLanguage: { es: 'Change layout language to English', en: 'Cambiar el idioma a Español' },
  settings: { es: 'Configuración', en: 'Settings' },
  openSettings: { es: 'Abrir Panel de Configuración', en: 'Open System Settings' },
  adjustThemeAndLanguage: { es: 'Ajustar temas visuales e idioma', en: 'Adjust theme modes and language' },
  signOut: { es: 'Cerrar Sesión', en: 'Sign Out' },
  signOutSecurely: { es: 'Finalizar sesión de forma segura', en: 'Securely end your session' },
};

function oppositeLocale(l: string): string {
  return l === 'es' ? 'en' : 'es';
}

export function buildCommonCommands(ctx: CommonCommandContext): Command[] {
  const { locale, pathname, router, t: ctxT } = ctx;
  const loc = locale === 'es' ? 'es' : 'en';
  const t = ctxT ?? ((key: string) => cmdDict[key]?.[loc] ?? key);
  return [
    {
      id: 'action-language',
      title: t('switchToEnglish'),
      description: t('changeLanguage'),
      category: t('settings'),
      shortcut: ['c', 'l'],
      icon: <Globe className="w-4 h-4" />,
      action: () => {
        router.replace(pathname, { locale: oppositeLocale(locale) });
      }
    },
    {
      id: 'action-settings',
      title: t('openSettings'),
      description: t('adjustThemeAndLanguage'),
      category: t('settings'),
      shortcut: ['c', 's'],
      icon: <Settings className="w-4 h-4" />,
      action: () => { ctx.onOpenSettings?.(); }
    },
    {
      id: 'action-logout',
      title: t('signOut'),
      description: t('signOutSecurely'),
      category: t('settings'),
      shortcut: ['q', 'q'],
      icon: <LogOut className="w-4 h-4" />,
      action: () => { ctx.onLogout?.(); }
    }
  ];
}
