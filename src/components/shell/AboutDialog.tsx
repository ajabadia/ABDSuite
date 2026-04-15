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
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 10000
    }} onClick={onClose}>
      <div 
        style={{
          width: '500px',
          background: 'var(--surface-color)',
          border: '4px solid var(--border-color)',
          padding: '30px',
          position: 'relative',
          boxShadow: '20px 20px 0 var(--border-color)'
        }} 
        onClick={e => e.stopPropagation()}
      >
        <div style={{ 
          borderBottom: '4px solid var(--border-color)', 
          paddingBottom: '20px', 
          marginBottom: '20px',
          display: 'flex',
          alignItems: 'baseline',
          gap: '15px'
        }}>
          <h2 style={{ fontSize: '1.8rem', fontWeight: 900, margin: 0 }}>ABDFN SUITE</h2>
          <span style={{ fontSize: '0.8rem', border: '2px solid var(--border-color)', padding: '2px 8px' }}>v5.0.0</span>
        </div>

        <div style={{ fontSize: '0.9rem', lineHeight: 1.6 }}>
          <p><strong>Aseptic Banking Data Factory Network</strong></p>
          <p>Plataforma unificada de procesamiento local seguro y auditoría industrial.</p>
          
          <div style={{ 
            marginTop: '20px', 
            padding: '15px', 
            background: 'rgba(0,0,0,0.2)', 
            border: '2px dashed var(--border-color)',
            fontFamily: 'var(--font-mono)'
          }}>
            SYSTEM_ID: ABDFN-MOD-2026-X86<br />
            CRYPT_ENGINE: AES-GCM-256 (WebCrypto)<br />
            LAYOUT_ENGINE: GAWEB-HOST-REV-Z
          </div>

          <p style={{ marginTop: '20px', fontSize: '0.75rem', opacity: 0.7 }}>
            © 2026 ABD-IA INFRASTRUCTURES.<br />
            Este sistema cumple con los mandatos de procesamiento local y seguridad de clave maestra en memoria volátil.
          </p>
        </div>

        <button 
          onClick={onClose}
          style={{
            marginTop: '30px',
            width: '100%',
            padding: '12px',
            background: 'var(--border-color)',
            color: 'var(--bg-color)',
            fontWeight: 900,
            cursor: 'pointer'
          }}
        >
          [CERRAR_SISTEMA]
        </button>
      </div>
    </div>
  );
};
