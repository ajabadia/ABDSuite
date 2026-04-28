'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import SettingsPanel from '@/components/SettingsPanel';
import FileProcessor from '@/components/FileProcessor';
import { useLanguage } from '@/lib/context/LanguageContext';
import { useWorkspace } from '@/lib/context/WorkspaceContext';
import { useFileBatchProcessor } from '@/lib/hooks/useFileBatchProcessor';
import { useInactivityPurge } from '@/lib/hooks/useInactivityPurge';
import { ShieldCheckIcon, ZapIcon, LockIcon, UnlockIcon } from '@/components/common/Icons';
import { ForbiddenPanel } from '@/components/common/ForbiddenPanel';
import { cryptStationService } from '@/lib/services/CryptStationService';
import { StationHeader } from '@/components/shell/StationHeader';

interface SelectedFile {
  file: File;
  id: string;
}

function CryptPageContent() {
  const { t } = useLanguage();
  const { can, currentOperator, isLocked } = useWorkspace();
  const searchParams = useSearchParams();
  const router = useRouter();
  const mode = (searchParams.get('view') === 'decrypt') ? 'decrypt' : 'encrypt';
  
  if (!can('CRYPT_USE')) {
    return <ForbiddenPanel />;
  }

  const canRun = can('CRYPT_RUN');

  const [files, setFiles] = useState<SelectedFile[]>([]);
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

  const { 
    isProcessing, 
    processFiles, 
    addLog,
    stats
  } = useFileBatchProcessor({ 
    password, 
    outputSuffix 
  });

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
    <div className="flex-col animate-fade-in" style={{ height: '100%', gap: '24px' }}>
      <StationHeader 
        title={t('shell.crypt').toUpperCase()}
        engineId="AES-GCM_256_V6"
        activeTabId={mode}
        tabs={[
          { 
            id: 'encrypt', 
            label: t('crypt.shield_vault'), 
            icon: <ShieldCheckIcon size={14} />, 
            onClick: () => router.push('/crypt?view=encrypt')
          },
          { 
            id: 'decrypt', 
            label: t('crypt.open_key'), 
            icon: <UnlockIcon size={14} />, 
            onClick: () => router.push('/crypt?view=decrypt')
          }
        ]}
      />

      <div className="crypt-main-layout flex-col" style={{ gap: '32px', flex: 1, minHeight: 0 }}>
        <section className="crypt-processor-section flex-col">
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
             <span className="station-shimmer-text">{t('crypt.waiting_input').toUpperCase()}</span>
          </div>
        )}

        {files.length > 0 && (
          <div className="crypt-ops-grid flex-row" style={{ gap: '24px', alignItems: 'flex-start' }}>
            <section className="crypt-settings-panel" style={{ flex: 2 }}>
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

            <section className="crypt-preflight-panel station-card flex-col" style={{ flex: 1, background: 'rgba(0,0,0,0.2)', gap: '16px' }}>
               <header className="flex-row" style={{ alignItems: 'center', gap: '8px' }}>
                  <ZapIcon size={16} color="var(--primary-color)" />
                  <h3 className="station-form-section-title" style={{ margin: 0, fontWeight: 900 }}>{t('crypt.pre_flight').toUpperCase()}</h3>
               </header>
               
               <div className="flex-col" style={{ gap: '12px' }}>
                  <div className="flex-row" style={{ justifyContent: 'space-between', fontSize: '0.7rem', fontWeight: 800 }}>
                    <span style={{ opacity: hasFiles ? 1 : 0.4 }}>{t('crypt.status_files')}</span>
                    <span style={{ color: hasFiles ? 'var(--status-ok)' : 'var(--status-err)' }}>{hasFiles ? 'YES' : 'NO'}</span>
                  </div>
                  <div className="flex-row" style={{ justifyContent: 'space-between', fontSize: '0.7rem', fontWeight: 800 }}>
                    <span style={{ opacity: hasPassphrase ? 1 : 0.4 }}>{t('crypt.status_passphrase')}</span>
                    <span style={{ color: hasPassphrase ? 'var(--status-ok)' : 'var(--status-err)' }}>{hasPassphrase ? t('crypt.ready') : t('crypt.required')}</span>
                  </div>
                  <div className="flex-row" style={{ justifyContent: 'space-between', fontSize: '0.7rem', fontWeight: 800 }}>
                    <span style={{ opacity: ikUnlocked ? 1 : 0.4 }}>{t('crypt.status_ik')}</span>
                    <span style={{ color: ikUnlocked ? 'var(--status-ok)' : 'var(--status-warn)' }}>{ikUnlocked ? t('crypt.vault_open') : t('crypt.vault_locked')}</span>
                  </div>
                  <div className="flex-row" style={{ justifyContent: 'space-between', fontSize: '0.7rem', fontWeight: 800 }}>
                    <span style={{ opacity: canRun ? 1 : 0.4 }}>{t('crypt.status_operator')}</span>
                    <span style={{ color: canRun ? 'var(--status-ok)' : 'var(--status-err)' }}>{canRun ? t('crypt.authorized') : t('crypt.forbidden')}</span>
                  </div>

                  <div style={{ marginTop: '8px', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '16px' }}>
                    <button 
                      className="station-btn station-btn-primary full" 
                      onClick={handleProcess}
                      disabled={!canStartBatch || isProcessing}
                      style={{ height: '48px', fontWeight: 900, fontSize: '1rem' }}
                    >
                      {isProcessing ? t('processor.processing').toUpperCase() : <><ZapIcon size={18} /> {t('crypt.start_batch').toUpperCase()}</>}
                    </button>
                    {isLocked && mode === 'encrypt' && (
                      <p className="flex-row" style={{ color: 'var(--status-warn)', fontSize: '0.65rem', marginTop: '12px', justifyContent: 'center', fontWeight: 900, gap: '4px' }}>
                        <LockIcon size={10} /> {t('crypt.ik_locked_warning').toUpperCase()}
                      </p>
                    )}
                  </div>
               </div>
            </section>
          </div>
        )}
      </div>

      <style jsx>{`
        @media (max-width: 1024px) {
          .crypt-ops-grid {
            flex-direction: column;
            align-items: stretch !important;
          }
          .crypt-settings-panel, .crypt-preflight-panel {
            flex: none !important;
            width: 100% !important;
          }
        }
      `}</style>
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
