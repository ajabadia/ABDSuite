'use client';

/**
 * @purpose Renderiza un menú de selección de idioma con opciones para español e inglés.
 * @purpose_en Renders a language selection mega menu with options for Spanish and English.
 * @refactorable false
 * @classification UI Component
 * @complexity Low
 * @fingerprint exports:1,imports:2,sig:8pdqs6
 * @lastUpdated 2026-06-23T23:02:16.280Z
 */

import { memo } from 'react';
import { cn } from '../utils.js';

interface SmartNavbarLanguageMenuProps {
  locale: string;
  onLocaleChange: (locale: string) => void;
  onClose: () => void;
}

/**
 * Renders the language selection mega menu with ES/EN options.
 */
export const SmartNavbarLanguageMenu = memo(function SmartNavbarLanguageMenu({ locale, onLocaleChange, onClose }: SmartNavbarLanguageMenuProps) {
  return (
    <div>
      <div className="flex gap-3">
        {[
          { value: 'es', label: 'ESPAÑOL' },
          { value: 'en', label: 'ENGLISH' },
        ].map(({ value, label }) => (
          <button
            key={value}
            onClick={() => {
              onLocaleChange(value);
              onClose();
            }}
            className={cn(
              "flex flex-col items-center justify-center gap-2 p-4 border font-mono text-[9px] font-bold tracking-widest uppercase transition-all duration-200 cursor-pointer min-w-[100px] rounded-none",
              locale === value
                ? 'border-primary/60 bg-primary/5 text-primary'
                : 'border-border bg-muted/10 hover:border-primary/40 hover:bg-primary/5 text-muted-foreground'
            )}
          >
            <span>{label}</span>
          </button>
        ))}
      </div>
    </div>
  );
});
