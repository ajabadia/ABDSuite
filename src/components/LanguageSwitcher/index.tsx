'use client';

import React, { useState } from 'react';
import { useLanguage } from '@/lib/context/LanguageContext';
import { Language } from '@/lib/i18n/translations';
import styles from './LanguageSwitcher.module.css';

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
    <div className={styles.wrapper}>
      <button 
        className={styles.toggleBtn}
        onClick={() => setIsOpen(!isOpen)}
        aria-label={t('ui.lang_select')}
        aria-expanded={isOpen}
      >
        <span className={styles.flag}>{currentOption.flag}</span>
        <span className={styles.label}>{currentOption.label}</span>
      </button>

      {isOpen && (
        <>
          <div className={styles.overlay} onClick={() => setIsOpen(false)} />
          <div className={styles.menu}>
            {options.map((opt) => (
              <button
                key={opt.code}
                className={`${styles.menuItem} ${language === opt.code ? styles.active : ''}`}
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
