/**
 * @purpose Renderiza un componente de cabecera estándar para paneles administrativos dentro del conjunto ABD Suite, incluyendo una icono, breadcrumb, título, descripción y acciones.
 * @purpose_en Renders a standardized header component for administrative dashboards across the ABD Suite, including an icon, breadcrumb, title, description, and actions.
 * @refactorable false
 * @classification UI Component
 * @complexity Low
 * @fingerprint exports:2,imports:2,sig:1chwma
 * @lastUpdated 2026-06-23T23:26:08.983Z
 */

import React from "react";
import type { ElementType, ReactNode } from "react";

export interface AdminPageHeaderProps {
  /** The icon to display in the breadcrumb / tag area */
  icon?: ElementType;
  /** The small tracking text above the title (e.g. "CONSOLA DE CONTROL • DASHBOARD") */
  breadcrumb?: ReactNode;
  /** The main title of the page */
  title: ReactNode;
  /** Optional back button or left-side action next to the title */
  backButton?: ReactNode;
  /** The descriptive subtitle under the main title */
  description?: ReactNode;
  /** Content to display on the right side of the header (actions, buttons, etc.) */
  children?: ReactNode;
  /** Custom className for the root container */
  className?: string;
  /** Optional tenant identifier to show current context */
  tenantId?: string;
}

/**
 * 🛰️ AdminPageHeader
 * Standardized header component for the administrative dashboards across the ABD Suite.
 */
export function AdminPageHeader({
  icon: Icon,
  breadcrumb,
  title,
  backButton,
  description,
  children,
  className = "",
  tenantId,
}: AdminPageHeaderProps) {
  return (
    <header className={`flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-border pb-8 ${className}`}>
      <div className="flex flex-col gap-2 min-w-0 flex-1">
        {/* Breadcrumb / Location Tag */}
        {breadcrumb && (
          <div className="text-[10px] font-mono font-black uppercase tracking-[0.25em] text-primary flex items-center gap-2 mb-2">
            {Icon && <Icon size={14} className="text-primary animate-pulse" aria-hidden="true" />}
            <span className="animate-console-pulse">{breadcrumb}</span>
            {tenantId && (
              <span className="text-muted-foreground ml-1">({tenantId})</span>
            )}
          </div>
        )}
        
        {/* Title Row with optional Back Button */}
        <div className="flex items-center gap-4 mt-1 min-w-0">
          <h1 className="text-3xl font-black uppercase italic tracking-tight text-foreground leading-none flex-1 truncate">
            {title}
          </h1>
        </div>
        
        {/* Description Subtitle */}
        {description && (
          <div className="text-sm text-muted-foreground font-sans mt-2 leading-relaxed">
            {description}
          </div>
        )}
      </div>

      {/* Right Side Actions */}
      {children && (
        <div className="flex items-center space-x-2 shrink-0">
          {children}
        </div>
      )}
    </header>
  );
}
