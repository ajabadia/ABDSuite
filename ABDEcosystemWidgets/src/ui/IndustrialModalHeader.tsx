'use client'

/**
 * @purpose Renderiza un encabezado para modales industriales con título, subtítulo, icono y botón de cierre.
 * @purpose_en Renders a header for industrial modals with a title, subtitle, icon, and close button.
 * @refactorable false
 * @classification UI Component
 * @complexity Low
 * @fingerprint exports:2,imports:2,sig:1itwjco
 * @lastUpdated 2026-06-21T14:27:41.042Z
 */

import { X } from "lucide-react"
import type { ComponentType } from "react"

export interface IndustrialModalHeaderProps {
  title: string
  subtitle?: string
  icon: ComponentType<{ size?: number }>
  onClose: () => void
}

export function IndustrialModalHeader({ title, subtitle, icon: Icon, onClose }: IndustrialModalHeaderProps) {
  return (
    <header className="p-6 border-b border-border flex justify-between items-center bg-card">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-primary/10 rounded-md flex items-center justify-center text-primary border border-primary/20">
          <Icon size={20} aria-hidden="true" />
        </div>
        <div>
          <h3 className="text-sm font-black uppercase tracking-widest leading-none text-foreground italic">{title}</h3>
          {subtitle && (
            <p className="text-[10px] text-muted-foreground font-mono uppercase tracking-wider mt-1.5">{subtitle}</p>
          )}
        </div>
      </div>
      <button
        onClick={onClose}
        className="p-2 hover:bg-muted rounded-full transition-colors text-muted-foreground hover:text-foreground outline-none"
        aria-label="Close"
      >
        <X size={18} />
      </button>
    </header>
  )
}
