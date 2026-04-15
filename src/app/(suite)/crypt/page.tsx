'use client';

import React, { useState } from 'react';
import SettingsPanel from '@/components/SettingsPanel';
import FileProcessor from '@/components/FileProcessor';
import LogConsole from '@/components/LogConsole';
import { useLanguage } from '@/lib/context/LanguageContext';
import { useFileBatchProcessor } from '@/lib/hooks/useFileBatchProcessor';
import { useInactivityPurge } from '@/lib/hooks/useInactivityPurge';

/**
 * ABDFN Encryptor - Main Orchestrator
 * Refactored using SOLID principles and Custom Hooks.
 */
export default function Home() {
  const { t } = useLanguage();
  
  // Local Settings State
  const [password, setPassword] = useState('');
  const [batchMode, setBatchMode] = useState(false);
  const [outputSuffix, setOutputSuffix] = useState('_decrypted');

  // Business Logic Hooks
  const { 
    logs, 
    isProcessing, 
    processFiles, 
    clearLogs, 
    saveLogs, 
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

  return (
    <div className="module-grid">
      <section className="module-col-main">
        <FileProcessor
          onProcess={processFiles}
          onClear={(n) => addLog('error', 'logs.list_cleared', undefined, { n })}
          onSort={() => addLog('info', 'logs.sort_applied')}
          isProcessing={isProcessing}
          clearOnFinish={!batchMode}
          stats={stats}
        />
      </section>

      <section className="module-col-side">
        <SettingsPanel
          password={password}
          setPassword={setPassword}
          batchMode={batchMode}
          setBatchMode={setBatchMode}
          outputSuffix={outputSuffix}
          setOutputSuffix={setOutputSuffix}
        />
        <LogConsole
          logs={logs}
          onClear={() => {
            clearLogs();
            addLog('error', 'logs.history_cleared');
          }}
          onSave={saveLogs}
        />
      </section>
    </div>
  );
}
