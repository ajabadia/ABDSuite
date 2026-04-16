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
      
      {/* Cabecera del Preset */}
      <div className="station-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div className="flex-col" style={{ gap: '4px' }}>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 800 }}>{preset.name || 'Sin Nombre'}</h2>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
               <span style={{ opacity: 0.5, fontSize: '0.75rem' }}>v{preset.version}</span>
               <span className={`station-badge ${preset.isActive ? 'station-badge-green' : 'station-badge-orange'}`} style={{ height: '18px' }}>
                  {preset.isActive ? 'ACTIVO' : 'BORRADOR'}
               </span>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '12px' }}>
            <button className="station-btn" onClick={undo} disabled={undoStack.length === 0} title="Deshacer"><UndoIcon size={16} /></button>
            <button className="station-btn" onClick={() => setShowConfigModal(true)}><CogIcon size={16} /> Configuración</button>
            <button className="station-btn station-btn-primary" onClick={onSave}><SaveIcon size={16} /> Guardar Cambios</button>
            <button className="station-btn station-btn-primary" onClick={handleLaunchExecutor} style={{ background: 'var(--status-ok)', border: 'none' }}>
              <PlayIcon size={16} /> EJECUTAR PRESET
            </button>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '24px', marginTop: '16px', paddingTop: '16px', borderTop: '1px solid var(--border-color)', fontSize: '0.75rem', opacity: 0.6 }}>
          <span>Lote: {preset.chunkSize}</span>
          <span>Enc: {preset.encoding?.toUpperCase()}</span>
          <span>Tipo Pos: {preset.recordTypeStart}</span>
          <span>Tipo Len: {preset.recordTypeLen}</span>
          <span>Defecto: {preset.defaultRecordType}</span>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: '24px', flex: 1, minHeight: 0 }}>
        
        {/* Lista de Registros */}
        <div className="flex-col" style={{ gap: '12px' }}>
          <h3 style={{ fontSize: '0.8rem', opacity: 0.6, textTransform: 'uppercase' }}>Tipos de Registro</h3>
          <div className="station-card" style={{ padding: '8px', flex: 1, overflowY: 'auto' }}>
            {preset.recordTypes.map((rt, i) => (
              <button 
                key={i} 
                className={`nav-item ${activeRTIndex === i ? 'active' : ''}`}
                style={{ margin: '2px 0', border: 'none' }}
                onClick={() => setActiveRTIndex(i)}
              >
                <span className="station-badge station-badge-blue" style={{ minWidth: '24px', height: '18px' }}>{rt.trigger?.substring(0, 1) || 'D'}</span>
                <span style={{ marginLeft: '8px' }}>{rt.name}</span>
              </button>
            ))}
            <button className="station-btn" style={{ marginTop: '12px', width: '100%', padding: '12px' }} onClick={addRT}>+ Nuevo Registro</button>
          </div>
        </div>

        {/* Editor de Campos */}
        <div className="flex-col" style={{ gap: '12px' }}>
          <h3 style={{ fontSize: '0.8rem', opacity: 0.6, textTransform: 'uppercase' }}>Definición de Campos</h3>
          <div className="station-card" style={{ flex: 1, minHeight: 0, padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            {activeRT ? (
              <>
                <header style={{ padding: '16px 24px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '12px' }}>
                    <h4 style={{ fontWeight: 800 }}>{activeRT.name}</h4>
                    <span style={{ fontSize: '0.7rem', opacity: 0.5 }}>COMPORTAMIENTO: {activeRT.behavior}</span>
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button className="station-btn" onClick={() => setShowSampleModal(true)} title="Vista Previa"><EyeIcon size={16} /></button>
                    <button className="station-btn" onClick={() => setShowRTModal(true)} title="Propiedades"><CogIcon size={16} /></button>
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
                        <tr key={f.id || `f-${idx}`}>
                          <td><input type="number" className="station-input" style={{ textAlign: 'center', fontSize: '0.85rem' }} value={f.start} onChange={e => updateField(f.id, { start: parseInt(e.target.value) || 0 })} /></td>
                          <td><input type="number" className="station-input" style={{ textAlign: 'center', fontSize: '0.85rem' }} value={f.length} onChange={e => updateField(f.id, { length: parseInt(e.target.value) || 0 })} /></td>
                          <td><input type="text" className="station-input" style={{ fontSize: '0.85rem' }} value={f.name} onChange={e => updateField(f.id, { name: e.target.value.toUpperCase() })} /></td>
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
              <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0.2 }}>
                <ListIcon size={48} />
                <p style={{ marginLeft: '16px', fontWeight: 700 }}>SELECCIONE UN TIPO DE REGISTRO</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modales de Configuración */}
      {showConfigModal && (
        <div className="station-modal-overlay" onClick={() => setShowConfigModal(false)}>
          <div className="station-modal" style={{ maxWidth: '500px' }} onClick={e => e.stopPropagation()}>
            <header style={{ paddingBottom: '16px', borderBottom: '1px solid var(--border-color)', marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontWeight: 800 }}>CONFIGURACIÓN DEL PRESET</h3>
              <button className="station-btn" style={{ border: 'none' }} onClick={() => setShowConfigModal(false)}><XIcon size={20} /></button>
            </header>
            <div className="flex-col" style={{ gap: '16px' }}>
              <div className="flex-col" style={{ gap: '4px' }}>
                <label className="station-label">Nombre del Preset</label>
                <input className="station-input" value={preset.name} onChange={e => updatePreset({ name: e.target.value })} />
              </div>
              <div className="grid-2">
                <div className="flex-col" style={{ gap: '4px' }}>
                  <label className="station-label">Versión</label>
                  <input className="station-input" value={preset.version} onChange={e => updatePreset({ version: e.target.value })} />
                </div>
                <div className="flex-col" style={{ gap: '4px' }}>
                  <label className="station-label">Tamaño Lote</label>
                  <input type="number" className="station-input" value={preset.chunkSize} onChange={e => updatePreset({ chunkSize: parseInt(e.target.value) || 0 })} />
                </div>
              </div>
            </div>
            <button className="station-btn station-btn-primary" style={{ marginTop: '32px', width: '100%' }} onClick={() => setShowConfigModal(false)}>Guardar y Cerrar</button>
          </div>
        </div>
      )}

      {showRTModal && activeRT && (
        <div className="station-modal-overlay" onClick={() => setShowRTModal(false)}>
          <div className="station-modal" style={{ maxWidth: '450px' }} onClick={e => e.stopPropagation()}>
            <header style={{ paddingBottom: '16px', borderBottom: '1px solid var(--border-color)', marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontWeight: 800 }}>PROPIEDADES DEL REGISTRO</h3>
              <button className="station-btn" style={{ border: 'none' }} onClick={() => setShowRTModal(false)}><XIcon size={20} /></button>
            </header>
            <div className="flex-col" style={{ gap: '16px' }}>
              <div className="flex-col" style={{ gap: '4px' }}>
                <label className="station-label">Identificador (Trigger)</label>
                <input className="station-input" value={activeRT.trigger} onChange={e => updateRT(activeRTIndex, { trigger: e.target.value })} />
              </div>
              
              <div className="grid-2">
                 <div className="flex-col" style={{ gap: '4px' }}>
                    <label className="station-label">Posición Inicio</label>
                    <input type="number" className="station-input" value={activeRT.triggerStart} onChange={e => updateRT(activeRTIndex, { triggerStart: parseInt(e.target.value) || 0 })} />
                 </div>
                 <div className="flex-col" style={{ gap: '4px' }}>
                    <label className="station-label">Comportamiento</label>
                    <select className="station-select" value={activeRT.behavior} onChange={e => updateRT(activeRTIndex, { behavior: e.target.value as EtlRecordBehavior })}>
                       <option value="DATA">DATA (DATOS)</option>
                       <option value="HEADER">HEADER (CABECERA)</option>
                       <option value="FOOTER">FOOTER (PIE)</option>
                    </select>
                 </div>
              </div>
            </div>
            <button className="station-btn station-btn-primary" style={{ marginTop: '32px', width: '100%' }} onClick={() => setShowRTModal(false)}>Aplicar Cambios</button>
          </div>
        </div>
      )}

      {showSampleModal && (
        <div className="station-modal-overlay" onClick={() => setShowSampleModal(false)}>
          <div className="station-modal" style={{ maxWidth: '1000px', height: '80vh', padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }} onClick={e => e.stopPropagation()}>
            <header style={{ padding: '16px 24px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontWeight: 800 }}>ESTUDIO DE DATOS</h3>
              <button className="station-btn" style={{ border: 'none' }} onClick={() => setShowSampleModal(false)}><XIcon size={20} /></button>
            </header>
            <div style={{ flex: 1, minHeight: 0, padding: '12px' }}>
              <SamplePreview preset={preset} activeRecordTypeName={activeRT?.name} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
