'use client';

/**
 * @purpose Renderiza una pestaña de comandos con opciones de navegación y configuración para la aplicación de análisis.
 * @purpose_en Renders a command palette with various navigation and settings options for the Analytics application.
 * @refactorable false
 * @classification UI Component
 * @complexity Low
 * @fingerprint exports:1,imports:5,sig:5ha22r
 * @lastUpdated 2026-06-30T05:48:51.900Z
 */

import React from 'react';
import { useRouter, usePathname } from '@/i18n/routing';
import { useLocale } from 'next-intl';
import { CommandPalette, type Command, buildCommonCommands } from '@ajabadia/ecosystem-widgets';
import { LayoutDashboard, BarChart3, ShieldCheck } from 'lucide-react';

export function AnalyticsCommandPalette() {
  const router = useRouter();
  const pathname = usePathname();
  const locale = useLocale();

  const commands: Command[] = [
    {
      id: 'nav-dashboard',
      title: locale === 'es' ? 'Panel de Control' : 'Dashboard',
      description: locale === 'es' ? 'Ir al panel de analíticas central' : 'Go to the central analytics dashboard',
      category: locale === 'es' ? 'Navegación' : 'Navigation',
      shortcut: ['g', 'd'],
      icon: <LayoutDashboard className="w-4 h-4" />,
      action: () => {
        router.push('/admin');
      }
    },
    {
      id: 'nav-suite',
      title: locale === 'es' ? 'Resumen de la Suite' : 'Suite Summary',
      description: locale === 'es' ? 'Ver métricas generales del ecosistema' : 'View overall ecosystem metrics',
      category: locale === 'es' ? 'Navegación' : 'Navigation',
      shortcut: ['g', 's'],
      icon: <BarChart3 className="w-4 h-4" />,
      action: () => {
        router.push('/admin');
      }
    },
    {
      id: 'nav-security',
      title: locale === 'es' ? 'Panel de Seguridad' : 'Security Panel',
      description: locale === 'es' ? 'Estado de MFA y accesos' : 'MFA status and access logs',
      category: locale === 'es' ? 'Navegación' : 'Navigation',
      shortcut: ['g', 'm'],
      icon: <ShieldCheck className="w-4 h-4" />,
      action: () => {
        router.push('/admin');
      }
    },
    ...buildCommonCommands({ locale, pathname, router, onLogout: () => { window.location.href = '/api/abd-auth/logout'; } })
  ];

  return (
    <CommandPalette
      commands={commands}
      placeholder={locale === 'es' ? 'Escribe un comando o navega...' : 'Type a command or navigate...'}
    />
  );
}
