'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useLanguage } from '@/lib/context/LanguageContext';
import { 
  SystemIcon, 
  LockIcon, 
  ListIcon, 
  FileTextIcon, 
  ShieldCheckIcon,
  CogIcon,
  PlayIcon,
  UnlockIcon,
  MapIcon,
  HelpIcon
} from '@/components/common/Icons';
import { HelpModal } from './HelpModal';

export const Sidebar: React.FC = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const pathname = usePathname();
  const { t } = useLanguage();
  
  const [etlExpanded, setEtlExpanded] = useState(pathname.startsWith('/etl'));
  const [cryptExpanded, setCryptExpanded] = useState(pathname.startsWith('/crypt'));
  const [letterExpanded, setLetterExpanded] = useState(pathname.startsWith('/letter'));
  
  // Auto-collapse logic
  useEffect(() => {
    // ETL
    if (!pathname.startsWith('/etl')) {
      setEtlExpanded(false);
    } else if (!etlExpanded && pathname.startsWith('/etl')) {
      setEtlExpanded(true);
    }
    
    // Crypt
    if (!pathname.startsWith('/crypt')) {
      setCryptExpanded(false);
    } else if (!cryptExpanded && pathname.startsWith('/crypt')) {
      setCryptExpanded(true);
    }

    // Letter
    if (!pathname.startsWith('/letter')) {
      setLetterExpanded(false);
    } else if (!letterExpanded && pathname.startsWith('/letter')) {
      setLetterExpanded(true);
    }
  }, [pathname]);

  const navItems = [
    { href: '/', icon: <SystemIcon size={20} />, label: t('shell.home'), id: 'home' },
    { 
      id: 'crypt', 
      icon: <LockIcon size={20} />, 
      label: t('shell.crypt'),
      isAccordion: true,
      expanded: cryptExpanded,
      setExpanded: setCryptExpanded,
      activePath: '/crypt',
      subItems: [
        { href: '/crypt?view=encrypt', icon: <ShieldCheckIcon size={14} />, label: t('crypt.shield_vault'), id: 'crypt-encrypt' },
        { href: '/crypt?view=decrypt', icon: <UnlockIcon size={14} />, label: t('crypt.open_key'), id: 'crypt-decrypt' },
      ]
    },
    { 
      id: 'etl', 
      icon: <ListIcon size={20} />, 
      label: t('shell.etl'),
      isAccordion: true,
      expanded: etlExpanded,
      setExpanded: setEtlExpanded,
      activePath: '/etl',
      subItems: [
        { href: '/etl?view=designer', icon: <CogIcon size={14} />, label: t('etl.app_designer'), id: 'etl-designer' },
        { href: '/etl?view=executor', icon: <PlayIcon size={14} />, label: t('etl.app_executor'), id: 'etl-executor' },
      ]
    },
    { 
      id: 'letter', 
      icon: <FileTextIcon size={20} />, 
      label: t('shell.letter'),
      isAccordion: true,
      expanded: letterExpanded,
      setExpanded: setLetterExpanded,
      activePath: '/letter',
      subItems: [
        { href: '/letter?view=templates', icon: <FileTextIcon size={14} />, label: t('shell.letter_templates'), id: 'letter-templates' },
        { href: '/letter?view=config', icon: <CogIcon size={14} />, label: t('shell.letter_config') || 'CONFIGURACIÓN', id: 'letter-config' },
        { href: '/letter?view=mapping', icon: <MapIcon size={14} />, label: t('shell.letter_mapping'), id: 'letter-mapping' },
        { href: '/letter?view=generation', icon: <PlayIcon size={14} />, label: t('shell.letter_generation'), id: 'letter-generation' },
        { href: '/letter?view=audit', icon: <ShieldCheckIcon size={14} />, label: t('shell.letter_audit'), id: 'letter-audit' },
      ]
    },
  ];

  return (
    <aside className={`shell-sidebar ${isCollapsed ? 'collapsed' : ''}`}>
      <div style={{ padding: '24px', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: isCollapsed ? 'center' : 'space-between' }}>
        {!isCollapsed && <span style={{ fontWeight: 800, fontSize: '1.2rem', color: 'var(--primary-color)' }}>ABDSuite</span>}
        <button 
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="station-btn"
          style={{ padding: '6px', minWidth: '32px', boxShadow: 'none' }}
        >
          {isCollapsed ? '»' : '«'}
        </button>
      </div>

      <nav style={{ flex: 1, paddingTop: '12px', overflowY: 'auto' }}>
        {navItems.map((item) => {
          if (item.isAccordion) {
            const isAnySubActive = pathname.startsWith(item.activePath || '');
            const isExpanded = item.expanded;
            return (
              <div key={item.id} className="flex-col">
                <button 
                  className={`station-nav-item ${isAnySubActive ? 'active' : ''}`}
                  onClick={() => !isCollapsed && item.setExpanded?.(!isExpanded)}
                >
                  <span className="station-nav-icon">{item.icon}</span>
                  {!isCollapsed && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', flex: 1, alignItems: 'center' }}>
                      <span className="station-nav-label">{item.label}</span>
                      <span style={{ fontSize: '0.6rem', opacity: 0.5 }}>{isExpanded ? '▼' : '▶'}</span>
                    </div>
                  )}
                </button>
                
                <div className={`station-nav-anim-container ${isExpanded && !isCollapsed ? 'expanded' : ''}`}>
                  <div className="station-nav-anim-content">
                    <div className="station-nav-sub-container">
                      {item.subItems?.map(sub => {
                         const isSubActive = pathname === sub.href;
                         return (
                          <Link 
                            key={sub.id}
                            href={sub.href}
                            className={`station-nav-item station-nav-sub-item ${isSubActive ? 'active' : ''}`}
                          >
                            <span className="station-nav-icon">{sub.icon}</span>
                            <span className="station-nav-label">{sub.label}</span>
                          </Link>
                         );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            );
          }

          const isActive = pathname === item.href;
          return (
            <Link 
              key={item.id}
              href={item.href || '#'}
              className={`station-nav-item ${isActive ? 'active' : ''}`}
            >
              <span className="station-nav-icon">{item.icon}</span>
              {!isCollapsed && <span className="station-nav-label">{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      <div style={{ padding: '8px 12px', borderTop: '1px solid var(--border-color)' }}>
        <button 
          className="station-nav-item" 
          onClick={() => setIsHelpOpen(true)}
          style={{ width: '100%', border: 'none', background: 'transparent' }}
        >
          <span className="station-nav-icon"><HelpIcon size={20} /></span>
          {!isCollapsed && <span className="station-nav-label">{t('shell.help')}</span>}
        </button>
      </div>

      {!isCollapsed && (
        <div style={{ padding: '24px', fontSize: '0.65rem', color: 'var(--text-secondary)' }}>
          <div style={{ fontWeight: 700, marginBottom: '4px' }}>VERSION 5.0.0-IND</div>
          <div>© ABD INDUSTRIAL INFRASTRUCTURES</div>
        </div>
      )}

      <HelpModal isOpen={isHelpOpen} onClose={() => setIsHelpOpen(false)} />
    </aside>
  );
};
