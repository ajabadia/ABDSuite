'use client';

/**
 * @purpose Renderiza un componente de navegación lateral con opciones de autenticación del usuario y selección de tenant.
 * @purpose_en Renders a sidebar navigation component with user authentication and tenant selection options.
 * @refactorable false
 * @classification UI Component
 * @complexity Medium
 * @fingerprint exports:1,imports:4,sig:1f91b34
 * @lastUpdated 2026-06-29T22:21:56.352Z
 */

import React from 'react';
import { useTranslations } from 'next-intl';
import { AppSidebarNavigation, type AppSidebarLink } from '@ajabadia/ecosystem-widgets';
import { Home, LayoutDashboard, Terminal } from 'lucide-react';

interface UserSession {
  authenticated: boolean;
  user?: {
    name: string;
    surname: string;
    email: string;
    role: string;
    tenantId: string;
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
  const [tenantId, setTenantId] = React.useState<string | null>(null);

  React.useEffect(() => {
    React.startTransition(() => {
      const params = new URLSearchParams(window.location.search);
      setTenantId(params.get('tenantId'));
    });
  }, []);

  const isLoggedIn = session.authenticated && !!session.user;
  const user = session.user;

  const allLinks: AppSidebarLink[] = [
    { href: '/', label: t('home'), icon: <Home className="w-4 h-4" /> },
    { href: '/dashboard', label: t('myDashboard'), icon: <LayoutDashboard className="w-4 h-4" />, requiresAuth: true },
    { href: '/admin', label: t('adminPortal'), icon: <Terminal className="w-4 h-4" />, requiresAdmin: true },
  ];

  const transformHref = React.useCallback(
    (href: string) => {
      return tenantId ? `${href}?tenantId=${tenantId}` : href;
    },
    [tenantId]
  );

  return (
    <AppSidebarNavigation
      session={session}
      logoUrl={logoUrl || null}
      links={allLinks}
      brandName={t('appTitle') || 'ABD Base'}
      appBadge="BASE"
      onLogout={() => { window.location.href = '/api/auth/logout'; }}
      transformHref={tenantId ? transformHref : undefined}
      tenantSelectorSlot={tenantSelectorSlot}
      settingsSlot={settingsSlot}
    />
  );
}
