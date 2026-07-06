'use client';

/**
 * @purpose Renderiza una pestaña de comandos con diversas acciones relacionadas con la gobernanza, incluyendo acciones de navegación y configuración.
 * @purpose_en Renders a command palette with various governance-related commands, including navigation and settings actions.
 * @refactorable true (contains too many state variables and UI parts)
 * @classification UI Component
 * @complexity Low
 * @fingerprint exports:1,imports:5,sig:15re1og
 * @lastUpdated 2026-07-03T15:34:37.450Z
 */

import React from 'react';
import { useRouter, usePathname } from '@/i18n/routing';
import { useLocale, useTranslations } from 'next-intl';
import { CommandPalette, type Command, buildCommonCommands } from '@ajabadia/ecosystem-widgets';
import { Home, Palette, Folder, Terminal, ShieldCheck } from 'lucide-react';

export function GovernanceCommandPalette() {
  const router = useRouter();
  const pathname = usePathname();
  const locale = useLocale();
  const t = useTranslations('common');

  const commands: Command[] = [
    {
      id: 'nav-welcome',
      title: t('commandPalette.navGovernanceWelcome'),
      description: t('commandPalette.navGovernanceWelcomeDesc'),
      category: t('commandPalette.categoryNavigation'),
      shortcut: ['g', 'h'],
      icon: <Home className="w-4 h-4" />,
      action: () => {
        router.push('/');
      }
    },
    {
      id: 'nav-tenants',
      title: t('commandPalette.navGovernanceTenants'),
      description: t('commandPalette.navGovernanceTenantsDesc'),
      category: t('commandPalette.categoryNavigation'),
      shortcut: ['g', 't'],
      icon: <Terminal className="w-4 h-4" />,
      action: () => {
        router.push('/admin');
      }
    },
    {
      id: 'nav-branding',
      title: t('commandPalette.navGovernanceBranding'),
      description: t('commandPalette.navGovernanceBrandingDesc'),
      category: t('commandPalette.categoryNavigation'),
      shortcut: ['g', 'b'],
      icon: <Palette className="w-4 h-4" />,
      action: () => {
        router.push('/admin/branding');
      }
    },
    {
      id: 'nav-spaces',
      title: t('commandPalette.navGovernanceSpaces'),
      description: t('commandPalette.navGovernanceSpacesDesc'),
      category: t('commandPalette.categoryNavigation'),
      shortcut: ['g', 's'],
      icon: <Folder className="w-4 h-4" />,
      action: () => {
        router.push('/admin/spaces');
      }
    },
    {
      id: 'nav-audit',
      title: t('commandPalette.navGovernanceAudit'),
      description: t('commandPalette.navGovernanceAuditDesc'),
      category: t('commandPalette.categoryNavigation'),
      shortcut: ['g', 'a'],
      icon: <ShieldCheck className="w-4 h-4" />,
      action: () => {
        router.push('/admin/audit');
      }
    },
    ...buildCommonCommands({ locale, pathname, router, onLogout: () => { window.location.href = '/api/abd-auth/logout'; } })
  ];

  return (
    <CommandPalette
      commands={commands}
      placeholder={t('commandPalette.placeholder')}
    />
  );
}
