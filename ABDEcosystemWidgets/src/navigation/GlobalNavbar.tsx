'use client';

/**
 * @purpose Renderiza un panel lateral desplazable con información del usuario y función de logout.
 * @purpose_en Renders a collapsible navigation sidebar with user information and logout functionality.
 * @refactorable true (contains too many state variables and UI parts)
 * @classification UI Component
 * @complexity Medium
 * @fingerprint exports:6,imports:5,sig:l7858j
 * @lastUpdated 2026-06-26T09:59:52.767Z
 */

import * as React from 'react';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Menu, Shield, LogOut } from 'lucide-react';

import { cn } from '../utils.js';

// ──────────────────────────────────────────────
//  Shared Types
// ──────────────────────────────────────────────

export interface NavUser {
  name: string;
  role: string;
  tenantId: string;
  email?: string;
}

export interface SidebarLink {
  href: string;
  label: string;
  icon: React.ReactNode;
}

export interface NavbarTranslations {
  brandFallback?: string;
  logoutBtn?: string;
  identityProvider?: string;
  statusOnline?: string;
  emailLabel?: string;
}

const defaultTranslations: Required<NavbarTranslations> = {
  brandFallback: 'ABD SYSTEM',
  logoutBtn: 'TERMINAR SESIÓN',
  identityProvider: 'IDENTITY PROVIDER',
  statusOnline: 'ONLINE',
  emailLabel: 'EMAIL',
};

// ──────────────────────────────────────────────
//  Public Props
// ──────────────────────────────────────────────

export interface GlobalNavbarSession {
  authenticated: boolean;
  user?: {
    name: string;
    role: string;
    tenantId: string;
    email?: string;
  } | null;
}

export interface GlobalNavbarProps {
  session?: GlobalNavbarSession | null;
  links: SidebarLink[];
  logoUrl?: string | null;
  onLogout: () => void;
  brandName?: string;
  homeHref?: string;
  activeHref?: string;
  translations?: NavbarTranslations;
  transformHref?: (href: string) => string;
}

/**
 * 🌐 GlobalNavbar — Collapsible Navigation Sidebar
 */
