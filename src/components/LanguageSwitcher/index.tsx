'use client';

import React, { useState } from 'react';
import { useLanguage } from '@/lib/context/LanguageContext';
import { Language } from '@/lib/i18n/translations';

const LanguageSwitcher: React.FC = () => {
  const { language, setLanguage, t } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);

  const options: { code: Language; label: string; flag: string }[] = [
    { code: 'es', label: 'ESPAÑOL', flag: '🇪🇸' },
    { code: 'en', label: 'ENGLISH', flag: '🇺🇸' },
    { code: 'fr', label: 'FRANÇAIS', flag: '🇫🇷' },
    { code: 'de', label: 'DEUTSCH', flag: '🇩🇪' },
  ];

  const currentOption = options.find(o => o.code === language) || options[0];

  return (
    <div style={{ position: 'relative' }}>
      <button 
        className="station-btn"
        style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '6px 15px', height: '40px' }}
        onClick={() => setIsOpen(!isOpen)}
        title={t('ui.lang_select')}
      >
        <span>{currentOption.flag}</span>
        <span style={{ fontSize: '0.75rem' }}>{currentOption.label}</span>
      </button>

      {isOpen && (
        <>
          <div 
            style={{ position: 'fixed', inset: 0, zIndex: 1000 }} 
            onClick={() => setIsOpen(false)} 
          />
          <div style={{ 
            position: 'absolute', 
            top: 'calc(100% + 10px)', 
            right: 0, 
            background: 'var(--bg-color)', 
            border: 'var(--border-thick) solid var(--border-color)',
            boxShadow: '8px 8px 0 rgba(0,0,0,0.5)',
            zIndex: 1001,
            width: '180px'
          }}>
            {options.map((opt) => (
              <button
                key={opt.code}
                style={{
                  width: '100%',
                  textAlign: 'left',
                  padding: '12px 15px',
                  background: language === opt.code ? 'var(--border-color)' : 'transparent',
                  color: language === opt.code ? 'var(--bg-color)' : 'var(--text-primary)',
                  border: 'none',
                  borderBottom: '1px solid var(--border-color)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '12px',
                  cursor: 'pointer',
                  fontWeight: 900,
                  fontSize: '0.75rem',
                  textTransform: 'uppercase',
                  fontFamily: 'inherit'
                }}
                onClick={() => {
                  setLanguage(opt.code);
                  setIsOpen(false);
                }}
              >
                <span>{opt.label}</span>
                <span>{opt.flag}</span>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default LanguageSwitcher;
