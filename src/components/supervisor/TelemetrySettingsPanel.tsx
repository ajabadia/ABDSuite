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
  CogIcon
} from '@/components/common/Icons';

interface TelemetrySettingsPanelProps {
  onClose: () => void;
}

export const TelemetrySettingsPanel: React.FC<TelemetrySettingsPanelProps> = ({ onClose }) => {
  const { t } = useLanguage();
  const [config, setConfig] = useState<TelemetryConfig | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    TelemetryConfigService.loadConfig().then(setConfig);
  }, []);

  const handleSave = async () => {
    if (!config) return;
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
    <div className="station-dialog-overlay animate-fade-in">
      <div className="station-dialog" style={{ width: '600px', maxHeight: '90vh' }}>
        <header className="station-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <CogIcon size={20} />
            <h2 className="station-title">{t('supervisor.settings_title')}</h2>
          </div>
          <button className="station-btn secondary" onClick={onClose} style={{ padding: '6px' }}>
            <XIcon size={18} />
          </button>
        </header>

        <div className="station-dialog-content" style={{ overflowY: 'auto' }}>
          
          {/* CORPORATE IDENTITY */}
          <section className="settings-section">
             <div className="section-header">
                <BuildingIcon size={16} />
                <h3>{t('supervisor.corporate_header')}</h3>
             </div>
             <div className="form-group">
                <label>{t('supervisor.plant_name')}</label>
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
             <div className="form-group">
                <label>{t('supervisor.logo_load')}</label>
                <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                    {config.corporate.logoBase64 && (
                        <img src={config.corporate.logoBase64} alt="logo" style={{ height: '40px', background: 'white', padding: '4px', borderRadius: '4px' }} />
                    )}
                    <input type="file" accept="image/*" onChange={handleLogoUpload} style={{ fontSize: '0.7rem' }} />
                </div>
             </div>
          </section>

          {/* HEALTH THRESHOLDS */}
          <section className="settings-section">
             <div className="section-header">
                <AlertTriangleIcon size={16} />
                <h3>{t('supervisor.thresholds')} - CALIDAD & SALUD</h3>
             </div>
             <div className="grid-2">
                <div className="form-group">
                   <label>WARN: BREAKS QA</label>
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
                <div className="form-group">
                   <label>CRITICAL: BREAKS QA</label>
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
             </div>
          </section>

          {/* SECURITY THRESHOLDS */}
          <section className="settings-section">
             <div className="section-header">
                <ShieldCheckIcon size={16} />
                <h3>{t('supervisor.thresholds')} - SEGURIDAD</h3>
             </div>
             <div className="grid-2">
                <div className="form-group">
                   <label>FAILED LOGINS (WARN)</label>
                   <input 
                     type="number" 
                     className="station-input" 
                     value={config.security.failedLoginsWarn}
                     onChange={(e) => setConfig({
                       ...config, 
                       security: { ...config.security, failedLoginsWarn: Number(e.target.value) }
                     })}
                   />
                </div>
                <div className="form-group">
                   <label>FAILED LOGINS (CRITICAL)</label>
                   <input 
                     type="number" 
                     className="station-input" 
                     value={config.security.failedLoginsCritical}
                     onChange={(e) => setConfig({
                       ...config, 
                       security: { ...config.security, failedLoginsCritical: Number(e.target.value) }
                     })}
                   />
                </div>
                <div className="form-group">
                   <label>MAX PIN ATTEMPTS</label>
                   <input 
                     type="number" 
                     className="station-input" 
                     value={config.security.maxPinAttempts}
                     onChange={(e) => setConfig({
                       ...config, 
                       security: { ...config.security, maxPinAttempts: Number(e.target.value) }
                     })}
                   />
                </div>
                <div className="form-group">
                   <label>PIN COOLDOWN (MIN)</label>
                   <input 
                     type="number" 
                     className="station-input" 
                     value={config.security.pinCooldownMinutes}
                     onChange={(e) => setConfig({
                       ...config, 
                       security: { ...config.security, pinCooldownMinutes: Number(e.target.value) }
                     })}
                   />
                </div>
                <div className="form-group">
                   <label>MAX MFA ATTEMPTS</label>
                   <input 
                     type="number" 
                     className="station-input" 
                     value={config.security.maxMfaAttempts}
                     onChange={(e) => setConfig({
                       ...config, 
                       security: { ...config.security, maxMfaAttempts: Number(e.target.value) }
                     })}
                   />
                </div>
                <div className="form-group">
                   <label>MFA COOLDOWN (MIN)</label>
                   <input 
                     type="number" 
                     className="station-input" 
                     value={config.security.mfaCooldownMinutes}
                     onChange={(e) => setConfig({
                       ...config, 
                       security: { ...config.security, mfaCooldownMinutes: Number(e.target.value) }
                     })}
                   />
                </div>
             </div>
          </section>

        </div>

        <footer className="station-dialog-footer" style={{ justifyContent: 'space-between' }}>
            <button className="station-btn secondary" onClick={() => TelemetryConfigService.resetToDefaults().then(() => TelemetryConfigService.loadConfig().then(setConfig))}>
                RESTAURAR DEFECTOS
            </button>
            <button className="station-btn primary" onClick={handleSave} disabled={isSaving}>
                <SaveIcon size={18} />
                <span>{isSaving ? '...' : t('supervisor.save_settings')}</span>
            </button>
        </footer>
      </div>

      <style jsx>{`
        .settings-section {
          background: rgba(255,255,255,0.02);
          border: 1px solid rgba(255,255,255,0.05);
          border-radius: 8px;
          padding: 16px;
          margin-bottom: 24px;
        }
        .section-header {
           display: flex;
           align-items: center;
           gap: 8px;
           margin-bottom: 16px;
           border-bottom: 1px solid rgba(255,255,255,0.05);
           padding-bottom: 8px;
        }
        .section-header h3 { font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.05rem; opacity: 0.7; }
        .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
        .form-group label { display: block; font-size: 0.65rem; opacity: 0.5; margin-bottom: 4px; text-transform: uppercase; }
      `}</style>
    </div>
  );
};
