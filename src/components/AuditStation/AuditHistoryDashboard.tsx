'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { db } from '@/lib/db/db';
import { useLanguage } from '@/lib/context/LanguageContext';
import { useWorkspace } from '@/lib/context/WorkspaceContext';
import { ForbiddenPanel } from '../common/ForbiddenPanel';
import { IndustrialVirtualTable } from '../common/IndustrialVirtualTable';
import { 
  ListIcon, 
  SearchIcon, 
  AlertTriangleIcon, 
  ActivityIcon, 
  ShieldIcon, 
  ClockIcon,
  CheckCircleIcon,
  InfoIcon,
  LoaderIcon
} from '../common/Icons';
import { loadAuditRetention, saveAuditRetention, AuditRetentionSettings } from '@/lib/utils/audit-retention-settings';
import { purgeOldAuditRecords } from '@/lib/utils/audit-retention';

import { useSecurityKpis, SecurityKpis } from '@/lib/hooks/useSecurityKpis';
import { AuditCategory } from '@/lib/types/audit.types';
import { auditService } from '@/lib/services/AuditService';
import { TelemetryConfigService } from '@/lib/services/telemetry-config.service';

const ITEM_HEIGHT = 48;

/**
 * Enterprise Security Audit Dashboard (Phase 14.3 Refined)
 */
