'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useLanguage } from '@/lib/context/LanguageContext';
import { useWorkspace } from '@/lib/context/WorkspaceContext';
import { TelemetryService } from '@/lib/services/TelemetryService';
import { GlobalTelemetrySnapshot } from '@/lib/types/telemetry.types';
import { ComplianceReportService } from '@/lib/services/ComplianceReportService';
import { 
  ActivityIcon, 
  RefreshCwIcon, 
  AlertTriangleIcon, 
  CheckCircleIcon,
  ShieldAlertIcon,
  DownloadIcon,
  CogIcon,
  UserIcon,
  ShieldCheckIcon
} from '@/components/common/Icons';
import { UnitTable } from './UnitTable';
import { TelemetrySettingsPanel } from './TelemetrySettingsPanel';
import { OperatorManager } from './OperatorManager';
import { SecurityAuditPanel } from '../audit/SecurityAuditPanel';
import { ForbiddenPanel } from '../common/ForbiddenPanel';

export const SupervisorDashboard: React.FC = () => {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <SupervisorDashboardContent />
    </Suspense>
  );
};

const SupervisorDashboardContent: React.FC = () => {
  const { t } = useLanguage();
  const { can } = useWorkspace();
  const searchParams = useSearchParams();
  
  const initialTab = searchParams.get('tab')?.toUpperCase();
  const initialOperatorId = searchParams.get('operatorId');

  const [snapshot, setSnapshot] = useState<GlobalTelemetrySnapshot | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  
  const [activeTab, setActiveTab] = useState<'TELEMETRY' | 'OPERATORS' | 'SECURITY'>(
    (initialTab === 'OPERATORS' || initialTab === 'SECURITY') ? initialTab : 'TELEMETRY'
  );
  const [securityEventTypeFilter, setSecurityEventTypeFilter] = useState<string | null>(null);

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

  const handleExport = async () => {
    if (!snapshot) return;
    try {
      const blob = await ComplianceReportService.generateGlobalCsv(snapshot);
      ComplianceReportService.downloadBlob(blob, `ABDFN_AUDIT_MASTER_${new Date().toISOString()}.csv`);
    } catch (err) {
      console.error('[SUPERVISOR] Export failed', err);
    }
  };

  const canSeeOperators = can('OPERATORS_MANAGE');
  const canSeeSecurity = can('AUDIT_VIEW') || can('SUPERVISOR_VIEW');

  useEffect(() => {
    loadData();
    const interval = setInterval(() => loadData(), 60000); // 1 min auto-refresh
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (initialTab === 'OPERATORS' && canSeeOperators) {
      setActiveTab('OPERATORS');
    } else if (initialTab === 'SECURITY' && canSeeSecurity) {
      setActiveTab('SECURITY');
    }
  }, [initialTab, canSeeOperators, canSeeSecurity]);

  // Reset drill-down filter when navigating away
  useEffect(() => {
    if (activeTab !== 'SECURITY') {
      setSecurityEventTypeFilter(null);
    }
  }, [activeTab]);

  if (!can('SUPERVISOR_VIEW')) {
    return <ForbiddenPanel capability="SUPERVISOR_VIEW" />;
  }

  if (!snapshot && isLoading) {
    return (
      <div className="station-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
         <div className="loader-container">
            <RefreshCwIcon size={48} className="spin" />
            <p style={{ marginTop: '16px', opacity: 0.7 }}>{t('audit.validating')}</p>
         </div>
      </div>
    );
  }

  return (
    <div className="supervisor-container obsidian-surface-technical">
      <header className="station-header technical-header" style={{ borderBottom: '1px solid var(--border-color)', background: 'var(--header-bg)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div className="technical-icon-box">
            <ActivityIcon size={24} color="var(--primary-color)" />
          </div>
          <div>
            <h1 className="station-title" style={{ fontSize: '1rem', letterSpacing: '2px' }}>{t('supervisor.title').toUpperCase()}</h1>
            <p className="station-subtitle" style={{ fontSize: '0.65rem', opacity: 0.5, letterSpacing: '1px' }}>{t('supervisor.subtitle').toUpperCase()}</p>
          </div>
        </div>
        
        <div className="tab-group technical-tabs" style={{ display: 'flex', gap: '2px', background: 'var(--border-color)', padding: '2px', borderRadius: '4px' }}>
            <button 
              className={`station-tab-btn ${activeTab === 'TELEMETRY' ? 'active' : ''}`} 
              onClick={() => setActiveTab('TELEMETRY')}
            >
              <ActivityIcon size={14} />
              <span className="btn-label">{t('supervisor.title').split(' ')[0]}</span>
            </button>
            {canSeeOperators && (
              <button 
                className={`station-tab-btn ${activeTab === 'OPERATORS' ? 'active' : ''}`} 
                onClick={() => setActiveTab('OPERATORS')}
              >
                <UserIcon size={14} />
                <span className="btn-label">{t('operator.panel_title').split(' ')[0]}</span>
              </button>
            )}
            {canSeeSecurity && (
              <button 
                className={`station-tab-btn ${activeTab === 'SECURITY' ? 'active' : ''}`} 
                onClick={() => setActiveTab('SECURITY')}
              >
                <ShieldCheckIcon size={14} />
                <span className="btn-label">{t('audit.securityTitle').split(' ')[0]}</span>
              </button>
            )}
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
            <button className="station-btn secondary tiny technical-trigger" onClick={() => setShowSettings(true)} title={t('supervisor.settings_title')}>
                <CogIcon size={20} />
            </button>
            <button className="station-btn secondary tiny" onClick={() => loadData(true)} disabled={isLoading}>
                <RefreshCwIcon size={16} className={isLoading ? 'spin' : ''} />
            </button>
            <button className="station-btn primary" style={{ background: 'var(--primary-color)', color: '#000' }} onClick={handleExport} disabled={!snapshot}>
                <DownloadIcon size={16} />
                <span className="btn-label" style={{ fontWeight: 800 }}>{t('supervisor.export_master')}</span>
            </button>
        </div>
      </header>

      <main style={{ padding: '24px' }}>
        {activeTab === 'TELEMETRY' ? (
          <>
            {/* GLOBAL KPI GRID */}
            <div className="station-form-grid" style={{ marginBottom: '24px' }}>
              <div className="station-card technical-card">
                <div className="kpi-box">
                  <span className="kpi-label">{t('supervisor.kpi_docs_24h')}</span>
                  <span className="kpi-value">{snapshot?.globalTotals.totalDocs24h.toLocaleString()}</span>
                </div>
              </div>
              <div className="station-card technical-card">
                <div className="kpi-box">
                  <span className="kpi-label">{t('supervisor.kpi_audits_24h')}</span>
                  <span className="kpi-value">{snapshot?.globalTotals.totalAudits24h.toLocaleString()}</span>
                </div>
              </div>
              <div className="station-card technical-card">
                <div className="kpi-box">
                  <span className="kpi-label">{t('supervisor.kpi_errors_24h')}</span>
                  <span className={`kpi-value ${snapshot?.globalTotals.cryptOps.errors ? 'text-critical' : ''}`}>
                      {snapshot?.globalTotals.cryptOps.errors}
                  </span>
                </div>
              </div>
              <div className="station-card technical-card">
                <div className="kpi-box">
                  <span className="kpi-label">{t('supervisor.kpi_qa_breaks')}</span>
                  <span className={`kpi-value ${snapshot?.globalTotals.totalQaBreaks24h ? 'text-critical' : ''}`}>
                      {snapshot?.globalTotals.totalQaBreaks24h}
                  </span>
                </div>
              </div>
            </div>

            {/* UNITS TABLE */}
            <div className="station-card units-wrapper-technical" style={{ padding: 0, overflow: 'hidden', background: 'var(--surface-color)', border: '1px solid var(--border-color)' }}>
              <UnitTable units={snapshot?.units || []} />
            </div>

            {/* SECURITY & GOVERNANCE GLOBAL SUMMARY */}
            <div className="station-form-grid" style={{ marginTop: '24px' }}>
              <div className="station-card technical-card">
                  <h3 className="section-title-technical">{t('audit.securityTitle').toUpperCase()}</h3>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
                      <div className="metric-box-technical">
                          <span className="label">{t('supervisor.sec_failed')}</span>
                          <span className="val">{snapshot?.security.totalFailedLogins}</span>
                      </div>
                      <div className="metric-box-technical">
                          <span className="label">{t('supervisor.sec_locks')}</span>
                          <span className="val">{snapshot?.security.totalLocksTriggered}</span>
                      </div>
                      <div className="metric-box-technical">
                          <span className="label">{t('supervisor.sec_tech')}</span>
                          <span className="val">{snapshot?.security.totalTechModeActivations}</span>
                      </div>
                  </div>
              </div>

              <div className="station-card technical-card">
                  <h3 className="section-title-technical">{t('supervisor.govtitle') || 'GOBERNANZA GLOBAL'}</h3>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
                      <div className="metric-box-technical clickable" onClick={() => {
                        setSecurityEventTypeFilter('OPERATOR_ROLE_CHANGE');
                        setActiveTab('SECURITY');
                      }}>
                          <span className="label">{t('supervisor.govrolechanges') || 'CAMBIOS ROL'}</span>
                          <span className="val">{snapshot?.governance.operatorRoleChanges24h}</span>
                      </div>
                      <div className="metric-box-technical clickable" onClick={() => {
                          setSecurityEventTypeFilter('OPERATOR_CAPABILITY_OVERRIDE');
                          setActiveTab('SECURITY');
                      }}>
                          <span className="label">{t('supervisor.govoverrides') || 'OVERRIDE PERM.'}</span>
                          <span className="val">{snapshot?.governance.operatorOverrideChanges24h}</span>
                      </div>
                      <div className="metric-box-technical clickable" onClick={() => {
                          setSecurityEventTypeFilter('CONFIG_UPDATE'); 
                          setActiveTab('SECURITY');
                      }}>
                          <span className="label">{t('supervisor.govconfig')}</span>
                          <span className="val">{snapshot?.governance.configChanges24h}</span>
                      </div>
                  </div>
              </div>
            </div>
          </>
        ) : activeTab === 'OPERATORS' ? (
          <OperatorManager initialOperatorId={initialOperatorId} />
        ) : (
          <div className="station-card" style={{ height: 'calc(100vh - 200px)', background: 'var(--surface-color)', border: '1px solid var(--border-color)' }}>
            <SecurityAuditPanel initialEventType={securityEventTypeFilter ?? undefined} />
          </div>
        )}
      </main>

      {showSettings && (
        <TelemetrySettingsPanel onClose={() => setShowSettings(false)} />
      )}

      <style jsx>{`
        .supervisor-container {
          min-height: 100vh;
          background: var(--bg-color);
          color: var(--text-primary);
        }
        .technical-header {
           padding: 16px 32px;
           display: flex;
           justify-content: space-between;
           align-items: center;
        }
        .technical-icon-box {
           background: var(--border-color);
           opacity: 0.8;
           padding: 10px;
           border-radius: 8px;
        }
        .technical-card {
           background: var(--surface-color);
           border: 1px solid var(--border-color);
           border-radius: 8px;
           padding: 20px;
        }
        .kpi-box { display: flex; flex-direction: column; }
        .kpi-label {
          font-size: 0.6rem;
          text-transform: uppercase;
          letter-spacing: 0.05rem;
          opacity: 0.5;
          margin-bottom: 4px;
          font-weight: 800;
        }
        .kpi-value {
          font-size: 1.8rem;
          font-weight: 800;
          font-family: var(--font-mono);
          color: var(--text-primary);
        }
        .section-title-technical {
          font-size: 0.65rem;
          margin-bottom: 16px;
          opacity: 0.5;
          letter-spacing: 2px;
          font-weight: 900;
        }
        .metric-box-technical {
           background: var(--bg-color);
           padding: 12px;
           border-radius: 4px;
           border: 1px solid var(--border-color);
           display: flex;
           flex-direction: column;
           transition: var(--snap);
        }
        .metric-box-technical.clickable { cursor: pointer; }
        .metric-box-technical.clickable:hover { 
           border-color: var(--primary-color);
           background: var(--surface-color);
        }
        .metric-box-technical .label { font-size: 0.6rem; opacity: 0.5; margin-bottom: 4px; font-weight: 700; text-transform: uppercase; }
        .metric-box-technical .val { font-family: var(--font-mono); font-weight: bold; font-size: 1.1rem; }
        .text-critical { color: var(--status-err); }
      `}</style>
    </div>
  );
};
