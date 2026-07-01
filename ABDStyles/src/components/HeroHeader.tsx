/**
 * @purpose Renderiza un componente de cabecera estándar grande para páginas de aterrizaje públicas dentro del conjunto ABD, incluyendo una notificacion emergente, título y subtítulo opcional.
 * @purpose_en Renders a standardized large header component for public landing pages across the ABD Suite, including a status pill, title, and optional subtitle.
 * @refactorable false
 * @classification UI Component
 * @complexity Low
 * @fingerprint exports:2,imports:2,sig:5kkc55
 * @lastUpdated 2026-06-23T23:26:15.233Z
 */

import React from "react";
import type { ReactNode } from "react";

export interface HeroHeaderProps {
  /** The small tracking text in the pill above the title (e.g. "SYSTEM ACTIVE") */
  statusText?: ReactNode;
  /** The main title of the page, rendered gigantically */
  title: ReactNode;
  /** The descriptive subtitle under the main title */
  description?: ReactNode;
  /** Custom className for the root container */
  className?: string;
  /** Custom className for the title text, to allow size overrides */
  titleClassName?: string;
}

/**
 * 🛰️ HeroHeader
 * Standardized large header component for the public landing pages across the ABD Suite.
 */
export function HeroHeader({
  statusText,
  title,
  description,
  className = "",
  titleClassName = "text-6xl md:text-7xl",
}: HeroHeaderProps) {
  return (
    <header className={`flex flex-col gap-6 items-center text-center ${className}`} role="banner">
      
      {/* Status Pill */}
      {statusText && (
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-secondary/10 border border-border text-[10px] uppercase tracking-[0.2em] text-muted-foreground font-mono rounded">
          <span className="relative flex h-2 w-2" aria-hidden="true">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
          </span>
          {statusText}
        </div>
      )}
      
      {/* Gigantic Title */}
      <h1 className={`${titleClassName} font-black tracking-tighter text-foreground italic uppercase antialiased leading-none`}>
        {title}
      </h1>
      
      {/* Subtitle Description */}
      {description && (
        <p className="text-lg text-muted-foreground max-w-[650px] font-light leading-relaxed mx-auto">
          {description}
        </p>
      )}
    </header>
  );
}
