'use client'

/**
 * @purpose Gestiona un campo de entrada industrial de búsqueda con una icono de búsqueda Lucide React y un placeholder personalizable y etiqueta aria.
 * @purpose_en Manages an industrial search input field with a Lucide React Search icon and customizable placeholder and aria label.
 * @refactorable false
 * @classification UI Component
 * @complexity Medium
 * @fingerprint exports:2,imports:1,sig:1abrz7n
 * @lastUpdated 2026-06-21T14:27:44.927Z
 */

import { Search } from "lucide-react"

export interface IndustrialSearchInputProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  ariaLabel?: string
}

export function IndustrialSearchInput({ value, onChange, placeholder, ariaLabel }: IndustrialSearchInputProps) {
  return (
    <div className="flex items-center gap-4 bg-card p-2 rounded-md border border-border shadow-sm">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={14} aria-hidden="true" />
        <input
          type="text"
          aria-label={ariaLabel}
          placeholder={placeholder}
          value={value}
          onChange={e => onChange(e.target.value)}
          className="w-full bg-transparent border-none focus:ring-0 text-xs pl-10 h-8 text-foreground placeholder:text-muted-foreground/50 outline-none"
        />
      </div>
    </div>
  )
}
