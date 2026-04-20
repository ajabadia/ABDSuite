'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { coreDb } from '@/lib/db/SystemDB';
import { useLanguage } from '@/lib/context/LanguageContext';
import { ShieldCheckIcon, SearchIcon, RefreshCwIcon, ArrowRightIcon } from '@/components/common/Icons';
import { AuditDetails } from '@/lib/types/auth.types';
import Link from 'next/link';

type FilterMode = 'ALL' | 'SECURITY' | 'SYSTEM';
type SeverityFilter = 'ALL' | 'INFO' | 'WARN' | 'CRITICAL';
type EventCategory = 'AUTH' | 'WORKSPACE' | 'OPERATORS' | 'CONFIG' | 'OTHER';

interface AuditRow {
  id: string;
  timestamp: number;
  module: string;
  action: string;
  status: string;
  details: AuditDetails | null;
}

const getCategory = (log: AuditRow): EventCategory => {
  const type = log.details?.eventType || '';
  if (type.startsWith('AUTH')) return 'AUTH';
  if (type.startsWith('WORKSPACE')) return 'WORKSPACE';
  if (type.startsWith('OPERATOR')) return 'OPERATORS';
  if (type.endsWith('CONFIG_UPDATE')) return 'CONFIG';
  return 'OTHER';
};

interface SecurityAuditPanelProps {
  initialEventType?: string;
}

