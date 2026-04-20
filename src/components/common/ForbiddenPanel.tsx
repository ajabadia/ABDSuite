'use client';

import React from 'react';
import { useLanguage } from '@/lib/context/LanguageContext';
import { LockIcon } from '@/components/common/Icons';

export const ForbiddenPanel: React.FC = () => {
  const { t } = useLanguage();

  return (
    <div className="flex-col animate-fade-in" style={{ 
      height: '100%', 
      alignItems: 'center', 
      justifyContent: 'center', 
      gap: '24px',
      opacity: 0.8
    }}>
      <div className="station-card flex-col" style={{ 
        padding: '64px', 
        alignItems: 'center', 
        background: 'rgba(255, 59, 48, 0.05)', 
        border: '1px solid rgba(255, 59, 48, 0.2)',
        maxWidth: '500px',
        textAlign: 'center'
      }}>
        <LockIcon size={64} style={{ marginBottom: '16px', color: 'var(--status-err)' }} />
        <h2 style={{ fontSize: '1.5rem', margin: 0, letterSpacing: '2px' }}>ACCESS_DENIED</h2>
        <p style={{ opacity: 0.7, fontSize: '0.9rem', lineHeight: '1.6' }}>
          Your current industrial identifier does not have the required capabilities to access this module.
        </p>
        <div style={{ marginTop: '24px', fontSize: '0.7rem', fontWeight: 700, opacity: 0.5 }}>
          ABDFN SUITE GOVERNANCE ENGINE v5.0
        </div>
      </div>
    </div>
  );
};
