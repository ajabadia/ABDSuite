'use client';

/**
 * @purpose Renderiza una ventana de confirmación personalizable con título, mensaje y acciones.
 * @purpose_en Renders a confirm dialog with customizable title, message, and actions.
 * @refactorable true (contains too many state variables and UI parts)
 * @classification UI Component
 * @complexity Medium
 * @fingerprint exports:3,imports:5,sig:l1xxox
 * @lastUpdated 2026-06-21T14:27:33.499Z
 */

import * as React from 'react';
import { useEffect, useRef, useCallback, useState } from 'react';
import { AlertTriangle, Info, X, Loader2 } from 'lucide-react';
import { cn } from '../utils.js';
import { ANIM_DURATION } from '../constants.js';

export type ConfirmVariant = 'danger' | 'warning' | 'info';

export interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: ConfirmVariant;
  isLoading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

const variantStyles: Record<ConfirmVariant, {
  icon: React.ElementType;
  iconBg: string;
  iconColor: string;
  confirmBg: string;
  confirmBorder: string;
  confirmHover: string;
  confirmText: string;
}> = {
  danger: {
    icon: AlertTriangle,
    iconBg: 'bg-red-500/10',
    iconColor: 'text-red-500',
    confirmBg: 'bg-red-500/10',
    confirmBorder: 'border-red-500/40',
    confirmHover: 'hover:bg-red-500/20 hover:border-red-500',
    confirmText: 'text-red-500',
  },
  warning: {
    icon: AlertTriangle,
    iconBg: 'bg-amber-500/10',
    iconColor: 'text-amber-500',
    confirmBg: 'bg-amber-500/10',
    confirmBorder: 'border-amber-500/40',
    confirmHover: 'hover:bg-amber-500/20 hover:border-amber-500',
    confirmText: 'text-amber-500',
  },
  info: {
    icon: Info,
    iconBg: 'bg-primary/10',
    iconColor: 'text-primary',
    confirmBg: 'bg-primary/10',
    confirmBorder: 'border-primary/40',
    confirmHover: 'hover:bg-primary/20 hover:border-primary',
    confirmText: 'text-primary',
  },
};

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  variant = 'danger',
  isLoading = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const cancelRef = useRef<HTMLButtonElement>(null);
  const confirmRef = useRef<HTMLButtonElement>(null);
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Track previous open value to avoid reading `mounted` from effect closure
  const prevOpenRef = useRef(open);

  // -- Mount / unmount lifecycle for exit animation --
  const [mounted, setMounted] = useState(open);

  useEffect(() => {
    if (open) {
      // Cancel any pending close timer
      if (closeTimerRef.current) {
        clearTimeout(closeTimerRef.current);
        closeTimerRef.current = null;
      }
      setMounted(true);
    } else if (prevOpenRef.current) {
      // open just flipped to false — keep mounted for exit animation
      closeTimerRef.current = setTimeout(() => {
        setMounted(false);
      }, ANIM_DURATION);
    }

    prevOpenRef.current = open;

    return () => {
      if (closeTimerRef.current) {
        clearTimeout(closeTimerRef.current);
        closeTimerRef.current = null;
      }
    };
  }, [open]);

  // Close on Escape
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Escape' && !isLoading) {
        onCancel();
      }
    },
    [onCancel, isLoading]
  );

  if (!mounted) return null;

  const styles = variantStyles[variant];
  const IconComponent = styles.icon;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center"
      role="alertdialog"
      aria-modal="true"
      aria-label={title}
      onKeyDown={handleKeyDown}
    >
      {/* Backdrop */}
      <div
        className={cn(
          'absolute inset-0 bg-black/70 backdrop-blur-sm',
          open
            ? 'animate-in fade-in duration-200'
            : 'animate-out fade-out duration-150'
        )}
        onClick={isLoading ? undefined : onCancel}
        aria-hidden="true"
      />

      {/* Dialog */}
      <div
        className={cn(
          'relative w-full max-w-sm bg-card border border-border shadow-2xl p-6',
          open
            ? 'animate-in fade-in zoom-in-95 duration-200'
            : 'animate-out fade-out zoom-out-95 duration-150'
        )}
      >
      {/* Close button */}
      <button
        type="button"
        onClick={onCancel}
        disabled={isLoading}
        aria-label={cancelLabel}
        className="absolute top-3 right-3 p-1 text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <X size={14} />
      </button>

        {/* Icon */}
        <div className="flex flex-col items-center text-center gap-4 mb-6">
          <div className={cn('p-3 border border-border', styles.iconBg)}>
            <IconComponent size={22} className={styles.iconColor} />
          </div>

          {/* Title */}
          <h2 className="text-sm font-black uppercase tracking-wider text-foreground">
            {title}
          </h2>

          {/* Message */}
          <p className="text-[11px] text-muted-foreground leading-relaxed max-w-xs">
            {message}
          </p>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3">
          <button
            ref={cancelRef}
            type="button"
            onClick={onCancel}
            disabled={isLoading}
            className={cn(
              'px-4 py-2.5 bg-transparent text-muted-foreground border border-border',
              'hover:border-muted-foreground/40 hover:bg-white/[0.02]',
              'font-mono text-[10px] font-bold uppercase tracking-wider',
              'transition-all duration-200 rounded-none active:scale-[0.98]',
              'disabled:opacity-50 disabled:cursor-not-allowed'
            )}
          >
            {cancelLabel}
          </button>
          <button
            ref={confirmRef}
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className={cn(
              'px-4 py-2.5 font-mono text-[10px] font-black uppercase tracking-wider',
              'border transition-all duration-200 rounded-none active:scale-[0.98]',
              'disabled:opacity-50 disabled:cursor-not-allowed',
              styles.confirmBg,
              styles.confirmBorder,
              styles.confirmHover,
              styles.confirmText
            )}
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <Loader2 size={12} className="animate-spin" />
                {confirmLabel}
              </span>
            ) : (
              confirmLabel
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
