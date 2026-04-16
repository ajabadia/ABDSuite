'use client';

import React, { useState, useMemo } from 'react';
import { useLog } from '@/lib/context/LogContext';
import { 
  XIcon, 
  CopyIcon, 
  ArrowUpIcon, 
  ArrowDownIcon, 
  FilterIcon, 
  SearchIcon,
  TerminalIcon 
} from '@/components/common/Icons';

export const LogDrawer: React.FC = () => {
  const { logs, isOpen, setIsOpen, isMaximized, setIsMaximized, clearLogs } = useLog();
  const [search, setSearch] = useState('');
  const [appFilter, setAppFilter] = useState('');

  const filteredLogs = useMemo(() => {
    return logs.filter(log => {
      const matchesSearch = log.message.toLowerCase().includes(search.toLowerCase()) ||
                           log.app.toLowerCase().includes(search.toLowerCase()) ||
                           log.timestamp.includes(search.toLowerCase());
      const matchesApp = !appFilter || log.app === appFilter;
      return matchesSearch && matchesApp;
    });
  }, [logs, search, appFilter]);

  const uniqueApps = useMemo(() => {
    const apps = new Set(logs.map(l => l.app));
    return Array.from(apps);
  }, [logs]);

  const handleCopy = () => {
    const text = filteredLogs.map(l => `[${l.timestamp}] [${l.app}] [${l.level.toUpperCase()}] ${l.message}`).join('\n');
    navigator.clipboard.writeText(text);
    alert('Logs copiados al portapapeles');
  };

  return (
    <div 
      className={`log-drawer station-terminal station-console-anim-container ${isOpen ? 'open' : ''}`}
      style={{
        position: 'fixed',
        bottom: '32px',
        left: '250px',
        right: '0',
        height: isMaximized ? '60vh' : '250px',
        background: 'var(--surface-color)',
        borderTop: '4px solid var(--border-color)',
        zIndex: 2000,
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 -10px 30px rgba(0, 0, 0, 0.5)',
        borderLeft: '1px solid var(--border-color)',
        transform: isOpen ? 'translateY(0)' : 'translateY(100%)',
        opacity: isOpen ? 1 : 0,
        pointerEvents: isOpen ? 'auto' : 'none',
      }}
    >
      {/* Toolbar */}
      <header style={{ 
        padding: '8px 16px', 
        borderBottom: '1px solid var(--border-color)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        background: 'rgba(0,0,0,0.1)'
      }}>
        {/* Left: Filters */}
        <div className="flex-row" style={{ alignItems: 'center', gap: '16px', flex: 1 }}>
          <div className="station-registry-sync-actions" style={{ gap: '8px' }}>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <SearchIcon size={14} style={{ position: 'absolute', left: '12px', opacity: 0.5 }} />
              <input 
                type="text" 
                className="station-input"
                placeholder="FILTRAR REGISTROS..." 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{
                  paddingLeft: '32px',
                  fontSize: '0.7rem',
                  width: '200px',
                  height: '32px'
                }}
              />
            </div>
            
            <select 
              className="station-select"
              value={appFilter}
              onChange={(e) => setAppFilter(e.target.value)}
              style={{
                fontSize: '0.7rem',
                height: '32px',
                padding: '0 12px'
              }}
            >
              <option value="">TODAS LAS APPS</option>
              {uniqueApps.map(app => <option key={app} value={app}>{app.toUpperCase()}</option>)}
            </select>
          </div>

          <button 
            className="station-btn"
            onClick={clearLogs}
            style={{ 
              color: 'var(--status-err)', 
              fontSize: '0.65rem',
              fontWeight: 900,
              padding: '4px 12px',
              border: 'none',
              background: 'rgba(239, 68, 68, 0.1)'
            }}
          >
            LIMPIAR CONSOLA
          </button>
        </div>

        {/* Right: Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <button onClick={handleCopy} title="Copy Logs" style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}>
            <CopyIcon size={16} />
          </button>
          <button onClick={() => setIsMaximized(!isMaximized)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}>
            {isMaximized ? <ArrowDownIcon size={18} /> : <ArrowUpIcon size={18} />}
          </button>
          <button onClick={() => setIsOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}>
            <XIcon size={18} />
          </button>
        </div>
      </header>

      {/* Log Entries */}
      <div className="station-shell-content" style={{ flex: 1, overflowY: 'auto', padding: '16px', fontFamily: 'var(--font-mono)', fontSize: '0.8rem', background: 'rgba(0,0,0,0.05)' }}>
        {filteredLogs.map((log) => (
          <div key={log.id} style={{ 
            display: 'flex', 
            gap: '16px', 
            marginBottom: '6px',
            color: log.level === 'error' ? 'var(--status-err)' : 
                   log.level === 'warn' ? 'var(--status-warn)' : 
                   log.level === 'success' ? 'var(--status-ok)' : 'var(--text-primary)',
            padding: '4px 0',
            borderBottom: '1px solid rgba(255,255,255,0.03)'
          }}>
            <span style={{ opacity: 0.4, whiteSpace: 'nowrap', fontSize: '0.7rem' }}>[{log.timestamp.split('T')[1].split('.')[0]}]</span>
            <span style={{ 
              fontWeight: 900, 
              minWidth: '70px', 
              color: 'var(--primary-color)',
              fontSize: '0.7rem',
              letterSpacing: '0.05rem'
            }}>{log.app.toUpperCase()}</span>
            <span style={{ flex: 1, wordBreak: 'break-all', opacity: 0.9 }}>{log.message}</span>
          </div>
        ))}
        {filteredLogs.length === 0 && (
          <div className="station-empty-state" style={{ minHeight: '100px' }}>
             <span className="station-shimmer-text">SIN STREAM DE DATOS ACTIVO</span>
          </div>
        )}
      </div>
    </div>
  );
};
