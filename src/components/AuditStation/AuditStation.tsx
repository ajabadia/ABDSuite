'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useLanguage } from '@/lib/context/LanguageContext';
import { GAWEB_FIELDS } from '@/lib/logic/gaweb-auditor.logic';
import { sanitizeFilename } from '@/lib/utils/filename.utils';
import { 
  ShieldCheckIcon, 
  AlertTriangleIcon, 
  SearchIcon, 
  DownloadIcon, 
  XIcon, 
  FileTextIcon 
} from '@/components/common/Icons';

import { useLog } from '@/lib/context/LogContext';
import { useAuditWorker } from '@/lib/hooks/useAuditWorker';
import { IndustrialVirtualTable } from '@/components/common/IndustrialVirtualTable';
import { GawebRow, GawebErrorLite } from '@/lib/types/audit-worker.types';

import { db } from '@/lib/db/db';
import { AuditHistoryDashboard } from './AuditHistoryDashboard';

const PAGE_SIZE = 200;
const ITEM_HEIGHT = 32;

const AuditStation: React.FC = () => {
  const { t } = useLanguage();
  const { addLog: globalAddLog } = useLog();
  
  const [indexFile, setIndexFile] = useState<File | null>(null);
  const [archiveFile, setArchiveFile] = useState<File | null>(null);
  const [md5File, setMd5File] = useState<File | null>(null);

  const [activeTab, setActiveTab] = useState<'DATA' | 'ERRORS' | 'HISTORY'>('DATA');
  const [selectedLine, setSelectedLine] = useState<number | null>(null);

  // MOTOR INDUSTRIAL (Phase 2)
  const audit = useAuditWorker({ 
    encoding: 'iso-8859-1', 
    maxErrorsPreview: 5000 
  });

  const resetResults = useCallback(() => {
    audit.reset();
    setSelectedLine(null);
  }, [audit]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, slot: 'index' | 'archive' | 'md5') => {
    const f = e.target.files?.[0] || null;
    if (slot === 'index') setIndexFile(f);
    if (slot === 'archive') setArchiveFile(f);
    if (slot === 'md5') setMd5File(f);
    resetResults();
  };

  const runValidation = async () => {
    if (!indexFile) return;
    
    globalAddLog('AUDIT', t('audit.logs.start', { file: indexFile.name }), 'info', { fileName: indexFile.name });
    
    let md5Text = '';
    if (md5File) {
        try {
            md5Text = await md5File.text();
        } catch(e) {
            console.error("Error reading MD5 file", e);
        }
    }
    
    audit.startAudit({ 
      gawebFile: indexFile, 
      zipFile: archiveFile || undefined, 
      md5Witness: md5Text 
    });
  };

  // Efecto para feedback de logs industriales
  useEffect(() => {
    if (audit.summary && !audit.isRunning) {
      globalAddLog('AUDIT', t('audit.logs.success', { n: audit.summary.totalErrors }), audit.summary.totalErrors > 0 ? 'error' : 'success', { fileName: indexFile?.name });
      
      // PERSISTENCIA INDUSTRIAL (Era 6)
      const persistAudit = async () => {
          if (!indexFile || !audit.summary) return;
          try {
              await db.audit_history_v6.add({
                  id: crypto.randomUUID(),
                  module: 'AUDIT',
                  timestamp: Date.now(),
                  action: 'GAWEB_AUDIT_COMPLETED',
                  status: audit.summary.totalErrors > 0 ? 'ERROR' : 'SUCCESS',
                  details: JSON.stringify({
                      fileName: indexFile.name,
                      totalLines: audit.summary.totalLines,
                      totalErrors: audit.summary.totalErrors,
                      totalWarnings: audit.summary.totalWarnings
                  })
              } as any);
              console.log('[ABDFN-AUDIT] Result persisted to history.');
          } catch (e) {
              console.error('Failed to persist audit', e);
          }
      };
      persistAudit();

      if (audit.summary.totalErrors > 0) setActiveTab('ERRORS');
    }
  }, [audit.summary, audit.isRunning, globalAddLog, indexFile, t]);

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
      {/* CABECERA INDUSTRIAL (Era 5 / Aseptic v4) */}
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
            </div>
          </div>
        </div>

        <div className="station-tech-summary" style={{ marginTop: '24px' }}>
          <div className="station-tech-item"><span className="station-tech-label">SOURCE:</span> {indexFile?.name || 'NONE'}</div>
          <div className="station-tech-item"><span className="station-tech-label">PKG:</span> {archiveFile?.name || 'NONE'}</div>
          <div className="station-tech-item"><span className="station-tech-label">MODE:</span> ZERO_MEMORY_STREAMING</div>
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
            style={{ width: '320px', height: '56px', fontSize: '1.2rem', fontWeight: 900 }}
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
              {audit.packageResult && <span>PKG_FILES: <span className="station-badge station-badge-blue">{audit.packageResult.zipFilesCount}</span></span>}
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
                containerHeight={500}
                onRangeChange={handleRangeChange}
                renderRow={renderDataRow}
              />
            ) : activeTab === 'ERRORS' && audit.summary ? (
              <IndustrialVirtualTable
                items={visibleErrors}
                totalItems={audit.summary.totalErrors}
                itemHeight={ITEM_HEIGHT}
                containerHeight={500}
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
    </>
  );
};

export default AuditStation;
