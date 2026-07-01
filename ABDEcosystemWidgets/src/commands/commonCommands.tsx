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
}

export function buildCommonCommands(ctx: CommonCommandContext): Command[] {
  const { locale, pathname, router } = ctx;
  return [
    {
      id: 'action-language',
      title: locale === 'es' ? 'Switch to English' : 'Cambiar a Español',
      description: locale === 'es' ? 'Change layout language to English' : 'Cambiar el idioma a Español',
      category: locale === 'es' ? 'Configuración' : 'Settings',
      shortcut: ['c', 'l'],
      icon: <Globe className="w-4 h-4" />,
      action: () => {
        const nextLocale = locale === 'es' ? 'en' : 'es';
        router.replace(pathname, { locale: nextLocale });
      }
    },
    {
      id: 'action-settings',
      title: locale === 'es' ? 'Abrir Panel de Configuración' : 'Open System Settings',
      description: locale === 'es' ? 'Ajustar temas visuales e idioma' : 'Adjust theme modes and language',
      category: locale === 'es' ? 'Configuración' : 'Settings',
      shortcut: ['c', 's'],
      icon: <Settings className="w-4 h-4" />,
      action: () => { ctx.onOpenSettings?.(); }
    },
    {
      id: 'action-logout',
      title: locale === 'es' ? 'Cerrar Sesión' : 'Sign Out',
      description: locale === 'es' ? 'Finalizar sesión de forma segura' : 'Securely end your session',
      category: locale === 'es' ? 'Configuración' : 'Settings',
      shortcut: ['q', 'q'],
      icon: <LogOut className="w-4 h-4" />,
      action: () => { ctx.onLogout?.(); }
    }
  ];
}
