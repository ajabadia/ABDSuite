'use client';

/**
 * @purpose Renderiza un perfil de usuario y controles de sesión, incluyendo opciones para configuraciones administrativas y salir.
 * @purpose_en Renders a user profile status and session controls, including options for administrative settings and logout.
 * @refactorable false
 * @classification UI Component
 * @complexity Low
 * @fingerprint exports:2,imports:2,sig:1kcc1ny
 * @lastUpdated 2026-06-23T23:01:34.536Z
 */

import React from 'react';
import { ShieldCheck, Settings, LogOut } from 'lucide-react';

export interface UserIdentityProps {
  name: string;
  email: string;
  isAdmin?: boolean;
  adminHref?: string;
  logoutHref?: string;
  translations?: {
    adminTitle?: string;
    logoutTitle?: string;
  };
  LinkComponent?: React.ComponentType<{ href: string; className?: string; title?: string; children?: React.ReactNode }>;
}

/**
 * 👤 UserIdentity
 * Presentation component for rendering user profile status and session controls.
 * Keep it pure, stateless, and style-compliant.
 */
export function UserIdentity({
  name,
  email,
  isAdmin = false,
  adminHref = '/admin',
  logoutHref = '/api/auth/logout',
  translations,
  LinkComponent
}: UserIdentityProps) {
  const adminTitle = translations?.adminTitle || 'Admin Console';
  const logoutTitle = translations?.logoutTitle || 'Logout';

  // Fallback to native anchor if LinkComponent is not supplied
  const LinkComp = LinkComponent || 'a';

  return (
    <div className="flex items-center gap-4 p-1 pl-4 bg-card border border-border rounded-md backdrop-blur-sm group transition-all hover:border-primary/20">
      <div className="flex flex-col items-end gap-0.5 py-1">
        <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-foreground font-bold">
          {name}
        </span>
        <div className="flex items-center gap-1.5">
          {isAdmin && <ShieldCheck className="w-3 h-3 text-primary/60" />}
          <span className="text-[9px] font-mono uppercase tracking-[0.1em] text-muted-foreground/60">
            {email}
          </span>
        </div>
      </div>

      <div className="h-8 w-[1px] bg-border mx-1" />

      <div className="flex items-center">
        {isAdmin && (
          <LinkComp href={adminHref} title={adminTitle} className="p-1 hover:bg-muted rounded-none transition-colors text-muted-foreground hover:text-foreground">
            <Settings size={14} />
          </LinkComp>
        )}
        
        <LinkComp href={logoutHref} title={logoutTitle} className="p-1 hover:bg-red-500/10 rounded-none transition-colors text-red-500/70 hover:text-red-500">
          <LogOut size={14} />
        </LinkComp>
      </div>
    </div>
  );
}
