'use client';

/**
 * @purpose Gestiona un componente de paleta de comandos que permite a los usuarios buscar y ejecutar comandos mediante atajos de teclado.
 * @purpose_en Renders a Command Palette component that allows users to search and execute commands through keyboard shortcuts.
 * @refactorable true (contains too many state variables and UI parts)
 * @classification UI Component
 * @complexity Medium
 * @fingerprint exports:3,imports:2,sig:1lcweun
 * @lastUpdated 2026-06-26T09:59:49.650Z
 */

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Search, Terminal, CornerDownLeft } from 'lucide-react';
export interface Command {
  id: string;
  title: string;
  description?: string;
  category: string;
  action: () => void | Promise<void>;
  icon?: React.ReactNode;
  shortcut?: string[];
}

export interface CommandPaletteProps {
  commands: Command[];
  placeholder?: string;
  /** Pass isOpen and onOpenChange to control the palette externally instead of relying on DOM IDs */
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function CommandPalette({
  commands,
  placeholder,
  isOpen: controlledIsOpen,
  onOpenChange
}: CommandPaletteProps) {
  const [internalIsOpen, setInternalIsOpen] = useState(false);
  const isOpen = controlledIsOpen !== undefined ? controlledIsOpen : internalIsOpen;
  
  const setIsOpen = (newVal: boolean | ((prev: boolean) => boolean)) => {
    const nextVal = typeof newVal === 'function' ? newVal(isOpen) : newVal;
    setInternalIsOpen(nextVal);
    onOpenChange?.(nextVal);
  };

  const [search, setSearch] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);

  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const t = (key: string, opts?: { defaultMessage?: string }) => opts?.defaultMessage || key;
  const currentPlaceholder = placeholder || t('command_palette_placeholder', { defaultMessage: 'Escribe un comando o busca...' });

  // Toggle Command Palette on Ctrl+K / Cmd+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Custom global event listener for cross-component triggers
  useEffect(() => {
    const handleOpenEvent = () => setIsOpen(true);
    window.addEventListener('abd-command-palette-open', handleOpenEvent);
    return () => window.removeEventListener('abd-command-palette-open', handleOpenEvent);
  }, []);

