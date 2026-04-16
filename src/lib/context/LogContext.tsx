'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { LogEntry, LogLevel } from '../types/log.types';

interface LogContextType {
  logs: LogEntry[];
  addLog: (app: string, message: string, level?: LogLevel, data?: any) => void;
  clearLogs: () => void;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  isMaximized: boolean;
  setIsMaximized: (maximized: boolean) => void;
}

const LogContext = createContext<LogContextType | undefined>(undefined);

const MAX_LOGS = 1000;
const STORAGE_KEY = 'abdfn_logs';

export const LogProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);

  // Load from local storage on mount
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        setLogs(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to parse saved logs', e);
      }
    }
  }, []);

  // Save to local storage on change
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(logs.slice(0, 100))); // Persist only top 100 for safety
  }, [logs]);

  const addLog = useCallback((app: string, message: string, level: LogLevel = 'info', data?: any) => {
    const newEntry: LogEntry = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      app,
      level,
      message,
      data
    };

    setLogs(prev => {
      const updated = [newEntry, ...prev];
      return updated.slice(0, MAX_LOGS);
    });

    // Auto-open on error
    if (level === 'error') {
      setIsOpen(true);
    }
  }, []);

  const clearLogs = useCallback(() => {
    setLogs([]);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  return (
    <LogContext.Provider value={{ 
      logs, 
      addLog, 
      clearLogs, 
      isOpen, 
      setIsOpen, 
      isMaximized, 
      setIsMaximized 
    }}>
      {children}
    </LogContext.Provider>
  );
};

export const useLog = () => {
  const context = useContext(LogContext);
  if (!context) {
    throw new Error('useLog must be used within a LogProvider');
  }
  return context;
};
