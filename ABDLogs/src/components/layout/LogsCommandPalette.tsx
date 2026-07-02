'use client';

/**
 * @purpose Renderiza una pestaña de comandos con varios comandos relacionados con registro, navegación y configuración del usuario.
 * @purpose_en Renders a command palette with various commands related to logging, navigation, and user settings.
 * @refactorable false
 * @classification UI Component
 * @complexity Low
 * @fingerprint exports:1,imports:5,sig:aw6sm2
 * @lastUpdated 2026-06-30T05:49:35.141Z
 */

import React from 'react';
import { useRouter, usePathname } from '@/i18n/routing';
import { useTranslations, useLocale } from 'next-intl';
import { CommandPalette, type Command, buildCommonCommands } from '@ajabadia/ecosystem-widgets';
import { ShieldCheck, Server } from 'lucide-react';

export function LogsCommandPalette() {
  const router = useRouter();
  const pathname = usePathname();
  const locale = useLocale();
  const l = useTranslations('logs');

  const commands: Command[] = [
    // Navigation Category
    {
      id: 'nav-audit',
      title: l('forensicViewer'),
      description: l('forensicViewerDesc'),
      category: l('auditCategory'),
      shortcut: ['g', 'a'],
      icon: <ShieldCheck className="w-4 h-4" />,
      action: () => {
        router.push('/admin');
      }
    },
    {
      id: 'nav-status',
      title: l('serviceStatus'),
      description: l('serviceStatusDesc'),
      category: l('auditCategory'),
      shortcut: ['g', 's'],
      icon: <Server className="w-4 h-4" />,
      action: () => {
        router.push('/admin');
      }
    },
    // Configuration / Action Category
    ...buildCommonCommands({ locale, pathname, router, onLogout: () => { window.location.href = '/api/abd-auth/logout'; } })
  ];

  return (
    <CommandPalette
      commands={commands}
      placeholder={l('commandPlaceholder')}
    />
  );
}
