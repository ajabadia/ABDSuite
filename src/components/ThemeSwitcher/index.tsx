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
          <div style={{ 
            position: 'absolute', 
            top: 'calc(100% + 10px)', 
            right: 0, 
            background: 'var(--bg-color)', 
            border: 'var(--border-thick) solid var(--border-color)',
            boxShadow: '8px 8px 0 rgba(0,0,0,0.5)',
            zIndex: 1001,
            width: '220px'
          }}>
            {options.map((opt) => (
              <button
                key={opt.mode}
                style={{
                  width: '100%',
                  textAlign: 'left',
                  padding: '12px 15px',
                  background: mode === opt.mode ? 'var(--border-color)' : 'transparent',
                  color: mode === opt.mode ? 'var(--bg-color)' : 'var(--text-primary)',
                  border: 'none',
                  borderBottom: '1px solid var(--border-color)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  cursor: 'pointer',
                  fontWeight: 900,
                  fontSize: '0.75rem',
                  textTransform: 'uppercase',
                  fontFamily: 'inherit'
                }}
                onClick={() => {
                  setMode(opt.mode);
                  setIsOpen(false);
                }}
              >
                <span>{opt.icon}</span>
                <span>{t(opt.labelKey)}</span>
                {opt.mode === 'auto' && <small style={{ opacity: 0.5, marginLeft: 'auto', fontSize: '0.6rem' }}>(8-20h)</small>}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default ThemeSwitcher;
