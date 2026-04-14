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
    { href: '#', icon: <FileTextIcon />, label: t('shell.letter'), id: 'letter', disabled: true },
    { href: '#', icon: <ShieldIcon />, label: t('shell.audit'), id: 'audit', disabled: true },
  ];

  return (
    <aside className={`shell-sidebar ${isCollapsed ? 'collapsed' : ''}`}>
      <div style={{ padding: '20px', borderBottom: '4px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: isCollapsed ? 'center' : 'space-between' }}>
        {!isCollapsed && <span style={{ fontWeight: 900, fontSize: '1.2rem' }}>ABDFN</span>}
        <button 
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="menu-toggle"
          title={isCollapsed ? t('shell.menu_open') : t('shell.menu_close')}
          style={{ cursor: 'pointer', fontSize: '1.5rem', border: '2px solid var(--border-color)', width: '40px', height: '40px' }}
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
                opacity: item.disabled ? 0.5 : 1, 
                cursor: item.disabled ? 'not-allowed' : 'pointer',
                pointerEvents: item.disabled ? 'none' : 'auto'
              }}
            >
              <span className="nav-icon">{item.icon}</span>
              {!isCollapsed && <span className="nav-label">{item.label}</span>}
              {item.disabled && !isCollapsed && <span style={{ fontSize: '0.6rem', marginLeft: 'auto', border: '1px solid var(--border-color)', padding: '2px 4px' }}>LOCKED</span>}
            </Link>
          );
        })}
      </nav>

      {!isCollapsed && (
        <div style={{ padding: '20px', fontSize: '0.7rem', borderTop: '4px solid var(--border-color)', opacity: 0.7 }}>
          © 2026 ABD-IA SYSTEMS<br />
          v5.0.0-STABLE
        </div>
      )}
    </aside>
  );
};
