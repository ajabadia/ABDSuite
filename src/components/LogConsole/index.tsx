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
    <div className="station-card" style={{ flex: 1, padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
      <header style={{ padding: '12px 16px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--surface-color)' }}>
        <h3 style={{ fontSize: '0.75rem', fontWeight: 700, opacity: 0.6, textTransform: 'uppercase' }}>Consola de Eventos</h3>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button onClick={onSave} className="station-btn" style={{ padding: '4px 8px', fontSize: '0.7rem' }} title="Guardar Log"><DownloadIcon size={14} /></button>
          <button onClick={onClear} className="station-btn" style={{ padding: '4px 8px', fontSize: '0.7rem' }} title="Limpiar"><TrashIcon size={14} /></button>
        </div>
      </header>
      
      <div 
        ref={scrollRef}
        style={{ flex: 1, overflowY: 'auto', padding: '16px', fontSize: '0.85rem', background: 'var(--bg-color)', scrollBehavior: 'smooth' }}
      >
        {logs.length === 0 ? (
          <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0.2, fontSize: '0.8rem' }}>
            ESPERANDO ACTIVIDAD...
          </div>
        ) : (
          logs.map((log) => (
            <div key={log.id} style={{ display: 'flex', gap: '12px', marginBottom: '4px', lineHeight: '1.4' }}>
              <span style={{ opacity: 0.4, fontSize: '0.8em', minWidth: '70px' }}>{log.timestamp.toLocaleTimeString()}</span>
              <span className={`txt-${log.type === 'success' ? 'ok' : log.type === 'error' ? 'err' : 'warn'}`} style={{ fontWeight: 700, minWidth: '60px' }}>
                {log.type.toUpperCase()}
              </span>
              <span style={{ flex: 1, color: log.type === 'error' ? 'var(--status-err)' : 'var(--text-primary)' }}>
                {log.fileName && <span style={{ opacity: 0.5, fontWeight: 700 }}>{log.fileName}: </span>}
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
