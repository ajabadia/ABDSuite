/**
 * @purpose Renderiza un componente de badge que muestra el rol del usuario con una icono y texto, apoyando múltiples ubicaciones y variantes.
 * @purpose_en Renders a badge component that displays the role of a user with an icon and text, supporting multiple locales and variants.
 * @refactorable true (contains too many state variables and UI parts)
 * @classification UI Component
 * @complexity Low
 * @fingerprint exports:5,imports:3,sig:1ymvhr6
 * @lastUpdated 2026-06-23T23:26:24.346Z
 */

import React from 'react';
import type { ElementType } from 'react';
import { PenTool, UserCheck, Eye } from 'lucide-react';

// ─── Types ───────────────────────────────────────────────────────────────────

export type RoleType = 'CREATOR' | 'RECIPIENT' | 'AUDITOR';

export interface RoleLiteralsMap {
  CREATOR: { es: string; en: string };
  RECIPIENT: { es: string; en: string };
  AUDITOR: { es: string; en: string };
}

export type RoleBadgeVariant = 'default' | 'outline' | 'ghost';

export interface RoleBadgeProps {
  /** The internal role type */
  role: RoleType;
  /** Optional tenant-specific role literals (from roleCustomization.roleLiterals) */
  roleLiterals?: RoleLiteralsMap;
  /** Locale to render the literal in (default: 'es') */
  locale?: 'es' | 'en';
  /** Visual variant (default: 'default') */
  variant?: RoleBadgeVariant;
  /** Whether to show a role icon (default: true) */
  showIcon?: boolean;
  /** Optional custom icon override */
  icon?: ElementType;
  /** Additional CSS classes */
  className?: string;
}

// ─── Default Literals ────────────────────────────────────────────────────────

const DEFAULT_LITERALS: RoleLiteralsMap = {
  CREATOR: { es: 'Creador', en: 'Creator' },
  RECIPIENT: { es: 'Destinatario', en: 'Recipient' },
  AUDITOR: { es: 'Auditor', en: 'Auditor' },
};

// ─── Role Visual Configuration ───────────────────────────────────────────────

interface RoleVisual {
  icon: ElementType;
  bg: string;
  text: string;
  border: string;
  badgeBg: string;
}

const ROLE_VISUALS: Record<RoleType, RoleVisual> = {
  CREATOR: {
    icon: PenTool,
    bg: 'bg-sky-500/10 dark:bg-sky-500/15',
    text: 'text-sky-600 dark:text-sky-400',
    border: 'border-sky-500/20 dark:border-sky-500/25',
    badgeBg: 'bg-sky-500',
  },
  RECIPIENT: {
    icon: UserCheck,
    bg: 'bg-emerald-500/10 dark:bg-emerald-500/15',
    text: 'text-emerald-600 dark:text-emerald-400',
    border: 'border-emerald-500/20 dark:border-emerald-500/25',
    badgeBg: 'bg-emerald-500',
  },
  AUDITOR: {
    icon: Eye,
    bg: 'bg-amber-500/10 dark:bg-amber-500/15',
    text: 'text-amber-600 dark:text-amber-400',
    border: 'border-amber-500/20 dark:border-amber-500/25',
    badgeBg: 'bg-amber-500',
  },
};

// ─── Component ───────────────────────────────────────────────────────────────

/**
 * 🏷️ RoleBadge
 *
 * Renders a contextual role badge that displays the tenant-customizable literal
 * for a given internal role (CREATOR / RECIPIENT / AUDITOR).
 *
 * When `roleLiterals` is provided (from the tenant's `roleCustomization` config),
 * the badge displays the tenant-specific name for the role in the given locale.
 * Otherwise, it falls back to default literals (Creador / Destinatario / Auditor).
 *
 * @example
 * ```tsx
 * // Basic usage with defaults
 * <RoleBadge role="CREATOR" />
 *
 * // With tenant customization
 * <RoleBadge
 *   role="RECIPIENT"
 *   roleLiterals={tenant.roleCustomization?.roleLiterals}
 *   locale="en"
 *   variant="outline"
 * />
 * ```
 */
export function RoleBadge({
  role,
  roleLiterals,
  locale = 'es',
  variant = 'default',
  showIcon = true,
  icon: CustomIcon,
  className = '',
}: RoleBadgeProps) {
  // Resolve the literal text for this role + locale
  const literals = roleLiterals ?? DEFAULT_LITERALS;
  const label = literals[role]?.[locale] ?? DEFAULT_LITERALS[role][locale];

  // Resolve visual configuration
  const visual = ROLE_VISUALS[role];
  const IconComponent = CustomIcon ?? visual.icon;

  // Variant class composition
  const variantClasses: Record<RoleBadgeVariant, string> = {
    default: `${visual.bg} ${visual.text} ${visual.border} border`,
    outline: 'bg-transparent border border-border text-muted-foreground',
    ghost: 'bg-transparent border-transparent text-muted-foreground',
  };

  return (
    <span
      data-role={role}
      data-variant={variant}
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider whitespace-nowrap rounded-none transition-colors duration-150 ${variantClasses[variant]} ${className}`}
    >
      {showIcon && variant === 'default' && (
        <span className="relative flex h-2 w-2 shrink-0">
          <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${visual.badgeBg} opacity-75`} />
          <span className={`relative inline-flex rounded-full h-2 w-2 ${visual.badgeBg}`} />
        </span>
      )}
      {showIcon && variant !== 'default' && (
        <span className="shrink-0 flex items-center">
          <IconComponent size={12} aria-hidden="true" />
        </span>
      )}
      {label}
    </span>
  );
}
