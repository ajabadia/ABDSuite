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

  // --- MANUAL STATE ---
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
    const consoleMsg = `VALIDACIÓN MANUAL [${manualIso}]: ${manualTin} -> ${result.status} (${result.message})`;
    addLog(consoleMsg, result.isValid ? 'info' : 'warning');

    // Log individual audit via Unified Service
    try {
      await auditService.log({
        module: 'REGTECH',
        messageKey: 'REGTECH_TIN_VALIDATION_MANUAL',
        status: result.isValid || result.status === 'EXEMPTED' ? 'SUCCESS' : 'WARNING',
        details: { 
            eventType: 'REGTECH_TIN_VALIDATION_MANUAL',
            entityType: 'TIN',
            entityId: manualTin,
            actorUser: currentOperator?.username || 'SYSTEM',
            severity: result.isValid ? 'INFO' : 'WARN',
            context: { 
              iso: manualIso,
              tin: manualTin,
              status: result.status,
              message: result.message || null
            }
        }
      });
    } catch (err: any) {
      if (err.message === 'ENCRYPTION_ENGINE_LOCKED') {
        console.warn('[REGTECH] Audit log skipped: Vault is LOCKED.');
        addLog('Auditoría omitida (Vault Bloqueado)', 'WARNING');
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

    // Batch Processing (Pattern: Industrial Sequential)
    for (const line of dataLines) {
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

    setBatchResults(results);
    setBatchStats(stats);
    setIsProcessing(false);
    
    addLog(`Batch TIN processed: ${stats.total} records. ${stats.invalid + stats.mismatch} warnings/errors.`, 'info');
    
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

  const exportEnrichedCsv = () => {
    if (batchResults.length === 0 || !batchFile) return;
    
    // Get original headers or generate them
    const text = batchFile.name; // Use file name as reference
    const delimiter = detectedDelimiter || ';';
    
    let header = '';
    // Read headers again to preserve them
    const originalHeader = batchResults[0]?.originalCols?.length > 0 ? true : false;
    
    // Build Header
    header = `_ORIGINAL_DATA_${delimiter}VALIDATION_STATUS${delimiter}TIN_TYPE${delimiter}ENGINE_MESSAGE\n`;
    
    const body = batchResults.map(r => {
      const originalLine = r.originalCols.map((c: string) => `"${c.replace(/"/g, '""')}"`).join(delimiter);
      return `${originalLine}${delimiter}${r.status}${delimiter}${r.type || ''}${delimiter}"${(r.message || '').replace(/"/g, '""')}"`;
    }).join('\n');

    const blob = new Blob([header + body], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `enriched_${batchFile.name.replace('.csv', '')}_${new Date().getTime()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="station-container animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '24px', padding: '24px', height: '100%' }}>
      
      {/* LEFT PANEL: MANUAL SURGEON */}
      {mode === 'one-by-one' && (
      <section className="flex-col" style={{ flex: 1, gap: '12px' }}>
        <div className="station-registry">
            <div className="station-registry-header" onClick={() => setIsManualCollapsed(!isManualCollapsed)}>
                <div className="station-registry-title">
                    <SearchIcon size={18} />
                    {t('shell.regtech_station.manual_inspector_title').toUpperCase()}
                </div>
                <div style={{ opacity: 0.5 }}>
                    {isManualCollapsed ? <ArrowDownIcon size={18} /> : <ArrowUpIcon size={18} />}
                </div>
            </div>

            <div className={`station-registry-anim-container ${!isManualCollapsed ? 'expanded' : ''}`}>
                <div className="station-registry-anim-content">
                    <div className="station-registry-content">
                        <div className="section-header-technical" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '24px' }}>
                            <ActivityIcon size={14} color="var(--primary-color)" />
                            <h3 style={{ fontSize: '0.7rem', fontWeight: 900, letterSpacing: '1px' }}>INSPECTOR_CORE_V6</h3>
                        </div>

                        <div className="module-grid" style={{ gap: '16px' }}>
                            <div className="module-col-4">
                                <CountrySelector 
                                    value={manualIso} 
                                    onChange={(code) => setManualIso(code)}
                                />
                            </div>
                            <div className="module-col-8">
                                <label className="station-label">{t('shell.regtech_station.tin_label')}</label>
                                <input 
                                    className="station-input" 
                                    value={manualTin} 
                                    onChange={(e) => setManualTin(e.target.value)}
                                    style={{ width: '100%' }}
                                    placeholder={regulatoryOrchestrator.getInfo(manualIso)?.placeholder || t('shell.regtech_station.tin_placeholder')}
                                />
                            </div>
                        </div>

                        {/* Technical Specs Panel (Industrial Era 6.3) */}
                        {regulatoryOrchestrator.getInfo(manualIso) && (
                            <div style={{ marginTop: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                {/* 1. General Specs & Description */}
                                <div style={{ padding: '16px', background: 'rgba(0,0,0,0.2)', borderRadius: '4px', borderLeft: '2px solid var(--primary-color)' }}>
                                    <div className="flex-row" style={{ alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                                        <GlobeIcon size={14} color="var(--primary-color)" />
                                        <span style={{ fontSize: '0.65rem', fontWeight: 900, letterSpacing: '1px' }}>JURISDICTIONAL_SPECIFICATIONS</span>
                                    </div>
                                    <p style={{ fontSize: '0.75rem', opacity: 0.8, marginBottom: '12px', lineHeight: '1.4' }}>
                                        {regulatoryOrchestrator.getInfo(manualIso)?.description}
                                    </p>
                                    <div className="flex-row" style={{ gap: '16px', flexWrap: 'wrap' }}>
                                        <div className="flex-row" style={{ alignItems: 'center', gap: '6px', fontSize: '0.6rem', opacity: 0.6 }}>
                                            <DatabaseIcon size={12} />
                                            <span>SOURCE: {regulatoryOrchestrator.getInfo(manualIso)?.source?.toUpperCase()}</span>
                                        </div>
                                        <div className="flex-row" style={{ alignItems: 'center', gap: '6px', fontSize: '0.6rem', opacity: 0.6 }}>
                                            <ClockIcon size={12} />
                                            <span>UPDATED: {regulatoryOrchestrator.getInfo(manualIso)?.lastUpdated}</span>
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
                                                <span>OFFICIAL_DOCUMENTATION</span>
                                            </a>
                                        )}
                                    </div>
                                </div>

                                {/* 2. Entity Differentiation (New) */}
                                {regulatoryOrchestrator.getInfo(manualIso)?.entityDifferentiation && (
                                    <div style={{ padding: '12px 16px', background: 'rgba(56, 189, 248, 0.03)', borderRadius: '4px', border: '1px solid rgba(56, 189, 248, 0.1)' }}>
                                        <div style={{ fontSize: '0.55rem', fontWeight: 900, color: 'var(--primary-color)', marginBottom: '8px', letterSpacing: '1px' }}>ENTITY_DIFFERENTIATION_LOGIC</div>
                                        <div className="module-grid" style={{ gap: '12px' }}>
                                            <div className="module-col-6" style={{ fontSize: '0.65rem' }}>
                                                <div style={{ opacity: 0.5, marginBottom: '2px' }}>INDIVIDUAL</div>
                                                <div>{regulatoryOrchestrator.getInfo(manualIso)?.entityDifferentiation?.individualDescription}</div>
                                            </div>
                                            <div className="module-col-6" style={{ fontSize: '0.65rem' }}>
                                                <div style={{ opacity: 0.5, marginBottom: '2px' }}>BUSINESS / ENTITY</div>
                                                <div>{regulatoryOrchestrator.getInfo(manualIso)?.entityDifferentiation?.businessDescription}</div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* 3. Residency & Compliance (New) */}
                                {regulatoryOrchestrator.getCountryInfo(manualIso) && (
                                    <div className="module-grid" style={{ gap: '12px' }}>
                                        <div className="module-col-12" style={{ padding: '12px 16px', background: 'rgba(255,255,255,0.02)', borderRadius: '4px' }}>
                                            <div style={{ fontSize: '0.55rem', fontWeight: 900, opacity: 0.5, marginBottom: '8px', letterSpacing: '1px' }}>FISCAL_RESIDENCE_CRITERIA</div>
                                            <div className="flex-col" style={{ gap: '10px' }}>
                                                <div style={{ fontSize: '0.65rem' }}>
                                                    <span style={{ color: 'var(--primary-color)', fontWeight: 700 }}>[INDIVIDUAL]</span> {regulatoryOrchestrator.getCountryInfo(manualIso)?.residency.individual}
                                                </div>
                                                <div style={{ fontSize: '0.65rem' }}>
                                                    <span style={{ color: 'var(--primary-color)', fontWeight: 700 }}>[ENTITY]</span> {regulatoryOrchestrator.getCountryInfo(manualIso)?.residency.entity}
                                                </div>
                                            </div>
                                        </div>
                                        
                                        <div className="module-col-12 flex-row" style={{ gap: '8px', flexWrap: 'wrap' }}>
                                            <div className="station-badge" style={{ fontSize: '0.55rem', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)' }}>
                                                AUTHORITY: {regulatoryOrchestrator.getCountryInfo(manualIso)?.authority.toUpperCase()}
                                            </div>
                                            <div className="station-badge" style={{ fontSize: '0.55rem', background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
                                                CRS: {regulatoryOrchestrator.getCountryInfo(manualIso)?.compliance.crsStatus.toUpperCase()}
                                            </div>
                                            <div className="station-badge" style={{ fontSize: '0.55rem', background: 'rgba(249, 115, 22, 0.1)', color: '#f97316', border: '1px solid rgba(249, 115, 22, 0.2)' }}>
                                                FATCA: {regulatoryOrchestrator.getCountryInfo(manualIso)?.compliance.fatcaStatus?.toUpperCase()}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Semantic Cross-Check Fields (Dynamic Era 6) */}
                        {requirements.length > 0 && (
                            <div style={{ marginTop: '24px', padding: '16px', background: 'rgba(255,255,255,0.02)', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                                <div style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', marginBottom: '12px', fontWeight: 900 }}>SEMANTIC_REQUIREMENTS_DETECTED</div>
                                <div className="module-grid" style={{ gap: '12px' }}>
                                    {requirements.map((req, idx) => {
                                        const isLegacy = typeof req === 'string';
                                        if (isLegacy) {
                                          return (
                                            <div key={`legacy-${idx}`} className="module-col-12" style={{ padding: '8px', background: 'rgba(255,255,255,0.02)', borderRadius: '4px', fontSize: '0.65rem', opacity: 0.7, borderLeft: '2px solid rgba(255,255,255,0.1)' }}>
                                              {req}
                                            </div>
                                          );
                                        }

                                        const r = req as any;
                                        const hasSuggestions = r.suggestions && r.suggestions.length > 0;
                                        
                                        return (
                                          <div key={r.key} className="module-col-6">
                                              <label className="station-label">
                                                  {t(`shell.regtech_fields.${r.label}`) !== `shell.regtech_fields.${r.label}` 
                                                      ? t(`shell.regtech_fields.${r.label}`)
                                                      : r.label.toUpperCase()}
                                              </label>
                                              {r.type === 'select' ? (
                                                  <select 
                                                      className="station-input" 
                                                      style={{ width: '100%' }}
                                                      onChange={(e) => setManualMetadata({ ...manualMetadata, [r.key]: e.target.value })}
                                                  >
                                                      <option value="">N/A</option>
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
                            style={{ width: '100%', marginTop: '24px', height: '48px' }}
                            onClick={runManualValidation}
                        >
                            {t('shell.regtech_station.execute_btn')}
                        </button>
                    </div>
                </div>
            </div>
        </div>

        {/* Manual Results */}
        {manualResult && (
            <div className="flex-col" style={{ gap: '12px', marginTop: '12px' }}>
                <span className="station-form-section-title">VALIDATION_REPORT_CORE</span>
                <div className="station-card animate-slide-up" style={{ padding: '24px', borderLeft: `4px solid ${manualResult.isValid ? 'var(--status-ok)' : 'var(--status-err)'}` }}>
                    <div className="flex-row" style={{ justifyContent: 'space-between', marginBottom: '16px' }}>
                        <div className="flex-col">
                            <div style={{ fontSize: '0.6rem', opacity: 0.5, fontWeight: 800 }}>{t('shell.regtech_station.status_badge').toUpperCase()}</div>
                            <TinStatusBadge status={manualResult.status} />
                    </div>
                    <div className="flex-col" style={{ alignItems: 'flex-end' }}>
                        <div style={{ fontSize: '0.6rem', opacity: 0.5 }}>{t('shell.regtech_station.tin_denomination')}</div>
                        <div style={{ fontWeight: 900, color: 'var(--primary-color)', textAlign: 'right' }}>
                            {(() => {
                                const main = t(`shell.regtech_tin_names.${manualIso}.main`);
                                const aux = t(`shell.regtech_tin_names.${manualIso}.aux`);
                                
                                // Check if we have valid translations (not the path string)
                                const hasMain = main !== `shell.regtech_tin_names.${manualIso}.main`;
                                const hasAux = aux && aux !== `shell.regtech_tin_names.${manualIso}.aux`;
                                
                                if (hasMain) {
                                    return hasAux ? `${main} (${aux})` : main;
                                }
                                return manualResult.tinType || 'UNKNOWN';
                            })()}
                            {manualResult.missingData && (
              <div style={{ marginTop: '16px', padding: '16px', background: 'rgba(56, 189, 248, 0.05)', border: '1px solid rgba(56, 189, 248, 0.1)', borderRadius: '4px' }}>
                <p style={{ fontSize: '0.65rem', fontWeight: 900, color: 'var(--primary-color)', textTransform: 'uppercase', letterSpacing: '0.05rem', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <ActivityIcon size={12} />
                  {t('shell.regtech_station.semantic_title')}
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
          </div>
                    </div>
                </div>

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
      
      {/* RIGHT PANEL: BATCH INDUSTRIAL */}
      {mode === 'batch' && (
      <section className="flex-col" style={{ flex: 1, gap: '12px' }}>
        <div className="station-registry">
            <div className="station-registry-header" onClick={() => setIsBatchCollapsed(!isBatchCollapsed)}>
                <div className="station-registry-title">
                    <ListIcon size={18} />
                    {t('shell.regtech_station.batch_title').toUpperCase()}
                </div>
                <div style={{ opacity: 0.5 }}>
                    {isBatchCollapsed ? <ArrowDownIcon size={18} /> : <ArrowUpIcon size={18} />}
                </div>
            </div>

            <div className={`station-registry-anim-container ${!isBatchCollapsed ? 'expanded' : ''}`}>
                <div className="station-registry-anim-content">
                    <div className="station-registry-content">
                        <div className="section-header-technical" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '24px' }}>
                            <ActivityIcon size={14} color="var(--primary-color)" />
                            <h3 style={{ fontSize: '0.7rem', fontWeight: 900, letterSpacing: '1px' }}>BATCH_INDUSTRIAL_STREAM</h3>
                        </div>

            {!batchFile ? (
                <div className="station-dropzone" style={{ height: '200px' }}>
                    <input type="file" accept=".csv,.txt" onChange={handleFileUpload} />
                    <UploadIcon size={48} className="station-shimmer-text" />
                    <div style={{ marginTop: '16px' }}>{t('shell.regtech_station.dropzone_text')}</div>
                    <div style={{ fontSize: '0.65rem', opacity: 0.5 }}>{t('shell.regtech_station.auto_delimiter')}</div>
                </div>
            ) : (
                <div className="flex-col" style={{ gap: '16px' }}>
                    <div className="flex-row" style={{ justifyContent: 'space-between', background: 'rgba(255,255,255,0.02)', padding: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                        <div className="flex-col">
                            <div style={{ fontSize: '0.6rem', opacity: 0.5 }}>{t('shell.regtech_station.active_file')}</div>
                            <div style={{ fontWeight: 700 }}>{batchFile.name}</div>
                        </div>
                        <button className="station-btn" style={{ padding: '4px 12px', minWidth: 'auto' }} onClick={() => { setBatchFile(null); setBatchResults([]); }}>{t('shell.regtech_station.reset_btn')}</button>
                    </div>

                    {/* Stats Dashboard */}
                    <div className="module-grid" style={{ gap: '8px' }}>
                        <div className="module-col-3 station-card" style={{ padding: '12px', textAlign: 'center' }}>
                            <div style={{ fontSize: '0.55rem', opacity: 0.5 }}>{t('shell.regtech_station.stat_total')}</div>
                            <div style={{ fontWeight: 900, fontSize: '1.2rem' }}>{batchStats.total}</div>
                        </div>
                        <div className="module-col-3 station-card" style={{ padding: '12px', textAlign: 'center', borderBottom: '2px solid #10b981' }}>
                            <div style={{ fontSize: '0.55rem', color: '#10b981', opacity: 0.7 }}>{t('shell.regtech_station.stat_valid')}</div>
                            <div style={{ fontWeight: 900, fontSize: '1.2rem', color: '#10b981' }}>{batchStats.valid}</div>
                        </div>
                        <div className="module-col-3 station-card" style={{ padding: '12px', textAlign: 'center', borderBottom: '2px solid #f43f5e' }}>
                            <div style={{ fontSize: '0.55rem', color: '#f43f5e', opacity: 0.7 }}>{t('shell.regtech_station.stat_invalid')}</div>
                            <div style={{ fontWeight: 900, fontSize: '1.2rem', color: '#f43f5e' }}>{batchStats.invalid}</div>
                        </div>
                        <div className="module-col-3 station-card" style={{ padding: '12px', textAlign: 'center', borderBottom: '2px solid #fb923c' }}>
                            <div style={{ fontSize: '0.55rem', color: '#fb923c', opacity: 0.7 }}>{t('shell.regtech_station.stat_mismatch')}</div>
                            <div style={{ fontWeight: 900, fontSize: '1.2rem', color: '#fb923c' }}>{batchStats.mismatch}</div>
                        </div>
                    </div>

                    {/* Telemetry info */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.65rem' }}>
                        <div>{t('shell.regtech_station.delimiter_detected')}: <code style={{ color: 'var(--primary-color)' }}>{detectedDelimiter === '\t' ? 'TAB' : detectedDelimiter}</code></div>
                        <div style={{ opacity: 0.5 }}>{t('shell.regtech_station.memory_isolated')}</div>
                    </div>

                    <button 
                        className="station-btn" 
                        style={{ width: '100%', marginTop: '8px' }} 
                        disabled={isProcessing || batchResults.length === 0}
                        onClick={exportEnrichedCsv}
                    >
                        <DownloadIcon size={16} /> {t('shell.regtech_station.export_btn')}
                    </button>
                </div>
            )}
                    </div>
                </div>
            </div>
        </div>

        {/* Batch Results Table Preview */}
        {batchResults.length > 0 && (
            <div className="flex-col" style={{ gap: '12px', flex: 1 }}>
                <span className="station-form-section-title">{t('shell.regtech_station.preview_title').toUpperCase()}</span>
                <div className="station-table-container" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                    <div style={{ padding: '12px 16px', background: 'rgba(0,0,0,0.1)', borderBottom: '1px solid rgba(255,255,255,0.05)', fontSize: '0.65rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '1px' }}>
                        DATA_PREVIEW_STREAM
                    </div>
                <div style={{ overflowY: 'auto' }}>
                    <table className="station-table" style={{ width: '100%', fontSize: '0.75rem' }}>
                        <thead style={{ position: 'sticky', top: 0, background: 'var(--module-bg)', zIndex: 1 }}>
                            <tr>
                                <th style={{ textAlign: 'left', padding: '8px 16px' }}>{t('shell.regtech_station.table_iso')}</th>
                                <th style={{ textAlign: 'left', padding: '8px 16px' }}>{t('shell.regtech_station.table_tin')}</th>
                                <th style={{ textAlign: 'center', padding: '8px 16px' }}>{t('shell.regtech_station.table_status')}</th>
                                <th style={{ textAlign: 'left', padding: '8px 16px' }}>{t('shell.regtech_station.table_type')}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {batchResults.slice(0, 50).map((res, i) => (
                                <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.02)' }}>
                                    <td style={{ padding: '6px 16px', fontWeight: 700 }}>{res.country}</td>
                                    <td style={{ padding: '6px 16px', fontFamily: 'var(--font-roboto-mono)' }}>{res.tin}</td>
                                    <td style={{ padding: '6px 16px', textAlign: 'center' }}>
                                        <TinStatusBadge status={res.status} tiny />
                                    </td>
                                    <td style={{ padding: '6px 16px', opacity: 0.6 }}>{res.type || 'N/A'}</td>
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
