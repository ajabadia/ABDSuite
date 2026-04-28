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

  // Dynamic Label Localization
  const displayLabel = label || t('shell.country_selector_label');
  const displayPlaceholder = placeholder || t('shell.country_selector_placeholder');

  const selectedCountry = useMemo(
    () => COUNTRIES_MASTER.find((c) => c.id === value),
    [value]
  );

  const filteredCountries = useMemo(() => {
    const term = search.toLowerCase().trim();
    if (!term) return COUNTRIES_MASTER;

    return COUNTRIES_MASTER.filter(
      (c) =>
        c.name.toLowerCase().includes(term) ||
        c.id.toLowerCase().includes(term)
    );
  }, [search]);

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
      {displayLabel && <label className="station-label">{displayLabel.toUpperCase()}</label>}
      
      <div 
        className={`country-selector-trigger ${isOpen ? 'active' : ''}`}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        style={{
            background: 'rgba(255,255,255,0.02)',
            border: '1px solid var(--border-color)',
            borderRadius: '4px',
            minHeight: '42px'
        }}
      >
        <div className="trigger-content">
          {selectedCountry ? (
            <>
              <FlagResolver code={selectedCountry.id} className="flag-icon-small" />
              <span className="selected-name" style={{ fontWeight: 900, fontSize: '0.8rem', letterSpacing: '0.5px' }}>{selectedCountry.name.toUpperCase()}</span>
              <span className="selected-code" style={{ opacity: 0.5 }}>({selectedCountry.id})</span>
              {selectedCountry.hasPlugin && <span className="plugin-badge" title="ALGORITHMIC_READY">🟢</span>}
            </>
          ) : (
            <span className="placeholder" style={{ opacity: 0.4 }}>{displayPlaceholder.toUpperCase()}</span>
          )}
        </div>
        <div className="trigger-arrow" style={{ opacity: 0.5 }}>
          <svg viewBox="0 0 20 20" fill="currentColor" width={14} height={14}>
            <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </div>
      </div>

      {isOpen && (
        <div className="country-selector-dropdown animate-slide-down" style={{ 
            background: 'var(--surface-color)', 
            border: '1px solid var(--primary-color)',
            boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
            top: 'calc(100% + 8px)',
            borderRadius: '4px'
        }}>
          <div className="search-box" style={{ padding: '8px', background: 'rgba(0,0,0,0.2)' }}>
            <input
              autoFocus
              type="text"
              className="station-input"
              style={{ width: '100%', fontSize: '0.75rem', height: '36px' }}
              placeholder={t('shell.country_selector_placeholder').toUpperCase()}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onClick={(e) => e.stopPropagation()}
            />
          </div>
          <ul className="country-list" style={{ maxHeight: '300px' }}>
            {filteredCountries.length > 0 ? (
              filteredCountries.map((c, idx) => (
                <li 
                  key={`${c.id}-${idx}`} 
                  className={`country-option ${c.id === value ? 'selected' : ''}`}
                  onClick={() => handleSelect(c.id)}
                  style={{
                      padding: '8px 12px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      cursor: 'pointer',
                      borderBottom: '1px solid rgba(255,255,255,0.02)'
                  }}
                >
                  <FlagResolver code={c.id} className="flag-icon-list" style={{ width: '18px', height: '18px' }} />
                  <div className="option-info">
                    <span className="option-name" style={{ fontSize: '0.75rem', fontWeight: c.id === value ? 900 : 500 }}>{c.name.toUpperCase()}</span>
                    <span className="option-iso" style={{ fontSize: '0.6rem', opacity: 0.5 }}>{c.id}</span>
                  </div>
                  <div className="option-meta">
                    {c.hasPlugin ? (
                      <span style={{ fontSize: '0.5rem', fontWeight: 900, color: 'var(--status-ok)', opacity: 0.8 }}>ALGO_READY</span>
                    ) : (
                      <span style={{ fontSize: '0.5rem', fontWeight: 900, opacity: 0.3 }}>GENERIC</span>
                    )}
                  </div>
                </li>
              ))
            ) : (
              <li className="no-results" style={{ padding: '24px', opacity: 0.5, fontSize: '0.75rem' }}>{t('shell.no_results').toUpperCase()}</li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
};
