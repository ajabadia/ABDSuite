'use client';

/**
 * @purpose Renderiza el menú mega del perfil del usuario con detalles y botones de acción.
 * @purpose_en Renders the user profile mega menu with details and action buttons.
 * @refactorable true (contains too many state variables and UI parts)
 * @classification UI Component
 * @complexity Low
 * @fingerprint exports:1,imports:4,sig:1cfys6a
 * @lastUpdated 2026-06-23T23:02:31.424Z
 */

import { memo } from 'react';
import { LogOut, User as UserIcon } from 'lucide-react';
import { LocalizedLink } from './LocalizedLink.js';
import type { SmartNavbarTranslations } from './SmartNavbar.js';

interface SmartNavbarUserMenuProps {
  user: {
    name?: string | null;
    role?: string | null;
    email?: string | null;
    tenantId?: string | null;
  };
  userInitial: string;
  t: Required<SmartNavbarTranslations>;
  onLogout: () => void;
  transformHref: (href: string) => string;
  onClose: () => void;
}

/**
 * Renders the user profile mega menu with details and action buttons.
 */
export const SmartNavbarUserMenu = memo(function SmartNavbarUserMenu({
  user,
  userInitial,
  t,
  onLogout,
  transformHref,
  onClose,
}: SmartNavbarUserMenuProps) {
  return (
    <div className="flex flex-col md:flex-row gap-6 md:gap-8 items-start md:items-center w-full justify-between max-w-4xl">
      {/* Left: User Details */}
      <div className="flex items-center gap-3 shrink-0">
        <div className="w-10 h-10 bg-primary/10 border border-primary/20 flex items-center justify-center font-bold text-sm text-primary rounded-none">
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

      {/* Middle: Details info (Desktop) */}
      <div className="font-mono text-[9px] text-muted-foreground/60 space-y-1 min-w-[240px] border-l border-border/50 pl-6 hidden md:block">
        <div className="flex justify-between gap-4">
          <span>{t.identityProvider}:</span>
          <span className="text-primary font-bold">{t.statusOnline}</span>
        </div>
        {user.email && (
          <div className="flex justify-between gap-4">
            <span>{t.emailLabel}:</span>
            <span className="truncate max-w-[160px]">{user.email.toLowerCase()}</span>
          </div>
        )}
      </div>

      {/* Middle: Details info (Mobile) */}
      <div className="font-mono text-[9px] text-muted-foreground/60 space-y-1 w-full border-t border-border/50 pt-3 md:hidden">
        <div className="flex justify-between">
          <span>{t.identityProvider}:</span>
          <span className="text-primary font-bold">{t.statusOnline}</span>
        </div>
        {user.email && (
          <div className="flex justify-between">
            <span>{t.emailLabel}:</span>
            <span className="truncate">{user.email.toLowerCase()}</span>
          </div>
        )}
      </div>

      {/* Right: Actions buttons */}
      <div className="flex flex-col sm:flex-row gap-2 shrink-0 w-full md:w-auto">
        <LocalizedLink
          href="/profile"
          transformHref={transformHref}
          onClick={onClose}
          className="flex items-center justify-center gap-2 px-4 py-2 border border-border text-[9px] font-mono font-bold tracking-widest uppercase text-muted-foreground hover:text-primary hover:border-primary/30 transition-all duration-200 rounded-none w-full sm:w-auto"
        >
          <UserIcon size={12} />
          {t.profileLabel}
        </LocalizedLink>
        <button
          onClick={() => { onLogout(); onClose(); }}
          className="flex items-center justify-center gap-2 px-4 py-2 border border-border text-[9px] font-mono font-bold tracking-widest uppercase text-red-400 hover:bg-red-500/10 hover:border-red-500/20 transition-all duration-200 cursor-pointer rounded-none w-full sm:w-auto"
        >
          <LogOut size={12} />
          {t.logoutBtn}
        </button>
      </div>
    </div>
  );
});
