'use client';

/**
 * @purpose Renderiza una menú mega de búsqueda/comando con un botón de activación.
 * @purpose_en Renders a search/command mega menu with a trigger button.
 * @refactorable false
 * @classification UI Component
 * @complexity Low
 * @fingerprint exports:1,imports:2,sig:1fz392e
 * @lastUpdated 2026-06-23T23:02:23.375Z
 */

import { memo } from 'react';
import { useTranslations } from 'next-intl';
import { Search } from 'lucide-react';

interface SmartNavbarSearchMenuProps {
  locale: string;
  onSearchTrigger: (() => void) | undefined;
  onClose: () => void;
}

/**
 * Renders the search/command mega menu with a trigger button.
 */
export const SmartNavbarSearchMenu = memo(function SmartNavbarSearchMenu({ locale, onSearchTrigger, onClose }: SmartNavbarSearchMenuProps) {
  const t = useTranslations('widgets');
  return (
    <div className="w-full flex justify-center py-2">
      <button
        data-testid="navbar-mega-search-trigger"
        onClick={() => {
          onSearchTrigger?.();
          onClose();
        }}
        className="flex items-center justify-between gap-4 w-full max-w-lg bg-card/60 border border-border px-4 py-3 text-[11px] text-muted-foreground/75 font-mono hover:bg-card hover:border-primary/50 transition-all duration-200 cursor-pointer rounded-none shadow-none"
      >
        <span className="flex items-center gap-2">
          <Search size={14} className="text-primary" />
          {t('typeCommandOrSearch')}
        </span>
        <kbd className="px-1.5 py-0.5 text-[9px] font-mono border border-border/50 text-muted-foreground/50 bg-background/50">
          Ctrl+K
        </kbd>
      </button>
    </div>
  );
});
