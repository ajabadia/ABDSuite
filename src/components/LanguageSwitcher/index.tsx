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
          <div className="station-dropdown" style={{ width: '180px' }}>
            {options.map((opt) => (
              <button
                key={opt.code}
                className={`station-dropdown-item ${language === opt.code ? 'active' : ''}`}
                style={{ justifyContent: 'space-between' }}
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
