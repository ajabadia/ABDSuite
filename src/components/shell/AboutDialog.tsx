'use client';

import React from 'react';
import { useLanguage } from '@/lib/context/LanguageContext';

interface AboutDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AboutDialog: React.FC<AboutDialogProps> = ({ isOpen, onClose }) => {
  const { t } = useLanguage();

  if (!isOpen) return null;

  return (
    <div className="station-modal-overlay">
      <div className="station-modal" style={{ maxWidth: '500px' }}>
        <header className="station-modal-header technical-header-small">
           <div className="flex-row" style={{ gap: '12px', alignItems: 'center' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 900, letterSpacing: '2px', opacity: 0.5 }}>ABOUT_TERMINAL</span>
           </div>
           <button onClick={onClose} className="station-btn secondary tiny">
              <span style={{ fontSize: '0.65rem' }}>ESC</span>
           </button>
        </header>

        <div className="station-modal-content" style={{ padding: '32px', background: 'var(--bg-color)' }}>
          <div style={{ 
            borderBottom: '1px solid var(--border-color)', 
            paddingBottom: '24px', 
            marginBottom: '24px',
            display: 'flex',
            flexDirection: 'column',
            gap: '4px'
          }}>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 900, margin: 0, letterSpacing: '2px' }}>ABDFN UNIFIED SUITE</h2>
            <div className="flex-row" style={{ gap: '8px', alignItems: 'center' }}>
               <span style={{ fontSize: '0.6rem', background: 'var(--primary-color)', color: '#000', padding: '2px 6px', fontWeight: 900, borderRadius: '2px' }}>V6.1.0-IND</span>
               <span style={{ fontSize: '0.6rem', opacity: 0.4, fontWeight: 800 }}>BUILD_2026.04.20</span>
            </div>
          </div>

          <div style={{ fontSize: '0.8rem', lineHeight: 1.6, fontFamily: 'var(--font-mono)' }}>
            <p style={{ fontWeight: 900, color: 'var(--primary-color)', letterSpacing: '1px' }}>ASEPTIC BANKING DATA FACTORY NETWORK</p>
            <p style={{ marginTop: '12px', opacity: 0.6, fontSize: '0.75rem' }}>Plataforma de procesamiento industrial con cifrado At-Rest dinámico y trazabilidad forense integrada.</p>
            
            <div style={{ 
              marginTop: '28px', 
              padding: '20px', 
              background: 'var(--surface-color)', 
              border: '1px solid var(--border-color)',
              borderRadius: '2px',
              fontSize: '0.65rem'
            }}>
              <div style={{ display: 'grid', gridTemplateColumns: '130px 1fr', gap: '12px' }}>
                <span style={{ fontWeight: 900, opacity: 0.4 }}>SYSTEM_CORE_ID:</span> <span style={{ fontWeight: 800 }}>ABDFN-MOD-2026-X86-P6</span>
                <span style={{ fontWeight: 900, opacity: 0.4 }}>CRYPT_ENGINE:</span> <span style={{ fontWeight: 800 }}>AES-GCM (256-BIT) / WEBCRYPTO</span>
                <span style={{ fontWeight: 900, opacity: 0.4 }}>UI_STANDARD:</span> <span style={{ fontWeight: 800 }}>UNCODIXFY V.4 (OBSIDIAN)</span>
                <span style={{ fontWeight: 900, opacity: 0.4 }}>COMPLIANCE:</span> <span style={{ fontWeight: 800 }}>ZERO-KNOWLEDGE / LOCAL-ONLY</span>
              </div>
            </div>

            <div style={{ marginTop: '32px', padding: '12px', border: '1px solid var(--border-color)', borderRadius: '2px', background: 'rgba(239, 68, 68, 0.02)' }}>
              <p style={{ fontSize: '0.6rem', opacity: 0.5, margin: 0, fontWeight: 700, textAlign: 'center' }}>
                © {new Date().getFullYear()} ABD INDUSTRIAL INFRASTRUCTURES. <br />
                AUTHORIZED PERSONNEL ONLY.
              </p>
            </div>
          </div>
        </div>

        <footer className="station-modal-footer">
          <button 
            onClick={onClose}
            className="station-btn primary small"
            style={{ minWidth: '120px', background: 'var(--primary-color)', color: '#000', fontWeight: 900 }}
          >
            {t('common.ok').toUpperCase()}
          </button>
        </footer>
      </div>
    </div>
  );
};
