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
  InfoIcon
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

    /**
     * Security Health Summary Logic (Phase 15 Parametrized)
     */
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
    }, [kpis, telemetry]);

    useEffect(() => {
        const fetchHistory = async () => {
            let collection = db.audit_history_v6.where('timestamp').between(fromTs, toTs, true, true);

            // Filtering at source where possible, or in memory for complex and conditions
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

            // Reverse and limit
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
                    fontSize: '0.85rem'
                }}
            >
                <div style={{ width: '140px', opacity: 0.6, fontSize: '0.75rem' }}>
                    {new Date(record.timestamp).toLocaleString()}
                </div>
                <div style={{ width: '100px' }}>
                    <span className={`station-badge station-badge-${record.category === 'AUTH' ? 'orange' : record.category === 'RBAC' ? 'green' : record.category === 'CONFIG' ? 'blue' : 'blue'}`}>
                        {record.category}
                    </span>
                </div>
                <div style={{ flex: 1, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {t(record.action) || record.action}
                </div>
                <div style={{ width: '80px', textAlign: 'right', display: 'flex', gap: '4px', justifyContent: 'flex-end', alignItems: 'center' }}>
                    <span className={`station-badge ${severity === 'CRITICAL' ? 'station-badge-orange' : severity === 'WARN' ? 'station-badge-blue' : ''}`} style={{ fontSize: '0.65rem' }}>
                        {severity}
                    </span>
                    {record.action === 'LETTERSMOKETESTFAILED' && (
                        <span className="station-badge" style={{ fontSize: '0.55rem', background: 'rgba(239, 68, 68, 0.1)', color: 'var(--error-color)', borderColor: 'var(--error-color)' }}>SMOKE</span>
                    )}
                </div>
            </div>
        );
    };

    const selectedRecord = records.find(r => r.id === selectedId);

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: '20px' }}>
            
            {/* SECURITY HEALTH SUMMARY (Phase 14.3 Template) */}
            <div className="station-card" style={{ background: 'var(--surface-color)', borderLeft: '4px solid var(--primary-color)', padding: '16px 20px' }}>
               <div className="flex-col" style={{ gap: '12px' }}>
                  <div className="flex-row" style={{ alignItems: 'center', gap: '10px' }}>
                     <ShieldIcon size={18} color="var(--primary-color)" />
                     <div style={{ fontWeight: 800, fontSize: '0.85rem', letterSpacing: '0.5px' }}>RESUMEN DE SALUD DE SEGURIDAD (DIAGNÓSTICO AUTOMÁTICO)</div>
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
                          fontSize: '0.8rem',
                          background: 'rgba(0,0,0,0.02)',
                          padding: '6px 12px',
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
                        <span style={{ fontSize: '0.6rem', opacity: 0.4, fontWeight: 700 }}>[FILTRAR]</span>
                      </div>
                    ))}
                  </div>
               </div>
            </div>

            {/* KPI CARDS (v2 Parametrized) */}
            <div className="station-form-grid" style={{ gridTemplateColumns: 'repeat(5, 1fr)' }}>
               <KPIItem 
                 val={kpis.failedAuthCount} 
                 label="AUTH_FAILURES" 
                 status={telemetry ? (kpis.failedAuthCount >= telemetry.security.securityThresholds.failedAuthHigh ? 'crit' : kpis.failedAuthCount >= telemetry.security.securityThresholds.failedAuthLow ? 'warn' : 'ok') : 'ok'} 
               />
               <KPIItem 
                 val={kpis.sessionLocks.inactivity + kpis.sessionLocks.manual} 
                 label={`SESSION_LOCKS (I:${kpis.sessionLocks.inactivity}/M:${kpis.sessionLocks.manual})`}
                 status={telemetry ? (kpis.sessionLocks.inactivity > telemetry.security.securityThresholds.inactivityLocksHigh ? 'warn' : 'ok') : 'ok'} 
               />
               <KPIItem 
                 val={kpis.rbacChangesCount} 
                 label="RBAC_ALTS" 
                 status={telemetry ? (kpis.rbacChangesCount >= telemetry.security.securityThresholds.rbacChangesAttention ? 'warn' : 'ok') : 'ok'} 
               />
               <KPIItem 
                 val={`${kpis.dataOps.success}/${kpis.dataOps.failed}`} 
                 label="DATA_OPS (OK/ERR)" 
                 status={telemetry ? (kpis.dataOps.failed >= telemetry.security.securityThresholds.dataOpsErrorAttention ? 'crit' : 'ok') : 'ok'} 
               />
               <KPIItem 
                 val={kpis.ikUnlocks} 
                 label="IK_UNLOCKS" 
                 status={kpis.ikUnlocks > 1 ? 'warn' : 'ok'} 
               />
            </div>

            {/* TOOLBAR */}
            <div className="flex-row" style={{ gap: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
                <div className="flex-col">
                    <label className="station-label" style={{ fontSize: '0.65rem' }}>CATEGORÍA</label>
                    <select className="station-input" value={categoryFilter} onChange={e => setCategoryFilter(e.target.value as any)} style={{ width: '130px', height: '36px' }}>
                        <option value="ALL">TODAS</option>
                        <option value="AUTH">AUTH</option>
                        <option value="RBAC">RBAC</option>
                        <option value="CONFIG">CONFIG</option>
                        <option value="DATA">DATA</option>
                        <option value="SYSTEM">SYSTEM</option>
                    </select>
                </div>
                <div className="flex-col">
                    <label className="station-label" style={{ fontSize: '0.65rem' }}>SEVERIDAD</label>
                    <select className="station-input" value={severityFilter} onChange={e => setSeverityFilter(e.target.value as any)} style={{ width: '110px', height: '36px' }}>
                        <option value="ALL">TODAS</option>
                        <option value="CRITICAL">CRITICAL</option>
                        <option value="WARN">WARN</option>
                        <option value="INFO">INFO</option>
                    </select>
                </div>
                <div className="flex-col">
                    <label className="station-label" style={{ fontSize: '0.65rem' }}>VENTANA_TIEMPO</label>
                    <select className="station-input" value={timeRange} onChange={e => setTimeRange(Number(e.target.value))} style={{ width: '120px', height: '36px' }}>
                        <option value={1}>1_HORA</option>
                        <option value={24}>24_HORAS</option>
                        <option value={168}>7_DÍAS</option>
                        <option value={720}>30_DÍAS</option>
                    </select>
                </div>

                <div className="flex-col" style={{ marginLeft: 'auto' }}>
                    <label className="station-label" style={{ fontSize: '0.65rem' }}>RETENCIÓN_DEXIE</label>
                    <div className="flex-row" style={{ gap: '8px', alignItems: 'center' }}>
                        <select className="station-input" value={retention.months} onChange={e => handleRetentionChange(Number(e.target.value))} style={{ width: '110px', height: '36px' }}>
                            <option value={3}>3_MESES</option>
                            <option value={6}>6_MESES</option>
                            <option value={12}>12_MESES</option>
                        </select>
                        <ClockIcon size={14} style={{ opacity: 0.5 }} />
                    </div>
                </div>
            </div>

            <div style={{ display: 'flex', flex: 1, gap: '20px', minHeight: 0 }}>
                {/* TABLE SECTION */}
                <div style={{ flex: 2, border: '1px solid var(--border-color)', background: 'var(--surface-color)', position: 'relative', borderRadius: '4px', overflow: 'hidden' }}>
                    <IndustrialVirtualTable
                        items={records}
                        totalItems={records.length}
                        itemHeight={ITEM_HEIGHT}
                        containerHeight={500}
                        renderRow={renderRow}
                    />
                </div>

                {/* DETAIL SECTION */}
                <div style={{ flex: 1, border: '1px solid var(--border-color)', background: 'var(--bg-color-alt)', padding: '20px', overflowY: 'auto', borderRadius: '4px' }}>
                    {selectedRecord ? (
                        <div className="flex-col" style={{ gap: '16px' }}>
                            <div style={{ paddingBottom: '12px', borderBottom: '1px solid var(--border-color)' }}>
                                <div style={{ fontSize: '0.65rem', fontWeight: 800, color: 'var(--primary-color)' }}>{selectedRecord.module}</div>
                                <h3 style={{ margin: '4px 0', fontSize: '1rem' }}>{t(JSON.parse(selectedRecord.details).data?.messageKey) || t(selectedRecord.action) || selectedRecord.action}</h3>
                                <div style={{ opacity: 0.5, fontSize: '0.75rem' }}>{new Date(selectedRecord.timestamp).toLocaleString()}</div>
                                {selectedRecord.action === 'LETTERSMOKETESTFAILED' && (
                                    <div style={{ marginTop: '8px', padding: '8px', background: 'rgba(239, 68, 68, 0.05)', borderLeft: '3px solid var(--error-color)', fontSize: '0.75rem' }}>
                                        <strong>SMOKE TEST ERROR:</strong> {t('audit.smoke.failed')}
                                    </div>
                                )}
                            </div>

                            {/* LETTERQA Enriched Details (Phase 20) */}
                            {selectedRecord.module === 'LETTERQA' && (() => {
                                const data = JSON.parse(selectedRecord.details).data || {};
                                return (
                                    <div className="station-tech-summary" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px', background: 'rgba(2, 132, 199, 0.05)', padding: '16px', borderRadius: '4px', border: '1px solid rgba(2, 132, 199, 0.1)' }}>
                                        <div className="station-tech-item">
                                            <span className="station-tech-label" style={{ fontSize: '0.6rem', opacity: 0.5, display: 'block', fontWeight: 800 }}>{t('audit.letterqa.lote').toUpperCase()}</span>
                                            <div style={{ fontWeight: 700 }}>{data.lote || 'N/A'}</div>
                                        </div>
                                        <div className="station-tech-item">
                                            <span className="station-tech-label" style={{ fontSize: '0.6rem', opacity: 0.5, display: 'block', fontWeight: 800 }}>{t('audit.letterqa.doc').toUpperCase()}</span>
                                            <div style={{ fontWeight: 700, fontFamily: 'var(--font-mono)' }}>{data.codDocumento || 'N/A'}</div>
                                        </div>
                                        <div className="station-tech-item">
                                            <span className="station-tech-label" style={{ fontSize: '0.6rem', opacity: 0.5, display: 'block', fontWeight: 800 }}>{t('audit.letterqa.preset').toUpperCase()}</span>
                                            <div style={{ fontSize: '0.75rem' }}>{data.presetName || data.presetId || 'N/A'}</div>
                                        </div>
                                        <div className="station-tech-item">
                                            <span className="station-tech-label" style={{ fontSize: '0.6rem', opacity: 0.5, display: 'block', fontWeight: 800 }}>{t('audit.letterqa.catdoc').toUpperCase()}</span>
                                            <div style={{ fontSize: '0.75rem' }}>{data.catDocName || data.catDocId || 'N/A'}</div>
                                        </div>
                                        <div className="station-tech-item">
                                            <span className="station-tech-label" style={{ fontSize: '0.6rem', opacity: 0.5, display: 'block', fontWeight: 800 }}>{t('audit.letterqa.template').toUpperCase()}</span>
                                            <div style={{ fontSize: '0.75rem' }}>{data.templateName || data.templateId || 'N/A'}</div>
                                        </div>
                                        <div className="station-tech-item">
                                            <span className="station-tech-label" style={{ fontSize: '0.6rem', opacity: 0.5, display: 'block', fontWeight: 800 }}>{t('audit.letterqa.mapping').toUpperCase()}</span>
                                            <div style={{ fontSize: '0.75rem' }}>{data.mappingName || data.mappingId || 'N/A'}</div>
                                        </div>
                                        <div className="station-tech-item" style={{ gridColumn: 'span 2' }}>
                                            <span className="station-tech-label" style={{ fontSize: '0.6rem', opacity: 0.5, display: 'block', fontWeight: 800 }}>{t('audit.letterqa.resolution').toUpperCase()}</span>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                <span style={{ fontWeight: 700, color: 'var(--primary-color)' }}>
                                                    {t(`audit.letterqa.reason_${data.reason?.toLowerCase()}`) || data.reason}
                                                </span>
                                                {data.isOperational === false && (
                                                    <span style={{ color: 'var(--error-color)', fontSize: '0.7rem' }}>
                                                        • {t('audit.letterqa.incomplete').toUpperCase()}
                                                    </span>
                                                )}
                                                {data.scoringDebug && (
                                                    <span className="station-badge" style={{ marginLeft: 'auto', background: 'var(--primary-color)', color: 'white' }}>
                                                        SCORE: {data.scoringDebug.total}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })()}

                            <pre style={{ fontSize: '0.75rem', padding: '12px', background: 'rgba(0,0,0,0.05)', borderRadius: '4px', overflowX: 'auto', border: '1px solid var(--border-color)' }}>
                                {JSON.stringify(JSON.parse(selectedRecord.details), null, 2)}
                            </pre>
                            
                            <div style={{ fontSize: '0.65rem', opacity: 0.4 }}>EVENT_ID: {selectedRecord.id}</div>
                        </div>
                    ) : (
                        <div className="station-empty-state" style={{ height: '100%' }}>
                            <ActivityIcon size={48} className="station-shimmer-text" />
                            <p style={{ fontWeight: 700, marginTop: '12px', opacity: 0.5 }}>SELECCIONE_EVENTO_FORENSE</p>
                        </div>
                    )}
                </div>
            </div>
            <style jsx>{`
              .health-sentence:hover {
                background: rgba(var(--primary-color-rgb), 0.05) !important;
                border-color: rgba(var(--primary-color-rgb), 0.1) !important;
              }
            `}</style>
        </div>
    );
};

const KPIItem = ({ val, label, status }: { val: string | number, label: string, status: 'ok' | 'warn' | 'crit' }) => (
    <div className="station-card flex-col" style={{ alignItems: 'center', justifyContent: 'center', padding: '12px' }}>
      <div style={{ 
        fontSize: '1.4rem', 
        fontWeight: 900, 
        color: status === 'crit' ? 'var(--error-color)' : status === 'warn' ? 'var(--status-warn)' : 'inherit' 
      }}>
        {val}
      </div>
      <div style={{ fontSize: '0.6rem', fontWeight: 700, opacity: 0.5, textAlign: 'center' }}>{label}</div>
    </div>
);
