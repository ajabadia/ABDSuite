'use client';

/**
 * @purpose Renderiza una pestaña de comandos con comandos relacionados a la autenticación.
 * @purpose_en Renders a command palette with authentication-related commands.
 * @refactorable true (contains too many state variables and UI parts)
 * @classification UI Component
 * @complexity Low
 * @fingerprint exports:1,imports:6,sig:ewlgr1
 * @lastUpdated 2026-06-30T05:48:59.462Z
 */

import React from 'react';
import { useRouter, usePathname } from '@/i18n/routing';
import { useLocale, useTranslations } from 'next-intl';
import { authClient } from '@/lib/auth-client';
import { CommandPalette, type Command, buildCommonCommands } from '@ajabadia/ecosystem-widgets';
import { LayoutDashboard, Users, Shield, Building2, Key } from 'lucide-react';

export function AuthCommandPalette() {
  const router = useRouter();
  const pathname = usePathname();
  const locale = useLocale();
  const t = useTranslations('common');

  const commands: Command[] = [
    {
      id: 'nav-dashboard',
      title: t('commandPalette.navDashboard'),
      description: t('commandPalette.navDashboardDesc'),
      category: t('commandPalette.categoryNavigation'),
      shortcut: ['g', 'd'],
      icon: <LayoutDashboard className="w-4 h-4" />,
      action: () => {
        router.push('/dashboard');
      }
    },
    {
      id: 'nav-users',
      title: t('commandPalette.navUsers'),
      description: t('commandPalette.navUsersDesc'),
      category: t('commandPalette.categoryNavigation'),
      shortcut: ['g', 'u'],
      icon: <Users className="w-4 h-4" />,
      action: () => {
        router.push('/dashboard/users');
      }
    },
    {
      id: 'nav-applications',
      title: t('commandPalette.navApplications'),
      description: t('commandPalette.navApplicationsDesc'),
      category: t('commandPalette.categoryNavigation'),
      shortcut: ['g', 'a'],
      icon: <Shield className="w-4 h-4" />,
      action: () => {
        router.push('/dashboard/applications');
      }
    },
    {
      id: 'nav-tenants',
      title: t('commandPalette.navTenants'),
      description: t('commandPalette.navTenantsDesc'),
      category: t('commandPalette.categoryNavigation'),
      shortcut: ['g', 't'],
      icon: <Building2 className="w-4 h-4" />,
      action: () => {
        router.push('/dashboard/tenants');
      }
    },
    {
      id: 'nav-security',
      title: t('commandPalette.navSecurity'),
      description: t('commandPalette.navSecurityDesc'),
      category: t('commandPalette.categoryNavigation'),
      shortcut: ['g', 's'],
      icon: <Key className="w-4 h-4" />,
      action: () => {
        router.push('/dashboard/security');
      }
    },
    ...buildCommonCommands({ locale, pathname, router, onLogout: async () => { await authClient.signOut(); window.location.href = '/'; } })
  ];

  return (
    <CommandPalette
      commands={commands}
      placeholder={t('commandPalette.placeholder')}
    />
  );
}
