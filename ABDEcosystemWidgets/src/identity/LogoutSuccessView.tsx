'use client';

/**
 * @purpose Gestiona el renderizado de una vista de éxito de salida con contenido dinámico y enlaces.
 * @purpose_en Manages the rendering of a logout success view with dynamic content and links.
 * @refactorable true (contains too many state variables and UI parts)
 * @classification UI Component
 * @complexity Medium
 * @fingerprint exports:2,imports:5,sig:tltvly
 * @lastUpdated 2026-06-26T09:59:45.126Z
 */

import * as React from 'react';
import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { ShieldCheck, LogIn, ArrowLeft, AlertTriangle } from 'lucide-react';
import { logger } from '@ajabadia/satellite-sdk/client';

export interface LogoutSuccessViewProps {
  signInUrl?: string;
  homeUrl?: string;
  appTitle?: string;
  translations?: {
    title?: string;
    subtitle?: string;
    message?: string;
    button?: string;
    home_button?: string;
    shield_badge?: string;
    tenantNotFoundTitle?: string;
    tenantNotFoundDesc?: string;
  };
  LinkComponent?: React.ComponentType<{ href: string; className?: string; children?: React.ReactNode; 'aria-label'?: string }>;
}

export function LogoutSuccessView(props: LogoutSuccessViewProps) {
  return (
    <Suspense fallback={
      <main className="min-h-screen flex items-center justify-center bg-background text-foreground font-sans">
        <div className="animate-pulse flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-muted" />
          <div className="h-4 w-32 bg-muted rounded" />
        </div>
      </main>
    }>
      <LogoutSuccessContent {...props} />
    </Suspense>
  );
}

