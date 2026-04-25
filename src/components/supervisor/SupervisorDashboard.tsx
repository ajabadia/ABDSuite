'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { useLanguage } from '@/lib/context/LanguageContext';
import { useWorkspace } from '@/lib/context/WorkspaceContext';
import { TelemetryService } from '@/lib/services/TelemetryService';
import { GlobalTelemetrySnapshot } from '@/lib/types/telemetry.types';
import { 
  ActivityIcon, 
  RefreshCwIcon, 
  ShieldAlertIcon,
  DownloadIcon,
  CogIcon,
  UserIcon,
  ShieldCheckIcon,
  TerminalIcon, 
  TagIcon
} from '@/components/common/Icons';
import { UnitTable } from './UnitTable';
import { TelemetrySettingsPanel } from './TelemetrySettingsPanel';
import { OperatorManager } from './OperatorManager';
import { SecurityAuditPanel } from '../audit/SecurityAuditPanel';
import { ForbiddenPanel } from '../common/ForbiddenPanel';
import { TechnicalCockpit } from './TechnicalCockpit';
import { ReportExportModal } from './ReportExportModal';
import { DocCatalogStation } from './DocCatalogStation';
import { supervisorService } from '@/lib/services/SupervisorService';

export const SupervisorDashboard: React.FC = () => {
  return (
    <Suspense fallback={<div className="station-shimmer-text">LOADING_SUPERVISOR_CONTEXT...</div>}>
      <SupervisorDashboardContent />
    </Suspense>
  );
};

