'use client';

import React, { useState } from 'react';
import { useLanguage } from '@/lib/context/LanguageContext';
import { EtlGlobalSettings } from '@/lib/types/etl.types';
import { XIcon } from '@/components/common/Icons';

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
      <div 
        className="station-modal" 
        style={{ maxWidth: '600px', padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }} 
        onClick={(e) => e.stopPropagation()}
      >
        <header className="station-registry-header" style={{ cursor: 'default' }}>
          <h2 className="station-registry-item-name" style={{ fontSize: '1rem' }}>AJUSTES ETL CORE</h2>
          <button className="station-btn" style={{ border: 'none', padding: '4px' }} onClick={onClose}>
            <XIcon size={20} />
          </button>
        </header>

        <div className="station-form-grid" style={{ padding: '24px' }}>
          <div className="station-form-field full">
            <label className="station-label">{t('etl.default_path')}:</label>
            <div className="flex-row" style={{ gap: '8px' }}>
              <input 
                type="text" 
                className="station-input" 
                value={settings.defaultPath}
                onChange={(e) => setSettings({ ...settings, defaultPath: e.target.value })}
              />
              <button className="station-btn">...</button>
            </div>
          </div>

          <div className="station-form-field full">
            <label className="station-label">Idioma del Sistema:</label>
            <select 
              className="station-select"
              value={settings.language}
              onChange={(e) => setSettings({ ...settings, language: e.target.value })}
            >
              <option value="es">es-ES (Español)</option>
              <option value="en">en-US (English)</option>
              <option value="fr">fr-FR (Français)</option>
              <option value="de">de-DE (Deutsch)</option>
            </select>
          </div>

          <div className="station-form-field">
            <label className="station-label">{t('etl.default_encoding')}:</label>
            <select 
              className="station-select"
              value={settings.defaultEncoding}
              onChange={(e) => setSettings({ ...settings, defaultEncoding: e.target.value })}
            >
              <option value="utf-8">UTF-8</option>
              <option value="windows-1252">Windows-1252</option>
            </select>
          </div>

          <div className="station-form-field">
            <label className="station-label">{t('etl.default_chunk')}:</label>
            <input 
              type="number" 
              className="station-input"
              value={settings.defaultChunkSize}
              onChange={(e) => setSettings({ ...settings, defaultChunkSize: parseInt(e.target.value) || 0 })}
            />
          </div>
        </div>

        <footer style={{ padding: '24px', borderTop: '1px solid var(--border-color)', display: 'flex', justifyContent: 'flex-end', gap: '16px' }}>
          <button className="station-btn" onClick={onClose}>
            {t('common.cancel')}
          </button>
          <button className="station-btn station-btn-primary" style={{ padding: '0 24px' }} onClick={handleSave}>
            {t('common.save')}
          </button>
        </footer>
      </div>
    </div>
  );
};

export default EtlSettingsModal;
