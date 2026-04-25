'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { coreDb } from '@/lib/db/SystemDB';
import { useLanguage } from '@/lib/context/LanguageContext';
import { ShieldCheckIcon, SearchIcon, RefreshCwIcon, ArrowRightIcon, ChevronRightIcon } from '@/components/common/Icons';
import { AuditDetails } from '@/lib/types/auth.types';
import Link from 'next/link';
import { ConfigDiffCard } from '../security/ConfigDiffCard';

type FilterMode = 'ALL' | 'SECURITY' | 'SYSTEM' | 'REGTECH';
type SeverityFilter = 'ALL' | 'INFO' | 'WARN' | 'CRITICAL';
type EventCategory = 'AUTH' | 'WORKSPACE' | 'OPERATORS' | 'CONFIG' | 'DATA' | 'OTHER';

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
  if (type.startsWith('REGTECH')) return 'DATA';
  return 'OTHER';
};

interface SecurityAuditPanelProps {
  initialEventType?: string;
  initialEntityType?: string;
  onFiltersCleared?: () => void;
}

const ENTITY_TYPE_LABELS: Record<string, string> = {
  'GAWEBSAMPLING': 'GAWEB Sampling',
  'TELEMETRYCONFIG': 'Configuración de Telemetría',
  'OPERATOR': 'Operador',
  'WORKSPACE': 'Espacio de Trabajo',
  'IK_OVERRIDE': 'Bypass de Integridad',
  'SESSION_LOCK': 'Bloqueo de Sesión'
};

