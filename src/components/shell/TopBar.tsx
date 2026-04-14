'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import { useLanguage } from '@/lib/context/LanguageContext';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import ThemeSwitcher from '@/components/ThemeSwitcher';

export const TopBar: React.FC = () => {
  const pathname = usePathname();
  const { t } = useLanguage();

  const getModuleTitle = () => {
    if (pathname === '/') return t('shell.home');
    if (pathname.startsWith('/crypt')) return t('shell.crypt');
    if (pathname.startsWith('/etl')) return t('shell.etl');
    return 'UNKNOWN_STATION';
  };

  return (
    <header className="shell-topbar">
      <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
        <span style={{ color: 'var(--border-color)', fontWeight: 800 }}>A:\ABDFN\{getModuleTitle().toUpperCase().replace(' ', '_')}&gt;</span>
        <div className="blink" style={{ width: '10px', height: '20px', background: 'var(--border-color)' }}></div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
        <LanguageSwitcher />
        <ThemeSwitcher />
      </div>

      <style jsx>{`
        .blink {
          animation: blink-animation 1s steps(2, start) infinite;
        }
        @keyframes blink-animation {
          to {
            visibility: hidden;
          }
        }
      `}</style>
    </header>
  );
};
