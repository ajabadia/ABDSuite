'use client';

import React, { useEffect } from 'react';
import { useRetentionPolicy } from '@/lib/hooks/useRetentionPolicy';
import { Sidebar } from '@/components/shell/Sidebar';
import { TopBar } from '@/components/shell/TopBar';
import { StatusBar } from '@/components/shell/StatusBar';
import { LogDrawer } from '@/components/shell/LogDrawer';
import { purgeOldAuditRecords } from '@/lib/utils/audit-retention';
import { useWorkspace } from '@/lib/context/WorkspaceContext';
import { BootstrapWizard } from '@/components/auth/BootstrapWizard';
import { LoaderIcon } from '@/components/common/Icons';
import { LoginScreen } from '@/components/auth/LoginScreen';
import { StepUpAuthModal } from '@/components/auth/StepUpAuthModal';
import { UIProvider, useUI } from '@/lib/context/UIContext';

interface ShellWrapperProps {
  children: React.ReactNode;
}

/**
 * ShellInner
 * Renders the actual shell structure using UI context.
 */
const ShellInner: React.FC<ShellWrapperProps> = ({ children }) => {
  const { isMobileMenuOpen, setMobileMenuOpen } = useUI();

  return (
    <div className="shell-container animate-fade-in">
      <Sidebar />
      <TopBar />
      <main className="shell-content">
        {children}
      </main>
      
      {/* Mobile Sidebar Overlay */}
      <div 
        className={`mobile-sidebar-overlay ${isMobileMenuOpen ? 'active' : ''}`}
        onClick={() => setMobileMenuOpen(false)}
      />

      <LogDrawer />
      <StatusBar />
      <StepUpAuthModal />
    </div>
  );
};

/**
 * ShellWrapper
 * Client component to host industrial lifecycle hooks and shell structure.
 * Protected by Phase 8 AuthGuard.
 */
export const ShellWrapper: React.FC<ShellWrapperProps> = ({ children }) => {
  const { currentOperator, currentUnit, isLoading, isBootstrapNeeded, isLocked, isVaultChallengeOpen } = useWorkspace();
  
  // Industrial Database Maintenance (Retention & Purge)
  useRetentionPolicy(30, !!currentUnit);

  if (isLoading) {
    return (
      <div className="flex-col" style={{ width: '100vw', height: '100vh', justifyContent: 'center', alignItems: 'center', background: 'var(--bg-primary)' }}>
        <LoaderIcon className="animate-spin" size={48} color="var(--accent-primary)" />
        <p style={{ marginTop: '24px', letterSpacing: '4px', opacity: 0.5 }}>SYNCHRONIZING SYSTEM...</p>
      </div>
    );
  }

  if (isBootstrapNeeded) {
    return <BootstrapWizard />;
  }

  if (!currentOperator || !currentUnit || isLocked) {
    return <LoginScreen />;
  }

  return (
    <UIProvider>
      <ShellInner>
        {children}
      </ShellInner>
      {isVaultChallengeOpen && <LoginScreen />}
    </UIProvider>
  );
};
