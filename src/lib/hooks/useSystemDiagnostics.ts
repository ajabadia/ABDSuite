'use client';

import { useState, useEffect } from 'react';

export interface SystemMetrics {
  cpuPulse: number; // 0-100 pseudo-load based on loop delay
  ramUsage: number; // MB
  isSecure: boolean;
  heartbeat: boolean;
  isEncryptionUnlocked: boolean;
}

export function useSystemDiagnostics() {
  const [metrics, setMetrics] = useState<SystemMetrics>({
    cpuPulse: 0.02,
    ramUsage: 0.3,
    isSecure: true,
    heartbeat: false,
    isEncryptionUnlocked: false
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
        heartbeat: !metrics.heartbeat, // Toggle for visual pulse
        isEncryptionUnlocked: false // Will be updated by effect below or passed as param
      });
      
      lastTime = now;
    }, 1000);

    return () => clearInterval(interval);
  }, [metrics.heartbeat]);

  // Direct subscription to Workspace context for encryption status
  const { installationKey } = require('@/lib/context/WorkspaceContext').useWorkspace();
  
  return { ...metrics, isEncryptionUnlocked: !!installationKey };
}
