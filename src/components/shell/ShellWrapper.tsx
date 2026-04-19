'use client';

import React, { useEffect } from 'react';
import { useRetentionPolicy } from '@/lib/hooks/useRetentionPolicy';
import { Sidebar } from '@/components/shell/Sidebar';
import { TopBar } from '@/components/shell/TopBar';
import { StatusBar } from '@/components/shell/StatusBar';
import { LogDrawer } from '@/components/shell/LogDrawer';
import { purgeOldAuditRecords } from '@/lib/utils/audit-retention';

interface ShellWrapperProps {
  children: React.ReactNode;
}

/**
 * ShellWrapper
 * Cliente component to host industrial lifecycle hooks and shell structure.
 */
export const ShellWrapper: React.FC<ShellWrapperProps> = ({ children }) => {
  // Activate Retention Policy (30 days)
  useRetentionPolicy(30);

  // Industrial Audit Retention (Configurable)
  useEffect(() => {
    purgeOldAuditRecords().catch(console.error);
  }, []);

  return (
    <div className="shell-container">
      <Sidebar />
      <TopBar />
      <main className="shell-content">
        {children}
      </main>
      <LogDrawer />
      <StatusBar />
    </div>
  );
};
