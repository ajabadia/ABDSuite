/**
 * @purpose Renderiza un componente pie de pie una vez que se ha enviado datos de telemetry, disposición en dos columnas y modo de etiquetas simples.
 * @purpose_en Renders a unified footer component that supports telemetry data, two-column layout, and simple label modes.
 * @refactorable true (contains too many state variables and UI parts)
 * @classification UI Component
 * @complexity Low
 * @fingerprint exports:2,imports:1,sig:1j6cv6z
 * @lastUpdated 2026-06-23T23:01:50.207Z
 */

import React from 'react';

export interface GlobalFooterProps {
  /** Simple centered label (used as fallback when no telemetry and no two-column layout) */
  label?: string;
  /** Left-side label (two-column layout mode) */
  leftLabel?: string;
  /** Right-side label (two-column layout mode) */
  rightLabel?: string;
  /** Telemetry data rows — overrides label mode when present */
  telemetryItems?: Array<{ label: string; value: string }>;
  /** Whether to show the separator line. Default true. */
  showSeparator?: boolean;
  /** Width of the separator line. Default 'full'. */
  separatorWidth?: 'full' | 'short';
  /** Additional className for the footer element */
  className?: string;
  /** Opacity level (0-100). Default 80. */
  opacity?: number;
}

/**
 * 🏁 GlobalFooter — Unified Industrial Footer
 *
 * Consolidates the old `Footer` (from @ajabadia/styles) and `GlobalFooter` (from widgets)
 * into a single component that supports three layout modes:
 *
 * 1. **Telemetry mode** — renders `telemetryItems[]` as centered key-value pairs
 * 2. **Two-column mode** — renders `leftLabel` + `rightLabel` side by side (responsive)
 * 3. **Label mode** — renders a single centered `label`
 *
 * Usage in apps follows the same thin-wrapper pattern as SystemSettings.
 */
export function GlobalFooter({
  label,
  leftLabel,
  rightLabel,
  telemetryItems,
  showSeparator = true,
  separatorWidth = 'full',
  className = '',
  opacity = 80,
}: GlobalFooterProps) {
  const opacityClass =
    opacity <= 20
      ? 'text-muted-foreground/20'
      : opacity <= 40
        ? 'text-muted-foreground/40'
        : opacity <= 60
          ? 'text-muted-foreground/60'
          : opacity <= 80
            ? 'text-muted-foreground/80'
            : 'text-muted-foreground';

  const isTwoColumn = !!(leftLabel && rightLabel);

  // ── Two-column mode preserves original GlobalFooter visual —──
  const containerClass = isTwoColumn
    ? 'mt-auto pt-6 border-t border-border flex flex-col sm:flex-row justify-between items-center gap-4'
    : 'mt-auto pt-12 flex flex-col items-center gap-6';

  const separatorWidthClass = separatorWidth === 'short' ? 'w-24 mx-auto' : 'w-full';

  return (
    <footer
      className={`${containerClass} font-mono text-[9px] uppercase tracking-[0.3em] ${opacityClass} ${className}`}
      role="contentinfo"
    >
      {showSeparator && !isTwoColumn && (
        <div
          className={`h-[1px] bg-border/40 ${separatorWidthClass}`}
          aria-hidden="true"
        />
      )}

      {telemetryItems && telemetryItems.length > 0 ? (
        // ── Telemetry mode — centered key-value pairs ──
        <div className="flex flex-wrap justify-center gap-x-12 gap-y-2">
          {telemetryItems.map((item, index) => (
            <span key={index}>
              {item.label}: {item.value}
            </span>
          ))}
        </div>
      ) : isTwoColumn ? (
        // ── Two-column mode — left / right labels ──
        <>
          <span>{leftLabel}</span>
          <span>{rightLabel}</span>
        </>
      ) : (
        // ── Simple label mode — centered ──
        label && <span>{label}</span>
      )}
    </footer>
  );
}
