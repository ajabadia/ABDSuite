'use client';

import React, { useState } from 'react';
import { usePathname } from 'next/navigation';
import { useLanguage } from '@/lib/context/LanguageContext';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import ThemeSwitcher from '@/components/ThemeSwitcher';
import { useLog } from '@/lib/context/LogContext';
import { useWorkspace } from '@/lib/context/WorkspaceContext';
import { useUI } from '@/lib/context/UIContext';
import { TerminalIcon, LogOutIcon, UserIcon, BuildingIcon, ShieldCheckIcon, ListIcon } from '@/components/common/Icons';
import { AboutDialog } from './AboutDialog';
import { SecurityDialog } from './SecurityDialog';

export const TopBar: React.FC = () => {
  const pathname = usePathname();
  const { t } = useLanguage();
  const { isOpen, setIsOpen } = useLog();
  const { currentOperator, currentUnit, logout } = useWorkspace();
  const { toggleMobileMenu } = useUI();
  const [isAboutOpen, setIsAboutOpen] = useState(false);
  const [isSecurityOpen, setIsSecurityOpen] = useState(false);

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
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <button 
          className="station-btn mobile-menu-btn" 
          onClick={toggleMobileMenu}
          aria-label="Toggle Menu"
        >
          <ListIcon size={20} />
        </button>
        
        <h1 style={{ fontWeight: 800, fontSize: '0.9rem', color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '2px' }}>
          {getModuleTitle()}
        </h1>

        {currentOperator && currentUnit && (
          <div className="flex-row" style={{ gap: '16px', paddingLeft: '24px', borderLeft: '1px solid var(--border-color)', opacity: 0.8 }}>
             <div className="flex-row" style={{ gap: '8px', fontSize: '0.75rem', cursor: 'pointer' }} onClick={() => setIsSecurityOpen(true)}>
                <UserIcon size={14} />
                <span style={{ fontWeight: 600 }}>{(currentOperator.displayName || currentOperator.username || 'OPERATOR').toUpperCase()}</span>
                {currentOperator.mfaEnabled && <ShieldCheckIcon size={12} color="var(--accent-primary)" style={{ marginLeft: '4px' }} />}
             </div>
             <div className="flex-row" style={{ gap: '8px', fontSize: '0.75rem' }}>
                <BuildingIcon size={14} />
                <span style={{ opacity: 0.6 }}>{currentUnit.code}</span>
             </div>
          </div>
        )}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
        <nav style={{ display: 'flex', gap: '12px' }}>
           <button 
             onClick={() => setIsAboutOpen(true)}
             className="station-btn"
             style={{ fontSize: '0.7rem', padding: '4px 10px', boxShadow: 'none', background: 'transparent', border: 'none' }}
           >
             Info
           </button>
           
           {currentOperator && (
             <button 
              onClick={logout}
              className="station-btn"
              style={{ fontSize: '0.7rem', padding: '4px 10px', boxShadow: 'none', background: 'transparent', border: 'none', color: 'var(--error)' }}
              title="Cerrar Sesión / Cambiar Operador"
             >
               <LogOutIcon size={14} />
             </button>
           )}
        </nav>
        
        <div style={{ display: 'flex', gap: '12px', paddingLeft: '24px', borderLeft: '1px solid var(--border-color)', alignItems: 'center' }}>
          <button 
            onClick={() => setIsOpen(!isOpen)}
            className={`station-btn ${isOpen ? 'station-btn-primary' : ''}`}
            style={{ padding: '6px', minWidth: 'auto', boxShadow: 'none' }}
            title="Consola de Sistema"
          >
            <TerminalIcon size={18} />
          </button>
          <LanguageSwitcher />
          <ThemeSwitcher />
        </div>
      </div>

      <AboutDialog isOpen={isAboutOpen} onClose={() => setIsAboutOpen(false)} />
      <SecurityDialog isOpen={isSecurityOpen} onClose={() => setIsSecurityOpen(false)} />
    </header>
  );
};
