'use client';

/**
 * @purpose Renderiza un menú de configuración del sistema con opciones de ubicación y tema, controles de autenticación y información de versión.
 * @purpose_en Renders a system settings dropdown menu with locale and theme options, authentication controls, and version information.
 * @refactorable true (contains too many state variables and UI parts)
 * @classification UI Component
 * @complexity Medium
 * @fingerprint exports:2,imports:5,sig:1h5h42d
 * @lastUpdated 2026-06-26T10:00:03.150Z
 */

import * as React from "react";
import { useState, useRef, useEffect } from "react";
import { Settings, X, LogIn, LogOut } from "lucide-react";
import { cn } from "../utils.js";
import { useClickOutside } from "../hooks/useClickOutside.js";

export interface SystemSettingsProps {
  locale: string;
  onLocaleChange: (locale: string) => void;
  locales?: string[];

  // Optional theme state/callback to delegate to parent (e.g. next-themes)
  theme?: string;
  onThemeChange?: (theme: string) => void;

  // Authentication props
  isAuthenticated?: boolean;
  /** Callback for custom login logic. If omitted, falls back to signinUrl navigation. */
  onLogin?: () => void;
  /** Callback for custom logout logic. If omitted, falls back to logoutUrl navigation. */
  onLogout?: () => void;
  /** URL to navigate to when logging out (fallback if onLogout is not provided). */
  logoutUrl?: string;
  /** URL to navigate to when logging in (fallback if onLogin is not provided). */
  signinUrl?: string;
  /** Whether to show the login button when not authenticated. Defaults to true. */
  showLogin?: boolean;

  // Optional version indicator
  versionSignature?: string;
}

