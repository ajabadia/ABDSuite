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
    { href: '/', icon: <SystemIcon size={20} />, label: t('shell.home'), id: 'home' },
    { href: '/crypt', icon: <LockIcon size={20} />, label: t('shell.crypt'), id: 'crypt' },
    { href: '/etl', icon: <ListIcon size={20} />, label: t('shell.etl'), id: 'etl' },
    { href: '/letter', icon: <FileTextIcon size={20} />, label: t('shell.letter'), id: 'letter' },
    { href: '/audit', icon: <ShieldIcon size={20} />, label: t('shell.audit'), id: 'audit' },
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

      <nav style={{ flex: 1, paddingTop: '12px' }}>
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link 
              key={item.id}
              href={item.href}
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
