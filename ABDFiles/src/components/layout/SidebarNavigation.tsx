'use client';

/**
 * @purpose Renderiza un componente de navegación lateral con enlaces y maneja la autenticación del usuario.
 * @purpose_en Renders a sidebar navigation component with links and handles user authentication.
 * @refactorable false
 * @classification UI Component
 * @complexity Medium
 * @fingerprint exports:1,imports:4,sig:1g1bpct
 * @lastUpdated 2026-07-02T18:45:49.819Z
 */

import React from 'react';
import { Home, Terminal, ShieldCheck } from 'lucide-react';
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
  const [logsAuditUrl, setLogsAuditUrl] = React.useState<string>('/admin/audit');

  React.useEffect(() => {
    const hostname = window.location.hostname;
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      setLogsAuditUrl(`http://localhost:5003/${locale}/admin/audit`);
    } else {
      setLogsAuditUrl(`/admin/audit`);
    }
  }, [locale]);

  const isLoggedIn = session.authenticated && !!session.user;
  const user = session.user;

  const allLinks: AppSidebarLink[] = [
    // Welcome Page only shown if not logged in
    ...(!isLoggedIn
      ? [
          {
            href: '/',
            label: t('navWelcome'),
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
      href: logsAuditUrl,
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
      brandName={t('appTitle') || 'ABD Suite'}
      appBadge="FILES"
      tenantSelectorSlot={tenantSelectorSlot}
      settingsSlot={settingsSlot}
    />
  );
}
