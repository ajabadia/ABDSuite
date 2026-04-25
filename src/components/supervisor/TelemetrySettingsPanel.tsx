'use client';

import React, { useState, useEffect } from 'react';
import { useLanguage } from '@/lib/context/LanguageContext';
import { TelemetryConfigService } from '@/lib/services/telemetry-config.service';
import { TelemetryConfig } from '@/lib/types/telemetry.types';
import { 
  XIcon, 
  SaveIcon, 
  AlertTriangleIcon,
  BuildingIcon,
  ShieldCheckIcon,
  CogIcon,
  RefreshCwIcon,
  LockIcon,
  MapIcon
} from '@/components/common/Icons';
import { useWorkspace } from '@/lib/context/WorkspaceContext';
import { EncryptionMigration } from '@/lib/utils/EncryptionMigration';
import { db } from '@/lib/db/db';

interface TelemetrySettingsPanelProps {
  onClose: () => void;
}

export const TelemetrySettingsPanel: React.FC<TelemetrySettingsPanelProps> = ({ onClose }) => {
  const { t } = useLanguage();
  const { requestStepUp, installationKey, currentUnit, currentOperator } = useWorkspace();
  const [config, setConfig] = useState<TelemetryConfig | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isMigrating, setIsMigrating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [migrationStatus, setMigrationStatus] = useState<string | null>(null);

  useEffect(() => {
    TelemetryConfigService.loadConfig().then(setConfig);
  }, []);

  const handleMigration = async () => {
    if (!installationKey || isMigrating) return;
    
    if (!(await requestStepUp(2))) {
        return;
    }

    if (!confirm('¿INICIAR MIGRACIÓN CRIPTOGRÁFICA DE DATOS EXISTENTES?\n\nSe cifrarán todas las plantillas y el historial de auditoría de la unidad actual.')) return;

    setIsMigrating(true);
    setMigrationStatus('PROCESANDO...');
    
    try {
        const coreRes = await EncryptionMigration.migrateCore(installationKey);
        let unitRes = { success: 0, skipped: 0 };
        
        if (currentUnit) {
            unitRes = await EncryptionMigration.migrateUnit(db, currentUnit.id, installationKey);
        }

        setMigrationStatus(`MIGRACIÓN COMPLETADA: ${coreRes.success + unitRes.success} registros cifrados. ${coreRes.skipped + unitRes.skipped} omitidos.`);
    } catch (err) {
      console.error('[MIGRATION] Critical failure', err);
      setError('FALLO CRÍTICO EN MIGRACIÓN. REVISA CONSOLA.');
    } finally {
        setIsMigrating(false);
    }
  };

  const handleSave = async () => {
    if (!config) return;
    if (!(await requestStepUp(2))) {
       return;
    }
    setIsSaving(true);
    try {
      await TelemetryConfigService.saveConfig(config, currentOperator?.id);
      setTimeout(onClose, 500); 
    } catch (err) {
      console.error('[SETTINGS] Save failed', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      if (config && ev.target?.result) {
        setConfig({
          ...config,
          corporate: { ...config.corporate, logoBase64: ev.target.result as string }
        });
      }
    };
    reader.readAsDataURL(file);
  };

  if (!config) return null;

  return (
    <div className="station-modal-overlay fade-in">
      <div className="station-modal" style={{ maxWidth: '640px' }}>
        <header className="station-modal-header">
          <div className="flex-row" style={{ alignItems: 'center', gap: '12px' }}>
            <CogIcon size={20} color="var(--primary-color)" />
            <h2 className="station-form-section-title" style={{ margin: 0 }}>{t('supervisor.settings_title').toUpperCase()}</h2>
          </div>
          <button className="station-btn secondary tiny" onClick={onClose}>
            <XIcon size={18} />
          </button>
        </header>

        <div className="station-modal-content" style={{ padding: '24px', gap: '24px' }}>
          
          {error && (
             <div className="station-registry-sync-header" style={{ borderColor: 'var(--status-err)', background: 'rgba(var(--status-err-rgb), 0.1)' }}>
                <div className="flex-row" style={{ gap: '8px', alignItems: 'center' }}>
                   <AlertTriangleIcon size={16} color="var(--status-err)" />
                   <span className="station-title-main" style={{ color: 'var(--status-err)' }}>[ERR] {error.toUpperCase()}</span>
                </div>
             </div>
          )}

          {/* CORPORATE IDENTITY */}
          <section className="station-card" style={{ padding: '20px', gap: '16px' }}>
             <div className="flex-row" style={{ gap: '10px', opacity: 0.6 }}>
                <BuildingIcon size={14} />
                <h3 className="station-form-section-title" style={{ fontSize: '0.65rem' }}>{t('supervisor.corporate_header').toUpperCase()}</h3>
             </div>
             <div className="station-field-container">
                <label className="station-registry-item-meta">{t('supervisor.plant_name').toUpperCase()}</label>
                <input 
                  type="text" 
                  className="station-input" 
                  value={config.corporate.plantName}
                  onChange={(e) => setConfig({
                    ...config,
                    corporate: { ...config.corporate, plantName: e.target.value }
                  })}
                />
             </div>
             <div className="station-field-container">
                <label className="station-registry-item-meta">{t('supervisor.logo_load').toUpperCase()}</label>
                <div className="flex-row" style={{ gap: '16px', alignItems: 'center' }}>
                    {config.corporate.logoBase64 && (
                        <img src={config.corporate.logoBase64} alt="logo" style={{ height: '40px', background: '#fff', padding: '4px', borderRadius: '4px', border: '1px solid var(--border-color)' }} />
                    )}
                    <input type="file" accept="image/*" onChange={handleLogoUpload} className="station-registry-item-meta" style={{ fontSize: '0.65rem' }} />
                </div>
             </div>
          </section>

          {/* THRESHOLDS GRID */}
          <div className="station-form-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
            {/* HEALTH */}
            <section className="station-card" style={{ padding: '20px', gap: '16px' }}>
               <div className="flex-row" style={{ gap: '10px', opacity: 0.6 }}>
                  <AlertTriangleIcon size={14} />
                  <h3 className="station-form-section-title" style={{ fontSize: '0.65rem' }}>HEALTH_LIMITS</h3>
               </div>
               <div className="station-field-container">
                  <label className="station-registry-item-meta">WARN: QA_BREAKS</label>
                  <input 
                    type="number" 
                    className="station-input" 
                    value={config.health.qaBreaksWarn}
                    onChange={(e) => setConfig({
                      ...config, 
                      health: { ...config.health, qaBreaksWarn: Number(e.target.value) }
                    })}
                  />
               </div>
               <div className="station-field-container">
                  <label className="station-registry-item-meta">CRITICAL: QA_BREAKS</label>
                  <input 
                    type="number" 
                    className="station-input" 
                    value={config.health.qaBreaksCritical}
                    onChange={(e) => setConfig({
                      ...config, 
                      health: { ...config.health, qaBreaksCritical: Number(e.target.value) }
                    })}
                  />
               </div>
            </section>

            {/* SECURITY */}
            <section className="station-card" style={{ padding: '20px', gap: '16px' }}>
               <div className="flex-row" style={{ gap: '10px', opacity: 0.6 }}>
                  <ShieldCheckIcon size={14} />
                  <h3 className="station-form-section-title" style={{ fontSize: '0.65rem' }}>SEC_POLICIES</h3>
               </div>
               <div className="station-field-container">
                  <label className="station-registry-item-meta">AUTH_FAIL (WARN)</label>
                  <input 
                    type="number" 
                    className="station-input" 
                    value={config.security.securityThresholds.failedAuthLow}
                    onChange={(e) => setConfig({
                      ...config, 
                      security: { ...config.security, securityThresholds: { ...config.security.securityThresholds, failedAuthLow: Number(e.target.value) } }
                    })}
                  />
               </div>
               <div className="station-field-container">
                  <label className="station-registry-item-meta">AUTH_FAIL (ALRT)</label>
                  <input 
                    type="number" 
                    className="station-input" 
                    value={config.security.securityThresholds.failedAuthHigh}
                    onChange={(e) => setConfig({
                      ...config, 
                      security: { ...config.security, securityThresholds: { ...config.security.securityThresholds, failedAuthHigh: Number(e.target.value) } }
                    })}
                  />
               </div>
            </section>
          </div>

          {/* MAPPING POLICY */}
          <section className="station-card" style={{ padding: '20px', gap: '16px' }}>
             <div className="flex-row" style={{ gap: '10px', opacity: 0.6 }}>
                <MapIcon size={14} />
                <h3 className="station-form-section-title" style={{ fontSize: '0.65rem' }}>{t('letter.ui.mapping_brain').toUpperCase()}</h3>
             </div>
             <div className="station-field-container">
                <div className="flex-row" style={{ justifyContent: 'space-between', marginBottom: '8px' }}>
                   <label className="station-registry-item-meta">MIN_COVERAGE_THRESHOLD</label>
                   <span className="station-title-main" style={{ color: 'var(--primary-color)' }}>
                      {Math.round(config.security.mappingThresholds.minCoverage * 100)}%
                   </span>
                </div>
                <input 
                  type="range" 
                  min="0" 
                  max="100" 
                  step="5"
                  className="station-input"
                  value={config.security.mappingThresholds.minCoverage * 100}
                  onChange={(e) => setConfig({
                    ...config,
                    security: { 
                      ...config.security, 
                      mappingThresholds: { minCoverage: Number(e.target.value) / 100 }
                    }
                  })}
                  style={{ cursor: 'pointer', accentColor: 'var(--primary-color)' }}
                />
             </div>
          </section>

           {/* AT-REST ENCRYPTION STATUS & MIGRATION */}
           <section className="station-card" style={{ padding: '20px', gap: '16px', border: '1px solid var(--primary-color)', background: 'rgba(var(--primary-color-rgb), 0.05)' }}>
              <div className="flex-row" style={{ gap: '10px' }}>
                 <LockIcon size={14} color="var(--primary-color)" />
                 <h3 className="station-form-section-title" style={{ fontSize: '0.65rem', color: 'var(--primary-color)' }}>SEG_AT_REST_ERA_6</h3>
              </div>
              <div className="flex-col" style={{ gap: '16px' }}>
                 <div className="flex-row" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
                    <div className="flex-col">
                       <span className="station-title-main" style={{ fontSize: '0.75rem' }}>STATUS: {installationKey ? 'UNLOCKED' : 'LOCKED'}</span>
                       <span className="station-registry-item-meta">AES-GCM INST_KEY_MEMORY_ACTIVE.</span>
                    </div>
                    <button 
                      className="station-btn station-btn-primary small" 
                      disabled={!installationKey || isMigrating}
                      onClick={handleMigration}
                    >
                      {isMigrating ? <RefreshCwIcon size={14} className="spin" /> : <RefreshCwIcon size={14} />}
                      <span>MIGRAR_DATOS</span>
                    </button>
                 </div>
                 {migrationStatus && (
                    <div className="station-shimmer-text" style={{ fontSize: '0.65rem', color: 'var(--primary-color)', fontWeight: 700 }}>
                       {migrationStatus.toUpperCase()}
                    </div>
                 )}
              </div>
           </section>

        </div>

        <footer className="station-modal-footer">
            <button className="station-btn secondary tiny" onClick={() => TelemetryConfigService.resetToDefaults().then(() => TelemetryConfigService.loadConfig().then(setConfig))}>
                RESET_DEFAULTS
            </button>
            <button className="station-btn station-btn-primary" onClick={handleSave} disabled={isSaving}>
                <SaveIcon size={18} />
                <span>{isSaving ? '...' : t('supervisor.save_settings').toUpperCase()}</span>
            </button>
        </footer>
      </div>
    </div>
  );
};
