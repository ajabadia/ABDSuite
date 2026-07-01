/**
 * @purpose Renderiza una plantilla para la página de aterrizaje con anchura máxima opcional y nombres de clase personalizados.
 * @purpose_en Renders a layout for the landing page with optional maximum width and custom class names.
 * @refactorable false
 * @classification UI Component
 * @complexity Low
 * @fingerprint exports:2,imports:2,sig:1ic7nze
 * @lastUpdated 2026-06-29T22:24:51.187Z
 */

import React from "react";
import type { ReactNode } from "react";

export interface LandingPageLayoutProps {
  children: ReactNode;
  maxWidth?: "5xl" | "6xl";
  className?: string;
}

export function LandingPageLayout({
  children,
  maxWidth = "5xl",
  className = "",
}: LandingPageLayoutProps) {
  const maxWidthClass = maxWidth === "6xl" ? "max-w-6xl" : "max-w-5xl";
  return (
    <div
      className={`flex min-h-screen flex-col items-center justify-center p-6 md:p-24 bg-background text-foreground selection:bg-primary/30 overflow-hidden ${className}`}
    >
      <div
        className="absolute inset-0 bg-industrial-grid mask-industrial-fade pointer-events-none opacity-50"
        aria-hidden="true"
      />

      <div
        className={`z-10 w-full ${maxWidthClass} flex flex-col gap-16 animate-in fade-in duration-500`}
      >
        {children}
      </div>
    </div>
  );
}
