import { useState, useCallback } from 'react';
import { useLanguage } from '@/lib/context/LanguageContext';

export interface LogEntry {
  id: string;
  timestamp: Date;
  type: 'info' | 'success' | 'error' | 'skip';
  message: string;
  fileName?: string;
}

/**
 * Common hook for modules that use the LogConsole.
 */
export const useLogs = () => {
  const { t } = useLanguage();
  const [logs, setLogs] = useState<LogEntry[]>([]);

  const addLog = useCallback((type: LogEntry['type'], messageKey: string, fileName?: string, params?: any) => {
    const newLog: LogEntry = {
      id: Math.random().toString(36).substring(2, 11),
      timestamp: new Date(),
      type,
      message: t(messageKey, params),
      fileName
    };
    setLogs(prev => [...prev, newLog]);
  }, [t]);

  const clearLogs = useCallback(() => setLogs([]), []);

  const saveLogs = useCallback((moduleName: string = 'abdfn') => {
    if (logs.length === 0) return;
    
    const logText = logs
      .map(l => `[${l.timestamp.toISOString()}] [${l.type.toUpperCase()}] ${l.fileName ? l.fileName + ': ' : ''}${l.message}`)
      .join('\n');
    
    const blob = new Blob([logText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `log_${moduleName.toLowerCase()}_${new Date().toISOString().split('T')[0]}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    
    addLog('success', 'logs.logs_exported');
  }, [logs, addLog]);

  return {
    logs,
    addLog,
    clearLogs,
    saveLogs
  };
};