  // Focus input when palette opens
  useEffect(() => {
    if (isOpen) {
      setSearch('');
      setActiveIndex(0);
      // Small timeout to ensure input is mounted
      const timer = setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // Filter commands based on search
  const filteredCommands = useMemo(() => {
    if (!search.trim()) return commands;
    const term = search.toLowerCase();
    return commands.filter(
      (cmd) =>
        cmd.title.toLowerCase().includes(term) ||
        cmd.category.toLowerCase().includes(term) ||
        cmd.description?.toLowerCase().includes(term)
    );
  }, [commands, search]);

  // Handle active index boundaries when filtered list changes
  useEffect(() => {
    setActiveIndex(0);
  }, [filteredCommands]);

  // Keyboard navigation inside the palette
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      setIsOpen(false);
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((prev) => (prev + 1) % filteredCommands.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((prev) => (prev - 1 + filteredCommands.length) % filteredCommands.length);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredCommands[activeIndex]) {
        executeCommand(filteredCommands[activeIndex]);
      }
    }
  };

  const executeCommand = async (cmd: Command) => {
    setIsOpen(false);
    try {
      await cmd.action();
    } catch (err) {
      if (process.env.NODE_ENV === 'development') { console.error('Error executing command:', err); }
    }
  };

  // Scroll active item into view
  useEffect(() => {
    if (!listRef.current) return;
    const activeEl = listRef.current.querySelector('[data-active="true"]');
    if (activeEl) {
      activeEl.scrollIntoView({ block: 'nearest' });
    }
  }, [activeIndex]);

  if (!isOpen) return null;

  // Group commands by category for display
  const groupedCommands: { [category: string]: typeof commands } = {};
  filteredCommands.forEach((cmd) => {
    if (!groupedCommands[cmd.category]) {
      groupedCommands[cmd.category] = [];
    }
    groupedCommands[cmd.category].push(cmd);
  });

  // Flat list reference to map group indexes to flat list index
  let flatIndexCounter = 0;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh] px-4"
      onKeyDown={handleKeyDown}
    >
      {/* Backdrop with premium glassmorphism blur */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-md transition-opacity duration-300"
        onClick={() => setIsOpen(false)}
      />

      {/* Palette Container */}
      <div className="relative w-full max-w-xl bg-zinc-950/90 border border-white/10 rounded-xl shadow-2xl shadow-black overflow-hidden flex flex-col transition-all duration-200 transform scale-100 max-h-[50vh]">
        {/* Grain/noise texture sutil layer */}
        <div className="absolute inset-0 pointer-events-none opacity-5 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:16px_16px]" />

        {/* Search Input Bar */}
        <div className="relative flex items-center border-b border-white/5 px-4 py-3.5 z-10">
          <Search className="w-5 h-5 text-white/40 mr-3 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            className="w-full bg-transparent text-white text-base outline-none border-none placeholder-white/30"
            placeholder={currentPlaceholder}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <div className="flex items-center space-x-1 ml-2 shrink-0">
            <kbd className="px-1.5 py-0.5 text-[10px] font-mono rounded bg-white/10 text-white/50 border border-white/5 uppercase">
              esc
            </kbd>
          </div>
        </div>

        {/* Commands List Area */}
        <div
          ref={listRef}
          className="flex-1 overflow-y-auto py-2 px-2 z-10 max-h-[35vh] scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent"
        >
          {filteredCommands.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
              <Terminal className="w-8 h-8 text-white/20 mb-2" />
              <p className="text-white/60 text-sm font-medium">{t('command_palette_no_commands', { defaultMessage: 'No se encontraron comandos' })}</p>
              <p className="text-white/30 text-xs mt-1">{t('command_palette_try_another', { defaultMessage: 'Prueba a escribir otra palabra clave' })}</p>
            </div>
          ) : (
            Object.keys(groupedCommands).map((category) => (
              <div key={category} className="mb-2 last:mb-0">
                {/* Category Header Label */}
                <div className="px-3 py-1.5 text-[10px] font-semibold tracking-wider text-white/30 uppercase select-none">
                  {category}
                </div>

                {/* Commands under this category */}
                <div className="space-y-0.5">
                  {groupedCommands[category].map((cmd) => {
                    const currentFlatIndex = flatIndexCounter++;
                    const isActive = currentFlatIndex === activeIndex;

                    return (
                      <div
                        key={cmd.id}
                        data-active={isActive}
                        className={`group flex items-center justify-between px-3 py-2.5 rounded-lg cursor-pointer transition-colors duration-150 ${
                          isActive
                            ? 'bg-white/10 text-white'
                            : 'text-white/60 hover:bg-white/5 hover:text-white'
                        }`}
                        onClick={() => executeCommand(cmd)}
                        onMouseEnter={() => setActiveIndex(currentFlatIndex)}
                      >
                        <div className="flex items-center min-w-0 mr-3">
                          {/* Icon Container */}
                          <div
                            className={`flex items-center justify-center w-6 h-6 rounded mr-3 shrink-0 transition-colors duration-150 ${
                              isActive ? 'text-white' : 'text-white/40 group-hover:text-white/60'
                            }`}
                          >
                            {cmd.icon || <Terminal className="w-4 h-4" />}
                          </div>

                          {/* Title and Description */}
                          <div className="min-w-0">
                            <span className="block text-sm font-medium truncate">
                              {cmd.title}
                            </span>
                            {cmd.description && (
                              <span
                                className={`block text-xs truncate transition-colors duration-150 ${
                                  isActive
                                    ? 'text-white/60'
                                    : 'text-white/30 group-hover:text-white/40'
                                }`}
                              >
                                {cmd.description}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Badges or Shortcut Indicators */}
                        <div className="flex items-center space-x-1 shrink-0">
                          {cmd.shortcut ? (
                            cmd.shortcut.map((key, idx) => (
                              <kbd
                                key={idx}
                                className={`px-1 py-0.5 text-[9px] font-mono rounded border transition-colors duration-150 uppercase ${
                                  isActive
                                    ? 'bg-white/20 border-white/20 text-white/80'
                                    : 'bg-white/5 border-white/5 text-white/30 group-hover:text-white/40'
                                }`}
                              >
                                {key}
                              </kbd>
                            ))
                          ) : (
                            isActive && (
                              <span className="text-[10px] text-white/40 flex items-center font-mono uppercase">
                                {t('command_palette_execute', { defaultMessage: 'ejecutar' })} <CornerDownLeft className="w-3 h-3 ml-1" />
                              </span>
                            )
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer Bar */}
        <div className="border-t border-white/5 px-4 py-2 bg-zinc-950 flex items-center justify-between text-[10px] text-white/30 select-none z-10 shrink-0">
          <div className="flex items-center space-x-3">
            <span>
              <kbd className="px-1 py-0.5 rounded bg-white/5 border border-white/5">↑↓</kbd> {t('command_palette_navigate', { defaultMessage: 'Navegar' })}
            </span>
            <span>
              <kbd className="px-1 py-0.5 rounded bg-white/5 border border-white/5">enter</kbd> {t('command_palette_select', { defaultMessage: 'Seleccionar' })}
            </span>
          </div>
          <div>
            <span>{t('command_palette_switcher', { defaultMessage: 'Conmutador Rápido' })}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
