'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import SettingsPanel from '@/components/SettingsPanel';
import FileProcessor from '@/components/FileProcessor';
import { useLanguage } from '@/lib/context/LanguageContext';
import { useWorkspace } from '@/lib/context/WorkspaceContext';
import { useFileBatchProcessor } from '@/lib/hooks/useFileBatchProcessor';
import { useInactivityPurge } from '@/lib/hooks/useInactivityPurge';
import { ShieldCheckIcon, ZapIcon, LockIcon } from '@/components/common/Icons';
import { ForbiddenPanel } from '@/components/common/ForbiddenPanel';
import { cryptStationService } from '@/lib/services/CryptStationService';

interface SelectedFile {
  file: File;
  id: string;
}

function CryptPageContent() {
  const { t } = useLanguage();
  const { can, currentOperator, isLocked } = useWorkspace();
  const searchParams = useSearchParams();
  const mode = (searchParams.get('view') === 'decrypt') ? 'decrypt' : 'encrypt';
  
  if (!can('CRYPT_USE')) {
    return <ForbiddenPanel />;
  }

  const canRun = can('CRYPT_RUN');

  // Elevated state from FileProcessor
  const [files, setFiles] = useState<SelectedFile[]>([]);
  
  // Local Settings State
  const [password, setPassword] = useState('');
  const [batchMode, setBatchMode] = useState(false);
  const [outputSuffix, setOutputSuffix] = useState(mode === 'encrypt' ? '.enc' : '_decrypted');

  const hasFiles = files.length > 0;
  const hasPassphrase = password.trim().length >= 8;
  const ikUnlocked = !isLocked;
  const canStartBatch = hasFiles && hasPassphrase && canRun;

  useEffect(() => {
    setOutputSuffix(mode === 'encrypt' ? '.enc' : '_decrypted');
  }, [mode]);

  // Business Logic Hooks
  const { 
    isProcessing, 
    processFiles, 
    addLog,
    stats
  } = useFileBatchProcessor({ 
    password, 
    outputSuffix 
  });

  // Security Hook
  useInactivityPurge({
    password,
    onPurge: (messageKey) => {
      setPassword('');
      addLog('error', `logs.${messageKey}`);
    }
  });

  const handleProcess = async () => {
    if (!canRun) return;
    
    try {
      // Industrial Validation
      cryptStationService.validateOptions({ mode, password, outputSuffix });

      if (isLocked && mode === 'encrypt') {
        addLog('error', 'logs.ik_locked_error');
        return;
      }
      
      const count = files.length;
      const result = await processFiles(files.map(f => f.file), mode);
      
      if (result) {
        await cryptStationService.logBatchResult(
          currentOperator?.id || 'system', 
          currentOperator?.username || 'unknown', 
          mode, 
          { ...result, total: count }
        );
      }

      if (!batchMode) setFiles([]);
    } catch (err: any) {
      addLog('error', err.message);
    }
  };

  return (
    <div className="flex-col fade-in" style={{ gap: '24px', height: '100%' }}>
      <header className="station-panel-header" style={{ borderBottom: 'none' }}>
        <div className="flex-col" style={{ gap: '4px' }}>
          <h2 className="station-title-main" style={{ margin: 0 }}>
            {mode === 'encrypt' ? t('crypt.shield_vault').toUpperCase() : t('crypt.open_key').toUpperCase()}
          </h2>
          <div className="flex-row" style={{ alignItems: 'center', gap: '12px' }}>
             <span className="station-registry-item-meta" style={{ fontWeight: 700 }}>ENGINE: AES-GCM 256</span>
             <span className="station-badge station-badge-blue">SECURE_CONTEXT</span>
             <span className={`station-badge ${password ? 'station-badge-green' : 'station-badge-orange'}`}>
                {password ? 'VAULT_OPEN' : 'VAULT_LOCKED'}
             </span>
          </div>
        </div>
      </header>


      <div className="flex-col" style={{ gap: '48px', flex: 1, minHeight: 0 }}>
        <section className="flex-col">
          <FileProcessor
            files={files}
            setFiles={setFiles}
            onClear={(n) => addLog('error', 'logs.list_cleared', undefined, { n })}
            onSort={() => addLog('info', 'logs.sort_applied')}
            isProcessing={isProcessing}
            stats={stats}
            hideEmpty={true}
          />
        </section>

        {files.length === 0 && (
          <div className="station-empty-state" style={{ marginTop: '40px' }}>
             <ShieldCheckIcon size={64} className="station-shimmer-text" style={{ marginBottom: '16px' }} />
             <span className="station-shimmer-text">CRYPT_VAULT_AWAITING_INPUT</span>
          </div>
        )}

        {files.length > 0 && (
          <div className="flex-row" style={{ gap: '24px', alignItems: 'flex-start' }}>
            <section style={{ flex: 2 }}>
              <SettingsPanel
                mode={mode}
                password={password}
                setPassword={setPassword}
                batchMode={batchMode}
                setBatchMode={setBatchMode}
                outputSuffix={outputSuffix}
                setOutputSuffix={setOutputSuffix}
                onProcess={handleProcess}
                isProcessing={isProcessing}
                canProcess={canStartBatch}
              />
            </section>

            <section className="station-card flex-col" style={{ flex: 1, background: 'rgba(0,0,0,0.2)', gap: '16px' }}>
               <header className="flex-row" style={{ alignItems: 'center', gap: '8px' }}>
                  <ShieldCheckIcon size={16} color="var(--primary-color)" />
                  <h3 className="station-form-section-title" style={{ margin: 0 }}>CRYPT_PRE_FLIGHT</h3>
               </header>
               
               <div className="flex-col" style={{ gap: '12px' }}>
                  <div className="flex-row" style={{ justifyContent: 'space-between', fontSize: '0.75rem' }}>
                    <span style={{ opacity: hasFiles ? 1 : 0.4 }}>FILE_SET_SELECTED</span>
                    <span style={{ fontWeight: 800, color: hasFiles ? 'var(--status-ok)' : 'var(--status-err)' }}>{hasFiles ? 'YES' : 'NO'}</span>
                  </div>
                  <div className="flex-row" style={{ justifyContent: 'space-between', fontSize: '0.75rem' }}>
                    <span style={{ opacity: hasPassphrase ? 1 : 0.4 }}>VAULT_PASSPHRASE</span>
                    <span style={{ fontWeight: 800, color: hasPassphrase ? 'var(--status-ok)' : 'var(--status-err)' }}>{hasPassphrase ? 'READY' : 'REQUIRED'}</span>
                  </div>
                  <div className="flex-row" style={{ justifyContent: 'space-between', fontSize: '0.75rem' }}>
                    <span style={{ opacity: ikUnlocked ? 1 : 0.4 }}>SECURITY_IK_STATUS</span>
                    <span style={{ fontWeight: 800, color: ikUnlocked ? 'var(--status-ok)' : 'var(--status-warn)' }}>{ikUnlocked ? 'UNLOCKED' : 'LOCKED'}</span>
                  </div>
                  <div className="flex-row" style={{ justifyContent: 'space-between', fontSize: '0.75rem' }}>
                    <span style={{ opacity: canRun ? 1 : 0.4 }}>OPERATOR_PRIVILEGE</span>
                    <span style={{ fontWeight: 800, color: canRun ? 'var(--status-ok)' : 'var(--status-err)' }}>{canRun ? 'AUTHORIZED' : 'FORBIDDEN'}</span>
                  </div>

                  <div style={{ marginTop: '8px', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '16px' }}>
                    <button 
                      className="station-btn station-btn-primary full" 
                      onClick={handleProcess}
                      disabled={!canStartBatch || isProcessing}
                      style={{ height: '48px', fontWeight: 900 }}
                    >
                      {isProcessing ? 'PROCESSING...' : <><ZapIcon size={18} /> START_BATCH</>}
                    </button>
                    {isLocked && mode === 'encrypt' && (
                      <p className="flex-row" style={{ color: 'var(--status-warn)', fontSize: '0.65rem', marginTop: '12px', justifyContent: 'center', fontWeight: 700, gap: '4px' }}>
                        <LockIcon size={10} /> IK_LOCKED: AT-REST_SECURITY_AT_RISK
                      </p>
                    )}
                  </div>
               </div>
            </section>
          </div>
        )}
      </div>

      {/* Sello de Integridad (Era 6) */}
      <div className="station-integrity-badge flex-row" style={{ position: 'fixed', bottom: '24px', right: '24px', gap: '8px', opacity: 0.6 }}>
         <div className="integrity-dot" style={{ background: 'var(--status-ok)' }} />
         <ShieldCheckIcon size={14} />
         <span>AES-GCM 256 INDUSTRIAL</span>
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <Suspense fallback={<div className="station-shimmer-text">LOADING_SECURE_CONTEXT...</div>}>
      <CryptPageContent />
    </Suspense>
  );
}
