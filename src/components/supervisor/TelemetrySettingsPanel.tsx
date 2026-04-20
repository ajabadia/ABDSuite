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
  LockIcon
} from '@/components/common/Icons';
import { useWorkspace } from '@/lib/context/WorkspaceContext';
import { EncryptionMigration } from '@/lib/utils/EncryptionMigration';
import { db } from '@/lib/db/db';

interface TelemetrySettingsPanelProps {
  onClose: () => void;
}

export const TelemetrySettingsPanel: React.FC<TelemetrySettingsPanelProps> = ({ onClose }) => {
  const { t } = useLanguage();
  const { requestStepUp, installationKey, currentUnit } = useWorkspace();
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
      await TelemetryConfigService.saveConfig(config);
      setTimeout(onClose, 500); // UI feedback
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
    <div className="station-modal-overlay">
      <div className="station-modal" style={{ maxWidth: '600px' }}>
        <header className="station-modal-header technical-header-small">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <CogIcon size={20} color="var(--primary-color)" />
            <h2 className="station-title" style={{ fontSize: '0.75rem', letterSpacing: '2px', fontWeight: 900, opacity: 0.5 }}>{t('supervisor.settings_title').toUpperCase()}</h2>
          </div>
          <button className="station-btn secondary tiny" onClick={onClose}>
            <XIcon size={18} />
          </button>
        </header>

        <div className="station-modal-content technical-content" style={{ background: 'var(--bg-color)' }}>
          
          {error && (
             <div className="alert-box-technical error" style={{ background: 'rgba(239, 68, 68, 0.1)', color: 'var(--status-err)', border: '1px solid var(--status-err)', marginBottom: '20px', padding: '12px', fontSize: '0.7rem' }}>
                <div className="flex-row" style={{ gap: '8px', alignItems: 'center' }}>
                   <AlertTriangleIcon size={16} />
                   <span style={{ fontWeight: 800 }}>[ERR] {error.toUpperCase()}</span>
                </div>
             </div>
          )}

          {/* CORPORATE IDENTITY */}
          <section className="settings-section-technical">
             <div className="section-header-technical">
                <BuildingIcon size={14} />
                <h3>{t('supervisor.corporate_header').toUpperCase()}</h3>
             </div>
             <div className="form-group-technical">
                <label className="label-technical">{t('supervisor.plant_name').toUpperCase()}</label>
                <input 
                  type="text" 
                  className="technical-input" 
                  value={config.corporate.plantName}
                  onChange={(e) => setConfig({
                    ...config,
                    corporate: { ...config.corporate, plantName: e.target.value }
                  })}
                />
             </div>
             <div className="form-group-technical" style={{ marginTop: '16px' }}>
                <label className="label-technical">{t('supervisor.logo_load').toUpperCase()}</label>
                <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                    {config.corporate.logoBase64 && (
                        <img src={config.corporate.logoBase64} alt="logo" style={{ height: '40px', background: 'white', padding: '4px', borderRadius: '4px', border: '1px solid var(--border-color)' }} />
                    )}
                    <input type="file" accept="image/*" onChange={handleLogoUpload} style={{ fontSize: '0.6rem', fontFamily: 'var(--font-mono)' }} />
                </div>
             </div>
          </section>

          {/* HEALTH THRESHOLDS */}
          <section className="settings-section-technical">
             <div className="section-header-technical">
                <AlertTriangleIcon size={14} />
                <h3>{t('supervisor.thresholds').toUpperCase()} - QA_SALUD</h3>
             </div>
             <div className="grid-2-technical">
                <div className="form-group-technical">
                   <label className="label-technical">WARN: BREAKS QA</label>
                   <input 
                     type="number" 
                     className="technical-input" 
                     value={config.health.qaBreaksWarn}
                     onChange={(e) => setConfig({
                       ...config, 
                       health: { ...config.health, qaBreaksWarn: Number(e.target.value) }
                     })}
                   />
                </div>
                <div className="form-group-technical">
                   <label className="label-technical">CRITICAL: BREAKS QA</label>
                   <input 
                     type="number" 
                     className="technical-input" 
                     value={config.health.qaBreaksCritical}
                     onChange={(e) => setConfig({
                       ...config, 
                       health: { ...config.health, qaBreaksCritical: Number(e.target.value) }
                     })}
                   />
                </div>
             </div>
          </section>

          {/* SECURITY THRESHOLDS & HEALTH */}
          <section className="settings-section-technical">
             <div className="section-header-technical">
                <ShieldCheckIcon size={14} />
                <h3>{t('supervisor.thresholds').toUpperCase()} - SEC_POLICY</h3>
             </div>
             <div className="grid-2-technical">
                <div className="form-group-technical">
                   <label className="label-technical">AUTH_FAIL (LOW)</label>
                   <input 
                     type="number" 
                     className="technical-input" 
                     value={config.security.securityThresholds.failedAuthLow}
                     onChange={(e) => setConfig({
                       ...config, 
                       security: { ...config.security, securityThresholds: { ...config.security.securityThresholds, failedAuthLow: Number(e.target.value) } }
                     })}
                   />
                </div>
                <div className="form-group-technical">
                   <label className="label-technical">AUTH_FAIL (ALERT)</label>
                   <input 
                     type="number" 
                     className="technical-input" 
                     value={config.security.securityThresholds.failedAuthHigh}
                     onChange={(e) => setConfig({
                       ...config, 
                       security: { ...config.security, securityThresholds: { ...config.security.securityThresholds, failedAuthHigh: Number(e.target.value) } }
                     })}
                   />
                </div>
                <div className="form-group-technical">
                   <label className="label-technical">RBAC_CHG (ATTN)</label>
                   <input 
                     type="number" 
                     className="technical-input" 
                     value={config.security.securityThresholds.rbacChangesAttention}
                     onChange={(e) => setConfig({
                       ...config, 
                       security: { ...config.security, securityThresholds: { ...config.security.securityThresholds, rbacChangesAttention: Number(e.target.value) } }
                     })}
                   />
                </div>
                <div className="form-group-technical">
                   <label className="label-technical">DATA_ERR (ATTN)</label>
                   <input 
                     type="number" 
                     className="technical-input" 
                     value={config.security.securityThresholds.dataOpsErrorAttention}
                     onChange={(e) => setConfig({
                       ...config, 
                       security: { ...config.security, securityThresholds: { ...config.security.securityThresholds, dataOpsErrorAttention: Number(e.target.value) } }
                     })}
                   />
                </div>
             </div>

             <div className="flex-col industrial-features-box" style={{ marginTop: '20px', gap: '12px', padding: '16px', background: 'var(--surface-color)', border: '1px solid var(--border-color)', borderRadius: '2px' }}>
                <span style={{ fontSize: '0.6rem', fontWeight: 900, opacity: 0.3, letterSpacing: '1px' }}>INDUSTRIAL_UI_FLAGS_ERA_6</span>
                <div className="flex-row" style={{ gap: '24px' }}>
                   <label className="technical-checkbox-container">
                      <input 
                        type="checkbox" 
                        checked={config.security.uiFeatures.letterWizardEnabled}
                        onChange={(e) => setConfig({
                          ...config,
                          security: { ...config.security, uiFeatures: { ...config.security.uiFeatures, letterWizardEnabled: e.target.checked } }
                        })}
                      />
                      <span className="label-technical" style={{ marginLeft: '8px', marginBottom: 0 }}>WIZARD_STATION</span>
                   </label>
                   <label className="technical-checkbox-container">
                      <input 
                        type="checkbox" 
                        checked={config.security.uiFeatures.mappingMobileLayoutEnabled}
                        onChange={(e) => setConfig({
                          ...config,
                          security: { ...config.security, uiFeatures: { ...config.security.uiFeatures, mappingMobileLayoutEnabled: e.target.checked } }
                        })}
                      />
                      <span className="label-technical" style={{ marginLeft: '8px', marginBottom: 0 }}>MAPPING_MOBILE</span>
                   </label>
                </div>
             </div>
          </section>

           {/* AT-REST ENCRYPTION STATUS & MIGRATION */}
           <section className="settings-section-technical at-rest-highlight">
              <div className="section-header-technical">
                 <LockIcon size={14} color="var(--primary-color)" />
                 <h3 style={{ color: 'var(--primary-color)' }}>SEG_AT_REST_ERA_6</h3>
              </div>
              <div className="flex-col" style={{ gap: '16px' }}>
                 <div className="flex-row" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
                    <div className="flex-col">
                       <span style={{ fontSize: '0.75rem', fontWeight: 800, fontFamily: 'var(--font-mono)' }}>STATUS: {installationKey ? 'UNLOCKED' : 'LOCKED'}</span>
                       <span style={{ fontSize: '0.6rem', opacity: 0.5 }}>AES-GCM INST_KEY_MEMORY_ACTIVE.</span>
                    </div>
                    <button 
                      className={`station-btn primary small ${isMigrating ? 'loading' : ''}`} 
                      disabled={!installationKey || isMigrating}
                      onClick={handleMigration}
                      style={{ padding: '8px 16px', fontSize: '0.65rem', background: 'var(--primary-color)', color: '#000', fontWeight: 900 }}
                    >
                      {isMigrating ? <RefreshCwIcon size={14} className="spin" /> : <RefreshCwIcon size={14} />}
                      <span>MIGRAR_DATOS</span>
                    </button>
                 </div>
                 {migrationStatus && (
                    <div className="status-text-technical" style={{ fontSize: '0.65rem', color: 'var(--primary-color)', fontFamily: 'var(--font-mono)', fontWeight: 700 }}>
                       {migrationStatus.toUpperCase()}
                    </div>
                 )}
              </div>
           </section>

        </div>

        <footer className="station-modal-footer">
            <button className="station-btn secondary tiny" style={{ fontSize: '0.6rem' }} onClick={() => TelemetryConfigService.resetToDefaults().then(() => TelemetryConfigService.loadConfig().then(setConfig))}>
                RESET_DEFAULTS
            </button>
            <button className="station-btn primary tiny" onClick={handleSave} disabled={isSaving} style={{ background: 'var(--primary-color)', color: '#000', padding: '10px 20px' }}>
                <SaveIcon size={18} />
                <span style={{ fontWeight: 900, fontSize: '0.7rem' }}>{isSaving ? '...' : t('supervisor.save_settings').toUpperCase()}</span>
            </button>
        </footer>
      </div>

      <style jsx>{`
        .technical-modal {
           animation: slideUp 0.1s ease-out;
        }
        @keyframes slideUp {
           from { transform: translateY(10px); opacity: 0; }
           to { transform: translateY(0); opacity: 1; }
        }
        .settings-section-technical {
          background: var(--surface-color);
          border: 1px solid var(--border-color);
          border-radius: 4px;
          padding: 20px;
          margin-bottom: 20px;
        }
        .settings-section-technical.at-rest-highlight {
           border: 1px solid var(--primary-color);
           background: rgba(56, 189, 248, 0.05);
        }
        .section-header-technical {
           display: flex;
           align-items: center;
           gap: 10px;
           margin-bottom: 20px;
           opacity: 0.8;
        }
        .section-header-technical h3 { font-size: 0.65rem; text-transform: uppercase; letter-spacing: 2px; font-weight: 900; margin: 0; color: var(--text-primary); }
        .grid-2-technical { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
        .label-technical { 
           display: block; 
           font-size: 0.6rem; 
           opacity: 0.5; 
           margin-bottom: 6px; 
           text-transform: uppercase; 
           letter-spacing: 1px;
           font-weight: 800;
           font-family: var(--font-mono);
        }
        .technical-input {
           background: var(--bg-color) !important;
           border: 1px solid var(--border-color) !important;
           font-family: var(--font-mono) !important;
           font-size: 0.75rem !important;
           color: var(--text-primary) !important;
           padding: 8px 12px;
           width: 100%;
        }
        .technical-checkbox-container {
           display: flex;
           align-items: center;
           cursor: pointer;
        }
      `}</style>
    </div>
  );
};
