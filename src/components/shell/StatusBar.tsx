'use client';

import React from 'react';
import { useLanguage } from '@/lib/context/LanguageContext';

export const StatusBar: React.FC = () => {
  const { t } = useLanguage();

  return (
    <footer className="shell-status">
      <div style={{ marginRight: 'auto' }}>
        {t('shell.status_ready')}...
      </div>
      <div style={{ display: 'flex', gap: '20px' }}>
        <span>[ CPU: 0.02% ]</span>
        <span>[ RAM: 8MB ]</span>
        <span>[ SECURE CONTEXT ]</span>
      </div>
    </footer>
  );
};