export const SecurityAuditPanel: React.FC<SecurityAuditPanelProps> = ({ initialEventType }) => {
  const { t } = useLanguage();
  const [logs, setLogs] = useState<AuditRow[]>([]);
  const [mode, setMode] = useState<FilterMode>('SECURITY');
  const [typeFilter, setTypeFilter] = useState<string>(initialEventType ?? 'ALL');
  const [severityFilter, setSeverityFilter] = useState<SeverityFilter>('ALL');
  const [categoryFilter, setCategoryFilter] = useState<'ALL' | EventCategory>('ALL');
  const [isLoading, setIsLoading] = useState(true);

  // Sync with external filters (Phase 13 Drill-down)
  useEffect(() => {
    if (initialEventType) {
      setTypeFilter(initialEventType);
      setMode('SECURITY');
    }
  }, [initialEventType]);

  const loadLogs = async () => {
    setIsLoading(true);
    try {
      const all = await coreDb.system_log
        .orderBy('timestamp')
        .reverse()
        .limit(500)
        .toArray();
      
      const mapped: AuditRow[] = all.map(log => {
        let details: AuditDetails | null = null;
        try {
          details = JSON.parse(log.details || '{}');
        } catch {
          details = null;
        }
        return {
          id: log.id,
          timestamp: log.timestamp,
          module: 'SECURITY', // Heuristic for system_log events
          action: log.action,
          status: log.status,
          details
        };
      });

      setLogs(mapped);
    } catch (err) {
      console.error('[SECURITY-AUDIT] Load failed', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
  }, []);

  const eventTypes = useMemo(() => {
    const types = new Set<string>();
    logs.forEach(l => {
      if (l.details?.eventType) types.add(l.details.eventType);
    });
    return Array.from(types).sort();
  }, [logs]);

  const filteredLogs = useMemo(() => {
    return logs.filter(log => {
      if (mode === 'SECURITY' && log.module !== 'SECURITY') return false;
      if (typeFilter !== 'ALL' && log.details?.eventType !== typeFilter) return false;
      if (severityFilter !== 'ALL' && log.details?.severity !== severityFilter) return false;
      if (categoryFilter !== 'ALL' && getCategory(log) !== categoryFilter) return false;
      return true;
    });
  }, [logs, mode, typeFilter, severityFilter, categoryFilter]);

  const resolveMessage = (entry: AuditRow) => {
    const i18nKey = `audit.${entry.action}`;
    const translated = t(i18nKey);
    
    if (translated === i18nKey) return entry.action;

    let msg = translated;
    const context = entry.details?.context || {};
    Object.entries(context).forEach(([key, val]) => {
      msg = msg.replace(`{${key}}`, String(val));
    });
    
    // Also support actorUser in interpolation if provided at top level
    if (entry.details?.actorUser) {
      msg = msg.replace('{actorUser}', entry.details.actorUser);
    }

    return msg;
  };

  return (
    <section className="flex-col animate-fade-in" style={{ gap: '16px', height: '100%' }}>
      <header className="flex-col" style={{ gap: '16px' }}>
        <div className="flex-row" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
          <div className="flex-row" style={{ gap: '12px', alignItems: 'center' }}>
            <ShieldCheckIcon size={20} color="var(--accent-primary)" />
            <h3 style={{ margin: 0, fontSize: '1.2rem' }}>{t('audit.securityTitle').toUpperCase()}</h3>
          </div>
          <button className="station-btn secondary" onClick={loadLogs} disabled={isLoading}>
            <RefreshCwIcon size={14} className={isLoading ? 'spin' : ''} />
          </button>
        </div>

        <div className="flex-row" style={{ gap: '16px', flexWrap: 'wrap' }}>
          <div className="flex-col">
            <label className="station-label" style={{ fontSize: '0.65rem' }}>MODULE</label>
            <select className="station-input" value={mode} onChange={e => setMode(e.target.value as any)} style={{ height: '32px', fontSize: '0.75rem' }}>
              <option value="SECURITY">SECURITY_ONLY</option>
              <option value="ALL">ALL_GLOBAL_SYSTEM</option>
            </select>
          </div>

          <div className="flex-col">
            <label className="station-label" style={{ fontSize: '0.65rem' }}>CATEGORY</label>
            <select className="station-input" value={categoryFilter} onChange={e => setCategoryFilter(e.target.value as any)} style={{ height: '32px', fontSize: '0.75rem' }}>
              <option value="ALL">ALL_CATEGORIES</option>
              <option value="AUTH">AUTH</option>
              <option value="WORKSPACE">WORKSPACE</option>
              <option value="OPERATORS">OPERATORS</option>
              <option value="CONFIG">CONFIG</option>
              <option value="OTHER">OTHER</option>
            </select>
          </div>

          <div className="flex-col">
            <label className="station-label" style={{ fontSize: '0.65rem' }}>EVENT_TYPE</label>
            <select className="station-input" value={typeFilter} onChange={e => setTypeFilter(e.target.value)} style={{ height: '32px', fontSize: '0.75rem' }}>
              <option value="ALL">ALL_TYPES</option>
              {eventTypes.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>

          <div className="flex-col">
            <label className="station-label" style={{ fontSize: '0.65rem' }}>SEVERITY</label>
            <select className="station-input" value={severityFilter} onChange={e => setSeverityFilter(e.target.value as any)} style={{ height: '32px', fontSize: '0.75rem' }}>
              <option value="ALL">ALL_SEVERITIES</option>
              <option value="INFO">INFO</option>
              <option value="WARN">WARNING</option>
              <option value="CRITICAL">CRITICAL</option>
            </select>
          </div>
        </div>
      </header>

      <div className="station-table-wrapper" style={{ flex: 1, overflow: 'auto' }}>
        <table className="station-table">
          <thead>
            <tr>
              <th style={{ width: '160px' }}>{t('audit.colTime').toUpperCase()}</th>
              <th style={{ width: '140px' }}>CATEGORY / TYPE</th>
              <th style={{ width: '120px' }}>ACTOR</th>
              <th style={{ width: '120px' }}>ENTITY</th>
              <th>{t('audit.colMessage').toUpperCase()}</th>
              <th style={{ width: '80px' }}>SEV</th>
            </tr>
          </thead>
          <tbody>
            {filteredLogs.map(log => (
              <tr key={log.id}>
                <td style={{ opacity: 0.6, fontSize: '0.75rem' }}>
                  {new Date(log.timestamp).toLocaleString()}
                </td>
                <td style={{ fontSize: '0.65rem', fontWeight: 600 }}>
                  <div style={{ opacity: 0.5 }}>{getCategory(log)}</div>
                  <div style={{ color: 'var(--accent-primary)' }}>{log.details?.eventType || log.action}</div>
                </td>
                <td>
                  {log.details?.actorId ? (
                    <Link 
                      href={`/supervisor?tab=operators&operatorId=${encodeURIComponent(log.details.actorId)}`}
                      className="audit-link"
                    >
                      {log.details.actorUser || log.details.actorId.split('-')[0]}
                    </Link>
                  ) : '—'}
                </td>
                <td>
                  {log.details?.entityType === 'OPERATOR' && log.details.entityId ? (
                    <Link 
                      href={`/supervisor?tab=operators&operatorId=${encodeURIComponent(log.details.entityId)}`}
                      className="audit-link"
                    >
                      OP:{log.details.entityId.split('-')[0]}
                    </Link>
                  ) : (
                    <span style={{ fontSize: '0.7rem', opacity: 0.7 }}>
                      {log.details?.entityType || '—'}{log.details?.entityId ? `:${log.details.entityId.split('-')[0]}` : ''}
                    </span>
                  )}
                </td>
                <td>
                  <div style={{ wordBreak: 'break-word', maxWidth: '500px', fontSize: '0.85rem' }}>
                    {resolveMessage(log)}
                  </div>
                </td>
                <td>
                  <span className={`status-badge ${(log.details?.severity || 'INFO').toLowerCase()}`}>
                    {log.details?.severity || 'INFO'}
                  </span>
                </td>
              </tr>
            ))}
            {filteredLogs.length === 0 && (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', opacity: 0.5, padding: '40px' }}>
                  {t('audit.emptySecurity')}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <style jsx>{`
        .status-badge {
          font-size: 0.6rem;
          padding: 2px 4px;
          border-radius: 2px;
          background: rgba(255,255,255,0.05);
          letter-spacing: 0.5px;
          font-weight: 700;
        }
        .status-badge.critical { color: var(--status-err); border: 1px solid var(--status-err); }
        .status-badge.warn { color: var(--status-warn); border: 1px solid var(--status-warn); }
        .status-badge.info { color: var(--accent-primary); border: 1px solid var(--accent-primary); }
        
        .audit-link {
          color: var(--accent-primary);
          text-decoration: none;
          font-size: 0.75rem;
          font-weight: 600;
          display: inline-flex;
          align-items: center;
          gap: 4px;
        }
        .audit-link:hover {
          text-decoration: underline;
          filter: brightness(1.2);
        }
      `}</style>
    </section>
  );
};
