'use client';

import React, { useState } from 'react';
import { useLanguage } from '@/lib/context/LanguageContext';
import { auditGaweb, GawebAuditResult, GAWEB_FIELDS } from '@/lib/logic/gaweb-auditor.logic';
import { auditPackageIntegrity, PackageAuditResult } from '@/lib/logic/package-auditor.logic';
import { sanitizeFilename } from '@/lib/utils/filename.utils';
import { FileIcon, ShieldCheckIcon, AlertTriangleIcon, SearchIcon, DownloadIcon, FolderIcon, XIcon, FileTextIcon } from '@/components/common/Icons';

import { useLog } from '@/lib/context/LogContext';
import { LogLevel } from '@/lib/types/log.types';

const AuditStation: React.FC = () => {
  const { t } = useLanguage();
  const { addLog: globalAddLog } = useLog();
  
  const [indexFile, setIndexFile] = useState<File | null>(null);
  const [archiveFile, setArchiveFile] = useState<File | null>(null);
  const [md5File, setMd5File] = useState<File | null>(null);

  const [result, setResult] = useState<GawebAuditResult | null>(null);
  const [packageResult, setPackageResult] = useState<PackageAuditResult | null>(null);
  
  const [activeTab, setActiveTab] = useState<'DATA' | 'ERRORS'>('DATA');
  const [isValidating, setIsValidating] = useState(false);
  const [selectedLine, setSelectedLine] = useState<number | null>(null);

  const resetResults = () => {
    setResult(null);
    setPackageResult(null);
    setSelectedLine(null);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, slot: 'index' | 'archive' | 'md5') => {
    const f = e.target.files?.[0] || null;
    if (slot === 'index') setIndexFile(f);
    if (slot === 'archive') setArchiveFile(f);
    if (slot === 'md5') setMd5File(f);
    resetResults();
  };

  const runValidation = async () => {
    if (!indexFile) return;
    setIsValidating(true);
    resetResults();
    globalAddLog('AUDIT', t('audit.logs.start', { file: indexFile.name }), 'info', { fileName: indexFile.name });
    
    await new Promise(r => setTimeout(r, 600));

    try {
      const reader = new FileReader();
      const auditPromise = new Promise<GawebAuditResult>((resolve, reject) => {
        reader.onload = (e) => {
          const content = e.target?.result as string;
          resolve(auditGaweb(content));
        };
        reader.onerror = reject;
        reader.readAsText(indexFile, 'iso-8859-1');
      });

      const auditResult = await auditPromise;
      
      if (archiveFile) {
        let md5Witness: string | undefined = undefined;
        if (md5File) md5Witness = await md5File.text();
        const pkgRes = await auditPackageIntegrity(auditResult, archiveFile, md5Witness);
        setPackageResult(pkgRes);
      }

      setResult(auditResult);
      globalAddLog('AUDIT', t('audit.logs.success', { n: auditResult.errors.length }), auditResult.errors.length > 0 ? 'error' : 'success', { fileName: indexFile.name });
      setActiveTab(auditResult.errors.length > 0 ? 'ERRORS' : 'DATA');
    } catch (err: any) {
      globalAddLog('AUDIT', t('logs.error'), 'error', { fileName: indexFile.name });
    } finally {
      setIsValidating(false);
    }
  };

  const exportCsv = () => {
    if (!result || !indexFile) return;
    const headers = [t('audit.col_line'), t('audit.col_field'), t('audit.col_pos'), t('audit.col_severity'), t('audit.col_message'), t('audit.col_value')].join(',');
    const rows = result.errors.map(e => `${e.line},${e.field},${e.position},${e.severity},"${t(e.messageKey, { file: e.value })}",${e.value}`).join('\n');
    const blob = new Blob([headers + '\n' + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const cleanOrigName = sanitizeFilename(indexFile.name);
    const downloadName = `AUDIT_REPORT_${cleanOrigName.split('.')[0]}.csv`;
    const a = document.createElement('a');
    a.href = url; a.download = downloadName; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex-col" style={{ gap: '24px', height: '100%' }}>
      
      <div className="station-card flex-col" style={{ gap: '20px' }}>
        <span className="station-form-section-title">CONTROL DE AUDITORÍA TÉCNICA</span>
        
        <div className="station-form-grid">
          <div className="station-form-field">
            <label className="station-label">{t('audit.select_file')}</label>
            <div className="flex-row" style={{ gap: '8px' }}>
              <input className="station-input" readOnly value={indexFile?.name || ''} placeholder="ESPERANDO .TXT..." />
              <input type="file" id="index-input" style={{ display: 'none' }} onChange={(e) => handleFileChange(e, 'index')} />
              <button className="station-btn" style={{ minWidth: '40px' }} onClick={() => document.getElementById('index-input')?.click()}>...</button>
            </div>
          </div>

          <div className="station-form-field">
            <label className="station-label">{t('audit.select_archive')}</label>
            <div className="flex-row" style={{ gap: '8px' }}>
              <input className="station-input" readOnly value={archiveFile?.name || ''} placeholder="ESPERANDO .ZIP..." />
              <input type="file" id="archive-input" style={{ display: 'none' }} accept=".zip" onChange={(e) => handleFileChange(e, 'archive')} />
              <button className="station-btn" style={{ minWidth: '40px' }} onClick={() => document.getElementById('archive-input')?.click()}>...</button>
            </div>
          </div>
        </div>

        <div className="station-registry-sync-header" style={{ padding: '16px', borderRadius: '4px', marginTop: '8px' }}>
          <div className="flex-row" style={{ gap: '24px', fontSize: '0.75rem', fontWeight: 800 }}>
            {result ? (
              <>
                <span>REGISTROS: <span className="station-badge station-badge-blue">{result.lines}</span></span>
                <span>ANOMALÍAS: <span className={`station-badge ${result.errors.length > 0 ? 'station-badge-orange' : 'station-badge-blue'}`}>{result.errors.length}</span></span>
              </>
            ) : (
              <span style={{ opacity: 0.5 }}>STATUS_READY: WAITING_FOR_PAYLOAD</span>
            )}
          </div>
          
          <button 
            className="station-btn station-btn-primary" 
            disabled={!indexFile || isValidating}
            onClick={runValidation}
            style={{ width: '220px', height: '40px' }}
          >
            {isValidating ? 'VALIDANDO...' : t('audit.validate').toUpperCase()}
          </button>
        </div>
      </div>

      <div className="flex-col" style={{ flex: 1, minHeight: 0, overflow: 'hidden' }}>
        <div className="station-tabs" style={{ background: 'var(--surface-color)', borderBottom: '1px solid var(--border-color)', borderRadius: '8px 8px 0 0' }}>
          <button className={`station-tab-btn ${activeTab === 'DATA' ? 'active' : ''}`} onClick={() => setActiveTab('DATA')}>
            <FileTextIcon size={14} /> {t('audit.tab_data').toUpperCase()}
          </button>
          <button className={`station-tab-btn ${activeTab === 'ERRORS' ? 'active' : ''}`} onClick={() => setActiveTab('ERRORS')}>
            <AlertTriangleIcon size={14} /> {t('audit.tab_errors').toUpperCase()}
          </button>
        </div>

        <div style={{ flex: 1, overflow: 'auto' }}>
          {activeTab === 'DATA' && result && (
            <div className="station-table-container" style={{ border: 'none', borderRadius: 0 }}>
              <table className="station-table">
                <thead>
                  <tr>
                    <th style={{ width: '48px', textAlign: 'center' }}>ID</th>
                    {GAWEB_FIELDS.map(f => (
                      <th key={f.name}>{t(`audit.fields.${f.name}`)}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {result.parsedData.map((row, idx) => (
                    <tr key={idx} style={{ background: selectedLine === idx + 1 ? 'rgba(var(--primary-color), 0.1)' : 'transparent' }} onClick={() => setSelectedLine(idx + 1)}>
                      <td style={{ textAlign: 'center', opacity: 0.5, fontSize: '0.7rem' }}>{idx + 1}</td>
                      {GAWEB_FIELDS.map(f => (
                        <td key={f.name}>{row[f.name]}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === 'ERRORS' && result && (
            <div className="station-table-container" style={{ border: 'none', borderRadius: 0 }}>
              <table className="station-table">
                <thead>
                  <tr>
                    <th style={{ width: '50px' }}>LÍN.</th>
                    <th style={{ width: '120px' }}>CAMPO</th>
                    <th style={{ width: '80px' }}>SEVERIDAD</th>
                    <th>MENSAJE DE AUDITORÍA</th>
                  </tr>
                </thead>
                <tbody>
                  {result.errors.map((err, idx) => (
                    <tr key={idx} style={{ background: err.severity === 'ERROR' ? 'rgba(239, 68, 68, 0.05)' : 'transparent' }}>
                      <td style={{ fontWeight: 800 }}>{err.line || '-'}</td>
                      <td style={{ fontSize: '0.75rem', opacity: 0.7 }}>{err.field}</td>
                      <td>
                        <span className={`station-badge ${err.severity === 'ERROR' ? 'station-badge-orange' : 'station-badge-blue'}`}>{err.severity}</span>
                      </td>
                      <td style={{ whiteSpace: 'normal', opacity: 0.9, fontSize: '0.85rem' }}>{t(err.messageKey, { file: err.value })}</td>
                    </tr>
                  ))}
                  {result.errors.length === 0 && (
                    <tr>
                      <td colSpan={4}>
                        <div className="station-empty-state" style={{ minHeight: '200px' }}>
                          <ShieldCheckIcon size={48} style={{ color: 'var(--status-ok)', marginBottom: '16px' }} />
                          <div style={{ fontWeight: 900, letterSpacing: '0.1rem' }}>INTEGRIDAD_VERIFICADA</div>
                          <p style={{ opacity: 0.5, fontSize: '0.8rem' }}>No se han detectado anomalías estructurales en el flujo.</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
          
          {!result && (
            <div className="station-empty-state" style={{ height: '100%' }}>
              <SearchIcon size={64} style={{ marginBottom: '16px', opacity: 0.2 }} />
              <p style={{ fontWeight: 900, letterSpacing: '0.2rem', opacity: 0.3 }}>WAITING_FOR_DATA_STREAM</p>
            </div>
          )}
        </div>
      </div>

      {result && result.errors.length > 0 && (
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '8px' }}>
          <button className="station-btn" style={{ padding: '0 24px', height: '40px', fontWeight: 800 }} onClick={exportCsv}>
            <DownloadIcon size={16} /> EXPORTAR REPORTE DE ANOMALÍAS (.CSV)
          </button>
        </div>
      )}
    </div>
  );
};

export default AuditStation;
