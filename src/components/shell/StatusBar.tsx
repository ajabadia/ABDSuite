'use client';

import React from 'react';
import { useLanguage } from '@/lib/context/LanguageContext';
import { useSystemDiagnostics } from '@/lib/hooks/useSystemDiagnostics';

export const StatusBar: React.FC = () => {
  const { t } = useLanguage();
  const metrics = useSystemDiagnostics();

  return (
    <footer className="shell-status">
      <div style={{ marginRight: 'auto', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <div style={{ 
          width: '6px', 
          height: '6px', 
          borderRadius: '50%', 
          background: metrics.isSecure ? 'var(--status-ok)' : 'var(--status-err)',
          opacity: metrics.heartbeat ? 1 : 0.3,
          transition: 'opacity 0.2s ease'
        }} />
        {t('shell.status_ready')}...
      </div>
      <div style={{ display: 'flex', gap: '20px', alignItems: 'center', fontSize: '11px', opacity: 0.8 }}>
        <span>[ CPU: {metrics.cpuPulse}% ]</span>
        <span>[ RAM: {metrics.ramUsage || '--'}MB ]</span>
        <span style={{ 
          color: metrics.isEncryptionUnlocked ? 'var(--status-ok)' : 'var(--status-warn)',
          opacity: 0.8
        }}>
           [ CRYPT: {metrics.isEncryptionUnlocked ? 'UNLOCKED' : 'LOCKED'} ]
        </span>
        <span style={{ 
          color: metrics.sessionState === 'LOCKED' ? 'var(--status-err)' : 'var(--status-ok)',
          opacity: 0.8
        }}>
           [ SESIÓN: {metrics.sessionState} {metrics.sessionState === 'ACTIVE' && metrics.sessionExpiresInMinutes !== undefined ? `(${metrics.sessionExpiresInMinutes}m)` : ''} ]
        </span>
        <span style={{ 
          color: metrics.isSecure ? 'var(--status-ok)' : 'var(--status-err)',
          fontWeight: 900,
          opacity: 1
        }}>
          [ {metrics.isSecure ? t('shell.security_safe').toUpperCase() : t('shell.security_unsafe').toUpperCase()} ]
        </span>
      </div>
    </footer>
  );
};