const SupervisorDashboardContent: React.FC = () => {
  const { t } = useLanguage();
  const { can, currentOperator } = useWorkspace();
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  
  const initialTab = searchParams.get('tab')?.toUpperCase();
  const initialOperatorId = searchParams.get('operatorId');
  const initialEntityType = searchParams.get('entityType');

  const [snapshot, setSnapshot] = useState<GlobalTelemetrySnapshot | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [showReports, setShowReports] = useState(false);
  
  const [activeTab, setActiveTab] = useState<'TELEMETRY' | 'OPERATORS' | 'SECURITY' | 'TECHNICAL' | 'DOCUMENTS'>(
    (initialTab === 'OPERATORS' || initialTab === 'SECURITY' || initialTab === 'TECHNICAL' || initialTab === 'DOCUMENTS') ? (initialTab as any) : 'TELEMETRY'
  );
  const [securityEventTypeFilter, setSecurityEventTypeFilter] = useState<string | null>(null);
  const [securityEntityTypeFilter, setSecurityEntityTypeFilter] = useState<string | null>(initialEntityType);

  const updateUrl = (params: Record<string, string | null>) => {
    const nextParams = new URLSearchParams(searchParams.toString());
    Object.entries(params).forEach(([key, val]) => {
      if (val) nextParams.set(key, val);
      else nextParams.delete(key);
    });
    router.replace(`${pathname}?${nextParams.toString()}`);
  };

  const handleFiltersCleared = () => {
    setSecurityEventTypeFilter(null);
    setSecurityEntityTypeFilter(null);
    const params = new URLSearchParams(searchParams.toString());
    params.delete('entityType');
    params.delete('eventType');
    router.replace(params.toString() ? `${pathname}?${params.toString()}` : pathname);
  };

  const loadData = async (force = false) => {
    setIsLoading(true);
    try {
      const data = await TelemetryService.getGlobalSnapshot(force);
      setSnapshot(data);
    } catch (err) {
      console.error('[SUPERVISOR] Failed to load telemetry', err);
    } finally {
      setIsLoading(false);
    }
  };

  const canSeeOperators = can('OPERATORS_MANAGE');
  const canSeeSecurity = can('AUDIT_VIEW') || can('SUPERVISOR_VIEW');

  useEffect(() => {
    loadData();
    if (currentOperator) {
      supervisorService.logDashboardAccess(currentOperator.id, currentOperator.username);
    }
    const interval = setInterval(() => loadData(), 60000);
    return () => clearInterval(interval);
  }, [currentOperator]);

  useEffect(() => {
    if (initialTab === 'OPERATORS' && canSeeOperators) {
      setActiveTab('OPERATORS');
    } else if (initialTab === 'SECURITY' && canSeeSecurity) {
      setActiveTab('SECURITY');
      if (initialEntityType) setSecurityEntityTypeFilter(initialEntityType);
    }
  }, [initialTab, canSeeOperators, canSeeSecurity, initialEntityType]);

  useEffect(() => {
    if (activeTab !== 'SECURITY') {
      setSecurityEventTypeFilter(null);
      setSecurityEntityTypeFilter(null);
    }
  }, [activeTab]);

  if (!can('SUPERVISOR_VIEW')) {
    return <ForbiddenPanel capability="SUPERVISOR_VIEW" />;
  }

  if (!snapshot && isLoading) {
    return (
      <div className="station-empty-state" style={{ height: '100%' }}>
         <RefreshCwIcon size={48} className="spin station-shimmer-text" />
         <span className="station-shimmer-text" style={{ marginTop: '16px' }}>{t('audit.validating').toUpperCase()}</span>
      </div>
    );
  }

  return (
    <div className="flex-col fade-in" style={{ height: '100%' }}>
      <header className="station-panel-header">
        <div className="flex-row" style={{ alignItems: 'center', gap: '16px' }}>
          <div className="station-icon-box">
            <ActivityIcon size={24} color="var(--primary-color)" />
          </div>
          <div className="flex-col">
            <h1 className="station-title-main" style={{ margin: 0 }}>{t('supervisor.title').toUpperCase()}</h1>
            <p className="station-registry-item-meta" style={{ margin: 0 }}>{t('supervisor.subtitle').toUpperCase()}</p>
          </div>
        </div>
        
        <div className="station-tabs" style={{ borderBottom: 'none', background: 'transparent' }}>
            <button className={`station-tab-btn ${activeTab === 'TELEMETRY' ? 'active' : ''}`} onClick={() => setActiveTab('TELEMETRY')}>
              <ActivityIcon size={14} /> {t('supervisor.title').split(' ')[0]}
            </button>
            {canSeeOperators && (
              <button className={`station-tab-btn ${activeTab === 'OPERATORS' ? 'active' : ''}`} onClick={() => setActiveTab('OPERATORS')}>
                <UserIcon size={14} /> {t('operator.panel_title').split(' ')[0]}
              </button>
            )}
            {canSeeSecurity && (
              <button className={`station-tab-btn ${activeTab === 'SECURITY' ? 'active' : ''}`} onClick={() => setActiveTab('SECURITY')}>
                <ShieldCheckIcon size={14} /> {t('audit.securityTitle').split(' ')[0]}
              </button>
            )}
            {canSeeSecurity && (
              <button className={`station-tab-btn ${activeTab === 'TECHNICAL' ? 'active' : ''}`} onClick={() => setActiveTab('TECHNICAL')}>
                <TerminalIcon size={14} /> LAB_COCKPIT
              </button>
            )}
            <button className={`station-tab-btn ${activeTab === 'DOCUMENTS' ? 'active' : ''}`} onClick={() => setActiveTab('DOCUMENTS')}>
              <TagIcon size={14} /> DOCUMENTOS
            </button>
        </div>

        <div className="flex-row" style={{ gap: '8px' }}>
            <button className="station-btn secondary tiny" onClick={() => setShowSettings(true)}>
                <CogIcon size={18} />
            </button>
            <button className="station-btn secondary tiny" onClick={() => loadData(true)} disabled={isLoading}>
                <RefreshCwIcon size={16} className={isLoading ? 'spin' : ''} />
            </button>
            <button className="station-btn station-btn-primary" onClick={() => setShowReports(true)} disabled={!snapshot}>
                <DownloadIcon size={16} /> REPORTES
            </button>
        </div>
      </header>

      <main className="flex-col" style={{ padding: '24px', flex: 1, minHeight: 0, overflow: 'auto' }}>
        {activeTab === 'TELEMETRY' ? (
          <div className="flex-col fade-in" style={{ gap: '24px' }}>
            <div className="station-form-grid">
              <div className="station-card flex-col" style={{ gap: '4px' }}>
                <span className="station-registry-item-meta">{t('supervisor.kpi_docs_24h')}</span>
                <span className="station-title-main" style={{ fontSize: '1.8rem' }}>{snapshot?.globalTotals.totalDocs24h.toLocaleString()}</span>
              </div>
              <div className="station-card flex-col" style={{ gap: '4px' }}>
                <span className="station-registry-item-meta">{t('supervisor.kpi_audits_24h')}</span>
                <span className="station-title-main" style={{ fontSize: '1.8rem' }}>{snapshot?.globalTotals.totalAudits24h.toLocaleString()}</span>
              </div>
              <div className="station-card flex-col" style={{ gap: '4px' }}>
                <span className="station-registry-item-meta">{t('supervisor.kpi_errors_24h')}</span>
                <span className={`station-title-main ${snapshot?.globalTotals.cryptOps.errors ? 'station-shimmer-text' : ''}`} style={{ fontSize: '1.8rem', color: snapshot?.globalTotals.cryptOps.errors ? 'var(--status-err)' : 'inherit' }}>
                    {snapshot?.globalTotals.cryptOps.errors}
                </span>
              </div>
              <div className="station-card flex-col" style={{ gap: '4px' }}>
                <span className="station-registry-item-meta">{t('supervisor.kpi_qa_breaks')}</span>
                <span className={`station-title-main ${snapshot?.globalTotals.totalQaBreaks24h ? 'station-shimmer-text' : ''}`} style={{ fontSize: '1.8rem', color: snapshot?.globalTotals.totalQaBreaks24h ? 'var(--status-err)' : 'inherit' }}>
                    {snapshot?.globalTotals.totalQaBreaks24h}
                </span>
              </div>
            </div>

            <section className="station-card" style={{ padding: 0 }}>
              <UnitTable units={snapshot?.units || []} />
            </section>

            <div className="station-form-grid">
              <div className="station-card flex-col" style={{ gap: '16px' }}>
                  <h3 className="station-form-section-title">{t('audit.securityTitle').toUpperCase()}</h3>
                  <div className="flex-row" style={{ gap: '16px' }}>
                      <div className="station-registry-sync-header" style={{ flex: 1, padding: '12px' }}>
                          <span className="station-registry-item-meta">{t('supervisor.sec_failed')}</span>
                          <span className="station-title-main" style={{ fontSize: '1.2rem' }}>{snapshot?.security.totalFailedLogins}</span>
                      </div>
                      <div className="station-registry-sync-header" style={{ flex: 1, padding: '12px' }}>
                          <span className="station-registry-item-meta">{t('supervisor.sec_locks')}</span>
                          <span className="station-title-main" style={{ fontSize: '1.2rem' }}>{snapshot?.security.totalLocksTriggered}</span>
                      </div>
                      <div className="station-registry-sync-header" style={{ flex: 1, padding: '12px' }}>
                          <span className="station-registry-item-meta">{t('supervisor.sec_tech')}</span>
                          <span className="station-title-main" style={{ fontSize: '1.2rem' }}>{snapshot?.security.totalTechModeActivations}</span>
                      </div>
                  </div>
              </div>

              <div className="station-card flex-col" style={{ gap: '16px' }}>
                  <h3 className="station-form-section-title">{t('supervisor.govtitle') || 'GOBERNANZA GLOBAL'}</h3>
                  <div className="flex-row" style={{ gap: '12px', flexWrap: 'wrap' }}>
                      <button className="station-registry-sync-header clickable" style={{ flex: 1, padding: '12px' }} onClick={() => {
                        setSecurityEventTypeFilter('OPERATOR_ROLE_CHANGE');
                        setActiveTab('SECURITY');
                        updateUrl({ tab: 'SECURITY', eventType: 'OPERATOR_ROLE_CHANGE' });
                      }}>
                          <span className="station-registry-item-meta">{t('supervisor.govrolechanges') || 'CAMBIOS ROL'}</span>
                          <span className="station-title-main" style={{ fontSize: '1.2rem' }}>{snapshot?.governance.operatorRoleChanges24h}</span>
                      </button>
                      <button className="station-registry-sync-header clickable" style={{ flex: 1, padding: '12px' }} onClick={() => {
                          setSecurityEventTypeFilter('OPERATOR_CAPABILITY_OVERRIDE');
                          setActiveTab('SECURITY');
                          updateUrl({ tab: 'SECURITY', eventType: 'OPERATOR_CAPABILITY_OVERRIDE' });
                      }}>
                          <span className="station-registry-item-meta">{t('supervisor.govoverrides') || 'OVERRIDE PERM.'}</span>
                          <span className="station-title-main" style={{ fontSize: '1.2rem' }}>{snapshot?.governance.operatorOverrideChanges24h}</span>
                      </button>
                      <button className="station-registry-sync-header clickable" style={{ flex: 1, padding: '12px' }} onClick={() => {
                          setSecurityEventTypeFilter('CONFIG_UPDATE'); 
                          setActiveTab('SECURITY');
                          updateUrl({ tab: 'SECURITY', eventType: 'CONFIG_UPDATE' });
                      }}>
                          <span className="station-registry-item-meta">{t('supervisor.govconfig')}</span>
                          <span className="station-title-main" style={{ fontSize: '1.2rem' }}>{snapshot?.governance.configChanges24h}</span>
                      </button>
                  </div>
              </div>
            </div>

            <section className="station-card flex-col" style={{ gap: '20px' }}>
                <header className="flex-row" style={{ gap: '12px', alignItems: 'center' }}>
                    <ShieldAlertIcon size={18} color="var(--primary-color)" />
                    <h3 className="station-form-section-title" style={{ margin: 0 }}>RBAC & SESSIONS · ACTIVIDAD RECIENTE</h3>
                </header>

                <SecurityActivityFeed />
            </section>
          </div>
        ) : activeTab === 'OPERATORS' ? (
          <OperatorManager initialOperatorId={initialOperatorId} />
        ) : activeTab === 'SECURITY' ? (
          <div className="flex-col" style={{ height: 'calc(100vh - 220px)', minHeight: '600px' }}>
            <SecurityAuditPanel 
              initialEventType={securityEventTypeFilter ?? undefined} 
              initialEntityType={securityEntityTypeFilter ?? undefined}
              onFiltersCleared={handleFiltersCleared}
            />
          </div>
        ) : activeTab === 'DOCUMENTS' ? (
          <div className="flex-col" style={{ height: 'calc(100vh - 220px)', minHeight: '600px' }}>
            <DocCatalogStation />
          </div>
        ) : (
          <TechnicalCockpit />
        )}
      </main>

      {showSettings && (
        <TelemetrySettingsPanel onClose={() => setShowSettings(false)} />
      )}

      {showReports && (
        <ReportExportModal snapshot={snapshot} onClose={() => setShowReports(false)} />
      )}

      <style jsx>{`
        .text-critical { color: var(--status-err); }
        .clickable:hover { border-color: var(--primary-color) !important; background: rgba(var(--primary-color-rgb), 0.05); }
      `}</style>
    </div>
  );
};

