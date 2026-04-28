'use client';

import React, { useState, useCallback, useMemo } from 'react';
import { useLanguage } from '@/lib/context/LanguageContext';
import { useLog } from '@/lib/context/LogContext';
import { useWorkspace } from '@/lib/context/WorkspaceContext';
import { auditService } from '@/lib/services/AuditService';
import { regulatoryService } from '@/lib/logic/RegulatoryService';
import { detectCsvDelimiter, splitRespectingQuotes } from '@/lib/utils/csv-detector';
import { TinStatusBadge } from './TinStatusBadge';
import { CountrySelector } from './CountrySelector';
import { MismatchDetails } from './MismatchDetails';
import { 
  ShieldCheckIcon, 
  SearchIcon, 
  UploadIcon, 
  ActivityIcon, 
  DownloadIcon, 
  ArrowUpIcon, 
  ArrowDownIcon,
  ListIcon,
  GlobeIcon,
  ExternalLinkIcon,
  ClockIcon,
  DatabaseIcon
} from '@/components/common/Icons';
import { TinValidationResult, TinValidationStatus, HolderMetadata } from '@/lib/types/regulatory.types';
import { db } from '@/lib/db/db';
import { regulatoryOrchestrator } from '@/lib/logic/RegulatoryOrchestrator';
import { StationHeader } from '@/components/shell/StationHeader';

interface TinValidatorStationProps {
  mode?: 'one-by-one' | 'batch';
}

/**
 * TIN_VALIDATOR_STATION (Era 6)
 * Industrial center for jurisdictional tax compliance.
 * Dual Mode: Manual Surgeon / Batch Industrial.
 */
