import { useState, useCallback } from 'react';
import { CryptoService } from '@/lib/services/crypto.service';
import { useLanguage } from '@/lib/context/LanguageContext';
import { useLog } from '@/lib/context/LogContext';
import { sanitizeFileName } from '@/lib/utils/path';
import { LogLevel } from '../types/log.types';

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
  const { addLog: globalAddLog, clearLogs: globalClearLogs } = useLog();
  const [isProcessing, setIsProcessing] = useState(false);
  const [stats, setStats] = useState({ success: 0, error: 0, skip: 0 });

  const addLog = useCallback((type: LogEntry['type'], messageKey: string, fileName?: string, params?: any) => {
    // Map internal types to global levels
    let level: LogLevel = 'info';
    if (type === 'success') level = 'success';
    if (type === 'error') level = 'error';
    if (type === 'skip') level = 'warn';

    globalAddLog('CRYPT', t(messageKey, params), level, { fileName });
  }, [t, globalAddLog]);

  const clearLogs = useCallback(() => {
    globalClearLogs();
    setStats({ success: 0, error: 0, skip: 0 });
  }, [globalClearLogs]);

  const processFiles = useCallback(async (files: File[], mode: 'encrypt' | 'decrypt') => {
    if (!password) {
      addLog('error', 'logs.pwd_required');
      return;
    }

    setIsProcessing(true);
    setStats({ success: 0, error: 0, skip: 0 });
    addLog('info', mode === 'encrypt' ? 'logs.start_enc' : 'logs.start_dec');

    let sCount = 0;
    let eCount = 0;
    let kCount = 0;

    for (const file of files) {
      try {
        // Validation logic
        if (mode === 'encrypt' && file.name.endsWith('.enc')) {
          addLog('skip', 'logs.skip_enc', file.name);
          kCount++;
          setStats(prev => ({ ...prev, skip: kCount }));
          continue;
        }

        if (mode === 'decrypt' && !file.name.endsWith('.enc')) {
          addLog('skip', 'logs.skip_dec', file.name);
          kCount++;
          setStats(prev => ({ ...prev, skip: kCount }));
          continue;
        }

        let resultBlob: Blob;
        let finalName: string;

        if (mode === 'encrypt') {
          resultBlob = await CryptoService.encryptFile(file, password);
          const safeSuffix = sanitizeFileName(outputSuffix);
          finalName = `${file.name}${safeSuffix}`;
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
        sCount++;
        setStats(prev => ({ ...prev, success: sCount }));
      } catch (error: any) {
        addLog('error', error.message || 'logs.error', file.name);
        eCount++;
        setStats(prev => ({ ...prev, error: eCount }));
      }
    }

    addLog('info', 'logs.summary', undefined, { s: sCount, e: eCount, k: kCount });
    
    // REGISTRO DE AUDITORÍA: BATCH CRYPT COMPLETADO
    try {
      const { db } = await import('@/lib/db/db');
      await db.audit_history_v6.add({
        id: crypto.randomUUID(),
        timestamp: Date.now(),
        module: 'CRYPT',
        action: 'CRYPT_BATCH_COMPLETED',
        status: eCount > 0 ? 'WARNING' : 'SUCCESS',
        details: JSON.stringify({
          mode: mode.toUpperCase(),
          total: files.length,
          success: sCount,
          errors: eCount,
          skipped: kCount
        })
      } as any);
    } catch (e) {
      console.error('Failed to log crypt audit', e);
    }

    setIsProcessing(false);
  }, [password, outputSuffix, t, addLog]);

  return {
    stats,
    isProcessing,
    processFiles,
    clearLogs,
    addLog
  };
};
