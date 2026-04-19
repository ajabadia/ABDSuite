'use client';

import React, { useState } from 'react';
import { MANUALS } from '@/lib/docs/manuals';
import { useLanguage } from '@/lib/context/LanguageContext';
import { HelpIcon, XIcon, FileTextIcon, LockIcon, ListIcon, ShieldCheckIcon } from '@/components/common/Icons';

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HelpModal: React.FC<HelpModalProps> = ({ isOpen, onClose }) => {
  const { t } = useLanguage();
  const [activeSection, setActiveSection] = useState<keyof typeof MANUALS>('general');

  if (!isOpen) return null;

  const sections = [
    { id: 'general', title: 'GENERAL', icon: <HelpIcon size={16} /> },
    { id: 'crypt', title: 'CRYPT', icon: <LockIcon size={16} /> },
    { id: 'etl', title: 'ETL', icon: <ListIcon size={16} /> },
    { id: 'letter', title: 'LETTER', icon: <FileTextIcon size={16} /> },
    { id: 'audit', title: 'AUDIT', icon: <ShieldCheckIcon size={16} /> },
  ];

  return (
    <div className="station-modal-overlay" onClick={onClose}>
      <div 
        className="station-modal" 
        style={{ maxWidth: '900px', height: '80vh', display: 'flex', flexDirection: 'column' }} 
        onClick={e => e.stopPropagation()}
      >
        <header className="station-modal-header" style={{ padding: '16px 24px' }}>
          <div className="flex-row" style={{ gap: '12px' }}>
            <HelpIcon size={20} style={{ color: 'var(--primary-color)' }} />
            <h2 className="station-registry-item-name">{t('shell.help').toUpperCase()}</h2>
          </div>
          <button className="station-btn icon-only" onClick={onClose}><XIcon size={18} /></button>
        </header>

        <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
          {/* Sidebar de navegación del manual */}
          <aside style={{ width: '200px', borderRight: '1px solid var(--border-color)', padding: '12px', background: 'rgba(var(--primary-color-rgb), 0.02)' }}>
            <div className="flex-col" style={{ gap: '4px' }}>
              {sections.map(section => (
                <button
                  key={section.id}
                  onClick={() => setActiveSection(section.id as any)}
                  className={`station-btn ${activeSection === section.id ? 'active' : ''}`}
                  style={{ 
                    justifyContent: 'flex-start', 
                    fontSize: '0.7rem', 
                    padding: '10px',
                    borderColor: activeSection === section.id ? 'var(--primary-color)' : 'transparent',
                    background: activeSection === section.id ? 'rgba(var(--primary-color-rgb), 0.1)' : 'transparent'
                  }}
                >
                  <span style={{ marginRight: '10px', opacity: activeSection === section.id ? 1 : 0.5 }}>{section.icon}</span>
                  {section.title}
                </button>
              ))}
            </div>
          </aside>

          {/* Contenido del manual */}
          <main style={{ flex: 1, padding: '32px', overflowY: 'auto', background: 'var(--surface-color)' }}>
            <div className="help-content-view">
              <h1 style={{ 
                fontSize: '1.4rem', 
                fontWeight: 900, 
                marginBottom: '24px', 
                color: 'var(--primary-color)',
                borderBottom: '2px solid var(--primary-color)',
                paddingBottom: '12px'
              }}>
                {MANUALS[activeSection].title}
              </h1>
              
              <div 
                className="manual-text-body"
                style={{ 
                  fontFamily: 'var(--font-roboto-mono)', 
                  fontSize: '0.9rem', 
                  lineHeight: '1.7',
                  color: 'var(--text-primary)',
                  whiteSpace: 'pre-wrap'
                }}
              >
                {MANUALS[activeSection].content}
              </div>
            </div>
          </main>
        </div>

        <footer style={{ padding: '12px 24px', borderTop: '1px solid var(--border-color)', background: 'rgba(var(--primary-color-rgb), 0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '0.6rem', opacity: 0.5 }}>DOCUMENT_ID: {activeSection.toUpperCase()}_MAN_v6.0</span>
          <span style={{ fontSize: '0.6rem', opacity: 0.5, letterSpacing: '2px' }}>ABD INDUSTRIAL INFRASTRUCTURES</span>
        </footer>
      </div>

      <style jsx>{`
        .help-content-view {
          max-width: 700px;
          margin: 0 auto;
        }
        .manual-text-body :global(h1), .manual-text-body :global(h2), .manual-text-body :global(h3) {
          color: var(--primary-color);
          margin-top: 2rem;
          margin-bottom: 1rem;
        }
        .manual-text-body :global(blockquote) {
          border-left: 4px solid var(--primary-color);
          padding-left: 1rem;
          margin-left: 0;
          background: rgba(var(--primary-color-rgb), 0.05);
          padding: 1rem;
        }
      `}</style>
    </div>
  );
};
