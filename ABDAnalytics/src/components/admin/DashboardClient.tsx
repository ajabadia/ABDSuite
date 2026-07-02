'use client';

/**
 * @purpose Renderiza un componente de dashboard del cliente con tablas para Suite, LMS, Seguridad y Gobernanza, maneja la navegación por teclado y muestra métricas según el tab activo.
 * @purpose_en Renders a dashboard client component with tabs for Suite, LMS, Security, and Governance, handling keyboard navigation and displaying metrics based on the active tab.
 * @refactorable true (contains too many state variables and UI parts)
 * @classification UI Component
 * @complexity Medium
 * @fingerprint exports:1,imports:8,sig:1b0hqiy
 * @lastUpdated 2026-07-02T18:43:43.350Z
 */

import React, { useState, useCallback, useEffect } from 'react';
import { AlertTriangle, HardDrive } from 'lucide-react';
import { useTranslations } from 'next-intl';
import type { DashboardMetrics } from '@/types/dashboard-metrics';
import SuiteTab from './tabs/SuiteTab';
import LmsTab from './tabs/LmsTab';
import SecurityTab from './tabs/SecurityTab';
import GovernanceTab from './tabs/GovernanceTab';

interface DashboardClientProps {
  metrics: DashboardMetrics;
}

type TabId = 'suite' | 'lms' | 'security' | 'governance';

const TAB_IDS: TabId[] = ['suite', 'lms', 'security', 'governance'];

export default function DashboardClient({ metrics }: DashboardClientProps) {
  const t = useTranslations('analytics');
  const [activeTab, setActiveTab] = useState<TabId>('suite');

  const tabRefs = React.useRef<Record<TabId, HTMLButtonElement | null>>({
    suite: null,
    lms: null,
    security: null,
    governance: null,
  });

  const [storageProvider, setStorageProvider] = useState<string>('CARGANDO...');

  useEffect(() => {
    fetch('/files/api/v1/storage/active-provider')
      .then(r => r.ok ? r.json() : { provider: 'CLOUDINARY' })
      .then(d => setStorageProvider(d.provider || 'CLOUDINARY'))
      .catch((e) => {
        console.warn('[STORAGE_PROVIDER] Fetch failed, using default', e);
        setStorageProvider('CLOUDINARY');
      });
  }, []);

  const handleKeyDown = useCallback((e: React.KeyboardEvent, currentTab: TabId) => {
    let nextIndex: number;
    if (e.key === 'ArrowRight') {
      nextIndex = (TAB_IDS.indexOf(currentTab) + 1) % TAB_IDS.length;
    } else if (e.key === 'ArrowLeft') {
      nextIndex = (TAB_IDS.indexOf(currentTab) - 1 + TAB_IDS.length) % TAB_IDS.length;
    } else {
      return;
    }
    e.preventDefault();
    const nextTab = TAB_IDS[nextIndex];
    setActiveTab(nextTab);
    tabRefs.current[nextTab]?.focus();
  }, []);

  const tabLabel = (tab: TabId): string => {
    switch (tab) {
      case 'suite': return t('tabSuite');
      case 'lms': return t('tabLms');
      case 'security': return t('tabSecurity');
      case 'governance': return t('tabGovernance');
    }
  };

  return (
    <div className="flex flex-col gap-8 w-full">
      {/* ⚠️ Omnipresent Demo Mode Audit Banner */}
      {metrics.isDemoMode && (
        <div 
          className="relative overflow-hidden border border-warning/30 bg-warning/5 p-4 flex flex-col md:flex-row items-center justify-between gap-4 animate-pulse"
          role="alert"
          aria-live="assertive"
        >
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-warning flex-shrink-0" />
            <div className="flex flex-col">
              <span className="font-mono text-xs font-black uppercase tracking-widest text-warning">
                {t('auditWarningTitle')}
              </span>
              <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider">
                {t('auditWarningDesc')}
              </span>
            </div>
          </div>
          <div className="px-3 py-1 border border-warning/40 text-[9px] font-mono text-warning uppercase font-bold tracking-widest bg-warning/10 select-none">
            {t('demoModeBadge')}
          </div>
        </div>
      )}

      {/* Active Storage Provider */}
      <div className="bg-card border p-4 rounded flex items-center justify-between">
        <div className="flex items-center gap-2">
          <HardDrive className="w-4 h-4 text-muted-foreground" />
          <span className="text-[9px] font-mono font-black text-muted-foreground uppercase">{t('activeStorageLabel')}</span>
        </div>
        <div className="text-lg font-mono font-black text-primary uppercase">{storageProvider}</div>
      </div>

      {/* Tabs navigation in compliance with industrial design */}
      <div className="flex flex-wrap gap-2 border-b border-border/40 pb-px" role="tablist" aria-label={t('analyticsPanelsAria')}>
        {TAB_IDS.map((tab) => (
          <button
            key={tab}
            ref={(el) => { tabRefs.current[tab] = el; }}
            aria-label={`${tabLabel(tab)} tab`}
            onClick={() => setActiveTab(tab)}
            onKeyDown={(e) => handleKeyDown(e, tab)}
            className={`px-5 py-3 font-mono text-xs uppercase tracking-widest border transition-all duration-150 rounded-none cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 ${
              activeTab === tab
                ? 'border-primary border-b-transparent bg-primary/5 text-primary font-bold'
                : 'border-transparent text-muted-foreground hover:text-foreground hover:bg-secondary/20'
            }`}
            role="tab"
            aria-selected={activeTab === tab}
            tabIndex={activeTab === tab ? 0 : -1}
          >
            {tabLabel(tab)}
          </button>
        ))}
      </div>

      {/* Tab Panels */}
      <div className="min-h-[400px]" role="tabpanel" aria-label={tabLabel(activeTab)}>
        {activeTab === 'suite' && <SuiteTab metrics={metrics} />}
        {activeTab === 'lms' && <LmsTab metrics={metrics} />}
        {activeTab === 'security' && <SecurityTab metrics={metrics} />}
        {activeTab === 'governance' && <GovernanceTab metrics={metrics} />}
      </div>
    </div>
  );
}
