'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useLanguage } from '@/lib/context/LanguageContext';
import { 
  SystemIcon, 
  LockIcon, 
  ListIcon, 
  FileTextIcon, 
  ShieldIcon 
} from '@/components/common/Icons';

export const Sidebar: React.FC = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const pathname = usePathname();
  const { t } = useLanguage();

  const navItems = [
    { href: '/', icon: <SystemIcon />, label: t('shell.home'), id: 'home' },
    { href: '/crypt', icon: <LockIcon />, label: t('shell.crypt'), id: 'crypt' },
    { href: '/etl', icon: <ListIcon />, label: t('shell.etl'), id: 'etl' },
    { href: '/letter', icon: <FileTextIcon />, label: t('shell.letter'), id: 'letter' },
    { href: '/audit', icon: <ShieldIcon />, label: t('shell.audit'), id: 'audit' },
  ];

  return (
    <aside className={`shell-sidebar ${isCollapsed ? 'collapsed' : ''}`}>
      <div style={{ padding: '24px', borderBottom: 'var(--border-thick) solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: isCollapsed ? 'center' : 'space-between' }}>
        {!isCollapsed && <span style={{ fontWeight: 900, fontSize: '1.4rem', letterSpacing: '2px' }}>ABDFN OS</span>}
        <button 
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="station-btn"
          style={{ padding: '4px 8px', minWidth: '40px', boxShadow: 'none' }}
          title={isCollapsed ? t('shell.menu_open') : t('shell.menu_close')}
        >
          {isCollapsed ? '»' : '«'}
        </button>
      </div>

      <nav style={{ flex: 1 }}>
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link 
              key={item.id}
              href={item.disabled ? '#' : item.href}
              className={`nav-item ${isActive ? 'active' : ''}`}
              style={{ 
                opacity: item.disabled ? 0.3 : 1, 
                pointerEvents: item.disabled ? 'none' : 'auto'
              }}
            >
              <span className="nav-icon" style={{ fontSize: '1.2rem' }}>{item.icon}</span>
              {!isCollapsed && <span className="nav-label">{item.label}</span>}
              {isActive && !isCollapsed && <span className="blink" style={{ marginLeft: 'auto', color: 'inherit' }}>●</span>}
            </Link>
          );
        })}
      </nav>

      {!isCollapsed && (
        <div style={{ padding: '20px', fontSize: '0.7rem', borderTop: 'var(--border-thick) solid var(--border-color)', opacity: 0.5, lineHeight: 1.4 }}>
          ABD-IA INFRASTRUCTURES<br />
          BUILD: 2026.04.15-R5<br />
          NODE: 0x8F2A
        </div>
      )}
    </aside>
  );
};
