'use client';

import React, { useState } from 'react';
import { useLanguage } from '@/lib/context/LanguageContext';
import { auditGaweb, GawebAuditResult, GAWEB_FIELDS } from '@/lib/logic/gaweb-auditor.logic';
import { auditPackageIntegrity, PackageAuditResult } from '@/lib/logic/package-auditor.logic';
import { sanitizeFilename } from '@/lib/utils/filename.utils';
import { FileIcon, ShieldCheckIcon, AlertTriangleIcon, SearchIcon, DownloadIcon, FolderIcon, XIcon, FileTextIcon } from '@/components/common/Icons';

interface AuditStationProps {
  onAddLog: (type: 'info' | 'success' | 'error' | 'skip', messageKey: string, fileName?: string, params?: any) => void;
}

const AuditStation: React.FC<AuditStationProps> = ({ onAddLog }) => {
  const { t } = useLanguage();
  
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
    onAddLog('info', 'audit.logs.start', indexFile.name, { file: indexFile.name });
    
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
      onAddLog(auditResult.errors.length > 0 ? 'error' : 'success', 'audit.logs.success', indexFile.name, { n: auditResult.errors.length });
      setActiveTab(auditResult.errors.length > 0 ? 'ERRORS' : 'DATA');
    } catch (err: any) {
      onAddLog('error', 'logs.error', indexFile.name);
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
      
      <div className="station-card">
        <h3 style={{ fontSize: '0.8rem', opacity: 0.6, textTransform: 'uppercase', marginBottom: '8px' }}>Control de Auditoría</h3>
        
        <div className="flex-col" style={{ gap: '16px' }}>
          <div className="grid-2" style={{ gap: '24px' }}>
            <div className="flex-col" style={{ gap: '4px' }}>
              <label className="station-label">{t('audit.select_file')}</label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input className="station-input" readOnly value={indexFile?.name || ''} placeholder="Esperando fichero .TXT..." />
                <input type="file" id="index-input" style={{ display: 'none' }} onChange={(e) => handleFileChange(e, 'index')} />
                <button className="station-btn" onClick={() => document.getElementById('index-input')?.click()}>...</button>
              </div>
            </div>

            <div className="flex-col" style={{ gap: '4px' }}>
              <label className="station-label">{t('audit.select_archive')}</label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input className="station-input" readOnly value={archiveFile?.name || ''} placeholder="Esperando paquete .ZIP..." />
                <input type="file" id="archive-input" style={{ display: 'none' }} accept=".zip" onChange={(e) => handleFileChange(e, 'archive')} />
                <button className="station-btn" onClick={() => document.getElementById('archive-input')?.click()}>...</button>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-color)', padding: '16px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
            <div style={{ display: 'flex', gap: '24px', fontSize: '0.8rem' }}>
              {result ? (
                <>
                  <span>Registros: <b className="txt-ok">{result.lines}</b></span>
                  <span>Anomalías: <b className={result.errors.length > 0 ? 'txt-err' : 'txt-ok'}>{result.errors.length}</b></span>
                </>
              ) : (
                <span style={{ opacity: 0.5 }}>Estado: LISTO PARA VALIDACIÓN</span>
              )}
            </div>
            
            <button 
              className="station-btn station-btn-primary" 
              disabled={!indexFile || isValidating}
              onClick={runValidation}
              style={{ width: '200px' }}
            >
              {isValidating ? 'Validando...' : t('audit.validate')}
            </button>
          </div>
        </div>
      </div>

      <div className="flex-col" style={{ flex: 1, minHeight: 0, border: '1px solid var(--border-color)', borderRadius: '8px', background: 'var(--surface-color)', overflow: 'hidden' }}>
        <div className="station-tabs">
          <button className={`tab-item ${activeTab === 'DATA' ? 'active' : ''}`} onClick={() => setActiveTab('DATA')}>
            {t('audit.tab_data')}
          </button>
          <button className={`tab-item ${activeTab === 'ERRORS' ? 'active' : ''}`} onClick={() => setActiveTab('ERRORS')}>
            {t('audit.tab_errors')}
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
                    <th style={{ width: '50px' }}>Lín.</th>
                    <th style={{ width: '120px' }}>Campo</th>
                    <th style={{ width: '80px' }}>Severidad</th>
                    <th>Mensaje de Auditoría</th>
                  </tr>
                </thead>
                <tbody>
                  {result.errors.map((err, idx) => (
                    <tr key={idx} style={{ background: err.severity === 'ERROR' ? 'rgba(var(--status-err), 0.05)' : 'transparent' }}>
                      <td style={{ fontWeight: 700 }}>{err.line || '-'}</td>
                      <td>{err.field}</td>
                      <td className={err.severity === 'ERROR' ? 'txt-err' : 'txt-warn'} style={{ fontWeight: 700 }}>{err.severity}</td>
                      <td style={{ whiteSpace: 'normal', opacity: 0.8 }}>{t(err.messageKey, { file: err.value })}</td>
                    </tr>
                  ))}
                  {result.errors.length === 0 && (
                    <tr>
                      <td colSpan={4} style={{ textAlign: 'center', padding: '64px', opacity: 0.4 }}>
                        <ShieldCheckIcon size={40} style={{ color: 'var(--status-ok)', marginBottom: '16px' }} />
                        <div style={{ fontWeight: 700 }}>INTEGRIDAD VERIFICADA</div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
          
          {!result && (
            <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', opacity: 0.2 }}>
              <FileIcon size={64} style={{ marginBottom: '16px' }} />
              <p style={{ fontWeight: 600 }}>ESPERANDO FLUJO DE DATOS</p>
            </div>
          )}
        </div>
      </div>

      {result && result.errors.length > 0 && (
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button className="station-btn" onClick={exportCsv}>
            <DownloadIcon size={16} /> Exportar Reporte de Anomalías
          </button>
        </div>
      )}
    </div>
  );
};

export default AuditStation;
