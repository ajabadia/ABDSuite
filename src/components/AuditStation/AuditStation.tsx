'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useLanguage } from '@/lib/context/LanguageContext';
import { GAWEB_FIELDS, serializeGawebRecord } from '@/lib/logic/gaweb-auditor.logic';
import { regulatoryService } from '@/lib/logic/RegulatoryService';
import { regulatoryOrchestrator } from '@/lib/logic/RegulatoryOrchestrator';
import { HolderMetadata, TinRequirement } from '@/lib/types/regulatory.types';
import { sanitizeFilename } from '@/lib/utils/filename.utils';
import { 
  ShieldCheckIcon, 
  AlertTriangleIcon, 
  SearchIcon, 
  DownloadIcon, 
  XIcon, 
  FileTextIcon,
  ListIcon,
  CogIcon
} from '@/components/common/Icons';

import { useLog } from '@/lib/context/LogContext';
import { useAuditWorker } from '@/lib/hooks/useAuditWorker';
import { IndustrialVirtualTable } from '@/components/common/IndustrialVirtualTable';
import { GawebRow, GawebErrorLite } from '@/lib/types/audit-worker.types';
import { GawebGoldenProfile } from '@/lib/types/gaweb-golden.types';

import { db } from '@/lib/db/db';
import { AuditHistoryDashboard } from './AuditHistoryDashboard';
import { TelemetryConfigService } from '@/lib/services/telemetry-config.service';
import { auditStationService } from '@/lib/services/AuditStationService';
import { useWorkspace } from '@/lib/context/WorkspaceContext';

type AuditPhase = 'IDLE' | 'LOADING' | 'ANALYZING' | 'SUMMARY' | 'EXPORTING';

const PAGE_SIZE = 200;
const ITEM_HEIGHT = 32;

const SEMANTIC_COLORS = ['#3b82f6', '#10b981', '#8b5cf6', '#06b6d4', '#ec4899', '#84cc16', '#a855f7', '#14b8a6'];

