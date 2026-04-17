'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import SettingsPanel from '@/components/SettingsPanel';
import FileProcessor from '@/components/FileProcessor';
import { useLanguage } from '@/lib/context/LanguageContext';
import { useFileBatchProcessor } from '@/lib/hooks/useFileBatchProcessor';
import { useInactivityPurge } from '@/lib/hooks/useInactivityPurge';
import { ShieldCheckIcon, UnlockIcon } from '@/components/common/Icons';

interface SelectedFile {
  file: File;
  id: string;
}

function CryptPageContent() {
  const { t } = useLanguage();
  const searchParams = useSearchParams();
  const mode = (searchParams.get('view') === 'decrypt') ? 'decrypt' : 'encrypt';
  
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
      <header className="module-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', fontSize: '1.2rem', fontWeight: 800 }}>
          {mode === 'encrypt' ? (
            <>
              <ShieldCheckIcon size={28} style={{ opacity: 0.6 }} />
              {t('crypt.shield_vault')}
            </>
          ) : (
            <>
              <UnlockIcon size={28} style={{ opacity: 0.6 }} />
              {t('crypt.open_key')}
            </>
          )}
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

      {/* Sello de Integridad (Era 5) */}
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
