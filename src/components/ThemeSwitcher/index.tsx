'use client';

import React, { useState } from 'react';
import { useTheme, ThemeMode } from '@/lib/hooks/useTheme';
import { SunIcon, MoonIcon, SystemIcon, ClockIcon } from '@/components/common/Icons';
import { useLanguage } from '@/lib/context/LanguageContext';
import styles from './ThemeSwitcher.module.css';

const options: { mode: ThemeMode; labelKey: string; icon: React.ReactNode }[] = [
  { mode: 'light', labelKey: 'ui.theme_light', icon: <SunIcon size={20} aria-hidden="true" /> },
  { mode: 'dark', labelKey: 'ui.theme_dark', icon: <MoonIcon size={20} aria-hidden="true" /> },
  { mode: 'system', labelKey: 'ui.theme_system', icon: <SystemIcon size={20} aria-hidden="true" /> },
  { mode: 'auto', labelKey: 'ui.theme_auto', icon: <ClockIcon size={20} aria-hidden="true" /> },
];

const ThemeSwitcher: React.FC = () => {
  const { mode, setMode } = useTheme();
  const { t } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);

  const currentOption = options.find(o => o.mode === mode) || options[1];

  return (
    <div className={styles.wrapper}>
      <button 
        className={`glass ${styles.toggleBtn}`}
        onClick={() => setIsOpen(!isOpen)}
        title={t('ui.theme_select')}
        aria-label={t('ui.theme_select')}
        aria-expanded={isOpen}
      >
        <span className={styles.icon}>{currentOption.icon}</span>
        <span className={styles.label}>{t(currentOption.labelKey)}</span>
      </button>

      {isOpen && (
        <>
          <div className={styles.overlay} onClick={() => setIsOpen(false)} />
          <div className={`${styles.menu} animate-fade-in`}>
            {options.map((opt) => (
              <button
                key={opt.mode}
                className={`${styles.menuItem} ${mode === opt.mode ? styles.active : ''}`}
                onClick={() => {
                  setMode(opt.mode);
                  setIsOpen(false);
                }}
              >
                <span className={styles.optIcon}>{opt.icon}</span>
                <span>{t(opt.labelKey)}</span>
                {opt.mode === 'auto' && <small className={styles.hint}>(8:00 - 20:00)</small>}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default ThemeSwitcher;
