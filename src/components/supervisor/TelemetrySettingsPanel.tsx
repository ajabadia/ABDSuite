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
  MapIcon,
  PlusIcon,
  MinusIcon,
  UploadIcon
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

    if (!confirm(t('supervisor.settings_modal.migration_confirm'))) return;

    setIsMigrating(true);
    setMigrationStatus(t('supervisor.settings_modal.migration_processing'));
    
    try {
        const coreRes = await EncryptionMigration.migrateCore(installationKey);
        let unitRes = { success: 0, skipped: 0 };
        
        if (currentUnit) {
            unitRes = await EncryptionMigration.migrateUnit(db, currentUnit.id, installationKey);
        }

        setMigrationStatus(t('supervisor.settings_modal.migration_done').replace('{n}', String(coreRes.success + unitRes.success)).replace('{s}', String(coreRes.skipped + unitRes.skipped)));
    } catch (err) {
      console.error('[MIGRATION] Critical failure', err);
      setError(t('supervisor.settings_modal.migration_error'));
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

  const NumberStepper = ({ value, onChange, label }: { value: number, onChange: (v: number) => void, label: string }) => (
    <div className="flex-col" style={{ gap: '4px' }}>
       <label className="station-label">{label}</label>
       <div className="flex-row" style={{ gap: '8px', alignItems: 'center' }}>
          <button className="station-btn secondary tiny" onClick={() => onChange(Math.max(0, value - 1))} style={{ width: '32px', height: '32px', padding: 0 }}>
             <MinusIcon size={14} />
          </button>
          <input 
            type="number" 
            className="station-input" 
            value={value}
            onChange={(e) => onChange(Number(e.target.value))}
            style={{ textAlign: 'center', fontWeight: 900, flex: 1 }}
          />
          <button className="station-btn secondary tiny" onClick={() => onChange(value + 1)} style={{ width: '32px', height: '32px', padding: 0 }}>
             <PlusIcon size={14} />
          </button>
       </div>
    </div>
  );

  return (
    <div className="station-modal-overlay fade-in">
      <div className="station-modal">
        <header className="station-modal-header">
          <div className="flex-row" style={{ alignItems: 'center', gap: '12px' }}>
            <CogIcon size={20} color="var(--primary-color)" />
            <h2 className="station-form-section-title" style={{ margin: 0 }}>{t('supervisor.settings_title').toUpperCase()}</h2>
          </div>
          <button className="station-btn secondary tiny" onClick={onClose}>
            <XIcon size={18} />
          </button>
        </header>

        <div className="station-modal-content" style={{ gap: '16px', display: 'flex', flexDirection: 'column' }}>
          
          {error && (
             <div className="station-registry-sync-header" style={{ borderColor: 'var(--status-err)', background: 'rgba(var(--status-err-rgb), 0.1)' }}>
                <div className="flex-row" style={{ gap: '8px', alignItems: 'center' }}>
                   <AlertTriangleIcon size={16} color="var(--status-err)" />
                   <span className="station-title-main" style={{ color: 'var(--status-err)' }}>[ERR] {error.toUpperCase()}</span>
                </div>
             </div>
          )}
          
          {/* CORPORATE IDENTITY */}
           <section className="station-card full" style={{ padding: '20px', gap: '16px' }}>
              <div className="flex-row" style={{ gap: '10px', opacity: 0.6, marginBottom: '4px' }}>
                 <BuildingIcon size={14} />
                 <h3 className="station-form-section-title">{t('supervisor.corporate_header').toUpperCase()}</h3>
              </div>
              
              <div className="flex-col" style={{ gap: '16px' }}>
                  <div className="flex-col" style={{ gap: '4px' }}>
                         <label className="station-label">{t('supervisor.plant_name')}</label>
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
                      <div className="flex-col" style={{ gap: '4px' }}>
                         <label className="station-label">{t('supervisor.logo_load')}</label>
                         <div className="flex-row" style={{ gap: '16px', alignItems: 'center' }}>
                             {config.corporate.logoBase64 && (
                                 <img src={config.corporate.logoBase64} alt="logo" style={{ height: '32px', background: '#fff', padding: '4px', borderRadius: '4px', border: '1px solid var(--border-color)' }} />
                             )}
                             <label className="station-btn station-btn-primary tiny clickable" style={{ gap: '8px' }}>
                                <UploadIcon size={14} />
                                <span>{t('supervisor.settings_modal.btn_upload') || 'UPLOAD'}</span>
                                <input type="file" accept="image/*" onChange={handleLogoUpload} style={{ display: 'none' }} />
                             </label>
                             {config.corporate.logoBase64 && (
                                <button className="station-btn secondary tiny" onClick={() => setConfig({...config, corporate: {...config.corporate, logoBase64: undefined}})}>
                                   <XIcon size={12} />
                                </button>
                             )}
                         </div>
                      </div>
                  </div>
               </section>

              {/* HEALTH */}
              <section className="station-card full" style={{ padding: '20px', gap: '16px' }}>
                 <div className="flex-row" style={{ gap: '10px', opacity: 0.6, marginBottom: '4px' }}>
                    <AlertTriangleIcon size={14} />
                    <h3 className="station-form-section-title">{t('supervisor.settings_modal.health_limits').toUpperCase()}</h3>
                 </div>
                 <NumberStepper 
                    label={t('supervisor.settings_modal.qa_breaks_warn')}
                    value={config.health.qaBreaksWarn}
                    onChange={(v) => setConfig({ ...config, health: { ...config.health, qaBreaksWarn: v } })}
                 />
                 <NumberStepper 
                    label={t('supervisor.settings_modal.qa_breaks_crit')}
                    value={config.health.qaBreaksCritical}
                    onChange={(v) => setConfig({ ...config, health: { ...config.health, qaBreaksCritical: v } })}
                 />
              </section>

              {/* SECURITY */}
              <section className="station-card full" style={{ padding: '20px', gap: '16px' }}>
                 <div className="flex-row" style={{ gap: '10px', opacity: 0.6, marginBottom: '4px' }}>
                    <ShieldCheckIcon size={14} />
                    <h3 className="station-form-section-title">{t('supervisor.settings_modal.sec_policies').toUpperCase()}</h3>
                 </div>
                 <NumberStepper 
                    label={t('supervisor.settings_modal.auth_fail_warn')}
                    value={config.security.securityThresholds.failedAuthLow}
                    onChange={(v) => setConfig({ ...config, security: { ...config.security, securityThresholds: { ...config.security.securityThresholds, failedAuthLow: v } } })}
                 />
                 <NumberStepper 
                    label={t('supervisor.settings_modal.auth_fail_alrt')}
                    value={config.security.securityThresholds.failedAuthHigh}
                    onChange={(v) => setConfig({ ...config, security: { ...config.security, securityThresholds: { ...config.security.securityThresholds, failedAuthHigh: v } } })}
                 />
              </section>

              {/* MAPPING POLICY */}
              <section className="station-card full" style={{ padding: '20px', gap: '16px' }}>
                 <div className="flex-row" style={{ gap: '10px', opacity: 0.6, marginBottom: '4px' }}>
                    <MapIcon size={14} />
                    <h3 className="station-form-section-title">{t('letter.ui.mapping_brain').toUpperCase()}</h3>
                 </div>
                 <div className="flex-col" style={{ gap: '4px' }}>
                    <div className="flex-row" style={{ justifyContent: 'space-between', marginBottom: '12px' }}>
                       <label className="station-label">{t('supervisor.settings_modal.min_coverage')}</label>
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
                      style={{ cursor: 'pointer', accentColor: 'var(--primary-color)', padding: 0, height: '4px' }}
                    />
                 </div>
              </section>

               {/* AT-REST ENCRYPTION STATUS & MIGRATION */}
                <section className="station-card full" style={{ padding: '20px', gap: '16px', border: '1px solid var(--primary-color)', background: 'rgba(var(--primary-color-rgb), 0.05)' }}>
                   <div className="flex-row" style={{ gap: '10px' }}>
                      <LockIcon size={14} color="var(--primary-color)" />
                      <h3 className="station-form-section-title" style={{ color: 'var(--primary-color)', marginBottom: '4px' }}>{t('supervisor.settings_modal.seg_era_6').toUpperCase()}</h3>
                   </div>
                   <div className="flex-row" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
                         <div className="flex-col">
                            <span className="station-title-main" style={{ fontSize: '0.8rem' }}>{t('supervisor.settings_modal.status').toUpperCase()}: {installationKey ? t('supervisor.tech_unlocked').toUpperCase() : t('supervisor.tech_locked').toUpperCase()}</span>
                            <span className="station-registry-item-meta">{t('supervisor.settings_modal.aes_gcm_active')}</span>
                         </div>
                         <button 
                           className="station-btn station-btn-primary small" 
                           disabled={!installationKey || isMigrating}
                           onClick={handleMigration}
                         >
                           {isMigrating ? <RefreshCwIcon size={14} className="spin" /> : <RefreshCwIcon size={14} />}
                           <span>{t('supervisor.settings_modal.btn_migrate').toUpperCase()}</span>
                         </button>
                   </div>
                  {migrationStatus && (
                     <div className="station-shimmer-text" style={{ fontSize: '0.75rem', color: 'var(--primary-color)', fontWeight: 700, marginTop: '8px' }}>
                        {migrationStatus.toUpperCase()}
                     </div>
                  )}
                </section>

        </div>

         <footer className="station-modal-footer">
             <button className="station-btn secondary tiny" onClick={() => TelemetryConfigService.resetToDefaults().then(() => TelemetryConfigService.loadConfig().then(setConfig))}>
                 {t('supervisor.settings_modal.btn_reset').toUpperCase()}
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
