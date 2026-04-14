'use client';

import React, { useRef, useEffect } from 'react';
import { useLanguage } from '@/lib/context/LanguageContext';
import styles from './LogConsole.module.css';

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
    <section className="module-section" aria-labelledby="logs-title">
      <div className={styles.header}>
        <h2 id="logs-title" className={styles.title}>{t('logs.title')}</h2>
        <div className={styles.actions}>
          <button onClick={onSave} className={styles.actionBtn}>
            <span className={styles.key}>F1</span> {t('logs.save').split(' ')[1]}
          </button>
          <button onClick={onClear} className={styles.actionBtn}>
            <span className={styles.key}>F2</span> {t('logs.clear').split(' ')[1]}
          </button>
        </div>
      </div>
      
      <div className={styles.console} role="log" aria-live="polite" ref={scrollRef}>
        {logs.length === 0 ? (
          <div className={styles.empty}>{t('logs.waiting')}</div>
        ) : (
          logs.map((log) => (
            <div key={log.id} className={`${styles.entry} ${styles[log.type]}`}>
              <span className={styles.timestamp}>
                [{log.timestamp.toLocaleTimeString()}]
              </span>
              <span className={styles.type}>[{log.type.toUpperCase()}]</span>
              {log.fileName && <span className={styles.fileName}>{log.fileName}: </span>}
              <span className={styles.message}>{log.message}</span>
            </div>
          ))
        )}
      </div>
    </section>
  );
};

export default LogConsole;
