'use client';

import React, { useState } from 'react';
import { useLanguage } from '@/lib/context/LanguageContext';
import { EtlPreset, EtlRecordType, EtlField, EtlRecordBehavior } from '@/lib/types/etl.types';
import { SamplePreview } from './SamplePreview';
import { CogIcon, EyeIcon, TrashIcon, ListIcon, XIcon, SaveIcon, UndoIcon, PlayIcon } from '@/components/common/Icons';
import { useRouter } from 'next/navigation';

interface EtlDesignerProps {
  preset: EtlPreset;
  onUpdate: (updated: EtlPreset) => void;
  onSave: () => void;
}

export const EtlDesigner: React.FC<EtlDesignerProps> = ({ preset, onUpdate, onSave }) => {
  const { t } = useLanguage();
  const router = useRouter();
  const [activeRTIndex, setActiveRTIndex] = useState(0);
  const [undoStack, setUndoStack] = useState<string[]>([]);
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [showRTModal, setShowRTModal] = useState(false);
  const [showSampleModal, setShowSampleModal] = useState(false);

  const activeRT = preset.recordTypes[activeRTIndex] || null;

  const handleLaunchExecutor = () => {
    onSave(); // Auto-save before jumping
    router.push(`/etl?view=executor&id=${preset.id}`);
  };

  const snapshot = () => {
    setUndoStack(prev => [...prev.slice(-19), JSON.stringify(preset)]);
  };

  const undo = () => {
    if (undoStack.length === 0) return;
    const last = undoStack[undoStack.length - 1];
    setUndoStack(prev => prev.slice(0, -1));
    onUpdate(JSON.parse(last));
  };

  const updatePreset = (patch: Partial<EtlPreset>) => {
    snapshot();
    onUpdate({ ...preset, ...patch, updatedAt: Date.now() });
  };

  const updateRT = (index: number, patch: Partial<EtlRecordType>) => {
    const newRTs = [...preset.recordTypes];
    newRTs[index] = { ...newRTs[index], ...patch };
    updatePreset({ recordTypes: newRTs });
  };

  const addRT = () => {
    const newRT: EtlRecordType = {
      name: `TIPO_${preset.recordTypes.length + 1}`,
      trigger: '',
      triggerStart: 0,
      behavior: 'DATA',
      range: '',
      fields: []
    };
    updatePreset({ recordTypes: [...preset.recordTypes, newRT] });
    setActiveRTIndex(preset.recordTypes.length);
  };

  const removeRecordType = () => {
    if (!activeRT) return;
    if (!confirm('¿Eliminar este tipo de registro?')) return;
    const newRTs = preset.recordTypes.filter((_, i) => i !== activeRTIndex);
    updatePreset({ recordTypes: newRTs });
    setActiveRTIndex(Math.max(0, activeRTIndex - 1));
  };

  const addField = () => {
    if (!activeRT) return;
    const newField: EtlField = { 
      id: `f_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      name: 'NUEVO_CAMPO', start: 0, length: 1 
    };
    updateRT(activeRTIndex, { fields: [...activeRT.fields, newField] });
  };

  const updateField = (id: string, patch: Partial<EtlField>) => {
    if (!activeRT) return;
    const newFields = activeRT.fields.map(f => f.id === id ? { ...f, ...patch } : f);
    updateRT(activeRTIndex, { fields: newFields });
  };

  const removeField = (id: string) => {
    if (!activeRT) return;
    updateRT(activeRTIndex, { fields: activeRT.fields.filter(f => f.id !== id) });
  };

  return (
    <div className="flex-col" style={{ gap: '24px', height: '100%' }}>
      
      {/* Cabecera del Preset Industrial */}
      <div className="station-card">
        <div className="station-panel-header" style={{ borderBottom: 'none', paddingBottom: 0, marginBottom: 0 }}>
          <div className="flex-col" style={{ gap: '4px' }}>
            <h2 className="station-title-main" style={{ margin: 0 }}>{preset.name || t('etl.no_name')}</h2>
            <div className="flex-row" style={{ alignItems: 'center', gap: '12px' }}>
               <span style={{ opacity: 0.5, fontSize: '0.75rem', fontWeight: 700 }}>V{preset.version}</span>
               <span className={`station-badge ${preset.isActive ? 'station-badge-green' : 'station-badge-orange'}`}>
                  {preset.isActive ? 'ACTIVO' : 'BORRADOR'}
               </span>
            </div>
          </div>

          <div className="flex-row" style={{ gap: '12px' }}>
            <button className="station-btn" onClick={undo} disabled={undoStack.length === 0} title="Deshacer"><UndoIcon size={16} /></button>
            <button className="station-btn station-btn-gear" onClick={() => setShowConfigModal(true)}><CogIcon size={16} /> Configuración</button>
            <button className="station-btn station-btn-primary" onClick={onSave}><SaveIcon size={16} /> {t('common.save')}</button>
            <button className="station-btn station-btn-primary" onClick={handleLaunchExecutor} style={{ background: 'var(--status-ok)', border: 'none' }}>
              <PlayIcon size={16} /> {t('etl.launch_executor')}
            </button>
          </div>
        </div>

        <div className="station-tech-summary">
          <div className="station-tech-item"><span className="station-tech-label">Lote:</span> {preset.chunkSize}</div>
          <div className="station-tech-item"><span className="station-tech-label">Enc:</span> {preset.encoding?.toUpperCase()}</div>
          <div className="station-tech-item"><span className="station-tech-label">Tipo Pos:</span> {preset.recordTypeStart}</div>
          <div className="station-tech-item"><span className="station-tech-label">Tipo Len:</span> {preset.recordTypeLen}</div>
          <div className="station-tech-item"><span className="station-tech-label">Defecto:</span> {preset.defaultRecordType}</div>
        </div>
      </div>

      <div className="station-editor-area" style={{ gridTemplateColumns: '260px 1fr' }}>
        
        {/* Lista de Registros */}
        <div className="flex-col" style={{ gap: '12px' }}>
          <span className="station-form-section-title">ESTRUCTURA DE DATOS</span>
          <div className="station-card" style={{ padding: '8px', flex: 1, overflowY: 'auto' }}>
            <div className="station-registry-list">
              {preset.recordTypes.map((rt, i) => (
                <div 
                  key={i} 
                  className={`station-registry-item ${activeRTIndex === i ? 'active' : ''}`}
                  onClick={() => setActiveRTIndex(i)}
                >
                  <div className="station-registry-item-left">
                    <div className="station-registry-item-icon">
                      <span className="station-badge station-badge-blue" style={{ minWidth: '24px', padding: '0 4px' }}>{rt.trigger?.substring(0, 1) || 'D'}</span>
                    </div>
                    <div className="station-registry-item-info">
                      <span className="station-registry-item-name">{rt.name}</span>
                      <span className="station-registry-item-meta">{rt.behavior} • {rt.fields.length} campos</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <button className="station-btn station-btn-primary" style={{ marginTop: '12px', width: '100%', height: '40px' }} onClick={addRT}>+ {t('etl.add_rt')}</button>
          </div>
        </div>

        {/* Editor de Campos */}
        <div className="flex-col" style={{ gap: '12px' }}>
          <span className="station-form-section-title">DEFINICIÓN DE CAMPOS</span>
          <div className="station-card" style={{ flex: 1, minHeight: 0, padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            {activeRT ? (
              <>
                <header className="station-registry-header" style={{ padding: '16px 24px', cursor: 'default' }}>
                  <div className="flex-row" style={{ alignItems: 'baseline', gap: '12px' }}>
                    <h4 className="station-registry-item-name" style={{ fontSize: '1rem' }}>{activeRT.name}</h4>
                    <span className="station-badge station-badge-blue">{activeRT.behavior}</span>
                  </div>
                  <div className="flex-row" style={{ gap: '8px' }}>
                    <button className="station-btn" onClick={() => setShowSampleModal(true)} title="Vista Previa"><EyeIcon size={16} /></button>
                    <button className="station-btn station-btn-gear" onClick={() => setShowRTModal(true)} title="Propiedades"><CogIcon size={16} /></button>
                    <button className="station-btn" style={{ color: 'var(--status-err)' }} onClick={removeRecordType} title="Eliminar"><TrashIcon size={16} /></button>
                  </div>
                </header>

                <div className="station-table-container" style={{ border: 'none', borderRadius: 0, flex: 1 }}>
                  <table className="station-table">
                    <thead>
                      <tr>
                        <th style={{ width: '100px', textAlign: 'center' }}>INICIO</th>
                        <th style={{ width: '100px', textAlign: 'center' }}>LONGITUD</th>
                        <th>NOMBRE DEL CAMPO</th>
                        <th style={{ width: '60px' }}></th>
                      </tr>
                    </thead>
                    <tbody>
                      {activeRT.fields.sort((a,b) => a.start - b.start).map((f, idx) => (
                        <tr key={f.id || `f-${idx}`} className={f.length === 0 ? 'station-table-row-warn' : ''}>
                          <td><input type="number" className="station-input" style={{ textAlign: 'center' }} value={f.start} onChange={e => updateField(f.id, { start: parseInt(e.target.value) || 0 })} /></td>
                          <td><input type="number" className="station-input" style={{ textAlign: 'center' }} value={f.length} onChange={e => updateField(f.id, { length: parseInt(e.target.value) || 0 })} /></td>
                          <td><input type="text" className="station-input" value={f.name} onChange={e => updateField(f.id, { name: e.target.value.toUpperCase() })} /></td>
                          <td style={{ textAlign: 'center' }}>
                             <button onClick={() => removeField(f.id)} className="station-btn" style={{ padding: '4px', border: 'none' }}><TrashIcon size={14} style={{ color: 'var(--status-err)' }} /></button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <button className="station-btn station-btn-primary" style={{ margin: '16px', height: '48px' }} onClick={addField}>+ Añadir Campo</button>
              </>
            ) : (
              <div className="station-empty-state">
                <span className="station-shimmer-text">SELECCIONE UN TIPO DE REGISTRO</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modales de Configuración */}
      {showConfigModal && (
        <div className="station-modal-overlay" onClick={() => setShowConfigModal(false)}>
          <div className="station-modal" style={{ maxWidth: '500px' }} onClick={e => e.stopPropagation()}>
            <header className="station-modal-header">
              <h3 className="station-registry-item-name" style={{ fontSize: '1.1rem' }}>CONFIGURACIÓN DEL PRESET</h3>
              <button className="station-btn" style={{ border: 'none', padding: '4px' }} onClick={() => setShowConfigModal(false)}><XIcon size={20} /></button>
            </header>
            <div className="station-modal-content">
              <div className="station-form-grid">
                <div className="station-form-field full">
                  <label className="station-label">Nombre del Preset</label>
                  <input className="station-input" value={preset.name} onChange={e => updatePreset({ name: e.target.value })} />
                </div>
                <div className="station-form-field">
                  <label className="station-label">Versión</label>
                  <input className="station-input" value={preset.version} onChange={e => updatePreset({ version: e.target.value })} />
                </div>
                <div className="station-form-field">
                  <label className="station-label">Tamaño Lote</label>
                  <input type="number" className="station-input" value={preset.chunkSize} onChange={e => updatePreset({ chunkSize: parseInt(e.target.value) || 0 })} />
                </div>
                <div className="station-form-field full">
                  <div className="flex-row" style={{ gap: '12px', marginTop: '8px' }}>
                    <input 
                      type="checkbox" 
                      id="etl-active"
                      checked={preset.isActive !== false} 
                      onChange={e => updatePreset({ isActive: e.target.checked })} 
                    />
                    <label htmlFor="etl-active" className="station-label" style={{ marginBottom: 0 }}>Preset de extracción activo para producción</label>
                  </div>
                </div>
              </div>
            </div>
            <footer className="station-modal-footer">
               <button className="station-btn station-btn-primary" style={{ flex: 1 }} onClick={() => setShowConfigModal(false)}>{t('common.save')} Y CERRAR</button>
            </footer>
          </div>
        </div>
      )}

      {showRTModal && activeRT && (
        <div className="station-modal-overlay" onClick={() => setShowRTModal(false)}>
          <div className="station-modal" style={{ maxWidth: '450px' }} onClick={e => e.stopPropagation()}>
            <header className="station-modal-header">
              <h3 className="station-registry-item-name" style={{ fontSize: '1.1rem' }}>PROPIEDADES DEL REGISTRO</h3>
              <button className="station-btn" style={{ border: 'none', padding: '4px' }} onClick={() => setShowRTModal(false)}><XIcon size={20} /></button>
            </header>
            <div className="station-modal-content">
              <div className="station-form-grid">
                <div className="station-form-field full">
                  <label className="station-label">Identificador (Trigger)</label>
                  <input className="station-input" value={activeRT.trigger} onChange={e => updateRT(activeRTIndex, { trigger: e.target.value })} />
                </div>
                
                <div className="station-form-field">
                  <label className="station-label">Posición Inicio</label>
                  <input type="number" className="station-input" value={activeRT.triggerStart} onChange={e => updateRT(activeRTIndex, { triggerStart: parseInt(e.target.value) || 0 })} />
                </div>
                <div className="station-form-field">
                  <label className="station-label">Comportamiento</label>
                  <select className="station-select" value={activeRT.behavior} onChange={e => updateRT(activeRTIndex, { behavior: e.target.value as EtlRecordBehavior })}>
                      <option value="DATA">DATA (DATOS)</option>
                      <option value="HEADER">HEADER (CABECERA)</option>
                      <option value="FOOTER">FOOTER (PIE)</option>
                  </select>
                </div>
              </div>
            </div>
            <footer className="station-modal-footer">
              <button className="station-btn station-btn-primary" style={{ width: '100%' }} onClick={() => setShowRTModal(false)}>APLICAR CAMBIOS</button>
            </footer>
          </div>
        </div>
      )}

      {showSampleModal && (
        <div className="station-modal-overlay" onClick={() => setShowSampleModal(false)}>
          <div className="station-modal" style={{ maxWidth: '1000px', height: '85vh'}} onClick={e => e.stopPropagation()}>
            <header className="station-modal-header">
              <h3 className="station-registry-item-name" style={{ fontSize: '1.1rem' }}>ESTUDIO DE DATOS</h3>
              <button className="station-btn" style={{ border: 'none', padding: '4px' }} onClick={() => setShowSampleModal(false)}><XIcon size={20} /></button>
            </header>
            <div className="station-modal-content" style={{ padding: '12px' }}>
              <SamplePreview preset={preset} activeRecordTypeName={activeRT?.name} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
