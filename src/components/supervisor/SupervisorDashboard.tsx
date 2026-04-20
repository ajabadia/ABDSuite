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
    <div className="station-container animate-fade-in">
      <header className="station-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div className="station-icon-glow">
            <ActivityIcon size={32} />
          </div>
          <div>
            <h1 className="station-title">{t('supervisor.title')}</h1>
            <p className="station-subtitle">{t('supervisor.subtitle')}</p>
          </div>
        </div>
        
        <div style={{ display: 'flex', gap: '8px' }}>
            <button 
              className={`station-btn ${activeTab === 'TELEMETRY' ? 'primary' : 'secondary'}`} 
              onClick={() => setActiveTab('TELEMETRY')}
            >
              <ActivityIcon size={18} />
              <span className="btn-label">{t('supervisor.title').split(' ')[0]}</span>
            </button>
            {canSeeOperators && (
              <button 
                className={`station-btn ${activeTab === 'OPERATORS' ? 'primary' : 'secondary'}`} 
                onClick={() => setActiveTab('OPERATORS')}
              >
                <UserIcon size={18} />
                <span className="btn-label">{t('operator.panel_title').split(' ')[0]}</span>
              </button>
            )}
            {canSeeSecurity && (
              <button 
                className={`station-btn ${activeTab === 'SECURITY' ? 'primary' : 'secondary'}`} 
                onClick={() => setActiveTab('SECURITY')}
              >
                <ShieldCheckIcon size={18} />
                <span className="btn-label">{t('audit.securityTitle').split(' ')[0]}</span>
              </button>
            )}
        </div>

        <div style={{ display: 'flex', gap: '12px' }}>
            <button className="station-btn secondary" onClick={() => setShowSettings(true)}>
                <CogIcon size={18} />
            </button>
            <button className="station-btn secondary" onClick={() => loadData(true)} disabled={isLoading}>
                <RefreshCwIcon size={18} className={isLoading ? 'spin' : ''} />
            </button>
            <button className="station-btn primary" onClick={handleExport} disabled={!snapshot}>
                <DownloadIcon size={18} />
                <span className="btn-label">{t('supervisor.export_master')}</span>
            </button>
        </div>
      </header>

      {activeTab === 'TELEMETRY' ? (
        <>
          {/* GLOBAL KPI GRID */}
          <div className="station-form-grid" style={{ marginBottom: '24px' }}>
            <div className="station-card">
              <div className="kpi-box">
                <span className="kpi-label">{t('supervisor.kpi_docs_24h')}</span>
                <span className="kpi-value">{snapshot?.globalTotals.totalDocs24h.toLocaleString()}</span>
              </div>
            </div>
            <div className="station-card">
              <div className="kpi-box">
                <span className="kpi-label">{t('supervisor.kpi_audits_24h')}</span>
                <span className="kpi-value">{snapshot?.globalTotals.totalAudits24h.toLocaleString()}</span>
              </div>
            </div>
            <div className="station-card">
              <div className="kpi-box">
                <span className="kpi-label">{t('supervisor.kpi_errors_24h')}</span>
                <span className={`kpi-value ${snapshot?.globalTotals.cryptOps.errors ? 'text-critical' : ''}`}>
                    {snapshot?.globalTotals.cryptOps.errors}
                </span>
              </div>
            </div>
            <div className="station-card">
              <div className="kpi-box">
                <span className="kpi-label">{t('supervisor.kpi_qa_breaks')}</span>
                <span className={`kpi-value ${snapshot?.globalTotals.totalQaBreaks24h ? 'text-critical' : ''}`}>
                    {snapshot?.globalTotals.totalQaBreaks24h}
                </span>
              </div>
            </div>
          </div>

          {/* UNITS TABLE */}
          <div className="station-card" style={{ padding: 0, overflow: 'hidden' }}>
            <UnitTable units={snapshot?.units || []} />
          </div>

          {/* SECURITY GLOBAL SUMMARY */}
          <div className="station-form-grid" style={{ marginTop: '24px' }}>
            <div className="station-card">
                <h3 style={{ fontSize: '0.9rem', marginBottom: '16px', opacity: 0.6 }}>GLOBAL SECURITY EVENTS</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
                    <div className="metric-box">
                        <span className="label">{t('supervisor.sec_failed')}</span>
                        <span className="val">{snapshot?.security.totalFailedLogins}</span>
                    </div>
                    <div className="metric-box">
                        <span className="label">{t('supervisor.sec_locks')}</span>
                        <span className="val">{snapshot?.security.totalLocksTriggered}</span>
                    </div>
                    <div className="metric-box">
                        <span className="label">{t('supervisor.sec_tech')}</span>
                        <span className="val">{snapshot?.security.totalTechModeActivations}</span>
                    </div>
                </div>
            </div>
          </div>
        </>
      ) : activeTab === 'OPERATORS' ? (
        <OperatorManager initialOperatorId={initialOperatorId} />
      ) : (
        <div className="station-card" style={{ height: 'calc(100vh - 250px)' }}>
          <SecurityAuditPanel />
        </div>
      )}

      {showSettings && (
        <TelemetrySettingsPanel onClose={() => setShowSettings(false)} />
      )}

      <style jsx>{`
        .kpi-box {
          display: flex;
          flex-direction: column;
        }
        .kpi-label {
          font-size: 0.7rem;
          text-transform: uppercase;
          letter-spacing: 0.1rem;
          opacity: 0.6;
          margin-bottom: 8px;
        }
        .kpi-value {
          font-size: 2.2rem;
          font-weight: 800;
          font-family: 'JetBrains Mono', monospace;
        }
        .text-critical {
          color: var(--status-critical);
          text-shadow: 0 0 10px rgba(255, 0, 0, 0.3);
        }
        .metric-box {
           background: rgba(255,255,255,0.03);
           padding: 12px;
           border-radius: 4px;
           display: flex;
           flex-direction: column;
        }
        .metric-box .label { font-size: 0.65rem; opacity: 0.5; margin-bottom: 4px; }
        .metric-box .val { font-family: 'JetBrains Mono'; font-weight: bold; }
      `}</style>
    </div>
  );
};
