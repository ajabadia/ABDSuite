'use client';

/**
 * @purpose Renderiza una barra de navegación superior unificada para todas las aplicaciones ABD Suite, incluyendo gestión de sesiones, cambio de tema, selección de idioma y funcionalidad de búsqueda.
 * @purpose_en Renders a unified top navigation bar for all ABD Suite apps, including session management, theme switching, language selection, and search functionality.
 * @refactorable true (contains too many state variables and UI parts)
 * @classification UI Component
 * @complexity Medium
 * @fingerprint exports:3,imports:13,sig:13geetg
 * @lastUpdated 2026-06-26T09:59:58.660Z
 */

import * as React from 'react';
import { useState, useRef, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  Shield, Sun, Search, Languages, Building2, Menu, X,
} from 'lucide-react';
import { cn } from '../utils.js';
import { LocalizedLink } from './LocalizedLink.js';
import { SmartNavbarNavMenu } from './SmartNavbarNavMenu.js';
import { SmartNavbarThemeMenu } from './SmartNavbarThemeMenu.js';
import { SmartNavbarLanguageMenu } from './SmartNavbarLanguageMenu.js';
import { SmartNavbarUserMenu } from './SmartNavbarUserMenu.js';
import { SmartNavbarSearchMenu } from './SmartNavbarSearchMenu.js';
import type { GlobalNavbarSession, SidebarLink } from './GlobalNavbar.js';
import { TenantMegaMenuProvider } from '../identity/TenantMegaMenuContext.js';

// ── Translations ──

export interface SmartNavbarTranslations {
  brandFallback?: string;
  logoutBtn?: string;
  loginBtn?: string;
  searchLabel?: string;
  themeLabel?: string;
  themeLight?: string;
  themeDark?: string;
  themeSystem?: string;
  profileLabel?: string;
  identityProvider?: string;
  statusOnline?: string;
  emailLabel?: string;
  languageLabel?: string;
}

const defaultTranslations: Required<SmartNavbarTranslations> = {
  brandFallback: 'ABD SYSTEM',
  logoutBtn: 'TERMINAR SESIÓN',
  loginBtn: 'INICIAR SESIÓN',
  searchLabel: 'BUSCAR...',
  themeLabel: 'TEMA',
  themeLight: 'CLARO',
  themeDark: 'OSCURO',
  themeSystem: 'SISTEMA',
  profileLabel: 'MI PERFIL',
  identityProvider: 'PROVEEDOR',
  statusOnline: 'ONLINE',
  emailLabel: 'EMAIL',
  languageLabel: 'IDIOMA',
};

// ── Props ──

export interface SmartNavbarProps {
  session: GlobalNavbarSession | null;
  links: SidebarLink[];
  logoUrl?: string | null;
  brandName?: string;
  /** Optional short identifier for the satellite app (e.g. 'LOGS', 'GOV', 'QUIZ', 'AUTH') */
  appBadge?: string;
  activeHref?: string;
  locale?: string;
  onLogout: () => void;
  onLogin?: () => void;
  onLocaleChange?: (locale: string) => void;
  transformHref?: (href: string) => string;
  tenantSelectorSlot?: React.ReactNode;
  settingsSlot?: React.ReactNode;
  notificationsSlot?: React.ReactNode;
  translations?: SmartNavbarTranslations;
  onSearchTrigger?: () => void;
}

type MenuName = 'navigation' | 'tenant' | 'theme' | 'user' | 'language' | 'search';

// ── Error Boundary (Slot Isolation) ──

class SlotErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback?: React.ReactNode },
  { hasError: boolean }
> {
  constructor(props: { children: React.ReactNode; fallback?: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback ?? (
          <div className="px-3 py-2 text-[9px] font-mono text-muted-foreground border border-dashed border-border">
            ⚠️ SLOT ERROR
          </div>
        )
      );
    }
    return this.props.children;
  }
}

// ── Focusable element selector ──
const FOCUSABLE_SELECTOR = 'a[href], button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])';

// ══════════════════════════════════════════
//  FALLBACK (shown during Suspense hydration)
// ══════════════════════════════════════════

