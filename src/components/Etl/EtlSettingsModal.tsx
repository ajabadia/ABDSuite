'use client';

import React, { useState } from 'react';
import { useLanguage } from '@/lib/context/LanguageContext';
import { EtlGlobalSettings } from '@/lib/types/etl.types';

interface EtlSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (settings: EtlGlobalSettings) => void;
  initialSettings: EtlGlobalSettings;
}

const EtlSettingsModal: React.FC<EtlSettingsModalProps> = ({ 
  isOpen, 
  onClose, 
  onSave, 
  initialSettings 
}) => {
  const { t, language: appLanguage, setLanguage } = useLanguage();
  const [settings, setSettings] = useState<EtlGlobalSettings>(initialSettings);

  if (!isOpen) return null;

  const handleSave = () => {
    if (settings.language !== appLanguage) {
      setLanguage(settings.language as any);
    }
    onSave(settings);
    onClose();
  };

  return (
    <div className="station-modal-overlay" onClick={onClose}>
      <div className="station-modal" style={{ maxWidth: '600px' }} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: 'var(--border-thin) solid var(--border-color)', paddingBottom: '10px' }}>
          <span style={{ fontWeight: 900, fontSize: '1.2rem' }}>[PREFERENCES_CORE]</span>
          <button className="station-btn" onClick={onClose} style={{ padding: '2px 8px', boxShadow: 'none' }}>X</button>
        </div>

        <div className="flex-col" style={{ gap: '20px' }}>
          <div className="flex-col" style={{ gap: '10px' }}>
            <label className="station-label">{t('etl.default_path')}:</label>
            <div className="flex-row" style={{ gap: '5px' }}>
              <input 
                type="text" 
                className="station-input" 
                value={settings.defaultPath}
                onChange={(e) => setSettings({ ...settings, defaultPath: e.target.value })}
              />
              <button className="station-btn" style={{ padding: '8px 12px', boxShadow: 'none' }}>...</button>
            </div>
          </div>

          <div className="flex-col" style={{ gap: '10px' }}>
            <label className="station-label">SYSTEM_LANGUAGE:</label>
            <select 
              className="station-select"
              value={settings.language}
              onChange={(e) => setSettings({ ...settings, language: e.target.value })}
            >
              <option value="es">es-ES (ESPAÑOL)</option>
              <option value="en">en-US (ENGLISH)</option>
              <option value="fr">fr-FR (FRANÇAIS)</option>
              <option value="de">de-DE (DEUTSCH)</option>
            </select>
          </div>

          <div className="grid-2">
            <div className="flex-col" style={{ gap: '10px' }}>
              <label className="station-label">{t('etl.default_encoding')}:</label>
              <select 
                className="station-select"
                value={settings.defaultEncoding}
                onChange={(e) => setSettings({ ...settings, defaultEncoding: e.target.value })}
              >
                <option value="utf-8">UTF-8</option>
                <option value="windows-1252">WINDOWS-1252</option>
              </select>
            </div>

            <div className="flex-col" style={{ gap: '10px' }}>
              <label className="station-label">{t('etl.default_chunk')}:</label>
              <input 
                type="number" 
                className="station-input"
                value={settings.defaultChunkSize}
                onChange={(e) => setSettings({ ...settings, defaultChunkSize: parseInt(e.target.value) || 0 })}
              />
            </div>
          </div>
        </div>

        <div className="flex-row" style={{ justifyContent: 'flex-end', gap: '15px', marginTop: '10px' }}>
          <button className="station-btn" onClick={onClose} style={{ boxShadow: 'none' }}>
            {t('common.cancel')}
          </button>
          <button className="station-btn station-btn-primary" onClick={handleSave}>
            {t('common.save')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default EtlSettingsModal;
