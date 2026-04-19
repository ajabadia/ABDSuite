'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

export type AppEnvironment = 'PROD' | 'QA' | 'DEV';

interface ConfigContextType {
  environment: AppEnvironment;
  isTechnicianMode: boolean;
  setEnvironment: (env: AppEnvironment) => void;
  toggleTechnicianMode: () => void;
}

const ConfigContext = createContext<ConfigContextType | undefined>(undefined);

export const ConfigProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [environment, setEnvironmentState] = useState<AppEnvironment>('PROD');
  const [isTechnicianMode, setIsTechnicianMode] = useState(false);

  useEffect(() => {
    // Escucha de atajo industrial (Ctrl + Shift + F12)
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'F12') {
        setIsTechnicianMode(prev => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    
    // Carga de preferencia local (si existe)
    const savedEnv = localStorage.getItem('abdfn_env') as AppEnvironment;
    if (savedEnv) setEnvironmentState(savedEnv);

    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const setEnvironment = (env: AppEnvironment) => {
    setEnvironmentState(env);
    localStorage.setItem('abdfn_env', env);
  };

  const toggleTechnicianMode = () => setIsTechnicianMode(prev => !prev);

  return (
    <ConfigContext.Provider value={{ environment, isTechnicianMode, setEnvironment, toggleTechnicianMode }}>
      {children}
    </ConfigContext.Provider>
  );
};

export const useConfig = () => {
  const context = useContext(ConfigContext);
  if (context === undefined) {
    throw new Error('useConfig must be used within a ConfigProvider');
  }
  return context;
};