export function GlobalNavbar({
  session,
  links,
  logoUrl,
  onLogout,
  brandName,
  homeHref = '/dashboard',
  activeHref,
  translations,
  transformHref,
}: GlobalNavbarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Build the NavUser from session
  const user: NavUser = {
    name: session?.user?.name || (session?.authenticated ? 'User' : 'Guest'),
    role: session?.user?.role || 'PUBLIC',
    tenantId: session?.user?.tenantId || (session?.authenticated ? 'GLOBAL' : ''),
    email: session?.user?.email || '',
  };

  const resolvedBrand = brandName || (session?.user?.tenantId ? session.user.tenantId : 'ABD SYSTEM');

  // Push the main content by injecting classes to the body
  useEffect(() => {
    if (isCollapsed) {
      document.body.classList.add('sidebar-collapsed-layout');
      document.body.classList.remove('sidebar-expanded-layout');
    } else {
      document.body.classList.add('sidebar-expanded-layout');
      document.body.classList.remove('sidebar-collapsed-layout');
    }
    return () => {
      document.body.classList.remove('sidebar-collapsed-layout', 'sidebar-expanded-layout');
    };
  }, [isCollapsed]);

  const t = { ...defaultTranslations, ...translations };

  // ── Link component ──
  const LocalizedLink: React.ComponentType<{
    href: string;
    onClick?: () => void;
    className?: string;
    title?: string;
    children: React.ReactNode;
  }> = ({ href, onClick, className, title, children }) => {
    const finalHref = transformHref ? transformHref(href) : href;
    const isExternal = finalHref.startsWith('http://') || finalHref.startsWith('https://');

    if (isExternal) {
      return (
        <a href={finalHref} onClick={onClick} className={className} title={title}>
          {children}
        </a>
      );
    }

    if (onClick) {
      return (
        <Link href={finalHref} className={className} onClick={onClick} title={title}>
          {children}
        </Link>
      );
    }
    return (
      <Link href={finalHref} className={className} title={title}>
        {children}
      </Link>
    );
  };

  return (
    <>
      {/* 🗄️ Collapsible Sidebar Panel */}
      <aside
        id="global-navbar-panel"
        role="navigation"
        aria-label="Global Navigation"
        className={cn(
          'fixed inset-y-0 left-0 z-[50] bg-background border-r border-border shadow-2xl flex flex-col transition-all duration-300 ease-in-out rounded-none overflow-hidden',
          isCollapsed ? 'w-[64px] p-2' : 'w-80 p-6'
        )}
      >
        {/* 🍔 Hamburger Trigger Button */}
        <div className={cn("flex items-center", isCollapsed ? "justify-center mt-4 mb-8" : "justify-between mb-8 pt-6 border-b border-border pb-4")}>
          {!isCollapsed && (
            <LocalizedLink
              href={homeHref}
              className="flex items-center gap-3 overflow-hidden"
            >
              {logoUrl ? (
                <img
                  src={logoUrl}
                  alt="Logo"
                  className="w-6 h-6 object-contain filter drop-shadow-[0_1px_3px_rgba(0,0,0,0.3)] shrink-0"
                />
              ) : (
                <div className="w-6 h-6 bg-primary/10 border border-primary/30 flex items-center justify-center shrink-0">
                  <Shield size={12} className="text-primary" />
                </div>
              )}
              <span className="font-mono text-xs font-black uppercase tracking-[0.2em] text-foreground truncate">
                {user.tenantId || resolvedBrand}
              </span>
            </LocalizedLink>
          )}

          <button
            aria-label="Toggle Navigation"
            aria-expanded={!isCollapsed}
            aria-controls="global-navbar-panel"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-2 rounded-none hover:bg-muted text-muted-foreground hover:text-foreground transition-all duration-200 cursor-pointer flex-shrink-0"
          >
            {isCollapsed ? <Menu className="w-5 h-5" /> : <Menu className="w-4 h-4" />}
          </button>
        </div>

        {/* 🧭 Navigation Links */}
        <nav className="flex-1 flex flex-col gap-2 overflow-y-auto overflow-x-hidden no-scrollbar">
          {links.map((link) => {
            const isActive = activeHref
              ? activeHref === link.href ||
                (link.href !== homeHref && activeHref.startsWith(link.href))
              : false;

            return (
              <LocalizedLink
                key={link.href}
                href={link.href}
                className={cn(
                  'py-3 rounded-none flex items-center font-mono font-bold uppercase tracking-wider transition-all duration-200 border group',
                  isCollapsed ? 'px-0 justify-center text-[12px]' : 'px-4 gap-4 text-[10px]',
                  isActive
                    ? 'bg-primary/10 border-primary text-primary'
                    : 'bg-muted/10 border-border text-muted-foreground hover:border-primary/20 hover:bg-primary/5 hover:text-primary'
                )}
                {...(isCollapsed ? { title: link.label } : {})}
              >
                <span className="shrink-0">{link.icon}</span>
                {!isCollapsed && (
                  <span className="flex-1 truncate">{link.label}</span>
                )}
              </LocalizedLink>
            );
          })}
        </nav>

        {/* ⚙️ Session Card (Bottom) */}
        <div className={cn("border-border mt-auto", isCollapsed ? "pt-4 border-none flex justify-center pb-2" : "border-t pt-6")}>
          {isCollapsed ? (
             <div className="w-8 h-8 bg-primary/10 border border-primary/20 flex items-center justify-center font-bold text-xs text-primary rounded-none cursor-help" title={user.name}>
               {user.name?.charAt(0).toUpperCase() || 'U'}
             </div>
          ) : (
            <div className="flex flex-col gap-4 p-4 border border-border bg-muted/10 rounded-none relative overflow-hidden">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-primary/10 border border-primary/20 flex items-center justify-center font-bold text-xs text-primary rounded-none shrink-0">
                  {user.name?.charAt(0).toUpperCase() || 'U'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-black tracking-wider truncate uppercase text-foreground">
                    {user.name}
                  </p>
                  <p className="font-mono text-[8px] text-muted-foreground/80 uppercase tracking-widest truncate">
                    {user.role}
                  </p>
                </div>
              </div>

              <div className="font-mono text-[8px] text-muted-foreground/60 flex flex-col gap-1 border-t border-border/50 pt-2.5">
                <div className="flex justify-between">
                  <span>{t.identityProvider}:</span>
                  <span className="text-primary font-bold">{t.statusOnline}</span>
                </div>
                {user.email && (
                  <div className="flex justify-between">
                    <span>{t.emailLabel}:</span>
                    <span className="truncate max-w-[150px]">
                      {user.email.toLowerCase()}
                    </span>
                  </div>
                )}
              </div>

              <button
                aria-label={t.logoutBtn}
                onClick={onLogout}
                className="w-full flex items-center justify-center gap-2 px-3 py-2 border border-border text-[9px] font-mono font-black uppercase tracking-widest transition-all rounded-none hover:text-red-400 hover:bg-red-500/10 hover:border-red-500/20 cursor-pointer"
              >
                <LogOut size={12} />
                <span>{t.logoutBtn}</span>
              </button>
            </div>
          )}
          {isCollapsed && (
             <button
                aria-label={t.logoutBtn}
                onClick={onLogout}
                className="mt-4 w-10 h-10 flex items-center justify-center border border-border transition-all rounded-none hover:text-red-400 hover:bg-red-500/10 hover:border-red-500/20 cursor-pointer text-muted-foreground mx-auto"
                title={t.logoutBtn}
              >
                <LogOut size={14} />
              </button>
          )}
        </div>
      </aside>
    </>
  );
}

