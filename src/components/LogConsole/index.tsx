'use client';

import React, { useRef, useEffect } from 'react';
import { useLanguage } from '@/lib/context/LanguageContext';

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
    <div className="station-card" style={{ display: 'flex', flexDirection: 'column', padding: 0, overflow: 'hidden' }}>
      <div className="station-card-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span>TELEMETRY_STREAM</span>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button onClick={onSave} className="station-btn" style={{ padding: '2px 10px', fontSize: '0.65rem', boxShadow: 'none' }}>SAVE_LOG</button>
          <button onClick={onClear} className="station-btn" style={{ padding: '2px 10px', fontSize: '0.65rem', boxShadow: 'none' }}>CLEAR</button>
        </div>
      </div>
      
      <div className="station-console" ref={scrollRef}>
        {logs.length === 0 ? (
          <div style={{ opacity: 0.2, fontWeight: 900, textAlign: 'center', padding: '20px' }}>WAITING_FOR_DATA_STREAM...</div>
        ) : (
          logs.map((log) => (
            <div key={log.id} style={{ display: 'flex', gap: '8px', marginBottom: '2px' }}>
              <span style={{ opacity: 0.4, fontSize: '0.9em' }}>[{log.timestamp.toLocaleTimeString()}]</span>
              <span className={`txt-${log.type === 'success' ? 'ok' : log.type === 'error' ? 'err' : 'warn'}`} style={{ fontWeight: 900 }}>
                [{log.type.toUpperCase()}]
              </span>
              <span style={{ flex: 1 }}>
                {log.fileName && <span style={{ opacity: 0.6 }}>{log.fileName}: </span>}
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
