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

// Entity labels are now handled via i18n: t('audit.forensics.entities.' + type)

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
    <section className="flex-row animate-fade-in" style={{ gap: '24px', height: '100%', padding: '24px', overflow: 'hidden', paddingTop: '16px' }}>
      <div className="flex-col" style={{ flex: selectedLog ? 1.5 : 1, gap: '20px', minWidth: 0, height: '100%', overflow: 'hidden' }}>
      <header className="flex-col" style={{ gap: '16px' }}>
        <div className="flex-row" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
          <div className="flex-row" style={{ gap: '12px', alignItems: 'center' }}>
            <ShieldCheckIcon size={18} color="var(--primary-color)" />
            <h3 className="station-form-section-title" style={{ margin: 0 }}>{t('audit.forensics.panel_title').toUpperCase()}</h3>
          </div>
          <button className="station-btn secondary tiny" onClick={loadLogs} disabled={isLoading}>
            <RefreshCwIcon size={14} className={isLoading ? 'spin' : ''} />
          </button>
        </div>

        {/* Filter Bar */}
        <div className="flex-row" style={{ gap: '12px', flexWrap: 'wrap', padding: '16px', background: 'var(--surface-color)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
          <div className="flex-col" style={{ flex: 1, minWidth: '140px' }}>
            <label className="station-registry-item-meta" style={{ fontSize: '0.6rem', marginBottom: '6px' }}>{t('audit.forensics.filter_module')}</label>
            <select className="station-input" value={mode} onChange={e => setMode(e.target.value as any)} style={{ height: '36px', fontSize: '0.75rem', width: '100%' }}>
              <option value="SECURITY">{t('audit.forensics.module_security')}</option>
              <option value="REGTECH">{t('audit.forensics.module_regtech')}</option>
              <option value="ALL">{t('audit.forensics.module_all')}</option>
            </select>
          </div>

          <div className="flex-col" style={{ flex: 1, minWidth: '140px' }}>
            <label className="station-registry-item-meta" style={{ fontSize: '0.6rem', marginBottom: '6px' }}>{t('audit.forensics.filter_category')}</label>
            <select className="station-input" value={categoryFilter} onChange={e => setCategoryFilter(e.target.value as any)} style={{ height: '36px', fontSize: '0.75rem', width: '100%' }}>
              <option value="ALL">{t('audit.forensics.cat_all')}</option>
              <option value="AUTH">{t('audit.forensics.cat_auth')}</option>
              <option value="WORKSPACE">{t('audit.forensics.cat_workspace')}</option>
              <option value="OPERATORS">{t('audit.forensics.cat_operators')}</option>
              <option value="CONFIG">{t('audit.forensics.cat_config')}</option>
              <option value="DATA">{t('audit.forensics.cat_data')}</option>
              <option value="OTHER">{t('audit.forensics.cat_other')}</option>
            </select>
          </div>

          <div className="flex-col" style={{ flex: 1, minWidth: '180px' }}>
            <label className="station-registry-item-meta" style={{ fontSize: '0.6rem', marginBottom: '6px' }}>{t('audit.forensics.filter_event')}</label>
            <select className="station-input" value={typeFilter || 'ALL'} onChange={e => setTypeFilter(e.target.value)} style={{ height: '36px', fontSize: '0.75rem', width: '100%' }}>
              <option value="ALL">{t('audit.forensics.type_all')}</option>
              {eventTypes.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>

          <div className="flex-col" style={{ flex: 1, minWidth: '140px' }}>
            <label className="station-registry-item-meta" style={{ fontSize: '0.6rem', marginBottom: '6px' }}>{t('audit.forensics.filter_severity')}</label>
            <select className="station-input" value={severityFilter} onChange={e => setSeverityFilter(e.target.value as any)} style={{ height: '36px', fontSize: '0.75rem', width: '100%' }}>
              <option value="ALL">{t('audit.forensics.sev_all')}</option>
              <option value="INFO">{t('audit.forensics.sev_info')}</option>
              <option value="WARN">{t('audit.forensics.sev_warn')}</option>
              <option value="CRITICAL">{t('audit.forensics.sev_crit')}</option>
            </select>
          </div>
        </div>

        {/* ACTIVE FILTERS CHIPS */}
        {(typeFilter && typeFilter !== 'ALL' || entityTypeFilter) && (
          <div className="flex-row" style={{ gap: '8px' }}>
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
                 {t(`audit.forensics.entities.${entityTypeFilter}`) !== `audit.forensics.entities.${entityTypeFilter}` 
                   ? t(`audit.forensics.entities.${entityTypeFilter}`) 
                   : entityTypeFilter}
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
      </header>

      <div className="station-card flex-col" style={{ flex: 1, padding: 0, overflow: 'hidden' }}>
        <div className="station-table-header" style={{ background: 'var(--surface-color)', display: 'flex', alignItems: 'center', height: '40px', fontSize: '0.65rem', fontWeight: 900, opacity: 0.5 }}>
          <div style={{ width: '160px', paddingLeft: '16px' }}>{t('audit.forensics.col_time').toUpperCase()}</div>
          <div style={{ width: '180px' }}>{t('audit.forensics.col_type').toUpperCase()}</div>
          <div style={{ width: '120px' }}>{t('audit.forensics.col_actor').toUpperCase()}</div>
          <div style={{ width: '140px' }}>{t('audit.forensics.col_entity').toUpperCase()}</div>
          <div style={{ flex: 1 }}>{t('audit.forensics.col_message').toUpperCase()}</div>
          <div style={{ width: '80px', textAlign: 'center', paddingRight: '16px' }}>{t('audit.forensics.col_sev').toUpperCase()}</div>
        </div>
        <div style={{ flex: 1, overflowY: 'auto' }}>
          <table className="station-table">
            <tbody style={{ borderTop: 'none' }}>
              {filteredLogs.map(log => (
                <tr 
                  key={log.id} 
                  className={selectedLogId === log.id ? 'active' : ''} 
                  onClick={() => setSelectedLogId(log.id)}
                  style={{ cursor: 'pointer' }}
                >
                  <td style={{ width: '160px', opacity: 0.6, fontSize: '0.7rem', paddingLeft: '16px' }}>
                    {new Date(log.timestamp).toLocaleString()}
                  </td>
                  <td style={{ width: '180px' }}>
                    <div style={{ fontSize: '0.55rem', opacity: 0.5, letterSpacing: '1px' }}>{t(`audit.forensics.cat_${getCategory(log).toLowerCase()}`).toUpperCase()}</div>
                    <div style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--primary-color)' }}>{log.details?.eventType || log.action}</div>
                  </td>
                  <td style={{ width: '120px' }}>
                    {log.details?.actorId ? (
                      <Link 
                        href={`/supervisor?tab=operators&operatorId=${encodeURIComponent(log.details.actorId)}`}
                        className="audit-link"
                      >
                        {log.details.actorUser || log.details.actorId.split('-')[0]}
                      </Link>
                    ) : '—'}
                  </td>
                  <td style={{ width: '140px' }}>
                    {log.details?.entityType ? (
                      <button 
                        className={`station-pill ${entityTypeFilter === log.details.entityType ? 'active' : ''}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          setEntityTypeFilter(prev => prev === log.details?.entityType ? null : (log.details?.entityType || null));
                        }}
                        style={{ fontSize: '0.6rem', padding: '2px 8px', borderRadius: '4px' }}
                      >
                        {t(`audit.forensics.entities.${log.details.entityType}`) !== `audit.forensics.entities.${log.details.entityType}`
                          ? t(`audit.forensics.entities.${log.details.entityType}`)
                          : log.details.entityType}
                      </button>
                    ) : (
                      <span style={{ fontSize: '0.7rem', opacity: 0.7 }}>
                        {log.details?.entityType || '—'}{log.details?.entityId ? `:${log.details.entityId.split('-')[0]}` : ''}
                      </span>
                    )}
                  </td>
                  <td style={{ flex: 1 }}>
                    <div style={{ wordBreak: 'break-word', maxWidth: '500px', fontSize: '0.8rem', opacity: 0.9 }}>
                      {resolveMessage(log)}
                    </div>
                  </td>
                  <td style={{ width: '80px', textAlign: 'center', paddingRight: '16px' }}>
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
    </div>

    {selectedLog && (
        <div className="flex-col animate-slide-in-right" style={{ width: '400px', gap: '16px', paddingLeft: '20px', borderLeft: '1px solid var(--border-color)', overflowY: 'auto' }}>
           <div className="flex-row" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
             <h4 style={{ margin: 0, fontSize: '0.7rem', fontWeight: 900, color: 'var(--primary-color)' }}>{t('audit.forensics.detail_title').toUpperCase()}</h4>
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
                <p>{t('audit.forensics.no_diff').toUpperCase()}</p>
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
          background: var(--surface-color);
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
