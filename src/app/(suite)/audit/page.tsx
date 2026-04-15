'use client';

import React from 'react';
import AuditStation from '@/components/AuditStation/AuditStation';
import LogConsole from '@/components/LogConsole';
import { useLanguage } from '@/lib/context/LanguageContext';
import { useLogs } from '@/lib/hooks/useLogs';

export default function AuditPage() {
  const { t } = useLanguage();
  const { logs, addLog, clearLogs, saveLogs } = useLogs();

  const handleClearHistory = () => {
    clearLogs();
    addLog('error', 'logs.history_cleared');
  };

  return (
    <div className="animate-fade-in module-grid">
      <section className="module-col-main">
        <header className="module-title">
          {t('shell.audit')}
        </header>
        
        <div className="module-section" style={{ padding: 0, overflow: 'hidden' }}>
          <AuditStation onAddLog={addLog} />
        </div>
      </section>

      <section className="module-col-side" style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
        <LogConsole 
          logs={logs} 
          onClear={handleClearHistory} 
          onSave={() => saveLogs('audit')} 
        />
        
        {/* Module specific documentation or secondary status can go here */}
        <div className="module-section" style={{ flex: 1, opacity: 0.6 }}>
          <h3 style={{ borderBottom: '2px solid var(--border-color)', marginBottom: '12px' }}>GAWEB_SPEC_V4</h3>
          <p style={{ fontSize: '0.9rem' }}>
            {t('ui.offline')}
          </p>
          <ul style={{ marginTop: '20px', listStyleType: 'none', fontSize: '0.8rem' }}>
            <li>- PARSER: POSITIONAL_STRICT</li>
            <li>- ENCODING: ISO-8859-1</li>
            <li>- MIN_LENGTH: 212_BYTES</li>
            <li>- MAX_RECORD: 251_BYTES</li>
          </ul>
        </div>
      </section>
    </div>
  );
}
