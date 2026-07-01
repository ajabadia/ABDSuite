'use client';

/**
 * @purpose Renderiza un componente de navegación lateral con enlaces personalizados para el usuario y una marca.
 * @purpose_en Renders a sidebar navigation component with user-specific links and branding.
 * @refactorable false
 * @classification UI Component
 * @complexity Low
 * @fingerprint exports:1,imports:4,sig:p2d6s0
 * @lastUpdated 2026-06-29T22:24:00.617Z
 */

import React from 'react';
import { Home, Cpu } from 'lucide-react';
import { useTranslations, useLocale } from 'next-intl';
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
  const locale = useLocale();

  const isLoggedIn = session.authenticated && !!session.user;
  const user = session.user;

  const allLinks: AppSidebarLink[] = [
    {
      href: '/',
      label: locale === 'es' ? 'Inicio' : 'Home',
      icon: <Home size={14} />
    },
    {
      href: '#servicios',
      label: locale === 'es' ? 'Servicios' : 'Services',
      icon: <Cpu size={14} />
    }
  ];

  const finalLogoUrl = logoUrl || (isLoggedIn && user?.branding ? user.branding.logoUrl : null);

  return (
    <AppSidebarNavigation
      session={session}
      logoUrl={finalLogoUrl}
      links={allLinks}
      brandName={t('appTitle') || 'ABD SUITE'}
      appBadge="SUITE"
      onLogin={() => { window.location.href = '/login'; }}
      tenantSelectorSlot={tenantSelectorSlot}
      settingsSlot={settingsSlot}
    />
  );
}
