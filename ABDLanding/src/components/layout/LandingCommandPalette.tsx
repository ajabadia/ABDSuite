'use client';

/**
 * @purpose Renderiza una pestaña de comandos con opciones de navegación y configuración en la aplicación ABDLanding.
 * @purpose_en Renders a command palette with navigation and settings options in the ABDLanding application.
 * @refactorable false
 * @classification UI Component
 * @complexity Low
 * @fingerprint exports:1,imports:5,sig:1rrsnt4
 * @lastUpdated 2026-06-30T05:49:26.654Z
 */

import React from 'react';
import { useRouter, usePathname } from '@/i18n/routing';
import { useLocale, useTranslations } from 'next-intl';
import { CommandPalette, type Command, buildCommonCommands } from '@ajabadia/ecosystem-widgets';
import { Home, Cpu } from 'lucide-react';

export function LandingCommandPalette() {
  const router = useRouter();
  const pathname = usePathname();
  const locale = useLocale();
  const t = useTranslations('home');

  const commands: Command[] = [
    {
      id: 'nav-home',
      title: t('commandHome'),
      description: t('commandHomeDesc'),
      category: t('commandCategoryNav'),
      shortcut: ['g', 'h'],
      icon: <Home className="w-4 h-4" />,
      action: () => {
        router.push('/');
      }
    },
    {
      id: 'nav-services',
      title: t('commandServices'),
      description: t('commandServicesDesc'),
      category: t('commandCategoryNav'),
      shortcut: ['g', 's'],
      icon: <Cpu className="w-4 h-4" />,
      action: () => {
        router.push('#servicios');
      }
    },
    ...buildCommonCommands({ locale, pathname, router, onLogout: () => { window.location.href = '/api/abd-auth/logout'; } })
  ];

  return (
    <CommandPalette
      placeholder={t('commandPlaceholder')}
      commands={commands}
    />
  );
}