export const SecurityAuditPanel: React.FC<SecurityAuditPanelProps> = ({ initialEventType, initialEntityType, onFiltersCleared }) => {
  const { t } = useLanguage();
  const [logs, setLogs] = useState<AuditRow[]>([]);
  const [mode, setMode] = useState<FilterMode>('SECURITY');
  const [typeFilter, setTypeFilter] = useState<string | null>(initialEventType || null);
  const [entityTypeFilter, setEntityTypeFilter] = useState<string | null>(initialEntityType || null);
  const [severityFilter, setSeverityFilter] = useState<SeverityFilter>('ALL');
  const [categoryFilter, setCategoryFilter] = useState<'ALL' | EventCategory>('ALL');
  const [isLoading, setIsLoading] = useState(true);
  const [selectedLogId, setSelectedLogId] = useState<string | null>(null);

  // Sync with external filters (Phase 13 Drill-down + Phase 18 Sync)
  useEffect(() => {
    if (initialEventType) {
      setTypeFilter(initialEventType);
      setMode('SECURITY');
    }
    if (initialEntityType) {
      setEntityTypeFilter(initialEntityType);
      setMode('SECURITY');
    }
  }, [initialEventType, initialEntityType]);

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
          module: log.action.startsWith('REGTECH') ? 'REGTECH' : 'SECURITY', 
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
      const details = log.details;
      const rowEntityType = details?.entityType;
      const rowEventType = details?.eventType;

      const matchesMode = 
        mode === 'ALL' ? true : 
        mode === 'REGTECH' ? log.module === 'REGTECH' : 
        log.module === 'SECURITY';
      const matchesType = !typeFilter || typeFilter === 'ALL' || rowEventType === typeFilter;
      const matchesEntity = !entityTypeFilter || rowEntityType === entityTypeFilter;
      const matchesSeverity = severityFilter === 'ALL' || details?.severity === severityFilter;
      const matchesCategory = categoryFilter === 'ALL' || getCategory(log) === categoryFilter;

      return matchesMode && matchesType && matchesEntity && matchesSeverity && matchesCategory;
    });
  }, [logs, mode, typeFilter, entityTypeFilter, severityFilter, categoryFilter]);

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

  const selectedLog = useMemo(() => logs.find(l => l.id === selectedLogId), [logs, selectedLogId]);

  return (
    <section className="flex-row animate-fade-in" style={{ gap: '20px', height: '100%', padding: '24px', overflow: 'hidden' }}>
      <div className="flex-col" style={{ flex: selectedLog ? 1.5 : 1, gap: '16px', minWidth: 0, height: '100%', overflow: 'hidden' }}>
      <header className="flex-col" style={{ gap: '16px' }}>
        <div className="flex-row" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
          <div className="flex-row" style={{ gap: '12px', alignItems: 'center' }}>
            <ShieldCheckIcon size={20} color="var(--primary-color)" />
            <h3 style={{ margin: 0, fontSize: '0.75rem', letterSpacing: '2px', opacity: 0.5 }}>{t('audit.securityTitle').toUpperCase()}</h3>
          </div>
          <button className="station-btn secondary tiny" onClick={loadLogs} disabled={isLoading}>
            <RefreshCwIcon size={14} className={isLoading ? 'spin' : ''} />
          </button>
        </div>

        {/* ACTIVE FILTERS CHIPS (Industrial UX) */}
        {(typeFilter && typeFilter !== 'ALL' || entityTypeFilter) && (
          <div className="flex-row" style={{ gap: '8px', marginBottom: '8px' }}>
             {entityTypeFilter && (
               <button 
                 className="station-badge success clickable animate-fade-in" 
                 style={{ border: 'none', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.65rem' }}
                 onClick={() => {
                   setEntityTypeFilter(null);
                   setTypeFilter(null);
                   onFiltersCleared?.();
                 }}
               >
                 <span>●</span> 
                 {ENTITY_TYPE_LABELS[entityTypeFilter] || entityTypeFilter}
                 <span style={{ marginLeft: '4px', opacity: 0.5 }}>✕</span>
               </button>
             )}
             {typeFilter && typeFilter !== 'ALL' && !entityTypeFilter && (
               <button 
                 className="station-badge info clickable animate-fade-in" 
                 style={{ border: 'none', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.65rem' }}
                 onClick={() => {
                    setTypeFilter(null);
                    onFiltersCleared?.();
                 }}
               >
                 <span>●</span> {typeFilter}
                 <span style={{ marginLeft: '4px', opacity: 0.5 }}>✕</span>
               </button>
             )}
          </div>
        )}

        <div className="flex-row" style={{ gap: '16px', flexWrap: 'wrap' }}>
          <div className="flex-col">
            <label className="station-label" style={{ fontSize: '0.65rem' }}>MODULE</label>
            <select className="station-input" value={mode} onChange={e => setMode(e.target.value as any)} style={{ height: '32px', fontSize: '0.75rem' }}>
              <option value="SECURITY">SECURITY_ONLY</option>
              <option value="REGTECH">REGTECH_AUDIT</option>
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
              <option value="DATA">DATA_OPERATIONS</option>
              <option value="OTHER">OTHER</option>
            </select>
          </div>

          <div className="flex-col">
            <label className="station-label" style={{ fontSize: '0.65rem' }}>EVENT_TYPE</label>
            <select className="station-input" value={typeFilter || 'ALL'} onChange={e => setTypeFilter(e.target.value)} style={{ height: '32px', fontSize: '0.75rem' }}>
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
              <tr 
                key={log.id} 
                className={selectedLogId === log.id ? 'active' : ''} 
                onClick={() => setSelectedLogId(log.id)}
                style={{ cursor: 'pointer' }}
              >
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
                  {log.details?.entityType ? (
                    <button 
                      className={`station-pill ${entityTypeFilter === log.details.entityType ? 'active' : ''}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        setEntityTypeFilter(prev => prev === log.details?.entityType ? null : (log.details?.entityType || null));
                      }}
                      style={{ fontSize: '0.6rem', padding: '2px 6px', borderRadius: '4px' }}
                    >
                      {ENTITY_TYPE_LABELS[log.details.entityType] || log.details.entityType}
                    </button>
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
    </div>

    {selectedLog && (
        <div className="flex-col animate-slide-in-right" style={{ width: '400px', gap: '16px', paddingLeft: '20px', borderLeft: '1px solid var(--border-color)', overflowY: 'auto' }}>
           <div className="flex-row" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
             <h4 style={{ margin: 0, fontSize: '0.7rem', fontWeight: 900, color: 'var(--primary-color)' }}>DETALLE_FORENSE</h4>
             <button className="station-btn tiny" onClick={() => setSelectedLogId(null)}>×</button>
           </div>
           
           {selectedLog.details?.context?.before || selectedLog.details?.context?.after || selectedLog.details?.summary ? (
              <ConfigDiffCard 
                before={selectedLog.details.context?.before || selectedLog.details.summary?.from} 
                after={selectedLog.details.context?.after || selectedLog.details.summary?.to} 
                title={resolveMessage(selectedLog)}
                category={selectedLog.details.entityType}
                ignoreKeys={['corporate', 'logoBase64', 'witness']}
              />
            ) : (
             <div className="station-card" style={{ padding: '20px', opacity: 0.5, textAlign: 'center', fontSize: '0.8rem' }}>
                <p>NO_DIFFERENTIAL_DATA_AVAILABLE</p>
                <pre style={{ textAlign: 'left', fontSize: '0.7rem', marginTop: '12px' }}>
                  {JSON.stringify(selectedLog.details, null, 2)}
                </pre>
             </div>
           )}
        </div>
      )}

      <style jsx>{`
        .status-badge {
          font-size: 0.55rem;
          padding: 2px 6px;
          border-radius: 2px;
          background: var(--bg-color);
          border: 1px solid var(--border-color);
          letter-spacing: 1px;
          font-weight: 900;
          font-family: var(--font-mono);
        }
        .status-badge.critical { color: var(--status-err); border-color: var(--status-err); background: rgba(239, 68, 68, 0.05); }
        .status-badge.warn { color: var(--status-warn); border-color: var(--status-warn); }
        .status-badge.info { color: var(--primary-color); border-color: var(--primary-color); }
        
        .audit-link {
          color: var(--primary-color);
          text-decoration: none;
          font-family: var(--font-mono);
          font-size: 0.75rem;
          font-weight: 600;
          display: inline-flex;
          align-items: center;
          gap: 4px;
        }
        .audit-link:hover {
          text-decoration: underline;
        }

        .station-pill {
          background: rgba(255,255,255,0.05);
          border: 1px solid var(--border-color);
          color: var(--text-primary);
          cursor: pointer;
          transition: var(--snap);
        }
        .station-pill:hover {
          background: rgba(255,255,255,0.1);
          border-color: var(--primary-color);
        }
        .station-pill.active {
          background: var(--primary-color);
          color: #000;
          border-color: var(--primary-color);
          font-weight: 800;
        }
      `}</style>
    </section>
  );
};
