'use client';

import React from 'react';
import { useLanguage } from '@/lib/context/LanguageContext';

export const StatusBar: React.FC = () => {
  const { t } = useLanguage();
  const [isSecure, setIsSecure] = React.useState(true);

  React.useEffect(() => {
    // SubtleCrypto requires a Secure Context (HTTPS or localhost)
    const secure = window.isSecureContext && !!window.crypto.subtle;
    setIsSecure(secure);
  }, []);

  return (
    <footer className="shell-status">
      <div style={{ marginRight: 'auto' }}>
        {t('shell.status_ready')}...
      </div>
      <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
        <span>[ CPU: 0.02% ]</span>
        <span>[ RAM: 8MB ]</span>
        <span style={{ 
          color: isSecure ? 'var(--status-ok)' : 'var(--status-err)',
          fontWeight: 900,
          opacity: 1
        }}>
          [ {isSecure ? t('shell.security_safe').toUpperCase() : t('shell.security_unsafe').toUpperCase()} ]
        </span>
      </div>
    </footer>
  );
};
