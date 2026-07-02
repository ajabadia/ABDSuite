'use client';

/**
 * @purpose Renderiza un componente de navegación lateral con manejo de idioma y autenticación del usuario.
 * @purpose_en Renders a sidebar navigation component with locale handling and user authentication.
 * @refactorable true (contains too many state variables and UI parts)
 * @classification UI Component
 * @complexity Medium
 * @fingerprint exports:3,imports:7,sig:o3r4ul
 * @lastUpdated 2026-06-30T11:18:12.916Z
 */

import React from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { usePathname, useRouter } from 'next/navigation';
import { SmartNavbar } from './SmartNavbar.js';
import type { SmartNavbarProps, SmartNavbarTranslations } from './SmartNavbar.js';
import { buildSidebarLinks } from './buildSidebarLinks.js';
import type { GlobalNavbarSession } from './GlobalNavbar.js';

export interface AppSidebarLink {
  href: string;
  label: string;
  icon: React.ReactNode;
  requiresAuth?: boolean;
  requiresAdmin?: boolean;
  requiresSuperAdmin?: boolean;
}

export interface AppSidebarNavigationProps {
  session: GlobalNavbarSession | null;
  logoUrl?: string | null;
  links: AppSidebarLink[];
  appBadge?: string;
  brandName?: string;
  onLogin?: () => void;
  onLogout?: () => void;
  transformHref?: (href: string) => string;
  translations?: Partial<SmartNavbarTranslations>;
  tenantSelectorSlot?: React.ReactNode;
  settingsSlot?: React.ReactNode;
  notificationsSlot?: React.ReactNode;
}

export function AppSidebarNavigation({
  session,
  logoUrl,
  links,
  appBadge,
  brandName,
  onLogin,
  onLogout,
  transformHref,
  translations: translationsOverride,
  tenantSelectorSlot,
  settingsSlot,
  notificationsSlot,
}: AppSidebarNavigationProps) {
  const t = useTranslations('common');
  const locale = useLocale();
  const router = useRouter();

  // Strip locale prefix from pathname since links are defined without locale
  const rawPathname = usePathname();
  const segments = rawPathname.split('/').filter(Boolean);
  const pathname = segments.length > 1 ? '/' + segments.slice(1).join('/') : '/';

  const isLoggedIn = session?.authenticated === true && !!session?.user;
  const user = session?.user ?? null;

  const builtLinks = buildSidebarLinks(links, user?.role, isLoggedIn);

  const finalLogoUrl = logoUrl || null;

  const handleLocaleChange = (newLocale: string) => {
    let domainSuffix = "";
    const hostname = window.location.hostname;
    if (hostname !== "localhost" && hostname !== "127.0.0.1") {
      const parts = hostname.split('.');
      if (parts.length >= 2) {
        domainSuffix = `; domain=.${parts.slice(-2).join('.')}`;
      }
    }
    document.cookie = `NEXT_LOCALE=${newLocale}; path=/; max-age=31536000; SameSite=Lax${domainSuffix}`;
    const path = window.location.pathname;
    const search = window.location.search;
    const segments = path.split('/').filter(Boolean);
    if (segments.length > 0) {
      segments[0] = newLocale;
      window.location.href = '/' + segments.join('/') + search;
    } else {
      window.location.href = '/' + newLocale + search;
    }
  };

  const appTitle = brandName || t('appTitle') || 'ABD SYSTEM';

  const smartNavbarProps: SmartNavbarProps = {
    session,
    links: builtLinks,
    logoUrl: finalLogoUrl,
    onLogout: onLogout ?? (() => { window.location.href = '/api/abd-auth/logout'; }),
    brandName: appTitle,
    activeHref: pathname,
    locale,
    tenantSelectorSlot,
    settingsSlot,
    onLocaleChange: handleLocaleChange,
    onSearchTrigger: () => {
      window.dispatchEvent(new CustomEvent('abd-command-palette-open'));
    },
    translations: {
      brandFallback: appTitle,
      loginBtn: t('loginBtn') || 'SIGN IN',
      logoutBtn: t('logoutBtn') || 'SIGN OUT',
      identityProvider: t('identityProvider') || 'IDENTITY PROVIDER',
      statusOnline: t('statusOnline') || 'ONLINE',
      emailLabel: t('emailLabel') || 'EMAIL',
      ...translationsOverride,
    }
  };
  if (appBadge !== undefined) {
    smartNavbarProps.appBadge = appBadge;
  }
  if (onLogin !== undefined) {
    smartNavbarProps.onLogin = onLogin;
  }
  if (transformHref !== undefined) {
    smartNavbarProps.transformHref = transformHref;
  }
  if (notificationsSlot !== undefined) {
    smartNavbarProps.notificationsSlot = notificationsSlot;
  }

  return <SmartNavbar {...smartNavbarProps} />;
}
