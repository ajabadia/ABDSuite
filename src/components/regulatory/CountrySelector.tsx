import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useLanguage } from '../../lib/context/LanguageContext';
import { COUNTRIES_MASTER, CountryMetadata } from '../../data/countries_master';
import { FlagResolver } from '../ui/FlagResolver';
import './CountrySelector.css';

interface CountrySelectorProps {
  value: string; // ISO Code
  onChange: (code: string) => void;
  label?: string;
  placeholder?: string;
  disabled?: boolean;
}

/**
 * CountrySelector - Era 6 Industrial
 * Un selector de países con búsqueda integrada, banderas de alta fidelidad
 * e indicadores de disponibilidad de motor algorítmico (RegTech Plugins).
 */
export const CountrySelector: React.FC<CountrySelectorProps> = ({
  value,
  onChange,
  label,
  placeholder,
  disabled = false,
}) => {
  const { t } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  // Localización dinámica de etiquetas (Skill 06)
  const displayLabel = label || t('shell.country_selector_label');
  const displayPlaceholder = placeholder || t('shell.country_selector_placeholder');

  // Encontrar el país seleccionado actualmente
  const selectedCountry = useMemo(
    () => COUNTRIES_MASTER.find((c) => c.id === value),
    [value]
  );

  // Filtrar países según la búsqueda
  const filteredCountries = useMemo(() => {
    const term = search.toLowerCase().trim();
    if (!term) return COUNTRIES_MASTER;

    return COUNTRIES_MASTER.filter(
      (c) =>
        c.name.toLowerCase().includes(term) ||
        c.id.toLowerCase().includes(term)
    );
  }, [search]);

  // Manejar clics fuera del componente para cerrar el dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (code: string) => {
    onChange(code);
    setIsOpen(false);
    setSearch('');
  };

  return (
    <div className={`country-selector-container ${disabled ? 'disabled' : ''}`} ref={containerRef}>
      {displayLabel && <label className="country-selector-label">{displayLabel}</label>}
      
      <div 
        className={`country-selector-trigger ${isOpen ? 'active' : ''}`}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <div className="trigger-content">
          {selectedCountry ? (
            <>
              <FlagResolver code={selectedCountry.id} className="flag-icon-small" />
              <span className="selected-name">{selectedCountry.name}</span>
              <span className="selected-code">({selectedCountry.id})</span>
              {selectedCountry.hasPlugin && <span className="plugin-badge" title="Plugin Algorítmico Activo">🟢</span>}
            </>
          ) : (
            <span className="placeholder">{displayPlaceholder}</span>
          )}
        </div>
        <div className="trigger-arrow">
          <svg viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
            <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </div>
      </div>

      {isOpen && (
        <div className="country-selector-dropdown">
          <div className="search-box">
            <input
              autoFocus
              type="text"
              className="search-input"
              placeholder={t('shell.country_selector_placeholder')}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onClick={(e) => e.stopPropagation()}
            />
          </div>
          <ul className="country-list" role="listbox">
            {filteredCountries.length > 0 ? (
              filteredCountries.map((c, idx) => (
                <li 
                  key={`${c.id}-${idx}`} 
                  className={`country-option ${c.id === value ? 'selected' : ''}`}
                  onClick={() => handleSelect(c.id)}
                  role="option"
                  aria-selected={c.id === value}
                >
                  <div className="option-flag">
                    <FlagResolver code={c.id} className="flag-icon-list" />
                  </div>
                  <div className="option-info">
                    <span className="option-name">{c.name}</span>
                    <span className="option-iso">{c.id}</span>
                  </div>
                  <div className="option-meta">
                    {c.hasPlugin ? (
                      <span className="plugin-indicator active" title="Algoritmo Validado">🟢 Ready</span>
                    ) : (
                      <span className="plugin-indicator generic" title="Validación Genérica">⚪ Generic</span>
                    )}
                  </div>
                </li>
              ))
            ) : (
              <li className="no-results">{t('shell.no_results')}</li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
};