export const AuditHistoryDashboard: React.FC = () => {
    const { t } = useLanguage();
    const { can, currentOperator } = useWorkspace();

    if (!can('AUDIT_VIEW')) {
        return <ForbiddenPanel capability="AUDIT_VIEW" />;
    }

    const [records, setRecords] = useState<any[]>([]);
    const [categoryFilter, setCategoryFilter] = useState<AuditCategory | 'ALL'>('ALL');
    const [severityFilter, setSeverityFilter] = useState<string | 'ALL'>('ALL');
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [retention, setRetention] = useState<AuditRetentionSettings>(() => loadAuditRetention());
    
    // Time Range State
    const [timeRange, setTimeRange] = useState<number>(24); // hours
    const toTs = Date.now();
    const fromTs = toTs - (timeRange * 60 * 60 * 1000);

    const { kpis, isLoading: kpisLoading } = useSecurityKpis(fromTs, toTs);

    const handleRetentionChange = async (months: number) => {
        const next = { months: months as any };
        setRetention(next);
        saveAuditRetention(next);
        purgeOldAuditRecords();

        await auditService.log({
          module: 'AUDIT',
          messageKey: 'audit.config.update',
          status: 'WARNING',
          operatorId: currentOperator?.id,
          details: {
            eventType: 'AUDIT_CONFIG_UPDATE',
            entityType: 'AUDIT_CONFIG',
            entityId: 'GLOBAL',
            actorId: currentOperator?.id,
            actorUser: currentOperator?.username,
            severity: 'WARN',
            context: {
              retentionMonths: months
            }
          }
        });
    };

    const [telemetry, setTelemetry] = useState<any>(null);

    useEffect(() => {
        TelemetryConfigService.loadConfig().then(setTelemetry);
    }, []);

    const healthSummary = useMemo(() => {
        if (!telemetry) return [];
        const sentences: { text: string; status: 'ok' | 'warn' | 'crit'; type: AuditCategory | 'ALL' }[] = [];
        const thresholds = telemetry.security.securityThresholds;

        // 1. Auth Failures
        if (kpis.failedAuthCount === 0) {
            sentences.push({ text: t('audit.diagnostics.auth_ok'), status: 'ok', type: 'AUTH' });
        } else if (kpis.failedAuthCount < thresholds.failedAuthLow) {
            sentences.push({ text: t('audit.diagnostics.auth_noise', { n: kpis.failedAuthCount }), status: 'ok', type: 'AUTH' });
        } else if (kpis.failedAuthCount < thresholds.failedAuthHigh) {
            sentences.push({ text: t('audit.diagnostics.auth_warn', { n: kpis.failedAuthCount }), status: 'warn', type: 'AUTH' });
        } else {
            sentences.push({ text: t('audit.diagnostics.auth_crit', { n: kpis.failedAuthCount }), status: 'crit', type: 'AUTH' });
        }

        // 2. Session Locks
        const totalLocks = kpis.sessionLocks.inactivity + kpis.sessionLocks.manual;
        if (totalLocks === 0) {
            sentences.push({ text: t('audit.diagnostics.locks_none'), status: 'warn', type: 'AUTH' });
        } else if (kpis.sessionLocks.inactivity > thresholds.inactivityLocksHigh) {
            sentences.push({ text: t('audit.diagnostics.locks_warn', { n: kpis.sessionLocks.inactivity }), status: 'warn', type: 'AUTH' });
        } else {
            sentences.push({ text: t('audit.diagnostics.locks_ok', { inactivity: kpis.sessionLocks.inactivity, manual: kpis.sessionLocks.manual }), status: 'ok', type: 'AUTH' });
        }

        // 3. RBAC Changes
        if (kpis.rbacChangesCount === 0) {
            sentences.push({ text: t('audit.diagnostics.rbac_ok'), status: 'ok', type: 'RBAC' });
        } else if (kpis.rbacChangesCount >= thresholds.rbacChangesAttention) {
            sentences.push({ text: t('audit.diagnostics.rbac_warn', { n: kpis.rbacChangesCount }), status: 'warn', type: 'RBAC' });
        } else {
            sentences.push({ text: t('audit.diagnostics.rbac_minor', { n: kpis.rbacChangesCount }), status: 'ok', type: 'RBAC' });
        }

        // 4. Data Operations
        if (kpis.dataOps.total === 0) {
            sentences.push({ text: t('audit.diagnostics.data_none'), status: 'ok', type: 'DATA' });
        } else {
            const hasTooManyErrors = kpis.dataOps.failed >= thresholds.dataOpsErrorAttention;
            sentences.push({ 
                text: t('audit.diagnostics.data_stats', { total: kpis.dataOps.total, success: kpis.dataOps.success, failed: kpis.dataOps.failed }), 
                status: hasTooManyErrors ? 'crit' : 'ok', 
                type: 'DATA' 
            });
        }

        return sentences;
    }, [kpis, telemetry, t]);

    useEffect(() => {
        const fetchHistory = async () => {
            let collection = db.audit_history_v6.where('timestamp').between(fromTs, toTs, true, true);
            let data = await collection.toArray();

            if (categoryFilter !== 'ALL') {
                data = data.filter(r => r.category === categoryFilter);
            }
            
            if (severityFilter !== 'ALL') {
              data = data.filter(r => {
                try {
                  const details = JSON.parse(r.details || '{}');
                  return details.severity === severityFilter;
                } catch { return false; }
              });
            }

            data.sort((a, b) => b.timestamp - a.timestamp);
            setRecords(data.slice(0, 500));
        };
        fetchHistory();
    }, [categoryFilter, severityFilter, fromTs, toTs]);

    const renderRow = (record: any | undefined, idx: number, style: React.CSSProperties) => {
        if (!record) return <div style={style}>...</div>;
        const isSelected = selectedId === record.id;
        
        let severity = 'INFO';
        try {
           severity = JSON.parse(record.details).severity || 'INFO';
        } catch {}

        return (
            <div
                key={record.id}
                onClick={() => setSelectedId(record.id)}
                style={{
                    ...style,
                    display: 'flex',
                    alignItems: 'center',
                    padding: '0 16px',
                    borderBottom: '1px solid var(--border-color)',
                    background: isSelected ? 'rgba(var(--primary-color), 0.1)' : 'transparent',
                    cursor: 'pointer',
                    transition: 'background 0.2s ease',
                    fontSize: '0.8rem'
                }}
            >
                <div style={{ width: '140px', opacity: 0.6, fontSize: '0.7rem', fontWeight: 700 }}>
                    {new Date(record.timestamp).toLocaleString().toUpperCase()}
                </div>
                <div style={{ width: '100px' }}>
                    <span className={`station-badge ${record.category === 'AUTH' ? 'warn' : record.category === 'RBAC' ? 'success' : record.category === 'CONFIG' ? 'info' : 'info'}`}>
                        {record.category}
                    </span>
                </div>
                <div style={{ flex: 1, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {t(record.action) || record.action}
                </div>
                <div style={{ width: '80px', textAlign: 'right', display: 'flex', gap: '4px', justifyContent: 'flex-end', alignItems: 'center' }}>
                    <span className={`station-badge ${severity === 'CRITICAL' ? 'err' : severity === 'WARN' ? 'warn' : ''}`} style={{ fontSize: '0.55rem' }}>
                        {severity}
                    </span>
                    {record.action === 'LETTERSMOKETESTFAILED' && (
                        <span className="station-badge err tiny" style={{ fontSize: '0.5rem' }}>SMOKE</span>
                    )}
                </div>
            </div>
        );
    };

    const selectedRecord = records.find(r => r.id === selectedId);

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: '20px' }} className="animate-fade-in">
            
            <div className="station-card" style={{ background: 'var(--surface-color)', borderLeft: '4px solid var(--primary-color)', padding: '16px 20px' }}>
               <div className="flex-col" style={{ gap: '12px' }}>
                  <div className="flex-row" style={{ alignItems: 'center', gap: '10px' }}>
                     <ShieldIcon size={18} color="var(--primary-color)" />
                     <div style={{ fontWeight: 900, fontSize: '0.8rem', letterSpacing: '1px' }}>{t('audit.diagnostics_title').toUpperCase()}</div>
                  </div>
                  <div className="flex-col" style={{ gap: '8px' }}>
                    {healthSummary.map((sentence, idx) => (
                      <div 
                        key={idx} 
                        className="health-sentence clickable"
                        onClick={() => setCategoryFilter(sentence.type)}
                        style={{ 
                          display: 'flex', 
                          gap: '10px', 
                          alignItems: 'baseline', 
                          fontSize: '0.75rem',
                          background: 'rgba(255,255,255,0.02)',
                          padding: '8px 12px',
                          borderRadius: '4px',
                          border: '1px solid transparent',
                          transition: 'all 0.2s ease',
                          cursor: 'pointer'
                        }}
                      >
                        {sentence.status === 'ok' ? <CheckCircleIcon size={14} color="var(--status-ok)" /> : 
                         sentence.status === 'warn' ? <InfoIcon size={14} color="var(--status-warn)" /> : 
                         <AlertTriangleIcon size={14} color="var(--error-color)" />}
                        <span style={{ flex: 1 }}>{sentence.text}</span>
                        <span style={{ fontSize: '0.55rem', opacity: 0.4, fontWeight: 900, letterSpacing: '0.5px' }}>[FILTER]</span>
                      </div>
                    ))}
                  </div>
               </div>
            </div>

            <div className="station-form-grid audit-kpi-grid">
               <KPIItem 
                 val={kpis.failedAuthCount} 
                 label={t('audit.kpi_auth_failures' as any) || 'AUTH_FAILURES'} 
                 status={telemetry ? (kpis.failedAuthCount >= telemetry.security.securityThresholds.failedAuthHigh ? 'crit' : kpis.failedAuthCount >= telemetry.security.securityThresholds.failedAuthLow ? 'warn' : 'ok') : 'ok'} 
               />
               <KPIItem 
                 val={kpis.sessionLocks.inactivity + kpis.sessionLocks.manual} 
                 label={t('audit.kpi_session_locks' as any) || `SESSION_LOCKS (I:${kpis.sessionLocks.inactivity}/M:${kpis.sessionLocks.manual})`}
                 status={telemetry ? (kpis.sessionLocks.inactivity > telemetry.security.securityThresholds.inactivityLocksHigh ? 'warn' : 'ok') : 'ok'} 
               />
               <KPIItem 
                 val={kpis.rbacChangesCount} 
                 label={t('audit.kpi_rbac_alts' as any) || 'RBAC_ALTS'} 
                 status={telemetry ? (kpis.rbacChangesCount >= telemetry.security.securityThresholds.rbacChangesAttention ? 'warn' : 'ok') : 'ok'} 
               />
               <KPIItem 
                 val={`${kpis.dataOps.success}/${kpis.dataOps.failed}`} 
                 label={t('audit.kpi_data_ops' as any) || 'DATA_OPS (OK/ERR)'} 
                 status={telemetry ? (kpis.dataOps.failed >= telemetry.security.securityThresholds.dataOpsErrorAttention ? 'crit' : 'ok') : 'ok'} 
               />
               <KPIItem 
                 val={kpis.ikUnlocks} 
                 label={t('audit.kpi_ik_unlocks' as any) || 'IK_UNLOCKS'} 
                 status={kpis.ikUnlocks > 1 ? 'warn' : 'ok'} 
               />
            </div>

            <div className="flex-row audit-toolbar" style={{ gap: '16px', alignItems: 'center', flexWrap: 'wrap', background: 'rgba(0,0,0,0.2)', padding: '12px', borderRadius: '4px' }}>
                <div className="flex-col">
                    <label className="station-label" style={{ fontSize: '0.6rem' }}>{t('audit.filter_category')}</label>
                    <select className="station-input" value={categoryFilter} onChange={e => setCategoryFilter(e.target.value as any)} style={{ width: '130px', height: '36px', fontSize: '0.75rem' }}>
                        <option value="ALL">ALL</option>
                        <option value="AUTH">AUTH</option>
                        <option value="RBAC">RBAC</option>
                        <option value="CONFIG">CONFIG</option>
                        <option value="DATA">DATA</option>
                        <option value="SYSTEM">SYSTEM</option>
                    </select>
                </div>
                <div className="flex-col">
                    <label className="station-label" style={{ fontSize: '0.6rem' }}>{t('audit.filter_severity')}</label>
                    <select className="station-input" value={severityFilter} onChange={e => setSeverityFilter(e.target.value as any)} style={{ width: '110px', height: '36px', fontSize: '0.75rem' }}>
                        <option value="ALL">ALL</option>
                        <option value="CRITICAL">CRITICAL</option>
                        <option value="WARN">WARN</option>
                        <option value="INFO">INFO</option>
                    </select>
                </div>
                <div className="flex-col">
                    <label className="station-label" style={{ fontSize: '0.6rem' }}>{t('audit.filter_time')}</label>
                    <select className="station-input" value={timeRange} onChange={e => setTimeRange(Number(e.target.value))} style={{ width: '120px', height: '36px', fontSize: '0.75rem' }}>
                        <option value={1}>1_HOUR</option>
                        <option value={24}>24_HOURS</option>
                        <option value={168}>7_DAYS</option>
                        <option value={720}>30_DAYS</option>
                    </select>
                </div>

                <div className="flex-col retention-col" style={{ marginLeft: 'auto' }}>
                    <label className="station-label" style={{ fontSize: '0.6rem' }}>{t('audit.retention_dexie')}</label>
                    <div className="flex-row" style={{ gap: '8px', alignItems: 'center' }}>
                        <select className="station-input" value={retention.months} onChange={e => handleRetentionChange(Number(e.target.value))} style={{ width: '110px', height: '36px', fontSize: '0.75rem' }}>
                            <option value={3}>3_MONTHS</option>
                            <option value={6}>6_MONTHS</option>
                            <option value={12}>12_MONTHS</option>
                        </select>
                        <ClockIcon size={14} style={{ opacity: 0.5 }} />
                    </div>
                </div>
            </div>

            <div className="audit-main-layout" style={{ display: 'flex', flex: 1, gap: '20px', minHeight: 0 }}>
                <div className="audit-table-section station-card" style={{ padding: 0, overflow: 'hidden' }}>
                    <IndustrialVirtualTable
                        items={records}
                        totalItems={records.length}
                        itemHeight={ITEM_HEIGHT}
                        renderRow={renderRow}
                    />
                </div>

                <div className="audit-detail-section station-card flex-col" style={{ gap: '16px', background: 'rgba(0,0,0,0.2)' }}>
                    {selectedRecord ? (
                        <div className="flex-col" style={{ gap: '16px' }}>
                            <div style={{ paddingBottom: '12px', borderBottom: '1px solid var(--border-color)' }}>
                                <div style={{ fontSize: '0.6rem', fontWeight: 900, color: 'var(--primary-color)', letterSpacing: '1px' }}>{selectedRecord.module.toUpperCase()}</div>
                                <h3 style={{ margin: '8px 0', fontSize: '0.9rem', fontWeight: 900 }}>{t(JSON.parse(selectedRecord.details).data?.messageKey) || t(selectedRecord.action) || selectedRecord.action}</h3>
                                <div style={{ opacity: 0.4, fontSize: '0.65rem', fontWeight: 700 }}>{new Date(selectedRecord.timestamp).toLocaleString().toUpperCase()}</div>
                                {selectedRecord.action === 'LETTERSMOKETESTFAILED' && (
                                    <div style={{ marginTop: '12px', padding: '10px', background: 'rgba(239, 68, 68, 0.05)', borderLeft: '4px solid var(--error-color)', fontSize: '0.7rem', fontWeight: 600 }}>
                                        {t('audit.smoke.failed').toUpperCase()}
                                    </div>
                                )}
                            </div>

                            {selectedRecord.module === 'LETTERQA' && (() => {
                                const data = JSON.parse(selectedRecord.details).data || {};
                                return (
                                    <div className="station-tech-summary" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px', background: 'rgba(56, 189, 248, 0.05)', padding: '16px', borderRadius: '4px', border: '1px solid rgba(56, 189, 248, 0.1)' }}>
                                        <DetailItem label={t('audit.letterqa.lote')} val={data.lote} />
                                        <DetailItem label={t('audit.letterqa.doc')} val={data.codDocumento} mono />
                                        <DetailItem label={t('audit.letterqa.preset')} val={data.presetName || data.presetId} />
                                        <DetailItem label={t('audit.letterqa.catdoc')} val={data.catDocName || data.catDocId} />
                                        <DetailItem label={t('audit.letterqa.template')} val={data.templateName || data.templateId} />
                                        <DetailItem label={t('audit.letterqa.mapping')} val={data.mappingName || data.mappingId} />
                                        
                                        <div className="station-tech-item" style={{ gridColumn: 'span 2' }}>
                                            <span className="station-tech-label" style={{ fontSize: '0.55rem', opacity: 0.5, display: 'block', fontWeight: 900, marginBottom: '4px' }}>{t('audit.letterqa.resolution').toUpperCase()}</span>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                <span style={{ fontWeight: 900, color: 'var(--primary-color)', fontSize: '0.8rem' }}>
                                                    {(t(`audit.letterqa.reason_${data.reason?.toLowerCase()}`) || data.reason).toUpperCase()}
                                                </span>
                                                {data.isOperational === false && (
                                                    <span style={{ color: 'var(--error-color)', fontSize: '0.65rem', fontWeight: 900 }}>
                                                        • {t('audit.letterqa.incomplete').toUpperCase()}
                                                    </span>
                                                )}
                                                {data.scoringDebug && (
                                                    <span className="station-badge info tiny" style={{ marginLeft: 'auto' }}>
                                                        SCORE: {data.scoringDebug.total}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })()}

                            <pre style={{ fontSize: '0.7rem', padding: '12px', background: 'rgba(0,0,0,0.3)', borderRadius: '4px', overflowX: 'auto', border: '1px solid var(--border-color)', fontFamily: 'var(--font-mono)', opacity: 0.8 }}>
                                {JSON.stringify(JSON.parse(selectedRecord.details), null, 2)}
                            </pre>
                            
                            <div style={{ fontSize: '0.55rem', opacity: 0.3, fontFamily: 'var(--font-mono)' }}>EVENT_ID: {selectedRecord.id}</div>
                        </div>
                    ) : (
                        <div className="station-empty-state" style={{ height: '100%' }}>
                            <ActivityIcon size={48} className="station-shimmer-text" />
                            <p style={{ fontWeight: 900, marginTop: '16px', opacity: 0.3, letterSpacing: '2px' }}>{t('audit.empty_forensic').toUpperCase()}</p>
                        </div>
                    )}
                </div>
            </div>

            <style jsx>{`
              .health-sentence:hover {
                background: rgba(255, 255, 255, 0.05) !important;
                border-color: var(--primary-color-dim) !important;
              }

              .audit-kpi-grid {
                grid-template-columns: repeat(5, 1fr);
              }

              .audit-table-section {
                flex: 2;
              }
              .audit-detail-section {
                flex: 1;
              }

              @media (max-width: 1024px) {
                .audit-main-layout {
                  flex-direction: column;
                }
                .audit-table-section {
                  height: 400px;
                }
                .audit-kpi-grid {
                  grid-template-columns: repeat(3, 1fr);
                }
              }

              @media (max-width: 640px) {
                .audit-kpi-grid {
                  grid-template-columns: repeat(2, 1fr);
                }
                .audit-toolbar {
                  flex-direction: column;
                  align-items: stretch !important;
                }
                .audit-toolbar > div {
                  width: 100% !important;
                }
                .audit-toolbar select {
                  width: 100% !important;
                }
                .retention-col {
                  margin-left: 0 !important;
                }
              }
            `}</style>
        </div>
    );
};

const KPIItem = ({ val, label, status }: { val: string | number, label: string, status: 'ok' | 'warn' | 'crit' }) => (
    <div className="station-card flex-col" style={{ alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
      <div style={{ 
        fontSize: '1.4rem', 
        fontWeight: 900, 
        color: status === 'crit' ? 'var(--error-color)' : status === 'warn' ? 'var(--status-warn)' : 'var(--text-primary)',
        lineHeight: 1
      }}>
        {val}
      </div>
      <div style={{ fontSize: '0.55rem', fontWeight: 900, opacity: 0.4, textAlign: 'center', marginTop: '6px', letterSpacing: '0.5px' }}>{label.toUpperCase()}</div>
    </div>
);

const DetailItem = ({ label, val, mono }: { label: string, val: any, mono?: boolean }) => (
    <div className="station-tech-item">
        <span className="station-tech-label" style={{ fontSize: '0.55rem', opacity: 0.5, display: 'block', fontWeight: 900, marginBottom: '2px' }}>{label.toUpperCase()}</span>
        <div style={{ fontWeight: 700, fontSize: '0.8rem', fontFamily: mono ? 'var(--font-mono)' : 'inherit', overflow: 'hidden', textOverflow: 'ellipsis' }}>{val || 'N/A'}</div>
    </div>
);

