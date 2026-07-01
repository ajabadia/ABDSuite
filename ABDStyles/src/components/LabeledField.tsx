/**
 * @purpose Renderiza un campo de formulario etiquetado con mensajes de error y sugerencia opcionales.
 * @purpose_en Renders a labeled form field with optional error and hint messages.
 * @refactorable true (contains too many state variables and UI parts)
 * @classification UI Component
 * @complexity Low
 * @fingerprint exports:2,imports:3,sig:yi6di9
 * @lastUpdated 2026-06-23T23:26:19.263Z
 */

import React from "react";
import type { ReactNode } from "react";
import { cn } from "./utils.js";

export interface LabeledFieldProps {
  /** Unique id — applied to the child input/select via cloneElement AND used as htmlFor on the label */
  id: string;
  /** Visible label text */
  label: ReactNode;
  /** Optional error message string. When present, renders a <p role="alert"> below the field */
  error?: string | null | undefined;
  /** Optional helper / hint text shown below the field */
  hint?: ReactNode;
  /** Marks the field as required (adds visual asterisk) */
  required?: boolean;
  /** Additional class names for the wrapper */
  className?: string;
  /** Additional class names for the <label> element */
  labelClassName?: string;
  /** The input, select, textarea, or other form control. Receives `id` and `aria-describedby` */
  children: ReactNode;
  /** If true, renders children directly without cloneElement (just wraps in field container) */
  raw?: boolean;
}

/**
 * 🛰️ LabeledField
 *
 * Accessible form field wrapper that ties together:
 * - `<label htmlFor={id}>` → input via `id`
 * - Error message with `role="alert"` for screen‑reader announcements
 * - Hint / helper text
 *
 * Usage:
 * ```tsx
 * <LabeledField id="email" label="Email" error={errors.email}>
 *   <Input id="email" {...register("email")} aria-describedby="email-hint" />
 * </LabeledField>
 * ```
 *
 * When `raw` is false (default), the component **clones** the child and
 * injects `id` so you don't have to repeat it.
 */
export function LabeledField({
  id,
  label,
  error,
  hint,
  required = false,
  className,
  labelClassName,
  children,
  raw = false,
}: LabeledFieldProps) {
  const errorId = `${id}-error`;
  const hintId = `${id}-hint`;
  const describedBy = [error ? errorId : "", hint ? hintId : ""]
    .filter(Boolean)
    .join(" ")
    || undefined;

  const child = raw
    ? children
    : React.isValidElement<Record<string, unknown>>(children)
      ? React.cloneElement(children, {
          ...(children.props as Record<string, unknown>),
          id,
          ...(describedBy ? { "aria-describedby": describedBy } : {}),
        })
      : children;

  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      {/* ── Label ── */}
      <label
        htmlFor={id}
        className={cn(
          "text-sm font-medium leading-none text-foreground peer-disabled:cursor-not-allowed peer-disabled:opacity-70",
          labelClassName,
        )}
      >
        {label}
        {required && (
          <span className="ml-0.5 text-destructive" aria-hidden="true">
            *
          </span>
        )}
      </label>

      {/* ── Field ── */}
      {child}

      {/* ── Hint ── */}
      {hint && (
        <p id={hintId} className="text-xs text-muted-foreground">
          {hint}
        </p>
      )}

      {/* ── Error ── */}
      {error && (
        <p
          id={errorId}
          role="alert"
          className="text-xs font-medium text-destructive flex items-center gap-1"
        >
          {error}
        </p>
      )}
    </div>
  );
}
