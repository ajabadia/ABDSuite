'use client';

import { useState, useEffect } from 'react';

export interface SystemMetrics {
  cpuPulse: number; // 0-100 pseudo-load based on loop delay
  ramUsage: number; // MB
  isSecure: boolean;
  heartbeat: boolean;
  isEncryptionUnlocked: boolean;
  sessionState: 'ACTIVE' | 'LOCKED' | 'EXPIRED';
  sessionExpiresInMinutes?: number;
}

export function useSystemDiagnostics() {
  const [metrics, setMetrics] = useState<SystemMetrics>({
    cpuPulse: 0.02,
    ramUsage: 0.3,
    isSecure: true,
    heartbeat: false,
    isEncryptionUnlocked: false,
    sessionState: 'ACTIVE'
  });

  useEffect(() => {
    let lastTime = performance.now();
    let frameCount = 0;
    
    const interval = setInterval(() => {
      const now = performance.now();
      const delta = now - lastTime;
      
      // Pseudo-CPU load based on event loop lag (simplified)
      const pulse = Math.min(100, Math.max(0.01, (delta - 1000) / 10)); 
      
      // RAM usage (Chrome/Chromium only)
      const memory = (performance as any).memory;
      const ram = memory ? Math.round(memory.usedJSHeapSize / (1024 * 1024)) : 0;
      
      setMetrics({
        cpuPulse: Number(pulse.toFixed(2)),
        ramUsage: ram,
        isSecure: window.isSecureContext && !!window.crypto.subtle,
        heartbeat: !metrics.heartbeat, 
        isEncryptionUnlocked: false,
        sessionState: metrics.sessionState
      });
      
      lastTime = now;
    }, 1000);

    return () => clearInterval(interval);
  }, [metrics.heartbeat]);

  // Direct subscription to Workspace context for encryption and session status
  const { installationKey, isLocked } = require('@/lib/context/WorkspaceContext').useWorkspace();
  
  // Calculate expiry from localStorage for reactivity (simplified)
  const [expiresAt, setExpiresAt] = useState<number | null>(null);
  
  useEffect(() => {
    const checkSession = () => {
        const saved = localStorage.getItem('abdfn_active_session');
        if (saved) {
            const session = JSON.parse(saved);
            setExpiresAt(session.expiresAt);
        }
    };
    checkSession();
    const interval = setInterval(checkSession, 30000); // sync every 30s
    return () => clearInterval(interval);
  }, []);

  const sessionExpiresInMinutes = expiresAt 
    ? Math.max(0, Math.round((expiresAt - Date.now()) / 60000)) 
    : undefined;

  const sessionState = isLocked ? 'LOCKED' : (sessionExpiresInMinutes === 0 ? 'EXPIRED' : 'ACTIVE');

  return { 
    ...metrics, 
    isEncryptionUnlocked: !!installationKey,
    sessionState,
    sessionExpiresInMinutes
  };
}
