'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import SettingsPanel from '@/components/SettingsPanel';
import FileProcessor from '@/components/FileProcessor';
import { useLanguage } from '@/lib/context/LanguageContext';
import { useWorkspace } from '@/lib/context/WorkspaceContext';
import { useFileBatchProcessor } from '@/lib/hooks/useFileBatchProcessor';
import { useInactivityPurge } from '@/lib/hooks/useInactivityPurge';
import { ShieldCheckIcon, UnlockIcon } from '@/components/common/Icons';
import { ForbiddenPanel } from '@/components/common/ForbiddenPanel';

interface SelectedFile {
  file: File;
  id: string;
}

function CryptPageContent() {
  const { t } = useLanguage();
  const { can } = useWorkspace();
  const searchParams = useSearchParams();
  const mode = (searchParams.get('view') === 'decrypt') ? 'decrypt' : 'encrypt';
  
  if (!can('CRYPT_USE')) {
    return <ForbiddenPanel />;
  }

  // Elevated state from FileProcessor
  const [files, setFiles] = useState<SelectedFile[]>([]);
  
  // Local Settings State
  const [password, setPassword] = useState('');
  const [batchMode, setBatchMode] = useState(false);
  const [outputSuffix, setOutputSuffix] = useState(mode === 'encrypt' ? '.enc' : '_decrypted');

  // Reset suffix when mode changes (optional, but requested behavior implies defaults)
  useEffect(() => {
    setOutputSuffix(mode === 'encrypt' ? '.enc' : '_decrypted');
  }, [mode]);

  // Business Logic Hooks
  const { 
    isProcessing, 
    processFiles, 
    clearLogs, 
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

  const handleProcess = () => {
    processFiles(files.map(f => f.file), mode);
    if (!batchMode) setFiles([]);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', height: '100%' }}>
      <header className="station-panel-header" style={{ padding: '0 0 20px 0' }}>
        <div className="flex-col" style={{ gap: '4px' }}>
          <h2 className="station-title-main" style={{ margin: 0 }}>
            {mode === 'encrypt' ? t('crypt.shield_vault').toUpperCase() : t('crypt.open_key').toUpperCase()}
          </h2>
          <div className="flex-row" style={{ alignItems: 'center', gap: '12px' }}>
             <span style={{ opacity: 0.5, fontSize: '0.75rem', fontWeight: 700 }}>ENGINE: AES-GCM 256</span>
             <span className="station-badge station-badge-blue">SECURE_CONTEXT</span>
             <span className={`station-badge ${password ? 'station-badge-green' : 'station-badge-orange'}`}>
                {password ? 'VAULT_OPEN' : 'VAULT_LOCKED'}
             </span>
          </div>
        </div>
      </header>


      <div style={{ display: 'flex', flexDirection: 'column', gap: '64px', flex: 1, minHeight: 0 }}>
        <section style={{ display: 'flex', flexDirection: 'column' }}>
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
             <ShieldCheckIcon size={64} style={{ marginBottom: '16px' }} />
             <span className="station-shimmer-text">CRYPT_VAULT_AWAITING_INPUT</span>
          </div>
        )}

        {files.length > 0 && (
          <section style={{ display: 'flex', flexDirection: 'column' }}>
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
              canProcess={files.length > 0 && password.trim().length > 0}
            />
          </section>
        )}
      </div>

      {/* Sello de Integridad (Era 6) */}
      <div className="station-integrity-badge" style={{ position: 'fixed', bottom: '24px', right: '24px' }}>
         <div className="integrity-dot" />
         <ShieldCheckIcon size={14} />
         <span>AES-GCM 256 INDUSTRIAL</span>
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <CryptPageContent />
    </Suspense>
  );
}
