'use client';

import React, { useState } from 'react';
import { usePathname } from 'next/navigation';
import { useLanguage } from '@/lib/context/LanguageContext';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import ThemeSwitcher from '@/components/ThemeSwitcher';
import { AboutDialog } from './AboutDialog';

export const TopBar: React.FC = () => {
  const pathname = usePathname();
  const { t } = useLanguage();
  const [isAboutOpen, setIsAboutOpen] = useState(false);

  const getModuleTitle = () => {
    if (pathname === '/') return t('shell.home');
    if (pathname.includes('/crypt')) return t('shell.crypt');
    if (pathname.includes('/etl')) return t('shell.etl');
    if (pathname.includes('/letter')) return t('shell.letter');
    if (pathname.includes('/audit')) return t('shell.audit');
    return 'STATION';
  };

  return (
    <header className="shell-topbar">
      <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
        <h1 style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--text-primary)', textTransform: 'uppercase' }}>
          {getModuleTitle()}
        </h1>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
        <nav style={{ display: 'flex', gap: '20px' }}>
           <a 
             href="/DOC/USER_MANUAL.txt" 
             target="_blank" 
             className="station-btn"
             style={{ fontSize: '0.75rem', padding: '4px 12px', boxShadow: 'none' }}
           >
             Manual
           </a>
           <button 
             onClick={() => setIsAboutOpen(true)}
             className="station-btn"
             style={{ fontSize: '0.75rem', padding: '4px 12px', boxShadow: 'none' }}
           >
             Info
           </button>
        </nav>
        <div style={{ display: 'flex', gap: '12px', paddingLeft: '24px', borderLeft: '1px solid var(--border-color)' }}>
          <LanguageSwitcher />
          <ThemeSwitcher />
        </div>
      </div>

      <AboutDialog isOpen={isAboutOpen} onClose={() => setIsAboutOpen(false)} />
    </header>
  );
};