const SecurityActivityFeed: React.FC = () => {
  const [events, setEvents] = useState<any[]>([]);

  useEffect(() => {
    const load = async () => {
      try {
        const logs = await supervisorService.getSecurityActivityFeed(10);
        setEvents(logs);
      } catch (err) {
        console.warn('Failed to load security activity feed', err);
      }
    };
    load();
    const interval = setInterval(load, 30000);
    return () => clearInterval(interval);
  }, []);

  if (events.length === 0) {
    return (
      <div className="station-empty-state" style={{ height: '150px' }}>
        <ShieldCheckIcon size={32} className="station-shimmer-text" />
        <span className="station-shimmer-text" style={{ marginTop: '12px' }}>NO RECENT SECURITY ANOMALIES</span>
      </div>
    );
  }

  return (
    <div className="flex-col" style={{ gap: '8px' }}>
      {events.map(ev => {
        const isCritical = ev.status === 'ERROR' || ev.status === 'WARNING';
        return (
          <div key={ev.id} className="station-registry-sync-header flex-row fade-in" style={{ gap: '16px', padding: '10px 16px' }}>
            <div className="integrity-dot" style={{ background: isCritical ? 'var(--status-err)' : 'var(--primary-color)', boxShadow: isCritical ? '0 0 8px var(--status-err)' : 'none' }} />
            <div style={{ width: '100px' }}>
                <span className="station-registry-item-meta">{new Date(ev.timestamp).toLocaleTimeString()}</span>
            </div>
            <div style={{ width: '60px' }}>
                <span className="station-badge station-badge-blue tiny">{ev.category}</span>
            </div>
            <div className="station-title-main" style={{ flex: 1, fontSize: '0.75rem' }}>
                {ev.action.toUpperCase()}
            </div>
            <div className="station-registry-item-meta" style={{ flex: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                ACTOR: {ev.details.actorUser || 'SYSTEM'} · {Object.entries(ev.details.context || {}).map(([k,v]) => `${k}:${v}`).join(' ')}
            </div>
          </div>
        );
      })}
    </div>
  );
};
