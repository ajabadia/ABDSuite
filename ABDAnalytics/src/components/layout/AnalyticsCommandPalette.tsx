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
import { useLocale, useTranslations } from 'next-intl';
import { CommandPalette, type Command, buildCommonCommands } from '@ajabadia/ecosystem-widgets';
import { LayoutDashboard, BarChart3, ShieldCheck } from 'lucide-react';

export function AnalyticsCommandPalette() {
  const router = useRouter();
  const pathname = usePathname();
  const locale = useLocale();
  const t = useTranslations('common');

  const commands: Command[] = [
    {
      id: 'nav-dashboard',
      title: t('dashboard'),
      description: t('goToDashboard'),
      category: t('navigation'),
      shortcut: ['g', 'd'],
      icon: <LayoutDashboard className="w-4 h-4" />,
      action: () => {
        router.push('/admin');
      }
    },
    {
      id: 'nav-suite',
      title: t('suiteSummary'),
      description: t('viewEcosystemMetrics'),
      category: t('navigation'),
      shortcut: ['g', 's'],
      icon: <BarChart3 className="w-4 h-4" />,
      action: () => {
        router.push('/admin');
      }
    },
    {
      id: 'nav-security',
      title: t('securityPanel'),
      description: t('mfaStatus'),
      category: t('navigation'),
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
      placeholder={t('commandPlaceholder')}
    />
  );
}
