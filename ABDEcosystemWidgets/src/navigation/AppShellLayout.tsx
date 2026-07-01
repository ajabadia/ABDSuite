/**
 * @purpose Renderiza el layout principal de una aplicación con branding, carga superior, navegación lateral, paleta de comandos, puente de autobús y componentes hijos.
 * @purpose_en Renders the main layout of an application with branding, top loader, sidebar navigation, command palette, event bus bridge, and children components.
 * @refactorable false
 * @classification UI Component
 * @complexity Low
 * @fingerprint exports:1,imports:4,sig:1qsoaef
 * @lastUpdated 2026-06-30T05:49:07.191Z
 */

import React from 'react';
import { NextIntlClientProvider } from 'next-intl';
import type { AbstractIntlMessages } from 'next-intl';
import { Toaster } from 'sonner';

function TopLoader() {
  return (
    <div
      role="progressbar"
      aria-hidden
      className="fixed top-0 left-0 z-45 h-[2px] w-full pointer-events-none"
    >
      <div
        className="h-full w-0 animate-pulse"
        style={{
          background: 'hsl(var(--primary))',
          boxShadow: '0 0 10px hsl(var(--primary)), 0 0 5px hsl(var(--primary))',
          animation: 'abd-top-loader 2s ease-in-out infinite',
        }}
      />
      <style>{`@keyframes abd-top-loader { 0% { width: 0; margin-left: 0; } 50% { width: 60%; margin-left: 20%; } 100% { width: 0; margin-left: 100%; } }`}</style>
    </div>
  );
}

interface AppShellLayoutProps {
  children: React.ReactNode;
  messages: AbstractIntlMessages;
  locale: string;
  brandingStyles?: React.ReactNode;
  sidebarNavigation?: React.ReactNode;
  commandPalette?: React.ReactNode;
  eventBusBridge?: React.ReactNode;
}

export function AppShellLayout({
  children,
  messages,
  locale,
  brandingStyles,
  sidebarNavigation,
  commandPalette,
  eventBusBridge,
}: AppShellLayoutProps) {
  return (
    <NextIntlClientProvider messages={messages} locale={locale} timeZone="Europe/Madrid">
      <div className="min-h-screen bg-background text-foreground selection:bg-primary/30 transition-colors duration-300">
        <React.Fragment key="branding">{brandingStyles}</React.Fragment>
        <React.Fragment key="top-loader"><TopLoader /></React.Fragment>
        <React.Fragment key="sidebar">{sidebarNavigation}</React.Fragment>
        <React.Fragment key="command">{commandPalette}</React.Fragment>
        <React.Fragment key="eventbus">{eventBusBridge}</React.Fragment>
        <React.Fragment key="content">{children}</React.Fragment>
        <React.Fragment key="toaster"><Toaster position="top-right" richColors closeButton /></React.Fragment>
      </div>
    </NextIntlClientProvider>
  );
}