function SmartNavbarFallback({ logoUrl, brandName, appBadge, translations }: Partial<SmartNavbarProps>) {
  const t = { ...defaultTranslations, ...translations };
  return (
    <div className="smart-navbar" data-testid="smart-navbar">
      <div className="max-w-[1600px] mx-auto h-full px-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {logoUrl ? (
            <img src={logoUrl} alt="Logo" className="w-6 h-6 object-contain" />
          ) : (
            <div className="w-6 h-6 bg-primary/10 border border-primary/30 flex items-center justify-center">
              <Shield size={12} className="text-primary" />
            </div>
          )}
          {appBadge && (
            <span className="font-mono text-[9px] font-bold tracking-wider text-primary/80 border border-primary/20 bg-primary/5 px-1.5 py-[1px] leading-none">
              {appBadge}
            </span>
          )}
          <span className="font-mono text-xs font-black uppercase tracking-[0.2em] text-foreground">
            {brandName || t.brandFallback}
          </span>
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════
//  INNER CONTENT (uses useSearchParams)
// ══════════════════════════════════════════

function SmartNavbarContent({
  session,
  links,
  logoUrl,
  brandName,
  appBadge,
  activeHref,
  locale = 'en',
  onLogout,
  onLogin,
  onLocaleChange,
  transformHref: rawTransformHref,
  tenantSelectorSlot,
  settingsSlot,
  notificationsSlot,
  translations,
  onSearchTrigger,
}: SmartNavbarProps) {
  const transformHref = rawTransformHref ?? ((href: string) => href);
  const t = { ...defaultTranslations, ...translations };
  const isAuthenticated = session?.authenticated === true;
  const user = session?.user ?? null;

  const searchParams = useSearchParams();
  const activeTenantId = searchParams.get('tenantId') || user?.tenantId || '';

  const [activeMenu, setActiveMenu] = useState<MenuName | null>(null);
  const [lockedMenu, setLockedMenu] = useState<MenuName | null>(null);
  const [currentTheme, setCurrentTheme] = useState<'light' | 'dark' | 'system'>('dark');
  const [isMobileMenuOpen, setMobileMenuOpen] = useState(false);

  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const navbarRef = useRef<HTMLDivElement>(null);
  const activeTriggerRef = useRef<HTMLElement | null>(null);
  const mobileToggleRef = useRef<HTMLButtonElement>(null);

  // ── Initialize theme state on mount & Cleanup sidebar legacy classes ──
  useEffect(() => {
    document.body.classList.remove('sidebar-expanded-layout', 'sidebar-collapsed-layout');
    try {
      const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | 'system' | null;
      if (savedTheme) {
        setCurrentTheme(savedTheme);
      } else {
        setCurrentTheme('system');
      }
    } catch {
      setCurrentTheme('system');
    }
  }, []);

  // ── Lock body scroll when mobile drawer is open ──
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isMobileMenuOpen]);

  // ── Escape key handler ──
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (isMobileMenuOpen) {
          setMobileMenuOpen(false);
          mobileToggleRef.current?.focus();
          return;
        }
        if (activeMenu) {
          setActiveMenu(null);
          setLockedMenu(null);
          // Return focus to the trigger that opened the menu
          if (activeTriggerRef.current) {
            activeTriggerRef.current.focus();
            activeTriggerRef.current = null;
          }
        }
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [activeMenu, isMobileMenuOpen]);

  // ── Click outside handler for locked menus ──
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (lockedMenu && navbarRef.current && !navbarRef.current.contains(e.target as Node)) {
        setActiveMenu(null);
        setLockedMenu(null);
      }
    };
    if (lockedMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [lockedMenu]);

  // ── Focus trap for mega‑menus & mobile drawer ──
  useEffect(() => {
    if (activeMenu || isMobileMenuOpen) {
      const container = isMobileMenuOpen
        ? navbarRef.current?.querySelector('[data-testid="navbar-mobile-drawer"]')
        : navbarRef.current?.querySelector('[data-testid="navbar-dropdown"]');

      if (!container) return;

      // Small delay so the DOM has rendered
      const raf = requestAnimationFrame(() => {
        const focusable = container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR);
        if (focusable.length > 0) focusable[0].focus();
      });

      const handleTabTrap = (e: KeyboardEvent) => {
        if (e.key !== 'Tab') return;
        const focusable = container?.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR);
        if (!focusable || focusable.length === 0) return;
        const arr = Array.from(focusable);
        const currentIndex = arr.indexOf(document.activeElement as HTMLElement);

        if (e.shiftKey) {
          if (currentIndex <= 0) {
            e.preventDefault();
            arr[arr.length - 1].focus();
          }
        } else {
          if (currentIndex === arr.length - 1) {
            e.preventDefault();
            arr[0].focus();
          }
        }
      };

      document.addEventListener('keydown', handleTabTrap);
      return () => {
        cancelAnimationFrame(raf);
        document.removeEventListener('keydown', handleTabTrap);
      };
    }
  }, [activeMenu, isMobileMenuOpen]);

  // ── Hover handlers ──
  const handleMouseEnter = useCallback((menuName: MenuName) => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (!lockedMenu || lockedMenu === menuName) {
      setActiveMenu(menuName);
    }
  }, [lockedMenu]);

  const handleMouseLeave = useCallback(() => {
    if (lockedMenu) return;
    timeoutRef.current = setTimeout(() => {
      setActiveMenu(null);
    }, 200);
  }, [lockedMenu]);

  // ── Click-to-lock ──
  const handleMenuClick = useCallback((menuName: MenuName, triggerEl: HTMLElement | null) => {
    if (lockedMenu === menuName && activeMenu === menuName) {
      setActiveMenu(null);
      setLockedMenu(null);
    } else {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      setActiveMenu(menuName);
      setLockedMenu(menuName);
      activeTriggerRef.current = triggerEl;
    }
  }, [lockedMenu, activeMenu]);

  const closeMenus = useCallback(() => {
    setActiveMenu(null);
    setLockedMenu(null);
  }, []);

  // ── Theme switching ──
  const setTheme = useCallback((theme: 'light' | 'dark' | 'system') => {
    const root = document.documentElement;
    root.classList.remove('light', 'dark');
    if (theme === 'system') {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      root.classList.add(prefersDark ? 'dark' : 'light');
    } else {
      root.classList.add(theme);
    }
    try {
      localStorage.setItem('theme', theme);
    } catch {
      // localStorage may be unavailable
    }
    setCurrentTheme(theme);
  }, []);

  // ── Derived values ──
  const userInitial = user?.name?.charAt(0)?.toUpperCase() || 'U';

  // ── Desktop nav links ──
  const renderNavLinks = () =>
    links.map((link, idx) => {
      const isActive = activeHref
        ? activeHref === link.href ||
          (link.href !== '/' && link.href !== '/dashboard' && link.href !== '/admin' && activeHref?.startsWith(link.href + '/'))
        : false;

      return (
        <LocalizedLink
          key={link.href}
          href={link.href}
          transformHref={transformHref}
          data-testid={`navbar-link-idx-${idx}`}
          className={cn(
            'px-4 py-1.5 font-mono text-[10px] tracking-widest uppercase transition-all duration-200 rounded-none',
            isActive
              ? 'text-primary font-black'
              : 'text-muted-foreground font-medium hover:text-primary'
          )}
        >
          <span className="flex items-center gap-2">
            {link.icon}
            {link.label}
          </span>
        </LocalizedLink>
      );
    });

  // ── Mobile drawer nav links ──
  const renderMobileNavLinks = () => {
    if (!isAuthenticated) return null;
    return links.map((link, idx) => {
      const isActive = activeHref
        ? activeHref === link.href ||
          (link.href !== '/' && link.href !== '/dashboard' && link.href !== '/admin' && activeHref?.startsWith(link.href + '/'))
        : false;

      return (
        <LocalizedLink
          key={link.href}
          href={link.href}
          transformHref={transformHref}
          data-testid={`navbar-link-idx-${idx}`}
          onClick={() => setMobileMenuOpen(false)}
          className={cn(
            'flex items-center gap-3 px-4 py-3.5 font-mono text-xs font-bold uppercase tracking-widest transition-all duration-200 border-b border-border/40',
            isActive
              ? 'text-primary'
              : 'text-muted-foreground hover:text-primary'
          )}
        >
          <span className="shrink-0">{link.icon}</span>
          {link.label}
        </LocalizedLink>
      );
    });
  };

  // ══════════════════════════════════════════
  //  RENDER
  // ══════════════════════════════════════════

  return (
    <>
      {/* ─── Navbar Container ─── */}
      <div
        ref={navbarRef}
        data-testid="smart-navbar"
        className="smart-navbar"
        onMouseLeave={handleMouseLeave}
      >
        <div className="max-w-[1600px] mx-auto h-full px-4 flex items-center justify-between gap-2">
          {/* ═══ LEFT: Logo + Debug Tag ═══ */}
          <div className="flex items-center gap-3 min-w-0" role="region" aria-label={brandName || t.brandFallback}>
            <LocalizedLink
              href={isAuthenticated ? '/' : '/'}
              transformHref={transformHref}
              data-testid="navbar-logo"
              className="flex items-center gap-3 shrink-0"
            >
              {logoUrl ? (
                <img
                  src={logoUrl}
                  alt="Logo"
                  className="w-6 h-6 object-contain filter drop-shadow-[0_1px_3px_rgba(0,0,0,0.3)]"
                />
              ) : (
                <div className="w-6 h-6 bg-primary/10 border border-primary/30 flex items-center justify-center">
                  <Shield size={12} className="text-primary" />
                </div>
              )}
              <div className="flex flex-col text-left">
                {appBadge && (
                  <span className="font-mono text-[9px] font-bold tracking-wider text-primary/80 border border-primary/20 bg-primary/5 px-1.5 py-[1px] leading-none">
                    {appBadge}
                  </span>
                )}
                <span className="font-mono text-xs font-black uppercase tracking-[0.2em] text-foreground truncate max-w-[160px] leading-tight">
                  {brandName || t.brandFallback}
                </span>
                {isAuthenticated && activeTenantId && (
                  <span className="font-mono text-[9px] opacity-70 uppercase tracking-widest text-muted-foreground leading-none mt-0.5">
                    {activeTenantId}
                  </span>
                )}
              </div>
            </LocalizedLink>
          </div>

          {/* ═══ CENTER: Nav Links (desktop, authenticated only) ═══ */}
          {isAuthenticated && (
            <nav className="smart-navbar-desktop-only flex items-center gap-1">
              {renderNavLinks()}
            </nav>
          )}

          {/* ═══ RIGHT: Utilities ═══ */}
          <div className="flex items-center gap-2">
            {/* Search Icon Button (desktop) */}
            {isAuthenticated && (
              <div
                className="relative smart-navbar-desktop-only"
                onMouseEnter={() => handleMouseEnter('search')}
                onClick={(e) => handleMenuClick('search', e.currentTarget as HTMLElement)}
              >
                <button
                  data-testid="navbar-menu-search"
                  className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all duration-200 cursor-pointer rounded-none"
                  aria-haspopup="true"
                  aria-expanded={activeMenu === 'search'}
                >
                  <Search size={16} />
                </button>
              </div>
            )}

            {/* Theme Toggle Button */}
            <div
              className="relative smart-navbar-desktop-only"
              onMouseEnter={() => handleMouseEnter('theme')}
              onClick={(e) => handleMenuClick('theme', e.currentTarget as HTMLElement)}
            >                <button
                  data-testid="navbar-menu-theme"
                  className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all duration-200 cursor-pointer rounded-none"
                  aria-haspopup="true"
                  aria-expanded={activeMenu === 'theme'}
                  aria-label={t.themeLabel}
                >
                  <Sun size={16} />
                </button>
            </div>

            {/* Language Toggle Button */}
            {onLocaleChange && (
              <div
                className="relative smart-navbar-desktop-only"
                onMouseEnter={() => handleMouseEnter('language')}
                onClick={(e) => handleMenuClick('language', e.currentTarget as HTMLElement)}
              >
                <button
                  data-testid="navbar-menu-language"
                  className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all duration-200 cursor-pointer rounded-none"
                  aria-haspopup="true"
                  aria-expanded={activeMenu === 'language'}
                  aria-label={t.languageLabel}
                >
                  <Languages size={16} />
                </button>
              </div>
            )}

            {/* Tenant Selector Button (desktop) */}
            {isAuthenticated && tenantSelectorSlot && (
              <div
                className="relative smart-navbar-desktop-only"
                onMouseEnter={() => handleMouseEnter('tenant')}
                onClick={(e) => handleMenuClick('tenant', e.currentTarget as HTMLElement)}
              >
                <button
                  data-testid="navbar-menu-tenant"
                  className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all duration-200 cursor-pointer rounded-none"
                  aria-haspopup="true"
                  aria-expanded={activeMenu === 'tenant'}
                >
                  <Building2 size={16} />
                </button>
              </div>
            )}

            {/* Notifications Slot (desktop) */}
            {isAuthenticated && notificationsSlot && (
              <div className="relative smart-navbar-desktop-only">
                <SlotErrorBoundary>
                  {notificationsSlot}
                </SlotErrorBoundary>
              </div>
            )}

            {/* User Menu (authenticated only) */}
            {isAuthenticated && (
              <div
                className="relative smart-navbar-desktop-only"
                onMouseEnter={() => handleMouseEnter('user')}
                onClick={(e) => handleMenuClick('user', e.currentTarget as HTMLElement)}
              >
                <button
                  data-testid="navbar-menu-user"
                  className="w-7 h-7 shrink-0 aspect-square flex items-center justify-center bg-primary/10 border border-primary/20 text-primary font-bold text-xs hover:bg-primary/20 transition-all duration-200 cursor-pointer rounded-none"
                  aria-haspopup="true"
                  aria-expanded={activeMenu === 'user'}
                >
                  {userInitial}
                </button>
              </div>
            )}

            {/* Login Button (public mode only) — visible on all screens */}
            {!isAuthenticated && onLogin && (
              <button
                onClick={onLogin}
                className="px-3 py-1.5 font-mono text-[10px] font-bold tracking-widest uppercase border border-border text-muted-foreground hover:text-primary hover:border-primary/30 transition-all duration-200 cursor-pointer rounded-none"
              >
                {t.loginBtn}
              </button>
            )}

            {/* Mobile Hamburger Toggle — visible only on mobile */}
            <button
              ref={mobileToggleRef}
              data-testid="navbar-mobile-toggle"
              className="smart-navbar-mobile-only p-2 text-muted-foreground hover:text-foreground transition-all duration-200 cursor-pointer rounded-none"
              onClick={() => setMobileMenuOpen((prev) => !prev)}
              aria-label={isMobileMenuOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={isMobileMenuOpen}
            >
              {isMobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
          </div>
        </div>

        {/* ─── Progress Bar (always in DOM → zero CLS) ─── */}
        <div className="absolute bottom-0 left-0 right-0 h-[2px] opacity-0 bg-primary/50 scale-x-0 transition-all duration-300 pointer-events-none" />

        {/* ═══ Mega Menu Dropdown ═══ */}
        {activeMenu && (
          <div
            data-testid="navbar-dropdown"
            className="smart-navbar-dropdown animate-in fade-in slide-in-from-top-1 duration-150"
            onMouseEnter={() => {
              if (timeoutRef.current) clearTimeout(timeoutRef.current);
            }}
            onMouseLeave={handleMouseLeave}
          >
            <div className={cn(
              "smart-navbar-dropdown-inner",
              (activeMenu === 'theme' || activeMenu === 'language' || activeMenu === 'user') ? 'smart-navbar-end' : 'smart-navbar-start'
            )}>
              {/* Navigation Mega Menu */}
              {activeMenu === 'navigation' && links && (
                <SmartNavbarNavMenu
                  links={links}
                  transformHref={transformHref}
                />
              )}

              {/* Theme Mega Menu */}
              {activeMenu === 'theme' && (
                <SmartNavbarThemeMenu
                  currentTheme={currentTheme}
                  setTheme={setTheme}
                  t={t}
                />
              )}

              {/* Language Mega Menu */}
              {activeMenu === 'language' && onLocaleChange && (
                <SmartNavbarLanguageMenu
                  locale={locale}
                  onLocaleChange={onLocaleChange}
                  onClose={closeMenus}
                />
              )}

              {/* User Mega Menu */}
              {activeMenu === 'user' && user && (
                <SmartNavbarUserMenu
                  user={user}
                  userInitial={userInitial}
                  t={t}
                  onLogout={onLogout}
                  transformHref={transformHref}
                  onClose={closeMenus}
                />
              )}

              {/* Search Mega Menu */}
              {activeMenu === 'search' && (
                <SmartNavbarSearchMenu
                  locale={locale}
                  onSearchTrigger={onSearchTrigger}
                  onClose={closeMenus}
                />
              )}

              {/* Tenant Mega Menu (renders the tenantSelectorSlot) */}
              {activeMenu === 'tenant' && tenantSelectorSlot && (
                <div className="w-full flex justify-center">
                  <SlotErrorBoundary>
                    <TenantMegaMenuProvider value={{ variant: 'content', isOpen: true }}>
                      {tenantSelectorSlot}
                    </TenantMegaMenuProvider>
                  </SlotErrorBoundary>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ═══ Mobile Drawer ═══ */}
      {isMobileMenuOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/20 z-30 md:hidden animate-in fade-in duration-200"
            onClick={() => {
              setMobileMenuOpen(false);
              mobileToggleRef.current?.focus();
            }}
            aria-hidden="true"
          />
          {/* Drawer Panel */}
          <div
            data-testid="navbar-mobile-drawer"
            className="fixed left-0 right-0 top-[56px] bottom-0 bg-background/98 backdrop-blur-lg border-t border-border z-40 overflow-y-auto animate-in slide-in-from-top-2 duration-200 md:hidden"
            role="dialog"
            aria-modal="true"
            aria-label="Mobile navigation"
          >
            <div className="flex flex-col min-h-full pb-8">
              {/* Nav Links */}
              {isAuthenticated && links.length > 0 && (
                <div className="border-b border-border/30 pb-2">
                  <div className="px-4 py-3 font-mono text-[9px] font-bold tracking-widest uppercase text-muted-foreground/50">
                    NAVEGACIÓN
                  </div>
                  {renderMobileNavLinks()}
                </div>
              )}

              {/* Tenant Selector Slot */}
              {isAuthenticated && tenantSelectorSlot && (
                <div className="border-b border-border/30 px-4 py-3">
                  <div className="font-mono text-[9px] font-bold tracking-widest uppercase text-muted-foreground/50 mb-2">
                    ORGANIZACIÓN
                  </div>
                  <SlotErrorBoundary>
                    {tenantSelectorSlot}
                  </SlotErrorBoundary>
                </div>
              )}

              {/* Notifications Slot (mobile) */}
              {notificationsSlot && (
                <div className="border-b border-border/30 px-4 py-3">
                  <div className="font-mono text-[9px] font-bold tracking-widest uppercase text-muted-foreground/50 mb-2">
                    NOTIFICACIONES
                  </div>
                  <SlotErrorBoundary>
                    {notificationsSlot}
                  </SlotErrorBoundary>
                </div>
              )}

              {/* Settings Slot (theme + language) */}
              {settingsSlot && (
                <div className="border-b border-border/30 px-4 py-3">
                  <div className="font-mono text-[9px] font-bold tracking-widest uppercase text-muted-foreground/50 mb-2">
                    CONFIGURACIÓN
                  </div>
                  <SlotErrorBoundary>
                    {settingsSlot}
                  </SlotErrorBoundary>
                </div>
              )}

              {/* User Card + Logout */}
              {isAuthenticated && user && (
                <div className="mt-auto px-4 pt-4 border-t border-border/30">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-9 h-9 bg-primary/10 border border-primary/20 flex items-center justify-center font-bold text-sm text-primary rounded-none">
                      {userInitial}
                    </div>
                    <div>
                      <p className="font-mono text-xs font-bold uppercase text-foreground">
                        {user.name}
                      </p>
                      <p className="font-mono text-[9px] text-muted-foreground uppercase tracking-wider">
                        {user.role}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2">
                    <LocalizedLink
                      href="/profile"
                      transformHref={transformHref}
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center justify-center gap-2 px-4 py-2.5 border border-border text-[10px] font-mono font-bold tracking-widest uppercase text-muted-foreground hover:text-primary hover:border-primary/30 transition-all duration-200 rounded-none w-full"
                    >
                      {t.profileLabel}
                    </LocalizedLink>
                    <button
                      onClick={() => { onLogout(); setMobileMenuOpen(false); }}
                      className="flex items-center justify-center gap-2 px-4 py-2.5 border border-border text-[10px] font-mono font-bold tracking-widest uppercase text-red-400 hover:bg-red-500/10 hover:border-red-500/20 transition-all duration-200 cursor-pointer rounded-none w-full"
                    >
                      {t.logoutBtn}
                    </button>
                  </div>
                </div>
              )}

              {/* Login for public mode */}
              {!isAuthenticated && onLogin && (
                <div className="px-4 pt-4">
                  <button
                    onClick={() => { onLogin(); setMobileMenuOpen(false); }}
                    className="w-full px-4 py-2.5 font-mono text-[10px] font-bold tracking-widest uppercase border border-primary/50 text-primary hover:bg-primary/10 transition-all duration-200 cursor-pointer rounded-none"
                  >
                    {t.loginBtn}
                  </button>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </>
  );
}

// ══════════════════════════════════════════
//  PUBLIC WRAPPER (with Suspense boundary)
// ══════════════════════════════════════════

/**
 * SmartNavbar — unified top navigation bar for all ABD Suite apps.
 *
 * Wraps the inner content in a Suspense boundary to satisfy Next.js 15+
 * requirements for `useSearchParams()` and prevents SSR bailouts.
 */
export function SmartNavbar(props: SmartNavbarProps) {
  return (
    <Suspense fallback={<SmartNavbarFallback {...props} />}>
      <SmartNavbarContent {...props} />
    </Suspense>
  );
}
