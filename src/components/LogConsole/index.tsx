'use client';

import React, { useRef, useEffect } from 'react';
import { useLanguage } from '@/lib/context/LanguageContext';
import { DownloadIcon, TrashIcon } from '@/components/common/Icons';

export interface LogEntry {
  id: string;
  timestamp: Date;
  type: 'info' | 'success' | 'error' | 'skip';
  message: string;
  fileName?: string;
}

interface LogConsoleProps {
  logs: LogEntry[];
  onClear: () => void;
  onSave: () => void;
}

const LogConsole: React.FC<LogConsoleProps> = ({ logs, onClear, onSave }) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const { t } = useLanguage();

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs]);

  return (
    <div className="station-console" style={{ flex: 1 }}>
      <header className="station-console-header">
        <h3 className="station-registry-item-name" style={{ fontSize: '0.8rem' }}>CONSOLA DE EVENTOS</h3>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button onClick={onSave} className="station-btn" style={{ padding: '4px 8px' }} title="Guardar Log"><DownloadIcon size={14} /></button>
          <button onClick={onClear} className="station-btn" style={{ padding: '4px 8px' }} title="Limpiar"><TrashIcon size={14} /></button>
        </div>
      </header>
      
      <div 
        ref={scrollRef}
        className="station-console-area"
        style={{ scrollBehavior: 'smooth' }}
      >
        {logs.length === 0 ? (
          <div className="station-empty-state" style={{ height: '100%' }}>
            <span className="station-shimmer-text">ESPERANDO ACTIVIDAD...</span>
          </div>
        ) : (
          logs.map((log) => (
            <div key={log.id} className="station-console-log">
              <span className="station-console-time">{log.timestamp.toLocaleTimeString()}</span>
              <span className={`station-console-status txt-${log.type === 'success' ? 'ok' : log.type === 'error' ? 'err' : 'warn'}`}>
                [{log.type.toUpperCase()}]
              </span>
              <span style={{ flex: 1, color: log.type === 'error' ? 'var(--status-err)' : 'var(--text-primary)' }}>
                {log.fileName && <span style={{ opacity: 0.5, fontWeight: 700 }}>{log.fileName} » </span>}
                {log.message}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default LogConsole;
