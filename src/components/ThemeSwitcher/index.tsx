'use client';

import React, { useState } from 'react';
import { useTheme, ThemeMode } from '@/lib/hooks/useTheme';
import { SunIcon, MoonIcon, SystemIcon, ClockIcon } from '@/components/common/Icons';
import { useLanguage } from '@/lib/context/LanguageContext';

const options: { mode: ThemeMode; labelKey: string; icon: React.ReactNode }[] = [
  { mode: 'light', labelKey: 'ui.theme_light', icon: <SunIcon size={18} /> },
  { mode: 'dark', labelKey: 'ui.theme_dark', icon: <MoonIcon size={18} /> },
  { mode: 'system', labelKey: 'ui.theme_system', icon: <SystemIcon size={18} /> },
  { mode: 'auto', labelKey: 'ui.theme_auto', icon: <ClockIcon size={18} /> },
];

const ThemeSwitcher: React.FC = () => {
  const { mode, setMode } = useTheme();
  const { t } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);

  const currentOption = options.find(o => o.mode === mode) || options[1];

  return (
    <div style={{ position: 'relative' }}>
      <button 
        className="station-btn"
        style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '6px 15px', height: '40px' }}
        onClick={() => setIsOpen(!isOpen)}
        title={t('ui.theme_select')}
      >
        <span>{currentOption.icon}</span>
        <span style={{ fontSize: '0.75rem' }}>{t(currentOption.labelKey)}</span>
      </button>

      {isOpen && (
        <>
          <div 
            style={{ position: 'fixed', inset: 0, zIndex: 1000 }} 
            onClick={() => setIsOpen(false)} 
          />
          <div className="station-dropdown" style={{ width: '220px' }}>
            {options.map((opt) => (
              <button
                key={opt.mode}
                className={`station-dropdown-item ${mode === opt.mode ? 'active' : ''}`}
                onClick={() => {
                  setMode(opt.mode);
                  setIsOpen(false);
                }}
              >
                <span>{opt.icon}</span>
                <span>{t(opt.labelKey)}</span>
                {opt.mode === 'auto' && <span className="station-hint" style={{ marginLeft: 'auto', fontSize: '0.6rem', opacity: 0.5 }}>(8-20H)</span>}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default ThemeSwitcher;
