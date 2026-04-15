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
    return 'UNKNOWN_STATION';
  };

  return (
    <header className="shell-topbar">
      <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
        <span style={{ color: 'var(--border-color)', fontWeight: 800, fontSize: '0.9rem' }}>
          NODE-ID: 0x8F2A / ABDFN / {getModuleTitle().toUpperCase().replace(/ /g, '_')}&gt;
        </span>
        <div className="blink" style={{ width: '8px', height: '18px', background: 'var(--border-color)' }}></div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
        <nav style={{ display: 'flex', gap: '15px' }}>
           <a 
             href="/DOC/USER_MANUAL.txt" 
             target="_blank" 
             style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', textDecoration: 'none', borderBottom: '1px solid currentColor' }}
           >
             [MANUAL]
           </a>
           <button 
             onClick={() => setIsAboutOpen(true)}
             style={{ fontSize: '0.7rem', background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', borderBottom: '1px solid currentColor' }}
           >
             [INFO]
           </button>
        </nav>
        <div style={{ display: 'flex', gap: '10px', paddingLeft: '20px', borderLeft: '1px solid var(--border-color)' }}>
          <LanguageSwitcher />
          <ThemeSwitcher />
        </div>
      </div>

      <AboutDialog isOpen={isAboutOpen} onClose={() => setIsAboutOpen(false)} />
    </header>
  );
};
