'use client';

/**
 * @purpose Renderiza el menú de selección de temas con opciones ligero, oscuro y sistema.
 * @purpose_en Renders the theme selection mega menu with light, dark, and system options.
 * @refactorable false
 * @classification UI Component
 * @complexity Low
 * @fingerprint exports:1,imports:4,sig:10iozxh
 * @lastUpdated 2026-06-23T23:02:27.502Z
 */

import { memo } from 'react';
import { Sun, Moon, Monitor } from 'lucide-react';
import { cn } from '../utils.js';
import type { SmartNavbarTranslations } from './SmartNavbar.js';

interface SmartNavbarThemeMenuProps {
  currentTheme: 'light' | 'dark' | 'system';
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
  t: Required<SmartNavbarTranslations>;
}

/**
 * Renders the theme selection mega menu with light, dark, and system options.
 */
export const SmartNavbarThemeMenu = memo(function SmartNavbarThemeMenu({ currentTheme, setTheme, t }: SmartNavbarThemeMenuProps) {
  const themes = [
    { value: 'light' as const, icon: Sun, label: t.themeLight },
    { value: 'dark' as const, icon: Moon, label: t.themeDark },
    { value: 'system' as const, icon: Monitor, label: t.themeSystem },
  ];

  return (
    <div>
      <h3 className="font-mono text-[9px] font-bold tracking-widest uppercase text-muted-foreground mb-3">
        {t.themeLabel}
      </h3>
      <div className="flex gap-3">
        {themes.map(({ value, icon: Icon, label }) => {
          const isActive = currentTheme === value;
          return (
            <button
              key={value}
              onClick={() => setTheme(value)}
              className={cn(
                "flex flex-col items-center gap-2 p-4 border transition-all duration-200 cursor-pointer min-w-[100px] rounded-none",
                isActive
                  ? "border-primary/60 bg-primary/5 text-primary"
                  : "border-border bg-muted/10 hover:border-primary/40 hover:bg-primary/5 text-muted-foreground"
              )}
            >
              <Icon size={18} className={isActive ? "text-primary" : "text-muted-foreground"} />
              <span className={cn(
                "font-mono text-[9px] font-bold tracking-widest uppercase",
                isActive ? "text-primary" : "text-muted-foreground"
              )}>
                {label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
});
