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

  if (!isOpen) return null;

  return (
    <div 
      className="log-drawer" 
      style={{
        position: 'fixed',
        bottom: '32px', // Above StatusBar
        left: '250px', // Sidebar width or auto
        right: '0',
        height: isMaximized ? '60vh' : '250px',
        background: 'var(--surface-color)',
        borderTop: '1px solid var(--border-color)',
        zIndex: 2000,
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 -10px 15px -3px rgba(0, 0, 0, 0.1)',
        transition: 'height 0.3s ease',
        borderLeft: '1px solid var(--border-color)',
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
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            <SearchIcon size={14} style={{ position: 'absolute', left: '8px', opacity: 0.5 }} />
            <input 
              type="text" 
              placeholder="Buscar en logs..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                background: 'var(--input-bg)',
                border: '1px solid var(--border-color)',
                borderRadius: '4px',
                padding: '4px 8px 4px 28px',
                fontSize: '0.75rem',
                color: 'var(--text-primary)',
                width: '180px'
              }}
            />
          </div>
          
          <select 
            value={appFilter}
            onChange={(e) => setAppFilter(e.target.value)}
            style={{
              background: 'var(--input-bg)',
              border: '1px solid var(--border-color)',
              borderRadius: '4px',
              padding: '4px 8px',
              fontSize: '0.75rem',
              color: 'var(--text-primary)'
            }}
          >
            <option value="">Todas las Apps</option>
            {uniqueApps.map(app => <option key={app} value={app}>{app}</option>)}
          </select>

          <button 
            onClick={clearLogs}
            style={{ 
              background: 'none', 
              border: 'none', 
              color: 'var(--status-err)', 
              fontSize: '0.7rem', 
              cursor: 'pointer',
              fontWeight: 700 
            }}
          >
            LIMPIAR
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
      <div style={{ flex: 1, overflowY: 'auto', padding: '12px 16px', fontFamily: 'var(--font-mono)', fontSize: '0.8rem' }}>
        {filteredLogs.map((log) => (
          <div key={log.id} style={{ 
            display: 'flex', 
            gap: '12px', 
            marginBottom: '4px',
            color: log.level === 'error' ? 'var(--status-err)' : 
                   log.level === 'warn' ? 'var(--status-warn)' : 
                   log.level === 'success' ? 'var(--status-ok)' : 'var(--text-primary)',
            padding: '2px 0'
          }}>
            <span style={{ opacity: 0.5, whiteSpace: 'nowrap' }}>[{log.timestamp.split('T')[1].split('.')[0]}]</span>
            <span style={{ 
              fontWeight: 800, 
              minWidth: '60px', 
              color: 'var(--primary-color)',
              opacity: 0.8 
            }}>{log.app}</span>
            <span style={{ flex: 1, wordBreak: 'break-all' }}>{log.message}</span>
          </div>
        ))}
        {filteredLogs.length === 0 && (
          <div style={{ textAlign: 'center', padding: '20px', opacity: 0.3 }}>
             SIN REGISTROS DISPONIBLES
          </div>
        )}
      </div>
    </div>
  );
};
