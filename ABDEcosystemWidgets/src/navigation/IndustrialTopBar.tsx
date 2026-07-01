'use client';

/**
 * @purpose Renderiza un componente barra superior para aplicaciones industriales, incluyendo funcionalidad de búsqueda y configuración del sistema.
 * @purpose_en Renders a top bar component for industrial applications, including search functionality and system settings.
 * @refactorable false
 * @classification UI Component
 * @complexity Low
 * @fingerprint exports:2,imports:2,sig:15pte1f
 * @lastUpdated 2026-06-23T23:01:58.500Z
 */

import React from 'react';
import { Search } from 'lucide-react';

export interface IndustrialTopBarProps {
  /**
   * Current locale for bilingual labels (BUSCADOR / SEARCH).
   */
  locale?: string;
  /**
   * Optional elements rendered BEFORE the search button.
   * Use this for TenantSelector or other leading controls.
   */
  children?: React.ReactNode;
  /**
   * App-specific SystemSettings wrapper (required).
   * Each app passes its own wrapper with next-intl / next-themes bindings.
   *
   * @example
   * <IndustrialTopBar locale="es" settings={<SystemSettings isAuthenticated={true} />}>
   *   <TenantSelector sessionUser={user} />
   * </IndustrialTopBar>
   */
  settings: React.ReactNode;
  /** Additional className forwarded to the container */
  className?: string;
}

/**
 * 🏗️ IndustrialTopBar
 *
 * Consolidates the repeated [search button + SystemSettings] floating top-right
 * control panel from all four satellite layouts into a single shared component.
 *
 * Layout structure:
 * ```
 * ┌─ fixed top-6 right-6 ──────────────────┐
 * │  [TenantSelector?]  [🔍 BUSCADOR]  [⚙️] │
 * └─────────────────────────────────────────┘
 * ```
 *
 * Usage follows the "logic in widgets → connection in app" pattern:
 * each app passes its own SystemSettings wrapper via `settings`,
 * keeping locale/theme/auth bindings local while the UI/UX stays unified.
 */
export function IndustrialTopBar({
  locale = 'en',
  children,
  settings,
  className = '',
}: IndustrialTopBarProps) {
  return (
    <div
      className={`fixed top-6 right-6 z-40 flex items-center gap-2 ${className}`}
    >
      {/* ── Leading controls (TenantSelector, etc.) ── */}
      {children}

      {/* ── Global search trigger (opens CommandPalette by DOM id) ── */}
      <button
        id="command-palette-trigger"
        aria-label={locale === 'es' ? 'Buscar comandos (Ctrl+K)' : 'Search commands (Ctrl+K)'}
        className="p-2.5 rounded-none border border-border bg-background/80 backdrop-blur-md hover:bg-muted text-foreground transition-all active:scale-90 cursor-pointer shadow-lg flex items-center justify-center gap-2"
      >
        <Search size={18} className="text-foreground shrink-0" />
        <span className="hidden md:inline-flex items-center text-[10px] font-black uppercase tracking-[0.15em] text-muted-foreground/80 font-sans">
          {locale === 'es' ? 'BUSCADOR' : 'SEARCH'}
        </span>
        <kbd className="hidden lg:inline-flex items-center px-1.5 py-0.5 text-[9px] font-mono rounded bg-white/10 text-white/50 border border-white/5 uppercase">
          Ctrl+K
        </kbd>
      </button>

      {/* ── App-specific SystemSettings wrapper ── */}
      {settings}
    </div>
  );
}