export function SystemSettings({
  locale,
  onLocaleChange,
  locales = ["es", "en"],
  theme,
  onThemeChange,
  isAuthenticated = false,
  onLogin,
  onLogout,
  logoutUrl = "/api/auth/logout",
  signinUrl = "/api/auth/signin",
  showLogin = true,
  versionSignature = "ABD_SYSTEM_V1.0",
}: SystemSettingsProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Local theme state if not controlled by parent
  const [internalTheme, setInternalTheme] = useState<string>(() => {
    if (typeof window !== "undefined") {
      const match = document.cookie.match(/(?:^|; )abd_theme=([^;]*)/);
      if (match && match[1]) {
        return match[1];
      }
      return localStorage.getItem("theme") || "dark";
    }
    return "dark";
  });

  const activeTheme = theme !== undefined ? theme : internalTheme;

  const handleThemeChange = (newTheme: string) => {
    if (typeof window !== "undefined") {
      localStorage.setItem("theme", newTheme);
      
      // Sync cookie across ports on localhost and subdomains in production
      let domainSuffix = "";
      const hostname = window.location.hostname;
      if (hostname !== "localhost" && hostname !== "127.0.0.1") {
        const parts = hostname.split('.');
        if (parts.length >= 2) {
          domainSuffix = `; domain=.${parts.slice(-2).join('.')}`;
        }
      }
      document.cookie = `abd_theme=${newTheme}; path=/; max-age=31536000; SameSite=Lax${domainSuffix}`;
      
      // Update DOM class name directly for instant visual change
      if (newTheme === 'system') {
        const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        document.documentElement.className = isDark ? 'dark' : 'light';
      } else {
        document.documentElement.className = newTheme;
      }
    }

    if (onThemeChange) {
      onThemeChange(newTheme);
    } else {
      setInternalTheme(newTheme);
    }
  };

  useEffect(() => {
    setMounted(true);
  }, []);

  useClickOutside(containerRef, () => setIsOpen(false));

  const t = (key: string, opts?: { defaultMessage?: string }) => opts?.defaultMessage || key;

  if (!mounted) {
    return (
      <button
        aria-label="Loading Settings"
        disabled
        className="p-2.5 rounded-none border border-border bg-background/80 backdrop-blur-md opacity-60 cursor-not-allowed"
      >
        <Settings size={18} className="text-muted-foreground animate-pulse" />
      </button>
    );
  }

  return (
    <div className="relative inline-block text-left z-[55]" ref={containerRef}>
      <button
        aria-label="Open Settings"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "p-2.5 rounded-none border border-border bg-background/80 backdrop-blur-md hover:bg-muted transition-all active:scale-90 cursor-pointer shadow-lg",
          isOpen && "bg-muted ring-1 ring-primary/20 border-primary/30"
        )}
      >
        <Settings
          size={18}
          className={cn(
            "text-foreground transition-transform duration-500",
            isOpen && "rotate-90 text-primary"
          )}
        />
      </button>

      {isOpen && (
        <div
          className="absolute right-0 mt-3 w-64 bg-background/95 border border-border backdrop-blur-md z-[100] overflow-hidden rounded-none shadow-2xl p-4 origin-top-right animate-in fade-in slide-in-from-top-2 zoom-in-95 duration-200 ease-out"
          role="region"
          aria-label="System Settings Menu"
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-4 pb-2 border-b border-border">
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground italic">
              {t('system_settings_title', { defaultMessage: 'CONFIGURACIÓN DEL SISTEMA' })}
            </span>
            <button
              aria-label={t('system_settings_close', { defaultMessage: 'Cerrar' })}
              onClick={() => setIsOpen(false)}
              className="p-1 hover:bg-muted rounded-none transition-colors text-muted-foreground hover:text-foreground cursor-pointer"
            >
              <X size={14} />
            </button>
          </div>
          {/* Auth Section */}
          {(isAuthenticated || showLogin) && (
            <div className="mt-6 pt-4 border-t border-border">
              {isAuthenticated ? (
                onLogout ? (
                  <button
                    aria-label={t('system_settings_logout', { defaultMessage: 'TERMINAR SESIÓN' })}
                    onClick={onLogout}
                    className="w-full flex items-center gap-3 px-3 py-2.5 bg-red-500/10 border border-red-500/20 text-red-500 hover:bg-red-500/20 transition-all duration-200 text-[10px] font-bold uppercase cursor-pointer rounded-none"
                  >
                    <LogOut size={14} />
                    <span>{t('system_settings_logout', { defaultMessage: 'TERMINAR SESIÓN' })}</span>
                  </button>
                ) : (
                  <a
                    href={logoutUrl}
                    className="w-full flex items-center gap-3 px-3 py-2.5 bg-red-500/10 border border-red-500/20 text-red-500 hover:bg-red-500/20 transition-all duration-200 text-[10px] font-bold uppercase cursor-pointer rounded-none"
                  >
                    <LogOut size={14} />
                    <span>{t('system_settings_logout', { defaultMessage: 'TERMINAR SESIÓN' })}</span>
                  </a>
                )
              ) : onLogin ? (
                <button
                  aria-label={t('system_settings_login', { defaultMessage: 'INICIAR SESIÓN' })}
                  onClick={onLogin}
                  className="w-full flex items-center gap-3 px-3 py-2.5 bg-primary/10 border border-primary/20 text-primary hover:bg-primary/20 transition-all duration-200 text-[10px] font-bold uppercase cursor-pointer rounded-none"
                >
                  <LogIn size={14} />
                  <span>{t('system_settings_login', { defaultMessage: 'INICIAR SESIÓN' })}</span>
                </button>
              ) : (
                <a
                  href={signinUrl}
                  className="w-full flex items-center gap-3 px-3 py-2.5 bg-primary/10 border border-primary/20 text-primary hover:bg-primary/20 transition-all duration-200 text-[10px] font-bold uppercase cursor-pointer rounded-none"
                >
                  <LogIn size={14} />
                  <span>{t('system_settings_login', { defaultMessage: 'INICIAR SESIÓN' })}</span>
                </a>
              )}
            </div>
          )}

          {/* Footer Version Signature */}
          <div className="mt-4 text-center">
            <span className="text-[8px] font-mono uppercase tracking-[0.3em] text-muted-foreground/30">
              {versionSignature}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
