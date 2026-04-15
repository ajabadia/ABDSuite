'use client';

import React, { useState } from 'react';
import { useLanguage } from '@/lib/context/LanguageContext';
import { auditGaweb, GawebAuditResult, GAWEB_FIELDS } from '@/lib/logic/gaweb-auditor.logic';
import { auditPackageIntegrity, PackageAuditResult } from '@/lib/logic/package-auditor.logic';
import { sanitizeFilename } from '@/lib/utils/filename.utils';
import { FileIcon, ShieldCheckIcon, AlertTriangleIcon, SearchIcon, DownloadIcon, FolderIcon } from '@/components/common/Icons';

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
        
        if (pkgRes.md5Match === false) {
           auditResult.errors.push({
             line: 0,
             field: 'MD5',
             position: 'N/A',
             severity: 'ERROR',
             messageKey: 'audit.errors.md5_mismatch',
             value: md5File?.name || 'UNKNOWN'
           });
        }
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
    onAddLog('info', 'audit.logs.export', downloadName, { file: downloadName });
  };

  return (
    <div className="flex-col" style={{ gap: '25px', height: '100%' }}>
      <div className="station-card">
        <div className="station-card-title">INDUSTRIAL_AUDIT_STATION</div>

        <div className="flex-col" style={{ gap: '20px' }}>
          <div className="grid-2" style={{ gap: '25px' }}>
            <div className="flex-col" style={{ gap: '8px' }}>
              <label className="station-label">{t('audit.select_file')}</label>
              <div className="flex-row" style={{ gap: '5px' }}>
                <input className="station-input" readOnly value={indexFile?.name || ''} placeholder="IDLE_WAITING_FOR_INDEX" style={{ fontSize: '0.8rem' }} />
                <input type="file" id="index-input" style={{ display: 'none' }} onChange={(e) => handleFileChange(e, 'index')} />
                <button className="station-btn" style={{ padding: '8px 12px', boxShadow: 'none' }} onClick={() => document.getElementById('index-input')?.click()}>...</button>
              </div>
            </div>

            <div className="flex-col" style={{ gap: '8px' }}>
              <label className="station-label">{t('audit.select_archive')}</label>
              <div className="flex-row" style={{ gap: '5px' }}>
                <input className="station-input" readOnly value={archiveFile?.name || ''} placeholder="IDLE_WAITING_FOR_PACKAGE" style={{ fontSize: '0.8rem' }} />
                <input type="file" id="archive-input" style={{ display: 'none' }} accept=".zip" onChange={(e) => handleFileChange(e, 'archive')} />
                <button className="station-btn" style={{ padding: '8px 12px', boxShadow: 'none' }} onClick={() => document.getElementById('archive-input')?.click()}>...</button>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(var(--primary-color), 0.05)', padding: '15px', border: 'var(--border-thin) solid var(--border-color)' }}>
            <div style={{ display: 'flex', gap: '20px', fontSize: '0.75rem', fontWeight: 900 }}>
              {result ? (
                <>
                  <span>RECORDS_FOUND: <b className="txt-ok">{result.lines}</b></span>
                  <span>ANOMALIES_DETECTED: <b className={result.errors.length > 0 ? 'txt-err' : 'txt-ok'}>{result.errors.length}</b></span>
                </>
              ) : (
                <span style={{ opacity: 0.5 }}>SYSTEM_STATUS: {t('audit.status_ready').toUpperCase()}</span>
              )}
            </div>
            
            <button 
              className="station-btn station-btn-primary" 
              disabled={!indexFile || isValidating}
              onClick={runValidation}
              style={{ padding: '10px 25px' }}
            >
              {isValidating ? 'VALIDATING...' : t('audit.validate').toUpperCase()}
            </button>
          </div>
        </div>
      </div>

      <div className="flex-col" style={{ flex: 1, overflow: 'hidden', border: 'var(--border-thin) solid var(--border-color)', background: 'var(--bg-color)', position: 'relative' }}>
        <div className="station-tabs">
          <button className={`tab-item ${activeTab === 'DATA' ? 'active' : ''}`} onClick={() => setActiveTab('DATA')}>
            {t('audit.tab_data').toUpperCase()}
          </button>
          <button className={`tab-item ${activeTab === 'ERRORS' ? 'active' : ''}`} onClick={() => setActiveTab('ERRORS')}>
            {t('audit.tab_errors').toUpperCase()}
          </button>
        </div>

        <div style={{ flex: 1, overflow: 'auto' }}>
          {activeTab === 'DATA' && result && (
            <div className="station-table-container">
              <table className="station-table">
                <thead>
                  <tr>
                    <th style={{ width: '50px', textAlign: 'center' }}>#</th>
                    {GAWEB_FIELDS.map(f => (
                      <th key={f.name} style={{ minWidth: f.length > 20 ? '200px' : '100px' }}>
                        {t(`audit.fields.${f.name}`)}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {result.parsedData.map((row, idx) => (
                    <tr key={idx} style={{ background: selectedLine === idx + 1 ? 'rgba(var(--primary-color), 0.1)' : 'transparent', cursor: 'pointer' }} onClick={() => setSelectedLine(idx + 1)}>
                      <td style={{ fontWeight: 900, textAlign: 'center', opacity: 0.5, fontSize: '0.7rem' }}>{idx + 1}</td>
                      {GAWEB_FIELDS.map(f => (
                        <td key={f.name} style={{ fontSize: '0.8rem', whiteSpace: 'nowrap' }}>
                          {row[f.name]}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === 'ERRORS' && result && (
            <div className="station-table-container">
              <table className="station-table">
                <thead>
                  <tr>
                    <th style={{ width: '60px' }}>L#</th>
                    <th style={{ width: '120px' }}>FIELD</th>
                    <th style={{ width: '80px' }}>POS</th>
                    <th style={{ width: '80px' }}>LEVEL</th>
                    <th>MESSAGE_CONTENT</th>
                  </tr>
                </thead>
                <tbody>
                  {result.errors.map((err, idx) => (
                    <tr key={idx} style={{ background: err.severity === 'ERROR' ? 'rgba(var(--status-err), 0.05)' : 'transparent' }}>
                      <td style={{ fontWeight: 900 }}>{err.line || '-'}</td>
                      <td style={{ fontWeight: 900 }}>{err.field}</td>
                      <td>{err.position}</td>
                      <td className={err.severity === 'ERROR' ? 'txt-err' : 'txt-warn'} style={{ fontWeight: 900 }}>{err.severity}</td>
                      <td style={{ whiteSpace: 'normal', fontSize: '0.8rem' }}>{t(err.messageKey, { file: err.value })}</td>
                    </tr>
                  ))}
                  {result.errors.length === 0 && (
                    <tr>
                      <td colSpan={5} style={{ textAlign: 'center', padding: '60px', opacity: 0.3 }}>
                        <ShieldCheckIcon size={48} />
                        <div style={{ marginTop: '15px', fontWeight: 900, fontSize: '1rem', letterSpacing: '2px' }}>INTEGRIDAD_VERIFICADA_OK</div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
          
          {!result && (
            <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', opacity: 0.1 }}>
              <FolderIcon size={120} />
              <p style={{ fontWeight: 900, marginTop: '20px', fontSize: '1.2rem', letterSpacing: '3px' }}>WAITING_FOR_DATA_STREAM</p>
            </div>
          )}
        </div>
      </div>

      {result && result.errors.length > 0 && (
        <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '10px 0' }}>
          <button className="station-btn" style={{ padding: '12px 25px' }} onClick={exportCsv}>
            {t('audit.export_csv').toUpperCase()}
          </button>
        </div>
      )}
    </div>
  );
};

export default AuditStation;
