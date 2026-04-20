'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { TelemetryConfig } from '@/lib/types/telemetry.types';
import { TelemetryConfigService } from '@/lib/services/telemetry-config.service';

interface TelemetryContextType {
  config: TelemetryConfig | null;
  refreshConfig: () => Promise<void>;
  updateConfig: (newConfig: TelemetryConfig) => Promise<void>;
}

const TelemetryContext = createContext<TelemetryContextType | undefined>(undefined);

export const TelemetryProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [config, setConfig] = useState<TelemetryConfig | null>(null);

  const refreshConfig = async () => {
    try {
      const data = await TelemetryConfigService.loadConfig();
      setConfig(data);
    } catch (err) {
      console.error('[TelemetryContext] Failed to load config', err);
    }
  };

  const updateConfig = async (newConfig: TelemetryConfig) => {
    try {
      await TelemetryConfigService.saveConfig(newConfig);
      setConfig(newConfig);
    } catch (err) {
      console.error('[TelemetryContext] Failed to save config', err);
      throw err;
    }
  };

  useEffect(() => {
    refreshConfig();
  }, []);

  return (
    <TelemetryContext.Provider value={{ config, refreshConfig, updateConfig }}>
      {children}
    </TelemetryContext.Provider>
  );
};

export const useTelemetryConfig = () => {
  const context = useContext(TelemetryContext);
  if (context === undefined) {
    throw new Error('useTelemetryConfig must be used within a TelemetryProvider');
  }
  return context;
};
