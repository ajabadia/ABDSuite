'use client';

import React, { useEffect, useState } from 'react';
import { coreDb } from '@/lib/db/SystemDB';
import { useLanguage } from '@/lib/context/LanguageContext';
import { ShieldCheckIcon, SearchIcon, RefreshCwIcon } from '@/components/common/Icons';

type FilterMode = 'ALL' | 'SECURITY' | 'SYSTEM';

export const SecurityAuditPanel: React.FC = () => {
  const { t } = useLanguage();
  const [logs, setLogs] = useState<any[]>([]);
  const [mode, setMode] = useState<FilterMode>('SECURITY');
  const [isLoading, setIsLoading] = useState(true);

  const loadLogs = async () => {
    setIsLoading(true);
    try {
      // system_log: { id, timestamp, action, details, status }
      const all = await coreDb.system_log
        .orderBy('timestamp')
        .reverse()
        .limit(200)
        .toArray();
      setLogs(all);
    } catch (err) {
      console.error('[SECURITY-AUDIT] Load failed', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
  }, []);

  const resolveMessage = (entry: any) => {
    // Try to translate entry.action (the messageKey)
    // If details are present, they are JSON stringified in AuditService
    let details = {};
    try {
      details = JSON.parse(entry.details || '{}');
    } catch { 
      details = {};
    }

    // Example key: audit.operator.master.transfer
    const i18nKey = `audit.${entry.action}`;
    const translated = t(i18nKey);
    
    if (translated === i18nKey) return entry.action; // Fallback

    // Simple interpolation if needed (if t doesn't do it)
    let msg = translated;
    Object.entries(details).forEach(([key, val]) => {
      msg = msg.replace(`{${key}}`, String(val));
    });
    return msg;
  };

  const filteredLogs = mode === 'ALL' 
    ? logs 
    : logs.filter(log => {
        // Simple heuristic since system_log doesn't have 'module' field yet, 
        // but AuditService sends security keys
        if (mode === 'SECURITY') return log.action.includes('operator') || log.status === 'WARNING';
        return true;
      });

  return (
    <section className="flex-col animate-fade-in" style={{ gap: '16px', height: '100%' }}>
      <header className="flex-row" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
        <div className="flex-row" style={{ gap: '12px', alignItems: 'center' }}>
          <ShieldCheckIcon size={20} color="var(--accent-primary)" />
          <h3 style={{ margin: 0, fontSize: '1.2rem' }}>{t('audit.securityTitle').toUpperCase()}</h3>
        </div>

        <div className="flex-row" style={{ gap: '8px' }}>
          <div className="station-tabs" style={{ background: 'rgba(255,255,255,0.05)', borderRadius: '4px', padding: '2px' }}>
            <button 
              className={`station-tab-btn ${mode === 'SECURITY' ? 'active' : ''}`}
              onClick={() => setMode('SECURITY')}
              style={{ fontSize: '0.7rem' }}
            >
              {t('audit.tabSecurity')}
            </button>
            <button 
              className={`station-tab-btn ${mode === 'ALL' ? 'active' : ''}`}
              onClick={() => setMode('ALL')}
              style={{ fontSize: '0.7rem' }}
            >
              {t('audit.tabAll')}
            </button>
          </div>
          <button className="station-btn secondary" onClick={loadLogs} disabled={isLoading}>
            <RefreshCwIcon size={14} className={isLoading ? 'spin' : ''} />
          </button>
        </div>
      </header>

      <div className="station-table-wrapper" style={{ flex: 1, overflow: 'auto' }}>
        <table className="station-table">
          <thead>
            <tr>
              <th style={{ width: '180px' }}>{t('audit.colTime').toUpperCase()}</th>
              <th>{t('audit.colMessage').toUpperCase()}</th>
              <th style={{ width: '100px' }}>STATUS</th>
            </tr>
          </thead>
          <tbody>
            {filteredLogs.map(log => (
              <tr key={log.id}>
                <td style={{ opacity: 0.6, fontSize: '0.8rem' }}>
                  {new Date(log.timestamp).toLocaleString()}
                </td>
                <td>
                  <div style={{ wordBreak: 'break-word', maxWidth: '600px' }}>
                    {resolveMessage(log)}
                  </div>
                </td>
                <td>
                  <span className={`status-badge ${log.status.toLowerCase()}`}>
                    {log.status}
                  </span>
                </td>
              </tr>
            ))}
            {filteredLogs.length === 0 && (
              <tr>
                <td colSpan={3} style={{ textAlign: 'center', opacity: 0.5, padding: '40px' }}>
                  {t('audit.emptySecurity')}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <style jsx>{`
        .status-badge {
          font-size: 0.65rem;
          padding: 2px 6px;
          border-radius: 2px;
          background: rgba(255,255,255,0.1);
          letter-spacing: 1px;
        }
        .status-badge.warning { color: var(--status-warn); border: 1px solid var(--status-warn); }
        .status-badge.info { color: var(--accent-primary); border: 1px solid var(--accent-primary); }
        .status-badge.success { color: var(--status-ok); border: 1px solid var(--status-ok); }
      `}</style>
    </section>
  );
};
