'use client';

/**
 * @purpose Renderiza un componente de navegación lateral con enlaces y branding según la sesión del usuario.
 * @purpose_en Renders a sidebar navigation component with links and branding based on user session.
 * @refactorable false
 * @classification UI Component
 * @complexity Low
 * @fingerprint exports:1,imports:4,sig:peuy8y
 * @lastUpdated 2026-07-02T18:46:41.531Z
 */

import React from 'react';
import { Home, Terminal, ShieldCheck } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { AppSidebarNavigation, type AppSidebarLink } from '@ajabadia/ecosystem-widgets';

interface UserSession {
  authenticated: boolean;
  user?: {
    name: string;
    surname: string;
    email: string;
    role: string;
    tenantId: string;
    branding?: {
      logoUrl?: string | null;
    } | null;
  };
}

interface SidebarNavigationProps {
  session: UserSession;
  logoUrl?: string | null;
  tenantSelectorSlot?: React.ReactNode;
  settingsSlot?: React.ReactNode;
}

export function SidebarNavigation({ session, logoUrl, tenantSelectorSlot, settingsSlot }: SidebarNavigationProps) {
  const t = useTranslations('common');

  const isLoggedIn = session.authenticated && !!session.user;
  const user = session.user;

  const allLinks: AppSidebarLink[] = [
    // Welcome Page only shown if not logged in
    ...(!isLoggedIn
      ? [
          {
            href: '/',
            label: t('welcomeMenu'),
            icon: <Home size={14} />
          }
        ]
      : []),
    {
      href: '/admin',
      label: t('adminMenu'),
      icon: <Terminal size={14} />,
      requiresAdmin: true
    },
    {
      href: '/admin/audit',
      label: t('navAudit'),
      icon: <ShieldCheck size={14} />,
      requiresAdmin: true
    }
  ];

  const finalLogoUrl = logoUrl || (isLoggedIn && user?.branding ? user.branding.logoUrl : null);

  return (
    <AppSidebarNavigation
      session={session}
      logoUrl={finalLogoUrl}
      links={allLinks}
      brandName={t('appTitle')}
      appBadge="LOGS"
      tenantSelectorSlot={tenantSelectorSlot}
      settingsSlot={settingsSlot}
    />
  );
}
