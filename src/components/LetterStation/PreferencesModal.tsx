'use client';

import React, { useState } from 'react';
import { useLanguage } from '@/lib/context/LanguageContext';
import { EtlGlobalSettings } from '@/lib/types/etl.types';
import { IDIOMAS_ISO } from '@/lib/constants/letter.constants';
import { SaveIcon, XIcon } from '@/components/common/Icons';

interface PreferencesModalProps {
  settings: EtlGlobalSettings;
  onSave: (s: EtlGlobalSettings) => void;
  onClose: () => void;
}

const PreferencesModal: React.FC<PreferencesModalProps> = ({ settings, onSave, onClose }) => {
  const { t } = useLanguage();
  const [formData, setFormData] = useState<EtlGlobalSettings>(settings);

  const handlePickPath = async () => {
    try {
      const handle = await (window as any).showDirectoryPicker();
      setFormData({ ...formData, defaultPath: handle.name });
    } catch { }
  };

  return (
    <div className="station-modal-overlay" onClick={onClose}>
      <div 
        className="station-modal" 
        style={{ width: '600px', padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}
        onClick={e => e.stopPropagation()}
      >
        <header style={{ padding: '16px 24px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ fontSize: '1rem', fontWeight: 800 }}>{t('etl.preferences').toUpperCase()}</h2>
          <button className="station-btn" style={{ border: 'none', padding: '4px' }} onClick={onClose}>
            <XIcon size={20} />
          </button>
        </header>

        <div style={{ padding: '24px' }}>
           <section className="station-card">
             <h3 className="station-form-section-title">{t('settings.title').toUpperCase()}</h3>
             
             <div className="flex-col" style={{ gap: '12px' }}>
                <div className="flex-col" style={{ gap: '4px' }}>
                   <label className="station-label">{t('etl.default_path').toUpperCase()}:</label>
                   <div style={{ display: 'flex', gap: '8px' }}>
                      <input className="station-input" value={formData.defaultPath} readOnly style={{ opacity: 0.7 }} />
                      <button className="station-btn" onClick={handlePickPath}>...</button>
                   </div>
                </div>

                <div className="flex-col" style={{ gap: '4px' }}>
                   <label className="station-label">{t('ui.lang_select').toUpperCase()}:</label>
                   <select 
                     className="station-select"
                     value={formData.language}
                     onChange={e => setFormData({...formData, language: e.target.value})}
                   >
                     {IDIOMAS_ISO.map(i => <option key={i.globalId} value={i.globalId}>{i.label}</option>)}
                   </select>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                   <div className="flex-col" style={{ gap: '4px' }}>
                     <label className="station-label">{t('etl.default_encoding').toUpperCase()}:</label>
                     <select className="station-select" value={formData.defaultEncoding} onChange={e => setFormData({...formData, defaultEncoding: e.target.value})}>
                       <option value="utf-8">UTF-8</option>
                       <option value="iso-8859-1">ISO-8859-1</option>
                     </select>
                   </div>
                   <div className="flex-col" style={{ gap: '4px' }}>
                     <label className="station-label">{t('etl.default_chunk').toUpperCase()}:</label>
                     <input type="number" className="station-input" value={formData.defaultChunkSize} onChange={e => setFormData({...formData, defaultChunkSize: Number(e.target.value)})} />
                   </div>
                </div>
             </div>
           </section>
        </div>

        <footer style={{ padding: '24px', borderTop: '1px solid var(--border-color)', display: 'flex', justifyContent: 'flex-end', gap: '16px', background: 'var(--surface-color)' }}>
           <button className="station-btn" onClick={onClose}>{t('common.cancel').toUpperCase()}</button>
           <button className="station-btn station-btn-primary" onClick={() => onSave(formData)}>
              <SaveIcon size={16} /> {t('common.save').toUpperCase()}
           </button>
        </footer>
      </div>
    </div>
  );
};

export default PreferencesModal;