export const TinValidatorStation: React.FC<TinValidatorStationProps> = ({ mode = 'one-by-one' }) => {
  const { t } = useLanguage();
  const { addLog } = useLog();

  const [isManualCollapsed, setIsManualCollapsed] = React.useState(false);
  const [isBatchCollapsed, setIsBatchCollapsed] = React.useState(false);
  
  // Dynamic Requirements for the selected country (Filtered by Scope Era 6.4)
  const [manualIso, setManualIso] = useState('ES');
  const [manualTin, setManualTin] = useState('');
  const [manualMetadata, setManualMetadata] = useState<HolderMetadata>({});
  const [manualResult, setManualResult] = useState<TinValidationResult | null>(null);

  // --- BATCH STATE ---
  const [batchFile, setBatchFile] = useState<File | null>(null);
  const [batchResults, setBatchResults] = useState<any[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [batchStats, setBatchStats] = useState({ 
    total: 0, 
    valid: 0, 
    invalid: 0, 
    mismatch: 0, 
    exempted: 0 
  });
  const [detectedDelimiter, setDetectedDelimiter] = useState<string | null>(null);

  // Dynamic Requirements for the selected country (Filtered by Scope Era 6.4)
  const requirements = useMemo(() => {
    const raw = regulatoryOrchestrator.getRequirements(manualIso);
    const hType = (manualMetadata as any).holderType || 'ANY';
    
    return raw.filter(req => {
      if (typeof req === 'string') return true;
      if (!req.scope) return true;
      if (hType === 'ANY') return true;
      return req.scope === hType;
    });
  }, [manualIso, (manualMetadata as any).holderType]);

  // --- ACTIONS ---
  const { installationKey, setIsVaultChallengeOpen, unlockIK, currentOperator } = useWorkspace();

  const runManualValidation = async () => {
    // 1. Vault Check: If locked, ask to unlock
    if (!installationKey) {
       const wantUnlock = window.confirm(t('regtech_prompts.vault_locked_confirm'));
       
       if (wantUnlock) {
         setIsVaultChallengeOpen(true);
         return;
       }
       addLog(t('audit.logs.skip_vault_locked'), 'warn');
    }

    const hType = (manualMetadata as any).holderType || 'ANY';
    const result = regulatoryService.validateTin(manualIso, manualTin, hType, manualMetadata);
    setManualResult(result);
    
    // Add Traceability to Retro Console
    const consoleMsg = t('regulatory.logs.manual_validation', { 
      iso: manualIso, 
      tin: manualTin, 
      status: result.status, 
      message: result.message || '' 
    });
    addLog(consoleMsg, result.isValid ? 'info' : 'warning');

    // Log individual audit via Unified Service (Masked PII for CoreDB compliance)
    const maskedTin = manualTin.length > 4 ? `${manualTin.substring(0, 3)}***` : '***';
    
    try {
      await auditService.log({
        module: 'REGTECH',
        messageKey: 'REGTECH_TIN_VALIDATION_MANUAL',
        status: result.isValid || result.status === 'EXEMPTED' ? 'SUCCESS' : 'WARNING',
        details: { 
            eventType: 'REGTECH_TIN_VALIDATION_MANUAL',
            entityType: 'TIN',
            entityId: maskedTin,
            actorUser: currentOperator?.username || 'SYSTEM',
            severity: result.isValid ? 'INFO' : 'WARN',
            context: { 
              iso: manualIso,
              tin: maskedTin,
              status: result.status,
              message: result.message || null
            }
        }
      });
    } catch (err: any) {
      if (err.message === 'ENCRYPTION_ENGINE_LOCKED') {
        console.warn('[REGTECH] Audit log skipped: Vault is LOCKED.');
        addLog(t('regulatory.logs.vault_locked_alert'), 'warning');
      } else {
        console.error('[REGTECH] Audit failure:', err);
      }
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setBatchFile(file);
    processBatch(file);
  };

  const processBatch = async (file: File) => {
    setIsProcessing(true);
    const text = await file.text();
    const delimiter = detectCsvDelimiter(text);
    setDetectedDelimiter(delimiter);
    
    const lines = text.split(/\r\n|\n|\r/).filter(l => l.trim().length > 0);
    if (lines.length === 0) return;

    // SMART MAPPER: Detect Headers and Column Indices
    const headerRow = splitRespectingQuotes(lines[0], delimiter);
    const lowerHeaders = headerRow.map(c => c.toLowerCase().trim());
    
    const hasHeaders = lowerHeaders.some(c => c.includes('tin') || c.includes('country') || c.includes('iso'));
    
    // Find critical column indices
    let countryIdx = 0;
    let tinIdx = 1;
    let holderTypeIdx = -1;

    if (hasHeaders) {
      const cIdx = lowerHeaders.findIndex(h => h.includes('country') || h === 'iso' || h === 'iso2');
      const tIdx = lowerHeaders.findIndex(h => h.includes('tin') || h.includes('tax') || h === 'number');
      const htIdx = lowerHeaders.findIndex(h => h.includes('type') || h.includes('holder') || h.includes('scope'));
      
      if (cIdx !== -1) countryIdx = cIdx;
      if (tIdx !== -1) tinIdx = tIdx;
      if (htIdx !== -1) holderTypeIdx = htIdx;
    }

    const dataLines = hasHeaders ? lines.slice(1) : lines;
    const results: any[] = [];
    const stats = { total: 0, valid: 0, invalid: 0, mismatch: 0, exempted: 0 };
    
    // Industrial Async Chunking (Prevents UI Freeze / Local DoS)
    const CHUNK_SIZE = 1000;
    let index = 0;

    const processNextChunk = async () => {
      const chunk = dataLines.slice(index, index + CHUNK_SIZE);
      
      for (const line of chunk) {
        const cols = splitRespectingQuotes(line, delimiter);
        if (cols.length < 2) continue;

        const country = (cols[countryIdx] || '').trim().toUpperCase();
        const tin = (cols[tinIdx] || '').trim();
        
        // Handle holderType if column exists
        let hType: 'INDIVIDUAL' | 'ENTITY' | 'ANY' = 'ANY';
        if (holderTypeIdx !== -1 && cols[holderTypeIdx]) {
            const val = cols[holderTypeIdx].toUpperCase();
            if (val.includes('IND') || val === 'PF' || val === 'NATURAL') hType = 'INDIVIDUAL';
            else if (val.includes('ENT') || val === 'PJ' || val === 'LEGAL') hType = 'ENTITY';
        }
        
        const res = regulatoryService.validateTin(country, tin, hType);
        
        stats.total++;
        
        switch (res.status) {
          case 'VALID':
          case 'VALID_UNOFFICIAL':
            stats.valid++;
            break;
          case 'INVALID':
          case 'INVALID_FORMAT':
          case 'INVALID_CHECKSUM':
            stats.invalid++;
            break;
          case 'MISMATCH':
            stats.mismatch++;
            break;
          case 'EXEMPTED':
            stats.exempted++;
            break;
        }

        results.push({
          originalCols: cols,
          country,
          tin,
          status: res.status,
          type: res.tinType,
          message: res.message
        });
      }

      index += CHUNK_SIZE;
      
      if (index < dataLines.length) {
        // UI Heartbeat: update stats partially to show progress
        setBatchStats({ ...stats });
        setTimeout(processNextChunk, 0);
      } else {
        finalizeBatch();
      }
    };

    const finalizeBatch = async () => {
      setBatchResults(results);
      setBatchStats(stats);
      setIsProcessing(false);
      
      addLog(t('regulatory.logs.batch_processed', { 
        total: stats.total, 
        warnings: stats.invalid + stats.mismatch 
      }), 'info');
      
      // Log Batch Audit via Unified Service
      try {
        await auditService.log({
          module: 'REGTECH',
          messageKey: 'REGTECH_TIN_VALIDATION_BATCH',
          status: stats.invalid > 0 || stats.mismatch > 0 ? 'WARNING' : 'SUCCESS',
          details: {
              eventType: 'REGTECH_TIN_VALIDATION_BATCH',
              entityType: 'FILE',
              entityId: file.name,
              severity: stats.invalid > 0 ? 'WARN' : 'INFO',
              context: { fileName: file.name, total: stats.total, invalid: stats.invalid, mismatch: stats.mismatch }
          }
        });
      } catch (err: any) {
        addLog(`Auditoría omitida: ${err.message}`, 'warning');
      }
    };

    processNextChunk();
  };

  const exportEnrichedCsv = () => {
    if (batchResults.length === 0 || !batchFile) return;
    
    /**
     * Sanitizes values to prevent CSV Injection / Formula Injection
     * Prepend ' if it starts with =, +, -, @
     */
    const sanitize = (val: string) => {
      if (!val) return '';
      const unsafe = ['=', '+', '-', '@'];
      if (unsafe.includes(val[0])) return `'${val}`;
      return val;
    };

    const delimiter = detectedDelimiter || ';';
    
    // Header Generation
    const headerRow = batchResults[0]?.originalCols.map((_: any, i: number) => `COL_${i + 1}`) || [];
    const enrichedHeaders = [...headerRow, 'VALIDATION_STATUS', 'TIN_TYPE', 'ENGINE_MESSAGE'];
    
    const headerStr = enrichedHeaders.map(h => `"${sanitize(h).replace(/"/g, '""')}"`).join(delimiter);
    
    const body = batchResults.map(r => {
      const originalLine = r.originalCols.map((c: string) => `"${sanitize(c).replace(/"/g, '""')}"`).join(delimiter);
      return `${originalLine}${delimiter}"${sanitize(r.status)}"${delimiter}"${sanitize(r.type || '')}"${delimiter}"${sanitize(r.message || '').replace(/"/g, '""')}"`;
    }).join('\n');

    const blob = new Blob([headerStr + '\n' + body], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `enriched_${batchFile.name.replace('.csv', '')}_${new Date().getTime()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };


  return (
    <div className="flex-col animate-fade-in" style={{ gap: '24px', padding: '0 24px', height: '100%' }}>
      
      {/* MANUAL SURGEON MODE */}
      {mode === 'one-by-one' && (
      <section className="flex-col animate-slide-up" style={{ flex: 1, gap: '24px' }}>
        <div className="station-card">
            <div className="station-card-header">
                <div className="station-card-title">
                    <ActivityIcon size={14} color="var(--primary-color)" />
                    {t('regulatory.inspector_core').toUpperCase()}
                </div>
            </div>

            <div className="station-card-content">
                <div className="station-form-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '24px' }}>
                    <div className="station-form-field">
                        <CountrySelector 
                            value={manualIso} 
                            onChange={(code) => setManualIso(code)}
                        />
                    </div>
                    <div className="station-form-field">
                        <label className="station-label">{t('regulatory.tin_label').toUpperCase()}</label>
                        <input 
                            className="station-input" 
                            value={manualTin} 
                            onChange={(e) => setManualTin(e.target.value)}
                            style={{ width: '100%' }}
                            placeholder={regulatoryOrchestrator.getInfo(manualIso)?.placeholder || t('regulatory.tin_placeholder')}
                        />
                    </div>
                </div>

                {/* Technical Specs Panel */}
                {regulatoryOrchestrator.getInfo(manualIso) && (
                    <div className="flex-col" style={{ marginTop: '24px', gap: '16px' }}>
                        <div style={{ padding: '16px', background: 'rgba(0,0,0,0.2)', borderRadius: '4px', borderLeft: '2px solid var(--primary-color)' }}>
                            <div className="flex-row" style={{ alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                                <GlobeIcon size={14} color="var(--primary-color)" />
                                <span style={{ fontSize: '0.65rem', fontWeight: 900, letterSpacing: '1px' }}>{t('regulatory.jurisdictional_specs').toUpperCase()}</span>
                            </div>
                            <p style={{ fontSize: '0.75rem', opacity: 0.8, marginBottom: '12px', lineHeight: '1.4' }}>
                                {regulatoryOrchestrator.getInfo(manualIso)?.description}
                            </p>
                            <div className="flex-row" style={{ gap: '16px', flexWrap: 'wrap' }}>
                                <div className="flex-row" style={{ alignItems: 'center', gap: '6px', fontSize: '0.6rem', opacity: 0.6 }}>
                                    <DatabaseIcon size={12} />
                                    <span>{t('regulatory.source').toUpperCase()}: {regulatoryOrchestrator.getInfo(manualIso)?.source?.toUpperCase()}</span>
                                </div>
                                <div className="flex-row" style={{ alignItems: 'center', gap: '6px', fontSize: '0.6rem', opacity: 0.6 }}>
                                    <ClockIcon size={12} />
                                    <span>{t('regulatory.updated').toUpperCase()}: {regulatoryOrchestrator.getInfo(manualIso)?.lastUpdated}</span>
                                </div>
                                {regulatoryOrchestrator.getInfo(manualIso)?.officialLink && (
                                    <a 
                                        href={regulatoryOrchestrator.getInfo(manualIso)?.officialLink} 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        className="flex-row" 
                                        style={{ alignItems: 'center', gap: '6px', fontSize: '0.6rem', color: 'var(--primary-color)', textDecoration: 'none' }}
                                    >
                                        <ExternalLinkIcon size={12} />
                                        <span>{t('regulatory.official_docs').toUpperCase()}</span>
                                    </a>
                                )}
                            </div>
                        </div>

                        {regulatoryOrchestrator.getInfo(manualIso)?.entityDifferentiation && (
                            <div style={{ padding: '12px 16px', background: 'rgba(56, 189, 248, 0.03)', borderRadius: '4px', border: '1px solid rgba(56, 189, 248, 0.1)' }}>
                                <div style={{ fontSize: '0.55rem', fontWeight: 900, color: 'var(--primary-color)', marginBottom: '8px', letterSpacing: '1px' }}>{t('regulatory.entity_diff').toUpperCase()}</div>
                                <div className="station-form-grid" style={{ gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                    <div style={{ fontSize: '0.65rem' }}>
                                        <div style={{ opacity: 0.5, marginBottom: '2px' }}>{t('regulatory.individual').toUpperCase()}</div>
                                        <div>{regulatoryOrchestrator.getInfo(manualIso)?.entityDifferentiation?.individualDescription}</div>
                                    </div>
                                    <div style={{ fontSize: '0.65rem' }}>
                                        <div style={{ opacity: 0.5, marginBottom: '2px' }}>{t('regulatory.entity').toUpperCase()}</div>
                                        <div>{regulatoryOrchestrator.getInfo(manualIso)?.entityDifferentiation?.businessDescription}</div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {regulatoryOrchestrator.getCountryInfo(manualIso) && (
                            <div className="flex-col" style={{ gap: '12px' }}>
                                <div style={{ padding: '12px 16px', background: 'rgba(255,255,255,0.02)', borderRadius: '4px' }}>
                                    <div style={{ fontSize: '0.55rem', fontWeight: 900, opacity: 0.5, marginBottom: '8px', letterSpacing: '1px' }}>{t('regulatory.residency_criteria').toUpperCase()}</div>
                                    <div className="flex-col" style={{ gap: '10px' }}>
                                        <div style={{ fontSize: '0.65rem' }}>
                                            <span style={{ color: 'var(--primary-color)', fontWeight: 700 }}>[{t('regulatory.individual').toUpperCase()}]</span> {regulatoryOrchestrator.getCountryInfo(manualIso)?.residency.individual}
                                        </div>
                                        <div style={{ fontSize: '0.65rem' }}>
                                            <span style={{ color: 'var(--primary-color)', fontWeight: 700 }}>[{t('regulatory.entity').toUpperCase()}]</span> {regulatoryOrchestrator.getCountryInfo(manualIso)?.residency.entity}
                                        </div>
                                    </div>
                                </div>
                                
                                <div className="flex-row" style={{ gap: '8px', flexWrap: 'wrap' }}>
                                    <div className="station-badge tiny">
                                        {t('regulatory.authority').toUpperCase()}: {regulatoryOrchestrator.getCountryInfo(manualIso)?.authority.toUpperCase()}
                                    </div>
                                    <div className="station-badge success tiny">
                                        {t('regulatory.crs_status').toUpperCase()}: {regulatoryOrchestrator.getCountryInfo(manualIso)?.compliance.crsStatus.toUpperCase()}
                                    </div>
                                    <div className="station-badge warn tiny">
                                        {t('regulatory.fatca_status').toUpperCase()}: {regulatoryOrchestrator.getCountryInfo(manualIso)?.compliance.fatcaStatus?.toUpperCase()}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Semantic Requirements */}
                {requirements.length > 0 && (
                    <div style={{ marginTop: '24px', padding: '16px', background: 'rgba(255,255,255,0.02)', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                        <div style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', marginBottom: '12px', fontWeight: 900 }}>{t('regulatory.semantic_title').toUpperCase()}</div>
                        <div className="station-form-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
                            {requirements.map((req, idx) => {
                                const isLegacy = typeof req === 'string';
                                if (isLegacy) {
                                  return (
                                    <div key={`legacy-${idx}`} style={{ padding: '8px', background: 'rgba(255,255,255,0.02)', borderRadius: '4px', fontSize: '0.65rem', opacity: 0.7, borderLeft: '2px solid rgba(255,255,255,0.1)' }}>
                                      {req}
                                    </div>
                                  );
                                }

                                const r = req as any;
                                const hasSuggestions = r.suggestions && r.suggestions.length > 0;
                                
                                return (
                                  <div key={r.key} className="station-form-field">
                                      <label className="station-label">
                                          {t(`regulatory.fields.${r.key}`) !== `regulatory.fields.${r.key}` 
                                              ? t(`regulatory.fields.${r.key}`).toUpperCase()
                                              : r.label.toUpperCase()}
                                      </label>
                                      {r.type === 'select' ? (
                                          <select 
                                              className="station-input" 
                                              style={{ width: '100%' }}
                                              onChange={(e) => setManualMetadata({ ...manualMetadata, [r.key]: e.target.value })}
                                          >
                                              <option value="">{t('regulatory.not_available')}</option>
                                              {r.options?.map((opt: any) => (
                                                  <option key={opt.value} value={opt.value}>
                                                      {t(`regulatory.fields.${opt.label}`) !== `regulatory.fields.${opt.label}`
                                                        ? t(`regulatory.fields.${opt.label}`).toUpperCase()
                                                        : opt.label.toUpperCase()}
                                                  </option>
                                              ))}
                                          </select>
                                      ) : (
                                          <>
                                            <input 
                                                type={r.type === 'date' ? 'date' : (r.type === 'number' ? 'number' : 'text')} 
                                                className="station-input" 
                                                style={{ width: '100%', fontSize: '0.7rem' }}
                                                placeholder={r.placeholder || (r.type === 'date' ? 'YYYY-MM-DD' : '')}
                                                list={hasSuggestions ? `suggestions-${r.key}` : undefined}
                                                onChange={(e) => setManualMetadata({ ...manualMetadata, [r.key]: e.target.value })}
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
                    </div>
                )}

                <button 
                    className="station-btn station-btn-primary" 
                    style={{ width: '100%', marginTop: '24px', height: '48px', fontSize: '1rem', fontWeight: 900 }}
                    onClick={runManualValidation}
                >
                    {t('regulatory.execute_btn').toUpperCase()}
                </button>
            </div>
        </div>

        {/* Manual Results */}
        {manualResult && (
            <div className="flex-col animate-slide-up" style={{ gap: '12px' }}>
                <span className="station-form-section-title">{t('regulatory.validation_report').toUpperCase()}</span>
                <div className="station-card" style={{ padding: '24px', borderLeft: `4px solid ${manualResult.isValid ? 'var(--status-ok)' : 'var(--status-err)'}` }}>
                    <div className="flex-row" style={{ justifyContent: 'space-between', marginBottom: '16px', gap: '16px' }}>
                        <div className="flex-col">
                            <div style={{ fontSize: '0.6rem', opacity: 0.5, fontWeight: 800 }}>{t('regulatory.status_badge').toUpperCase()}</div>
                            <TinStatusBadge status={manualResult.status} />
                        </div>
                        <div className="flex-col" style={{ alignItems: 'flex-end' }}>
                            <div style={{ fontSize: '0.6rem', opacity: 0.5 }}>{t('regulatory.tin_denomination').toUpperCase()}</div>
                            <div style={{ fontWeight: 900, color: 'var(--primary-color)', textAlign: 'right' }}>
                                {(() => {
                                    const main = t(`regulatory.tin_names.${manualIso}.main`);
                                    const aux = t(`regulatory.tin_names.${manualIso}.aux`);
                                    
                                    const hasMain = main !== `regulatory.tin_names.${manualIso}.main`;
                                    const hasAux = aux && aux !== `regulatory.tin_names.${manualIso}.aux`;
                                    
                                    if (hasMain) {
                                        return hasAux ? `${main} (${aux})` : main;
                                    }
                                    return manualResult.tinType || 'UNKNOWN';
                                })()}
                            </div>
                        </div>
                    </div>

                    {manualResult.missingData && (
                        <div style={{ marginTop: '16px', padding: '16px', background: 'rgba(56, 189, 248, 0.05)', border: '1px solid rgba(56, 189, 248, 0.1)', borderRadius: '4px' }}>
                            <p style={{ fontSize: '0.65rem', fontWeight: 900, color: 'var(--primary-color)', textTransform: 'uppercase', letterSpacing: '0.05rem', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <ActivityIcon size={12} />
                                {t('regulatory.semantic_title').toUpperCase()}
                            </p>
                            <div className="flex-row" style={{ flexWrap: 'wrap', gap: '8px' }}>
                                {manualResult.missingData.map((req, idx) => (
                                    <span key={idx} className="station-badge station-badge-blue">
                                        {req.label}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="flex-col" style={{ marginTop: '16px' }}>
                        <div 
                            style={{ 
                                fontSize: '0.9rem', 
                                marginBottom: '8px', 
                                opacity: 1, 
                                fontWeight: 900, 
                                color: manualResult.isValid ? 'var(--status-ok)' : '#ef4444',
                                letterSpacing: '0.5px',
                                lineHeight: '1.2'
                            }}
                        >
                            {manualResult.message}
                        </div>
                        
                        {manualResult.errorDetails && manualResult.errorDetails !== manualResult.message && (
                            <div 
                                style={{ 
                                    fontSize: '0.75rem', 
                                    marginBottom: '16px', 
                                    opacity: 0.7, 
                                    padding: '12px', 
                                    background: 'rgba(255,255,255,0.03)', 
                                    borderRadius: '4px',
                                    borderLeft: '2px solid rgba(255,255,255,0.1)',
                                    lineHeight: '1.4'
                                }}
                            >
                                {manualResult.errorDetails}
                            </div>
                        )}
                    </div>

                    {manualResult.status === 'MISMATCH' && (
                        <MismatchDetails reasonCode={manualResult.reasonCode} fields={manualResult.rawMismatchFields} />
                    )}
                </div>
            </div>
        )}
      </section>
      )}

      <style jsx>{`
        @media (max-width: 640px) {
           .tin-result-header {
             flex-direction: column !important;
             align-items: flex-start !important;
             gap: 12px !important;
           }
           .tin-result-type-box {
             align-items: flex-start !important;
           }
           .tin-result-type-box div {
             text-align: left !important;
           }
           .tin-result-card {
             padding: 16px !important;
           }
        }
      `}</style>
      
      {/* BATCH INDUSTRIAL MODE */}
      {mode === 'batch' && (
      <section className="flex-col animate-slide-up" style={{ flex: 1, gap: '24px' }}>
        <div className="station-card">
            <div className="station-card-header">
                <div className="station-card-title">
                    <ListIcon size={14} color="var(--primary-color)" />
                    {t('regulatory.batch_stream').toUpperCase()}
                </div>
            </div>

            <div className="station-card-content">
                {!batchFile ? (
                    <div className="station-dropzone" style={{ height: '200px' }}>
                        <input type="file" accept=".csv,.txt" onChange={handleFileUpload} />
                        <UploadIcon size={48} className="station-shimmer-text" />
                        <div style={{ marginTop: '16px', fontWeight: 700 }}>{t('regulatory.dropzone_text').toUpperCase()}</div>
                        <div style={{ fontSize: '0.65rem', opacity: 0.5, marginTop: '8px' }}>{t('regulatory.auto_delimiter').toUpperCase()}</div>
                    </div>
                ) : (
                    <div className="flex-col" style={{ gap: '24px' }}>
                        <div className="flex-row" style={{ justifyContent: 'space-between', background: 'rgba(255,255,255,0.02)', padding: '16px', borderRadius: '4px', border: '1px solid var(--border-color)' }}>
                            <div className="flex-col" style={{ gap: '4px' }}>
                                <div style={{ fontSize: '0.6rem', opacity: 0.5, fontWeight: 800 }}>{t('regulatory.active_file').toUpperCase()}</div>
                                <div style={{ fontWeight: 900, fontSize: '1rem', color: 'var(--primary-color)' }}>{batchFile.name.toUpperCase()}</div>
                            </div>
                            <button className="station-btn tiny" style={{ padding: '4px 12px' }} onClick={() => { setBatchFile(null); setBatchResults([]); }}>{t('regulatory.reset_btn').toUpperCase()}</button>
                        </div>

                        {/* Stats Dashboard */}
                        <div className="station-form-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
                            <div className="station-card" style={{ padding: '16px', textAlign: 'center', background: 'rgba(255,255,255,0.02)' }}>
                                <div style={{ fontSize: '0.6rem', opacity: 0.5, fontWeight: 800 }}>{t('regulatory.stat_total').toUpperCase()}</div>
                                <div style={{ fontWeight: 900, fontSize: '1.5rem', fontFamily: 'var(--font-mono)' }}>{batchStats.total}</div>
                            </div>
                            <div className="station-card" style={{ padding: '16px', textAlign: 'center', background: 'rgba(16, 185, 129, 0.05)', borderBottom: '2px solid #10b981' }}>
                                <div style={{ fontSize: '0.6rem', color: '#10b981', fontWeight: 800 }}>{t('regulatory.stat_valid').toUpperCase()}</div>
                                <div style={{ fontWeight: 900, fontSize: '1.5rem', color: '#10b981', fontFamily: 'var(--font-mono)' }}>{batchStats.valid}</div>
                            </div>
                            <div className="station-card" style={{ padding: '16px', textAlign: 'center', background: 'rgba(244, 63, 94, 0.05)', borderBottom: '2px solid #f43f5e' }}>
                                <div style={{ fontSize: '0.6rem', color: '#f43f5e', fontWeight: 800 }}>{t('regulatory.stat_invalid').toUpperCase()}</div>
                                <div style={{ fontWeight: 900, fontSize: '1.5rem', color: '#f43f5e', fontFamily: 'var(--font-mono)' }}>{batchStats.invalid}</div>
                            </div>
                            <div className="station-card" style={{ padding: '16px', textAlign: 'center', background: 'rgba(251, 146, 60, 0.05)', borderBottom: '2px solid #fb923c' }}>
                                <div style={{ fontSize: '0.6rem', color: '#fb923c', fontWeight: 800 }}>{t('regulatory.stat_mismatch').toUpperCase()}</div>
                                <div style={{ fontWeight: 900, fontSize: '1.5rem', color: '#fb923c', fontFamily: 'var(--font-mono)' }}>{batchStats.mismatch}</div>
                            </div>
                        </div>

                        {/* Telemetry info */}
                        <div className="flex-row" style={{ justifyContent: 'space-between', fontSize: '0.65rem', padding: '0 4px' }}>
                            <div style={{ fontWeight: 700, opacity: 0.6 }}>{t('regulatory.delimiter_detected').toUpperCase()}: <span style={{ color: 'var(--primary-color)' }}>{detectedDelimiter === '\t' ? 'TAB' : detectedDelimiter}</span></div>
                            <div style={{ fontWeight: 700, opacity: 0.4 }}>{t('regulatory.memory_isolated').toUpperCase()}</div>
                        </div>

                        <button 
                            className="station-btn station-btn-primary" 
                            style={{ width: '100%', height: '48px', fontSize: '1rem', fontWeight: 900 }} 
                            disabled={isProcessing || batchResults.length === 0}
                            onClick={exportEnrichedCsv}
                        >
                            <DownloadIcon size={18} /> {t('regulatory.export_btn').toUpperCase()}
                        </button>
                    </div>
                )}
            </div>
        </div>

        {/* Batch Results Table Preview */}
        {batchResults.length > 0 && (
            <div className="flex-col" style={{ gap: '12px', flex: 1 }}>
                <span className="station-form-section-title">{t('regulatory.preview_title').toUpperCase()}</span>
                <div className="station-card" style={{ flex: 1, padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                    <div className="station-card-header" style={{ padding: '12px 16px', borderBottom: '1px solid var(--border-color)' }}>
                        <div className="station-card-title" style={{ fontSize: '0.7rem' }}>
                            <ActivityIcon size={12} />
                            {t('regulatory.data_preview').toUpperCase()}
                        </div>
                    </div>
                    <div style={{ overflowY: 'auto', flex: 1 }}>
                        <table className="station-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead style={{ position: 'sticky', top: 0, background: 'var(--surface-color)', zIndex: 1 }}>
                                <tr>
                                    <th style={{ textAlign: 'left', padding: '12px 16px', fontSize: '0.65rem' }}>{t('regulatory.table_iso').toUpperCase()}</th>
                                    <th style={{ textAlign: 'left', padding: '12px 16px', fontSize: '0.65rem' }}>{t('regulatory.table_tin').toUpperCase()}</th>
                                    <th style={{ textAlign: 'center', padding: '12px 16px', fontSize: '0.65rem' }}>{t('regulatory.table_status').toUpperCase()}</th>
                                    <th style={{ textAlign: 'left', padding: '12px 16px', fontSize: '0.65rem' }}>{t('regulatory.table_type').toUpperCase()}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {batchResults.slice(0, 50).map((res, i) => (
                                    <tr key={i} className="station-table-row">
                                        <td style={{ padding: '8px 16px', fontWeight: 900, color: 'var(--primary-color)' }}>{res.country}</td>
                                        <td style={{ padding: '8px 16px', fontFamily: 'var(--font-mono)', fontSize: '0.7rem' }}>{res.tin}</td>
                                        <td style={{ padding: '8px 16px', textAlign: 'center' }}>
                                            <TinStatusBadge status={res.status} tiny />
                                        </td>
                                        <td style={{ padding: '8px 16px', opacity: 0.6, fontSize: '0.65rem' }}>{res.type || t('regulatory.not_available')}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        )}
      </section>
      )}
    </div>
  );
};