// COMPONENTE INDUSTRIAL: LineInspector (Era 6)
const LineInspector: React.FC<{ line: number, content: string, errors: GawebErrorLite[], t: any }> = ({ line, content, errors, t }) => {
  const paddedLine = content.padEnd(251, ' ');
  
  return (
    <div className="station-card" style={{ marginTop: '16px', background: 'rgba(0,0,0,0.4)', border: '1px solid var(--primary-color-dim)' }}>
      <div className="flex-row" style={{ justifyContent: 'space-between', padding: '8px 12px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
        <span className="station-registry-item-meta" style={{ fontWeight: 900 }}>LINE_INSPECTOR_V1 (OFFSET_HEX)</span>
        <span className="station-registry-item-meta" style={{ color: 'var(--primary-color)' }}>LNR: {line}</span>
      </div>
      
      <div style={{ padding: '16px', fontFamily: 'var(--font-roboto-mono)', fontSize: '0.85rem', position: 'relative', overflowX: 'auto', whiteSpace: 'pre' }}>
         <div style={{ opacity: 0.3, fontSize: '0.6rem', marginBottom: '8px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
            {'1234567890'.repeat(25).substring(0, 251)}
         </div>

         <div className="flex-row" style={{ position: 'relative', height: '24px' }}>
            {paddedLine.split('').map((char, i) => {
                const error = errors.find(e => i >= e.colStart && i < e.colEnd);
                const fieldIndex = GAWEB_FIELDS.findIndex(f => i >= f.startIndex && i < f.startIndex + f.length);
                const field = fieldIndex !== -1 ? GAWEB_FIELDS[fieldIndex] : null;

                let color = 'inherit';
                let background = 'transparent';
                let borderBottom = 'none';

                if (error) {
                    color = error.severity === 'ERROR' ? '#ef4444' : '#f59e0b';
                    background = `${color}22`;
                    borderBottom = `1px solid ${color}`;
                } else if (field) {
                    color = SEMANTIC_COLORS[fieldIndex % SEMANTIC_COLORS.length];
                    if (char === ' ') color = `${color}66`; // Dim espacios en blanco
                }

                return (
                    <span 
                        key={i} 
                        style={{ 
                            color, 
                            background,
                            borderBottom,
                            minWidth: '8.5px',
                            display: 'inline-block',
                            textAlign: 'center',
                            fontWeight: error ? 900 : (char !== ' ' ? 700 : 400)
                        }}
                        title={error ? `${error.field}: ${t(error.messageKey)}` : (field ? `${field.name} (Pos: ${i+1})` : `Pos: ${i+1}`)}
                    >
                        {char}
                    </span>
                );
            })}
         </div>
      </div>
      
      {errors.length > 0 && (
          <div style={{ padding: '12px', background: 'rgba(239, 68, 68, 0.05)', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
              {errors.map((e, i) => {
                  const countryIso = content.substring(130, 133).trim() || 'ES';
                  const tinResult = regulatoryService.validateTin(countryIso, content.substring(115, 130).trim());
                  
                  return (
                    <div key={i} className="flex-row" style={{ gap: '8px', fontSize: '0.75rem', marginBottom: '4px' }}>
                        <span style={{ color: e.severity === 'ERROR' ? '#ef4444' : '#f59e0b', fontWeight: 900 }}>
                           [{(() => {
                               const main = t(`shell.regtech_tin_names.${countryIso}.main`);
                               const aux = t(`shell.regtech_tin_names.${countryIso}.aux`);
                               if (main !== `shell.regtech_tin_names.${countryIso}.main`) {
                                   return aux && aux !== `shell.regtech_tin_names.${countryIso}.aux` ? `${main} (${aux})` : main;
                               }
                               return tinResult.tinType || e.field;
                           })()}]
                        </span>
                        <span style={{ opacity: 0.8 }}>{tinResult.explanation || tinResult.message || t(e.messageKey, { file: e.value })}</span>
                    </div>
                  );
              })}
          </div>
      )}
    </div>
  );
};

const MetadataCollectorForm: React.FC<{ 
    requirements: any[], 
    onValidate: (data: HolderMetadata) => void,
    onCancel: () => void,
    t: any 
}> = ({ requirements, onValidate, onCancel, t }) => {
    const [formData, setFormData] = useState<Record<string, any>>({});

    return (
        <div className="station-card" style={{ padding: '16px', background: 'rgba(0,0,0,0.6)', border: '1px solid var(--primary-color)' }}>
            <div className="station-form-section-title" style={{ marginBottom: '16px' }}>
                HIGH_FIDELITY_METADATA_COLLECTION
            </div>
            <div className="station-form-grid">
                {requirements.filter(req => {
                    if (typeof req === 'string') return true;
                    if (!req.scope) return true;
                    const hType = formData.holderType || 'ANY';
                    if (hType === 'ANY') return true;
                    return req.scope === hType;
                }).map((req, idx) => {
                    const isLegacy = typeof req === 'string';
                    if (isLegacy) {
                        return (
                            <div key={`legacy-${idx}`} className="module-col-12" style={{ padding: '8px', background: 'rgba(255,255,255,0.02)', borderRadius: '4px', fontSize: '0.65rem', opacity: 0.7, borderLeft: '2px solid rgba(255,255,255,0.1)', marginBottom: '8px' }}>
                                {req}
                            </div>
                        );
                    }

                    const r = req as any;
                    const hasSuggestions = r.suggestions && r.suggestions.length > 0;

                    return (
                        <div key={r.key} className="station-form-field">
                            <label className="station-label">
                                {t(`shell.regtech_fields.${r.key}`) !== `shell.regtech_fields.${r.key}` 
                                    ? t(`shell.regtech_fields.${r.key}`)
                                    : r.label.toUpperCase()}
                            </label>
                            {r.type === 'select' ? (
                                <select 
                                    className="station-input" 
                                    style={{ width: '100%' }}
                                    onChange={(e) => setFormData({...formData, [r.key]: e.target.value})}
                                >
                                    <option value="">---</option>
                                    {r.options?.map((opt: any) => (
                                        <option key={opt.value} value={opt.value}>
                                            {t(`shell.regtech_fields.${opt.label}`) !== `shell.regtech_fields.${opt.label}`
                                              ? t(`shell.regtech_fields.${opt.label}`)
                                              : opt.label.toUpperCase()}
                                        </option>
                                    ))}
                                </select>
                            ) : (
                                <>
                                    <input 
                                        type={r.type === 'date' ? 'date' : (r.type === 'number' ? 'number' : 'text')} 
                                        className="station-input" 
                                        style={{ width: '100%' }}
                                        placeholder={r.placeholder || (r.type === 'date' ? 'YYYY-MM-DD' : '')}
                                        list={hasSuggestions ? `suggestions-${r.key}` : undefined}
                                        onChange={(e) => setFormData({...formData, [r.key]: e.target.value})}
                                    />
                                    {hasSuggestions && (
                                      <datalist id={`suggestions-${r.key}`}>
                                        {r.suggestions.map((s: string, i: number) => (
                                          <option key={i} value={s} />
                                        ))}
                                      </datalist>
                                    )}
                                </>
                            )}
                        </div>
                    );
                })}
            </div>
            <div className="flex-row" style={{ marginTop: '20px', gap: '8px', justifyContent: 'flex-end' }}>
                <button className="station-btn tiny secondary" onClick={onCancel}>CANCEL</button>
                <button 
                    className="station-btn tiny" 
                    style={{ background: 'var(--primary-color)', color: 'black' }}
                    onClick={() => onValidate(formData as HolderMetadata)}
                >
                    RUN_SEMANTIC_CHECK
                </button>
            </div>
        </div>
    );
};

const AuditStation: React.FC = () => {
  const { t } = useLanguage();
  const { addLog: globalAddLog } = useLog();
  const { currentOperator } = useWorkspace();
  
  const [indexFile, setIndexFile] = useState<File | null>(null);
  const [archiveFile, setArchiveFile] = useState<File | null>(null);
  const [md5File, setMd5File] = useState<File | null>(null);

  const [activeTab, setActiveTab] = useState<'DATA' | 'ERRORS' | 'HISTORY'>('DATA');
  const [selectedLine, setSelectedLine] = useState<number | null>(null);
  const [isCollectingMetadata, setIsCollectingMetadata] = useState(false);
  const [semanticMetadata, setSemanticMetadata] = useState<Record<number, HolderMetadata>>({});
  const [phase, setPhase] = useState<AuditPhase>('IDLE');
  const [detectedProfile, setDetectedProfile] = useState<GawebGoldenProfile | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [warningThreshold, setWarningThreshold] = useState(2);
  const [samplingConfig, setSamplingConfig] = useState({ enabled: true, maxPerType: 10, sampleEvery: 1, maxPerDay: 5000 });

  // MOTOR INDUSTRIAL (Phase 2)
  const audit = useAuditWorker({ 
    encoding: 'iso-8859-1', 
    maxErrorsPreview: 5000 
  });

  const resetResults = useCallback(() => {
    audit.reset();
    setSelectedLine(null);
    setPhase('IDLE');
  }, [audit]);

  useEffect(() => {
    const loadSettings = async () => {
      const config = await TelemetryConfigService.loadConfig();
      setWarningThreshold(config.security.sessionWarningThresholdMinutes);
      if (config.security.auditSampling) {
        setSamplingConfig(config.security.auditSampling);
      }
    };
    loadSettings();
  }, []);

  const saveThreshold = async (val: number) => {
    setWarningThreshold(val);
    await TelemetryConfigService.saveConfig({
      security: { sessionWarningThresholdMinutes: val } as any
    });
    globalAddLog('SYSTEM', `Ajuste Seguridad: Umbral aviso sesión cambiado a ${val} min`, 'info');
  };

  const saveSampling = async (next: { enabled: boolean; maxPerType: number; sampleEvery: number; maxPerDay: number }) => {
    const prev = { ...samplingConfig };
    setSamplingConfig(next);
    await TelemetryConfigService.saveConfig({
      security: { auditSampling: next } as any
    });

    try {
      await auditStationService.logAuditResult(
        currentOperator?.id || 'system',
        'CONFIG',
        { totalErrors: 0, totalLines: 0 },
        { name: 'SAMPLING_CONFIG_UPDATE', version: '1.0' }
      );
      globalAddLog('SYSTEM', `Audit Config: Muestreo industrial actualizado (Max: ${next.maxPerType}, Every: ${next.sampleEvery})`, 'info');
    } catch (e) {
      console.error('Failed to log sampling update', e);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, slot: 'index' | 'archive' | 'md5') => {
    const f = e.target.files?.[0] || null;
    if (slot === 'index') setIndexFile(f);
    if (slot === 'archive') setArchiveFile(f);
    if (slot === 'md5') setMd5File(f);
    resetResults();
    if (slot === 'index' && f) autoDetectProfile(f);
  };

  const autoDetectProfile = async (file: File) => {
    try {
      const chunk = file.slice(0, 1024);
      const text = await chunk.text();
      const firstLine = text.split('\n')[0];
      if (firstLine.length < 32) return;

      const format = firstLine.substring(1, 3).trim();
      const docCode = firstLine.substring(26, 32).trim();

      const profile = await db.gaweb_golden_profiles_v6
        .where({ codigoDocumento: docCode, formatoCarta: format, active: 1 })
        .first();

      if (profile) {
        setDetectedProfile(profile);
        globalAddLog('AUDIT', `Perfil Golden Detectado: ${profile.name} (v${profile.version})`, 'info');
      } else {
        setDetectedProfile(null);
      }
    } catch (err) {
      console.error('[AUDIT-GOLDEN] Detection failed', err);
    }
  };

  const runValidation = async () => {
    if (!indexFile) return;
    
    try {
        auditStationService.validateOptions({ 
            encoding: 'iso-8859-1', 
            maxErrorsPreview: 5000,
            sampling: samplingConfig
        });

        globalAddLog('AUDIT', t('audit.logs.start', { file: indexFile.name }), 'info', { fileName: indexFile.name });
        
        let md5Text = '';
        if (md5File) {
            try {
                md5Text = await md5File.text();
            } catch(e) {
                console.error("Error reading MD5 file", e);
            }
        }
        
        setPhase('ANALYZING');
        audit.startAudit({ 
          gawebFile: indexFile, 
          zipFile: archiveFile || undefined, 
          md5Witness: md5Text,
          goldenProfile: detectedProfile || undefined,
          sampling: samplingConfig
        });
    } catch (err: any) {
        globalAddLog('AUDIT', err.message, 'error');
    }
  };

  useEffect(() => {
    if (audit.summary && !audit.isRunning) {
      globalAddLog('AUDIT', t('audit.logs.success', { n: audit.summary.totalErrors }), audit.summary.totalErrors > 0 ? 'error' : 'success', { fileName: indexFile?.name });
      setPhase('SUMMARY');

      const persistAudit = async () => {
          if (!indexFile || !audit.summary) return;
          try {
              await auditStationService.logAuditResult(
                  currentOperator?.id || 'system',
                  indexFile.name,
                  audit.summary,
                  detectedProfile
              );
              console.log('[ABDFN-AUDIT] Result persisted via AuditStationService.');
          } catch (e) {
              console.error('Failed to persist audit', e);
          }
      };
      persistAudit();

      if (audit.summary.totalErrors > 0) setActiveTab('ERRORS');
    }
  }, [audit.summary, audit.isRunning, globalAddLog, indexFile, t, currentOperator, detectedProfile]);


  const exportCsv = () => {
    if (!audit.summary || !indexFile) return;
    const errors = Array.from(audit.errorsWindows.values()).flat();
    const headers = [t('audit.col_line'), t('audit.col_field'), t('audit.col_pos'), t('audit.col_severity'), t('audit.col_message'), t('audit.col_value')].join(',');
    const rows = errors.map(e => `${e.line},${e.field},${e.position},${e.severity},"${t(e.messageKey, { file: e.value })}",${e.value}`).join('\n');
    const blob = new Blob([headers + '\n' + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const downloadName = `AUDIT_REPORT_${sanitizeFilename(indexFile.name).split('.')[0]}.csv`;
    const a = document.createElement('a'); a.href = url; a.download = downloadName; a.click();
    URL.revokeObjectURL(url);
  };

  // Renderizador de Filas de DATOS
  const renderDataRow = useCallback((row: GawebRow | undefined, idx: number, style: React.CSSProperties) => {
    if (!row) return (
        <div key={idx} style={{ ...style, opacity: 0.3, padding: '0 16px', fontSize: '10px', display: 'flex', alignItems: 'center', borderBottom: '1px solid var(--border-color)' }}>
            [STREAMING_CHUNK_LOADING_BLOCK_{Math.floor(idx / PAGE_SIZE)}]
        </div>
    );
    
    return (
      <div 
        key={idx} 
        style={{ 
          ...style, 
          display: 'flex', 
          borderBottom: '1px solid var(--border-color)',
          background: selectedLine === row.line ? 'rgba(var(--primary-color), 0.1)' : 'transparent',
          cursor: 'pointer'
        }}
        onClick={() => setSelectedLine(row.line)}
      >
        <div style={{ width: '48px', textAlign: 'center', opacity: 0.5, fontSize: '0.7rem', borderRight: '1px solid var(--border-color)', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {row.line}
        </div>
        <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
            {GAWEB_FIELDS.map(f => (
                <div key={f.name} style={{ flex: `0 0 ${f.length * 7}px`, minWidth: '32px', padding: '0 8px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', borderRight: '1px solid var(--border-color-soft)', height: '100%', display: 'flex', alignItems: 'center', fontSize: '0.75rem' }}>
                    {row.fields[f.name]}
                </div>
            ))}
        </div>
      </div>
    );
  }, [selectedLine]);

  // Renderizador de Filas de ERRORES
  const renderErrorRow = useCallback((err: GawebErrorLite | undefined, idx: number, style: React.CSSProperties) => {
    if (!err) return <div key={idx} style={{ ...style, opacity: 0.3, padding: '0 16px', fontSize: '10px', display: 'flex', alignItems: 'center', borderBottom: '1px solid var(--border-color)' }}>[ERROR_CHUNK_LOADING...]</div>;
    
    return (
      <div 
        key={idx} 
        style={{ 
          ...style, 
          display: 'flex', 
          borderBottom: '1px solid var(--border-color)',
          background: err.severity === 'ERROR' ? 'rgba(239, 68, 68, 0.05)' : 'transparent',
          alignItems: 'center'
        }}
      >
        <div style={{ width: '50px', fontWeight: 800, textAlign: 'center', borderRight: '1px solid var(--border-color)', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{err.line}</div>
        <div style={{ width: '120px', fontSize: '0.75rem', opacity: 0.7, padding: '0 8px' }}>{err.field}</div>
        <div style={{ width: '80px', textAlign: 'center' }}>
          <span className={`station-badge ${err.severity === 'ERROR' ? 'station-badge-orange' : 'station-badge-blue'}`}>{err.severity}</span>
        </div>
        <div style={{ flex: 1, padding: '0 8px', opacity: 0.9, fontSize: '0.85rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {t(err.messageKey, { file: err.value })}
        </div>
      </div>
    );
  }, [t]);

  // Lógica de Paginación para VirtualTable
  const handleRangeChange = useCallback((start: number, end: number) => {
    if (activeTab === 'DATA') {
      const windowStart = Math.floor((start - 1) / PAGE_SIZE) * PAGE_SIZE + 1;
      const windowEnd = windowStart + PAGE_SIZE - 1;
      audit.requestDataWindow(windowStart, windowEnd);
    } else {
      const windowStart = Math.floor((start - 1) / PAGE_SIZE) * PAGE_SIZE;
      const windowEnd = windowStart + PAGE_SIZE - 1;
      audit.requestErrorsWindow(windowStart, windowEnd);
    }
  }, [activeTab, audit]);

  // Helpers para obtener data de las ventanas cacheadas
  const visibleData = useMemo(() => {
    if (!audit.summary) return [];
    const arr = new Array(audit.summary.totalLines).fill(undefined);
    audit.dataWindows.forEach((rows, key) => {
      const [start] = key.split('-').map(Number);
      rows.forEach((r, i) => { arr[start - 1 + i] = r; });
    });
    return arr;
  }, [audit.dataWindows, audit.summary]);

  const visibleErrors = useMemo(() => {
    if (!audit.summary) return [];
    const arr = new Array(audit.summary.totalErrors).fill(undefined);
    audit.errorsWindows.forEach((errs, key) => {
      const [start] = key.split('-').map(Number);
      errs.forEach((e, i) => { arr[start + i] = e; });
    });
    return arr;
  }, [audit.errorsWindows, audit.summary]);

  return (
    <>
      {/* CABECERA INDUSTRIAL (Era 6 / Aseptic v6) */}
      <div className="station-card">
        <div className="station-panel-header" style={{ borderBottom: 'none', paddingBottom: 0, marginBottom: 0 }}>
          <div className="flex-col" style={{ gap: '4px' }}>
            <h2 className="station-title-main" style={{ margin: 0 }}>{t('dashboard.dash_audit_title').toUpperCase()}</h2>
            <div className="flex-row" style={{ alignItems: 'center', gap: '12px' }}>
               <span style={{ opacity: 0.5, fontSize: '0.75rem', fontWeight: 700 }}>AUDIT_SYS_V4.3</span>
               <span className={`station-badge ${audit.isRunning ? 'station-badge-orange' : (audit.summary ? 'station-badge-blue' : 'station-badge-green')}`}>
                  {audit.isRunning ? 'ULTRA_SCALE_ACTIVE' : (audit.summary ? 'REPORT_READY' : 'LISTENING')}
               </span>
               {audit.progress && (
                 <span className="station-badge station-badge-blue" style={{ fontFamily: 'var(--font-roboto-mono)' }}>
                   {audit.progress.processedLines.toLocaleString()} REC_OK
                 </span>
               )}
               {audit.isRunning && audit.progress && (
                 <span className="station-badge success" style={{ background: 'rgba(34, 197, 94, 0.1)', border: '1px solid rgba(34, 197, 94, 0.2)' }}>
                    {(audit.progress.processedLines / 5).toFixed(0)} REC/S
                 </span>
               )}
            </div>
          </div>
          <button 
            className="station-btn secondary tiny" 
            onClick={() => setIsSettingsOpen(true)}
            title="Ajustes de Auditoría"
          >
            <CogIcon size={16} />
          </button>
        </div>

        <div className="station-tech-summary" style={{ marginTop: '24px' }}>
          <div className="station-tech-item"><span className="station-tech-label">SOURCE:</span> {indexFile?.name || 'NONE'}</div>
          <div className="station-tech-item"><span className="station-tech-label">PKG:</span> {archiveFile?.name || 'NONE'}</div>
          <div className="station-tech-item"><span className="station-tech-label">MODE:</span> ZERO_MEMORY_STREAMING</div>
        </div>

        {/* PHASE TIMELINE (6.0.0-IND) */}
        <div style={{ marginTop: '24px', paddingTop: '16px', borderTop: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between' }}>
           {[
             { id: 'LOADING', label: '1. CARGA' },
             { id: 'ANALYZING', label: '2. ANÁLISIS' },
             { id: 'SUMMARY', label: '3. RESUMEN' },
             { id: 'EXPORTING', label: '4. REPORTE' }
           ].map((p, i) => {
             const active = phase === p.id || (phase === 'SUMMARY' && i < 2) || (phase === 'EXPORTING' && i < 3);
             const isCurrent = phase === p.id;
             return (
               <div key={p.id} className="flex-row" style={{ alignItems: 'center', gap: '8px', opacity: active ? 1 : 0.3 }}>
                  <div style={{ 
                    width: '10px', height: '10px', borderRadius: '50%', 
                    background: isCurrent ? 'var(--primary-color)' : (active ? 'var(--status-ok)' : 'var(--border-color)'),
                    boxShadow: isCurrent ? '0 0 8px var(--primary-color)' : 'none'
                  }} />
                  <span style={{ fontSize: '0.65rem', fontWeight: 900, color: isCurrent ? 'var(--primary-color)' : 'inherit' }}>{p.label}</span>
               </div>
             );
           })}
        </div>
      </div>

      {/* SELECCIÓN DE FICHEROS */}
      <section className="station-card flex-col" style={{ gap: '16px' }}>
        <div className="station-form-grid">
          <div className="station-form-field">
            <label className="station-label">{t('audit.select_file').toUpperCase()}</label>
            <div className="flex-row" style={{ gap: '8px' }}>
              <input className="station-input" style={{ flex: 1 }} readOnly value={indexFile?.name || ''} placeholder=".txt (GAWEB)" />
              <input type="file" id="index-input" style={{ display: 'none' }} onChange={(e) => handleFileChange(e, 'index')} />
              <button className="station-btn" onClick={() => document.getElementById('index-input')?.click()}>{t('audit.explore').toUpperCase()}</button>
            </div>
          </div>
          <div className="station-form-field">
            <label className="station-label">{t('audit.select_archive').toUpperCase()}</label>
            <div className="flex-row" style={{ gap: '8px' }}>
              <input className="station-input" style={{ flex: 1 }} readOnly value={archiveFile?.name || ''} placeholder=".zip (2GB_MAX)" />
              <input type="file" id="archive-input" style={{ display: 'none' }} accept=".zip" onChange={(e) => handleFileChange(e, 'archive')} />
              <button className="station-btn" onClick={() => document.getElementById('archive-input')?.click()}>{t('audit.explore').toUpperCase()}</button>
            </div>
          </div>
        </div>
        
        <div className="flex-row" style={{ justifyContent: 'flex-end', marginTop: '12px' }}>
          <button 
            className="station-btn station-btn-primary" 
            disabled={!indexFile || audit.isRunning}
            onClick={runValidation}
            style={{ width: '100%', maxWidth: '320px', height: '56px', fontSize: '1.2rem', fontWeight: 900 }}
          >
            {audit.isRunning ? t('audit.validating').toUpperCase() : t('audit.validate').toUpperCase()}
          </button>
        </div>
      </section>

      {/* RESULTADOS INDUSTRIALES */}
      {(audit.summary || audit.packageResult || audit.isRunning) && (
        <div className="flex-col" style={{ flex: 1, minHeight: 0, overflow: 'hidden' }}>
          <div className="station-tabs" style={{ background: 'var(--surface-color)', borderBottom: '1px solid var(--border-color)' }}>
            <button className={`station-tab-btn ${activeTab === 'DATA' ? 'active' : ''}`} onClick={() => setActiveTab('DATA')}>
              <FileTextIcon size={14} /> {t('audit.tab_data').toUpperCase()}
            </button>
            <button className={`station-tab-btn ${activeTab === 'ERRORS' ? 'active' : ''}`} onClick={() => setActiveTab('ERRORS')}>
              <AlertTriangleIcon size={14} /> {t('audit.tab_errors').toUpperCase()}
            </button>
            <button className={`station-tab-btn ${activeTab === 'HISTORY' ? 'active' : ''}`} onClick={() => setActiveTab('HISTORY')}>
              <ListIcon size={14} /> {t('audit.tab_history') || 'HISTORIAL'}
            </button>
          </div>

          <div className="station-registry-sync-header" style={{ padding: '8px 16px', borderBottom: '1px solid var(--border-color)' }}>
            <div className="flex-row" style={{ gap: '24px', fontSize: '0.75rem', fontWeight: 800 }}>
              <span>TOTAL_REC: <span className="station-badge station-badge-blue">{audit.summary?.totalLines.toLocaleString() || audit.progress?.processedLines.toLocaleString() || '0'}</span></span>
              <span>ANOMALIES: <span className={`station-badge ${audit.summary?.totalErrors || audit.progress?.errorsSoFar ? 'station-badge-orange' : 'station-badge-blue'}`}>{audit.summary?.totalErrors.toLocaleString() || audit.progress?.errorsSoFar.toLocaleString() || '0'}</span></span>
              {detectedProfile && (
                <span className="flex-row" style={{ gap: '8px' }}>
                  GOLDEN_STATUS: 
                  <span className={`station-badge ${audit.summary?.totalErrors ? 'station-badge-orange' : 'station-badge-blue'}`}>
                     {audit.summary ? (audit.summary.totalErrors > 0 ? 'BREAK' : 'MATCH') : 'CALCULATING...'}
                  </span>
                </span>
              )}
              {audit.packageResult && <span>PKG_FILES: <span className="station-badge station-badge-blue">{audit.packageResult.zipFilesCount}</span></span>}
              {samplingConfig.enabled && (
                <span className="animate-pulse" title={`Muestreo industrial activo: máx ${samplingConfig.maxPerType} errores por tipo/campo.`}>
                  SAMPLING: <span className="station-badge success">ACTIVE</span>
                </span>
              )}
            </div>
          </div>

          <div style={{ flex: 1, minHeight: 0, position: 'relative' }}>
            {activeTab === 'HISTORY' ? (
                <div style={{ flex: 1, padding: '20px', minHeight: '400px' }}>
                    <AuditHistoryDashboard />
                </div>
            ) : activeTab === 'DATA' && audit.summary ? (
              <IndustrialVirtualTable
                items={visibleData}
                totalItems={audit.summary.totalLines}
                itemHeight={ITEM_HEIGHT}
                onRangeChange={handleRangeChange}
                renderRow={renderDataRow}
              />
            ) : activeTab === 'ERRORS' && audit.summary ? (
              <IndustrialVirtualTable
                items={visibleErrors}
                totalItems={audit.summary.totalErrors}
                itemHeight={ITEM_HEIGHT}
                onRangeChange={handleRangeChange}
                renderRow={renderErrorRow}
              />
            ) : (
                <div className="station-empty-state" style={{ height: '300px' }}>
                    <SearchIcon className="station-shimmer-text" size={48} />
                    <div style={{ marginTop: '16px', fontWeight: 700 }}>{audit.isRunning ? 'ANALYZING_STREAM...' : 'WAITING_FOR_SUMMARY'}</div>
                </div>
            )}
          </div>

          {/* INSPECTOR DE LÍNEA SELECCIONADA */}
          {selectedLine && activeTab !== 'HISTORY' && (
              <div style={{ padding: '0 16px 16px 16px' }}>
                  {(() => {
                      const row = visibleData.find(r => r?.line === selectedLine);
                      let lineErrors = Array.from(audit.errorsWindows.values())
                        .flat()
                        .filter(e => e?.line === selectedLine);
                      
                      const rawContent = row ? serializeGawebRecord(GAWEB_FIELDS, row.fields) : ''; 
                      const countryIso = rawContent.substring(130, 133).trim() || 'ES';

                      // Re-validate semantically if metadata is available
                      if (selectedLine && semanticMetadata[selectedLine]) {
                          const tinValue = row?.fields['CLALF'] || '';
                          const hType = (semanticMetadata[selectedLine] as any).holderType || 'ANY';
                          const semanticResult = regulatoryService.validateTin(countryIso, tinValue, hType, semanticMetadata[selectedLine]);
                          
                          // Filter out structural CLALF errors and inject semantic results
                          lineErrors = lineErrors.filter(e => e.field !== 'CLALF');
                          if (semanticResult.status !== 'VALID' && semanticResult.status !== 'EXEMPTED') {
                              lineErrors.push({
                                  line: selectedLine,
                                  field: 'CLALF',
                                  colStart: GAWEB_FIELDS.find(f => f.name === 'CLALF')?.startIndex || 0,
                                  colEnd: (GAWEB_FIELDS.find(f => f.name === 'CLALF')?.startIndex || 0) + 15,
                                  severity: semanticResult.severity as any,
                                  messageKey: semanticResult.message || `audit.errors.invalid_tin_${countryIso.toLowerCase()}`,
                                  value: tinValue,
                                  index: 0,
                                  position: String(GAWEB_FIELDS.find(f => f.name === 'CLALF')?.startIndex || 0)
                              });
                          }
                      }

                      return (
                        <div style={{ position: 'relative' }}>
                             <button 
                                className="station-btn tiny secondary" 
                                style={{ position: 'absolute', top: '24px', right: '8px', zIndex: 10 }}
                                onClick={() => setSelectedLine(null)}
                             >
                                <XIcon size={12} />
                             </button>

                             {/* Metadata Collector Trigger */}
                             {(() => {
                                 const requirements = regulatoryOrchestrator.getRequirements(countryIso);
                                 if (requirements.length > 0 && lineErrors.some(e => e.field === 'CLALF' || semanticMetadata[selectedLine])) {
                                     return (
                                        <div className="flex-row" style={{ position: 'absolute', top: '24px', right: '40px', zIndex: 10, gap: '8px' }}>
                                             {!isCollectingMetadata ? (
                                                <>
                                                    <span style={{ fontSize: '0.65rem', opacity: 0.6 }}>
                                                        {semanticMetadata[selectedLine] ? 'SEMANTIC_CHECK_ACTIVE' : 'SEMANTIC_CHECK_AVAIL'}
                                                    </span>
                                                    <button 
                                                        className="station-btn tiny" 
                                                        style={{ background: semanticMetadata[selectedLine] ? '#10b981' : 'var(--primary-color)', color: 'black' }}
                                                        onClick={() => setIsCollectingMetadata(true)}
                                                    >
                                                        {semanticMetadata[selectedLine] ? 'RE_COLLECT_METADATA' : 'VALIDATE_HIGH_FIDELITY'}
                                                    </button>
                                                </>
                                             ) : (
                                                 <span style={{ fontSize: '0.65rem', color: 'var(--primary-color)', fontWeight: '900' }}>COLLECTING_DATA...</span>
                                             )}
                                        </div>
                                     );
                                 }
                                 return null;
                             })()}

                             {isCollectingMetadata ? (
                                 <div style={{ marginTop: '16px' }}>
                                     <MetadataCollectorForm 
                                        requirements={regulatoryOrchestrator.getRequirements(rawContent.substring(130, 133).trim() || 'ES')}
                                        onCancel={() => setIsCollectingMetadata(false)}
                                        onValidate={(data) => {
                                            setSemanticMetadata({ ...semanticMetadata, [selectedLine]: data });
                                            setIsCollectingMetadata(false);
                                            globalAddLog('AUDIT', t('audit.info.semantic_check_applied'), 'info', { line: selectedLine });
                                        }}
                                        t={t}
                                     />
                                 </div>
                             ) : (
                                <LineInspector 
                                    line={selectedLine} 
                                    content={rawContent} 
                                    errors={lineErrors} 
                                    t={t} 
                                />
                             )}
                        </div>
                      );
                  })()}
              </div>
          )}

          {audit.summary && audit.summary.totalErrors > 0 && (
            <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '12px' }}>
              <button className="station-btn" onClick={exportCsv}><DownloadIcon size={16} /> EXPORT_CSV</button>
            </div>
          )}
        </div>
      )}

      {/* Sello de Integridad */}
      <div className="station-integrity-badge" style={{ position: 'fixed', bottom: '24px', right: '24px' }}>
         <div className="integrity-dot" />
         <span>ZERO_MEMORY_VALIDATION OK</span>
      </div>

      {/* Modal Ajustes Auditoría */}
      {isSettingsOpen && (
        <div className="station-modal-overlay animate-fade-in" style={{ zIndex: 1000 }}>
          <div className="station-modal-content station-card" style={{ maxWidth: '450px' }}>
             <div className="flex-row" style={{ justifyContent: 'space-between', marginBottom: '24px' }}>
                <h3 style={{ margin: 0, fontSize: '0.8rem', letterSpacing: '2px' }}>AJUSTES DE SEGURIDAD AUDIT</h3>
                <button className="station-btn tiny secondary" onClick={() => setIsSettingsOpen(false)}>×</button>
             </div>
             
             <div className="station-form-field">
                <label className="station-label">UMBRAL AVISO EXPIRACIÓN (MINUTOS)</label>
                <div className="flex-row" style={{ gap: '12px', alignItems: 'center' }}>
                   <input 
                      type="range" 
                      min="1" max="10" 
                      value={warningThreshold} 
                      onChange={(e) => saveThreshold(parseInt(e.target.value))}
                      style={{ flex: 1 }}
                   />
                   <span style={{ width: '40px', textAlign: 'right', fontWeight: 900, fontSize: '1.2rem', color: 'var(--primary-color)' }}>
                      {warningThreshold}m
                   </span>
                </div>
                <p style={{ opacity: 0.5, fontSize: '0.65rem', marginTop: '8px' }}>
                   Define cuántos minutos antes de que la sesión expire se mostrará la alerta visual en la interfaz.
                </p>
             </div>

             <div className="station-form-field" style={{ marginTop: '20px', paddingTop: '20px', borderTop: '1px solid var(--border-color)' }}>
                <label className="station-label flex-row" style={{ justifyContent: 'space-between' }}>
                  MUESTREO INDUSTRIAL (GAWEB)
                  <input 
                    type="checkbox" 
                    checked={samplingConfig.enabled} 
                    onChange={e => saveSampling({ ...samplingConfig, enabled: e.target.checked })}
                  />
                </label>
                {samplingConfig.enabled && (
                  <div style={{ marginTop: '12px' }}>
                    <div className="flex-row" style={{ justifyContent: 'space-between', marginBottom: '4px', marginTop: '12px' }}>
                        <span style={{ fontSize: '0.65rem', opacity: 0.7 }}>FRECUENCIA DE MUESTREO (1 de N)</span>
                        <span style={{ fontWeight: 800, color: 'var(--primary-color)' }}>{samplingConfig.sampleEvery}</span>
                    </div>
                    <input 
                      type="range" 
                      min="1" max="100" 
                      value={samplingConfig.sampleEvery} 
                      onChange={e => saveSampling({ ...samplingConfig, sampleEvery: parseInt(e.target.value) })}
                      style={{ width: '100%' }}
                    />

                    <div className="flex-row" style={{ justifyContent: 'space-between', marginBottom: '4px', marginTop: '12px' }}>
                        <span style={{ fontSize: '0.65rem', opacity: 0.7 }}>LÍMITE GLOBAL DIARIO</span>
                        <span style={{ fontWeight: 800, color: 'var(--primary-color)' }}>{samplingConfig.maxPerDay}</span>
                    </div>
                    <input 
                      type="number" 
                      className="station-input"
                      value={samplingConfig.maxPerDay} 
                      onChange={e => saveSampling({ ...samplingConfig, maxPerDay: parseInt(e.target.value) || 0 })}
                      style={{ width: '100%', height: '32px', fontSize: '0.8rem' }}
                    />
                  </div>
                )}
                <p style={{ opacity: 0.5, fontSize: '0.65rem', marginTop: '8px' }}>
                  Agrupa errores idénticos y aplica cuotas de procesamiento para optimizar el rendimiento y legibilidad.
                </p>
             </div>

             <div className="flex-row" style={{ justifyContent: 'flex-end', marginTop: '24px' }}>
                <button className="station-btn station-btn-primary" onClick={() => setIsSettingsOpen(false)}>ACEPTAR</button>
             </div>
          </div>
        </div>
      )}
    </>
  );
};

export default AuditStation;