function LogoutSuccessContent({
  signInUrl = '/admin',
  homeUrl = '/',
  appTitle = 'ABDFiles',
  translations,
  LinkComponent
}: LogoutSuccessViewProps) {
  const searchParams = useSearchParams();
  const error = searchParams ? searchParams.get('error') : null;
  const [hasLogged, setHasLogged] = useState(false);

  const t = (key: keyof NonNullable<LogoutSuccessViewProps['translations']>, fallback: string) => {
    return translations?.[key] || fallback;
  };

  // 🛰️ Automatic Audit Logging to ABDLogs
  useEffect(() => {
    if (error && !hasLogged) {
      setHasLogged(true);
      logger.audit({
        tenantId: 'SYSTEM',
        action: 'LOGOUT_SECURITY_ALERT',
        entityType: 'TENANT',
        entityId: error === 'tenant_not_found' ? 'UNKNOWN' : error,
        userId: 'anonymous',
        userEmail: 'anonymous@system.local',
        changedFields: { error, context: 'logout_success_screen' }
      }).catch((err: unknown) => {
        if (process.env.NODE_ENV === 'development') { console.warn('[Widgets Audit] Failed to replicate audit log to ABDLogs:', err); }
      });
    }
  }, [error, hasLogged]);

  const LinkComp = LinkComponent || 'a';

  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-background text-foreground font-sans relative overflow-hidden p-6">
      {/* 🌌 Background Elements */}
      <div className="absolute inset-0 bg-grid-pattern opacity-[0.03] pointer-events-none" />
      <div className="absolute -top-[40%] -left-[20%] w-[80%] h-[80%] rounded-full bg-primary/5 blur-[120px] pointer-events-none" />
      <div className="absolute -bottom-[40%] -right-[20%] w-[80%] h-[80%] rounded-full bg-primary/5 blur-[120px] pointer-events-none" />

      {/* 🛡️ Content Card */}
      <div className="w-full max-w-[420px] bg-card/40 backdrop-blur-xl border border-border/80 p-8 md:p-10 shadow-2xl relative z-10 flex flex-col items-center text-center animate-in fade-in slide-in-from-bottom-6 duration-500">
        
        {/* 📟 Pulse Status Indicator */}
        <div className="relative mb-6">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center border border-primary/20 relative z-10">
            <ShieldCheck className="w-8 h-8 text-primary animate-pulse" />
          </div>
          <span className="absolute -bottom-1 -right-1 flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-primary"></span>
          </span>
        </div>

        {/* 🏷️ Badge */}
        <div className="px-3 py-1 bg-secondary border border-border text-[9px] font-black tracking-[0.2em] uppercase text-muted-foreground mb-6">
          {t('shield_badge', 'Sesión Revocada')}
        </div>

        {/* ⚠️ Error Message Panel */}
        {error === 'tenant_not_found' && (
          <div className="w-full bg-destructive/10 border border-destructive/30 p-4 mb-6 rounded text-left text-xs flex gap-3 items-start animate-in fade-in duration-300">
            <AlertTriangle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
            <div className="flex flex-col gap-1">
              <span className="font-bold uppercase tracking-wider text-[10px] text-destructive">
                {t('tenantNotFoundTitle', 'Organización no encontrada')}
              </span>
              <span className="text-[11px] leading-relaxed text-muted-foreground">
                {t('tenantNotFoundDesc', 'La organización especificada no existe o no está registrada en el ecosistema.')}
              </span>
            </div>
          </div>
        )}

        {error && error !== 'tenant_not_found' && (
          <div className="w-full bg-destructive/10 border border-destructive/30 p-4 mb-6 rounded text-left text-xs flex gap-3 items-start animate-in fade-in duration-300">
            <AlertTriangle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
            <div className="flex flex-col gap-1">
              <span className="font-bold uppercase tracking-wider text-[10px] text-destructive">
                Error
              </span>
              <span className="text-[11px] leading-relaxed text-muted-foreground">
                {error}
              </span>
            </div>
          </div>
        )}

        {/* 🏁 Typography */}
        <h1 className="text-2xl font-black tracking-tighter uppercase mb-3 text-foreground">
          {t('title', 'Desconexión Exitosa')}
        </h1>
        
        <p className="text-xs text-muted-foreground font-medium leading-relaxed mb-8 max-w-[320px]">
          {t('subtitle', 'Has cerrado sesión correctamente.')}
        </p>

        {/* 🔌 Secure Farewell Text */}
        <div className="w-full bg-secondary/20 border border-border/40 p-4 mb-8 text-[10px] font-mono leading-relaxed text-left text-muted-foreground/80 flex items-start gap-3">
          <span className="text-primary font-bold">{`>`}</span>
          <span>{t('message', 'Tu sesión ha sido revocada de forma segura tanto en el satélite como en la pasarela central.')}</span>
        </div>

        {/* 🚀 Interactive Trigger Button */}
        <LinkComp
          href={signInUrl}
          aria-label={t('button', 'Volver a Iniciar Sesión')}
          className="w-full h-11 bg-primary hover:bg-primary/95 text-primary-foreground text-[10px] font-black uppercase tracking-widest transition-all duration-200 cursor-pointer flex items-center justify-center gap-2 border-b-2 border-primary-foreground/10 active:border-b-0 active:translate-y-[1px] outline-none text-center"
        >
          <LogIn className="w-4 h-4" />
          {t('button', 'Volver a Iniciar Sesión')}
        </LinkComp>

        {/* 🏁 Return Link to Public Welcome Page */}
        <LinkComp
          href={homeUrl}
          aria-label={t('home_button', 'Volver a la Bienvenida')}
          className="mt-5 text-[9px] font-black text-muted-foreground hover:text-foreground tracking-widest uppercase transition-colors flex items-center gap-1.5 cursor-pointer outline-none justify-center"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          {t('home_button', 'Volver a la Bienvenida')}
        </LinkComp>
      </div>

      {/* 🏁 Footer Spec */}
      <footer className="absolute bottom-6 opacity-25 text-[8px] font-mono tracking-widest uppercase text-muted-foreground">
        {appTitle} | SEC_REVOKED_LOGOUT_OK
      </footer>
    </main>
  );
}
