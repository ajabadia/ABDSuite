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
    <div className="station-modal-overlay" onClick={onClose}>
      <div 
        className="station-modal" 
        style={{ maxWidth: '500px' }} 
        onClick={e => e.stopPropagation()}
      >
        <div style={{ 
          borderBottom: '1px solid var(--border-color)', 
          paddingBottom: '20px', 
          marginBottom: '20px',
          display: 'flex',
          alignItems: 'baseline',
          gap: '15px'
        }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, margin: 0 }}>ABDFN Suite</h2>
          <span style={{ fontSize: '0.7rem', border: '1px solid var(--border-color)', padding: '2px 8px', borderRadius: '4px' }}>v5.1.0-ASEPTIC</span>
        </div>

        <div style={{ fontSize: '0.9rem', lineHeight: 1.6 }}>
          <p style={{ fontWeight: 700, color: 'var(--primary-color)' }}>Aseptic Banking Data Factory Network</p>
          <p style={{ marginTop: '8px', opacity: 0.8 }}>Plataforma unificada de procesamiento local seguro y auditoría industrial.</p>
          
          <div style={{ 
            marginTop: '24px', 
            padding: '16px', 
            background: 'var(--bg-color)', 
            border: '1px solid var(--border-color)',
            borderRadius: '8px',
            fontSize: '0.75rem',
            opacity: 0.8
          }}>
            <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: '8px' }}>
              <span style={{ fontWeight: 700 }}>SYSTEM_ID:</span> <span>ABDFN-MOD-2026-X86</span>
              <span style={{ fontWeight: 700 }}>ENGINE:</span> <span>WebCrypto / DOCX-Parity</span>
              <span style={{ fontWeight: 700 }}>STANDARD:</span> <span>UNCODIXFY V4</span>
            </div>
          </div>

          <p style={{ marginTop: '24px', fontSize: '0.7rem', opacity: 0.6 }}>
            © {new Date().getFullYear()} ABD INDUSTRIAL INFRASTRUCTURES. <br />
            Procesamiento 100% local. Zero-Knowledge Compliance.
          </p>
        </div>

        <button 
          onClick={onClose}
          className="station-btn station-btn-primary"
          style={{ marginTop: '20px', width: '100%' }}
        >
          Cerrar
        </button>
      </div>
    </div>
  );
};
