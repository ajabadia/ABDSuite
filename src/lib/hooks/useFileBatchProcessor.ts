import { useState, useCallback } from 'react';
import { CryptoService } from '@/lib/services/crypto.service';
import { useLanguage } from '@/lib/context/LanguageContext';
import { sanitizeFileName } from '@/lib/utils/path';

export interface LogEntry {
  id: string;
  timestamp: Date;
  type: 'info' | 'success' | 'error' | 'skip';
  message: string;
  fileName?: string;
}

interface UseFileBatchProcessorProps {
  password?: string;
  outputSuffix?: string;
}

/**
 * Hook to manage the complex batch processing of files (Encryption/Decryption).
 */
export const useFileBatchProcessor = ({
  password,
  outputSuffix = '_decrypted'
}: UseFileBatchProcessorProps) => {
  const { t } = useLanguage();
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  const addLog = useCallback((type: LogEntry['type'], messageKey: string, fileName?: string, params?: any) => {
    const newLog: LogEntry = {
      id: Math.random().toString(36).substr(2, 9),
      timestamp: new Date(),
      type,
      message: t(messageKey, params),
      fileName
    };
    setLogs(prev => [...prev, newLog]);
  }, [t]);

  const clearLogs = useCallback(() => setLogs([]), []);

  const processFiles = useCallback(async (files: File[], mode: 'encrypt' | 'decrypt') => {
    if (!password) {
      addLog('error', 'logs.pwd_required');
      return;
    }

    setIsProcessing(true);
    addLog('info', mode === 'encrypt' ? 'logs.start_enc' : 'logs.start_dec');

    let successCount = 0;
    let errorCount = 0;
    let skipCount = 0;

    for (const file of files) {
      try {
        // Validation logic
        if (mode === 'encrypt' && file.name.endsWith('.enc')) {
          addLog('skip', 'logs.skip_enc', file.name);
          skipCount++;
          continue;
        }

        if (mode === 'decrypt' && !file.name.endsWith('.enc')) {
          addLog('skip', 'logs.skip_dec', file.name);
          skipCount++;
          continue;
        }

        let resultBlob: Blob;
        let finalName: string;

        if (mode === 'encrypt') {
          resultBlob = await CryptoService.encryptFile(file, password);
          finalName = `${file.name}.enc`;
        } else {
          resultBlob = await CryptoService.decryptFile(file, password);
          const baseName = file.name.replace(/\.enc$/, '');
          const safeSuffix = sanitizeFileName(outputSuffix);
          finalName = `${baseName}${safeSuffix}`;
        }

        // Trigger Download
        const url = URL.createObjectURL(resultBlob);
        const a = document.createElement('a');
        a.href = url;
        a.download = finalName;
        a.click();
        URL.revokeObjectURL(url);

        addLog('success', 'logs.success', file.name);
        successCount++;
      } catch (error: any) {
        addLog('error', error.message || 'logs.error', file.name);
        errorCount++;
      }
    }

    addLog('info', 'logs.summary', undefined, { s: successCount, e: errorCount, k: skipCount });
    setIsProcessing(false);
  }, [password, outputSuffix, t, addLog]);

  const saveLogs = useCallback(() => {
    if (logs.length === 0) return;
    addLog('success', 'logs.logs_exported');
    const logText = logs
      .map(l => `[${l.timestamp.toISOString()}] [${l.type.toUpperCase()}] ${l.fileName ? l.fileName + ': ' : ''}${l.message}`)
      .join('\n');
    const blob = new Blob([logText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `log_abdfn_${new Date().toISOString().split('T')[0]}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }, [logs]);

  return {
    logs,
    isProcessing,
    processFiles,
    clearLogs,
    saveLogs,
    addLog
  };
};
