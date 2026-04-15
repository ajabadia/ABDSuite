'use client';

import React, { useState } from 'react';
import { EtlGlobalSettings } from '@/lib/types/etl.types';
import { IDIOMAS_ISO } from '@/lib/constants/letter.constants';
import { SaveIcon, XIcon } from '@/components/common/Icons';

interface PreferencesModalProps {
  settings: EtlGlobalSettings;
  onSave: (s: EtlGlobalSettings) => void;
  onClose: () => void;
}

const PreferencesModal: React.FC<PreferencesModalProps> = ({ settings, onSave, onClose }) => {
  const [formData, setFormData] = useState<EtlGlobalSettings>(settings);

  const handlePickPath = async () => {
    try {
      const handle = await (window as any).showDirectoryPicker();
      setFormData({ ...formData, defaultPath: handle.name });
    } catch { }
  };

  return (
    <div className="station-modal-overlay">
      <div className="station-modal" style={{ width: '600px' }}>
        <header className="station-console-header">
          <div style={{ fontWeight: 900 }}>SISTEMA / PREFERENCIAS</div>
          <button className="station-btn" style={{ padding: '5px', background: 'transparent', boxShadow: 'none' }} onClick={onClose}>
            <XIcon size={20} />
          </button>
        </header>

        <div style={{ padding: '20px' }}>
           <section className="station-card">
             <span className="station-card-title">Configuración Global</span>
             
             <div style={{ marginBottom: '20px' }}>
                <label className="station-label">Ruta de salida por defecto:</label>
                <div className="flex-row" style={{ gap: '10px' }}>
                   <input className="station-input" value={formData.defaultPath} readOnly />
                   <button className="station-btn" onClick={handlePickPath}>...</button>
                </div>
             </div>

             <div style={{ marginBottom: '20px' }}>
                <label className="station-label">Idioma de la interfaz (JSON):</label>
                <select 
                  className="station-select"
                  value={formData.language}
                  onChange={e => setFormData({...formData, language: e.target.value})}
                >
                  {IDIOMAS_ISO.map(i => <option key={i.globalId} value={i.globalId}>{i.label}</option>)}
                </select>
             </div>

             <div className="grid-2">
                <div>
                  <label className="station-label">Codificación:</label>
                  <select className="station-select" value={formData.encoding} onChange={e => setFormData({...formData, encoding: e.target.value})}>
                    <option value="utf-8">UTF-8</option>
                    <option value="iso-8859-1">ISO-8859-1</option>
                  </select>
                </div>
                <div>
                  <label className="station-label">Chunk Size:</label>
                  <input type="number" className="station-input" value={formData.defaultChunkSize} onChange={e => setFormData({...formData, defaultChunkSize: Number(e.target.value)})} />
                </div>
             </div>
           </section>
        </div>

        <footer style={{ padding: '20px', borderTop: 'var(--border-thick) solid var(--border-color)', display: 'flex', justifyContent: 'flex-end', gap: '20px' }}>
           <button className="station-btn" onClick={onClose}>CANCELAR</button>
           <button className="station-btn station-btn-primary" onClick={() => onSave(formData)}>
              <SaveIcon size={16} /> GUARDAR PREFERENCIAS
           </button>
        </footer>
      </div>
    </div>
  );
};

export default PreferencesModal;
