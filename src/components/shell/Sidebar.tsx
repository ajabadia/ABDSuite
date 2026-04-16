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
  UnlockIcon
} from '@/components/common/Icons';

export const Sidebar: React.FC = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const pathname = usePathname();
  const { t } = useLanguage();
  
  // Accordion state
  const [etlExpanded, setEtlExpanded] = useState(pathname.startsWith('/etl'));
  const [cryptExpanded, setCryptExpanded] = useState(pathname.startsWith('/crypt'));

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
    { href: '/letter', icon: <FileTextIcon size={20} />, label: t('shell.letter'), id: 'letter' },
    { href: '/audit', icon: <ShieldCheckIcon size={20} />, label: t('shell.audit'), id: 'audit' },
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
                  className={`nav-item ${isAnySubActive ? 'active' : ''}`}
                  onClick={() => !isCollapsed && item.setExpanded?.(!isExpanded)}
                  style={{ 
                    width: '100%', 
                    textAlign: 'left', 
                    border: 'none', 
                    background: 'transparent', 
                    cursor: isCollapsed ? 'default' : 'pointer',
                    fontSize: 'inherit',
                    fontWeight: 'inherit',
                    fontFamily: 'inherit'
                  }}
                >
                  <span className="nav-icon">{item.icon}</span>
                  {!isCollapsed && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', flex: 1, alignItems: 'center' }}>
                      <span className="nav-label">{item.label}</span>
                      <span style={{ fontSize: '0.6rem', opacity: 0.5 }}>{isExpanded ? '▼' : '▶'}</span>
                    </div>
                  )}
                </button>
                
                {isExpanded && !isCollapsed && (
                  <div className="flex-col" style={{ paddingLeft: '16px', background: 'rgba(255,255,255,0.02)' }}>
                    {item.subItems?.map(sub => {
                       return (
                        <Link 
                          key={sub.id}
                          href={sub.href}
                          className="nav-item sub-item"
                          style={{ padding: '8px 16px' }}
                        >
                          <span className="nav-icon" style={{ opacity: 0.6 }}>{sub.icon}</span>
                          <span className="nav-label" style={{ fontWeight: 500 }}>{sub.label}</span>
                        </Link>
                       );
                    })}
                  </div>
                )}
              </div>
            );
          }

          const isActive = pathname === item.href;
          return (
            <Link 
              key={item.id}
              href={item.href || '#'}
              className={`nav-item ${isActive ? 'active' : ''}`}
            >
              <span className="nav-icon">{item.icon}</span>
              {!isCollapsed && <span className="nav-label">{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      {!isCollapsed && (
        <div style={{ padding: '24px', fontSize: '0.65rem', color: 'var(--text-secondary)', borderTop: '1px solid var(--border-color)' }}>
          <div style={{ fontWeight: 700, marginBottom: '4px' }}>VERSION 2026.04-ASEPTIC</div>
          <div>© ABD INDUSTRIAL INFRASTRUCTURES</div>
        </div>
      )}
    </aside>
  );
};
