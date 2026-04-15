'use client';

import React, { useState } from 'react';
import { useLanguage } from '@/lib/context/LanguageContext';
import { EtlPreset, EtlRecordType, EtlField, EtlRecordBehavior } from '@/lib/types/etl.types';
import { SamplePreview } from './SamplePreview';
import { CogIcon, EyeIcon, TrashIcon, ListIcon } from '@/components/common/Icons';

interface EtlDesignerProps {
  preset: EtlPreset;
  onUpdate: (updated: EtlPreset) => void;
  onSave: () => void;
}

export const EtlDesigner: React.FC<EtlDesignerProps> = ({ preset, onUpdate, onSave }) => {
  const { t } = useLanguage();
  const [activeRTIndex, setActiveRTIndex] = useState(0);
  const [undoStack, setUndoStack] = useState<string[]>([]);
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [showRTModal, setShowRTModal] = useState(false);
  const [showSampleModal, setShowSampleModal] = useState(false);

  const activeRT = preset.recordTypes[activeRTIndex] || null;

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
      name: `NEW_TYPE_${preset.recordTypes.length}`,
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
    if (!confirm(t('common.confirm_delete') || 'REMOVER TIPO?')) return;
    const newRTs = preset.recordTypes.filter((_, i) => i !== activeRTIndex);
    updatePreset({ recordTypes: newRTs });
    setActiveRTIndex(Math.max(0, activeRTIndex - 1));
  };

  const addField = () => {
    if (!activeRT) return;
    const newField: EtlField = { 
      id: `f_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      name: 'NEW_FIELD', start: 0, length: 10 
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
    <div className="flex-col" style={{ gap: '30px' }}>
      <div className="station-card">
        <div className="station-card-title">ETL_STUDIO_DESIGNER</div>
        
        <div className="flex-row" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
          <div className="flex-col" style={{ gap: '5px' }}>
            <h2 style={{ fontSize: '1.8rem', fontWeight: 900, textTransform: 'uppercase' }}>{preset.name || 'UNNAMED_PRESET'}</h2>
            <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
               <span style={{ opacity: 0.5, fontSize: '0.8rem' }}>v{preset.version}</span>
               <span className={`txt-${preset.isActive ? 'ok' : 'err'}`} style={{ fontWeight: 900, fontSize: '0.7rem', border: '1px solid currentColor', padding: '1px 6px' }}>
                  {preset.isActive ? 'ONLINE' : 'OFFLINE'}
               </span>
            </div>
          </div>

          <div className="flex-row" style={{ gap: '15px' }}>
            <button className="station-btn" onClick={() => setShowConfigModal(true)} title="Settings"><CogIcon size={20} /></button>
            <button className="station-btn station-btn-primary" onClick={onSave}>{t('etl.save_preset')}</button>
          </div>
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px', padding: '12px', background: 'rgba(var(--primary-color), 0.05)', border: 'var(--border-thin) solid var(--border-color)', fontSize: '0.7rem', fontWeight: 700 }}>
          <span>CHUNK: {preset.chunkSize}</span>
          <span>ENC: {preset.encoding?.toUpperCase()}</span>
          <span>TYPE_POS: {preset.recordTypeStart}</span>
          <span>TYPE_LEN: {preset.recordTypeLen}</span>
          <span>DEF_TYPE: {preset.defaultRecordType}</span>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: '30px' }}>
        {/* Record Types List */}
        <div className="station-card">
          <div className="station-card-title">RECORD_TYPES</div>
          <div className="flex-col" style={{ gap: '2px' }}>
            {preset.recordTypes.map((rt, i) => (
              <button 
                key={i} 
                className={`nav-item ${activeRTIndex === i ? 'active' : ''}`}
                style={{ padding: '14px 20px', fontSize: '0.85rem' }}
                onClick={() => setActiveRTIndex(i)}
              >
                [{rt.trigger?.substring(0, 1) || 'D'}] {rt.name}
              </button>
            ))}
            <button className="station-btn" style={{ marginTop: '15px', width: '100%', boxShadow: 'none' }} onClick={addRT}>+ ADD_NEW_TYPE</button>
          </div>
        </div>

        {/* Field Editor */}
        <div className="station-card">
          {activeRT ? (
            <div className="flex-col" style={{ gap: '20px' }}>
              <div className="flex-row" style={{ justifyContent: 'space-between', alignItems: 'center', borderBottom: 'var(--border-thin) solid var(--border-color)', paddingBottom: '15px' }}>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 900 }}>{activeRT.name} <small style={{ opacity: 0.5, fontSize: '0.7rem' }}>[{activeRT.behavior}]</small></h3>
                <div className="flex-row" style={{ gap: '10px' }}>
                  <button className="station-btn" onClick={() => setShowSampleModal(true)} style={{ padding: '6px 12px' }}><EyeIcon size={16} /></button>
                  <button className="station-btn" onClick={() => setShowRTModal(true)} style={{ padding: '6px 12px' }}><CogIcon size={16} /></button>
                  <button className="station-btn" style={{ color: 'var(--accent-color)', padding: '6px 12px' }} onClick={removeRecordType}><TrashIcon size={16} /></button>
                </div>
              </div>

              <div className="station-table-container" style={{ maxHeight: '500px' }}>
                <table className="station-table">
                  <thead>
                    <tr>
                      <th style={{ width: '80px' }}>START</th>
                      <th style={{ width: '80px' }}>LENGTH</th>
                      <th>FIELD_IDENTIFIER</th>
                      <th style={{ width: '50px' }}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {activeRT.fields.sort((a,b) => a.start - b.start).map((f) => (
                      <tr key={f.id}>
                        <td><input type="number" className="station-input" style={{ padding: '6px', textAlign: 'center', fontSize: '0.8rem' }} value={f.start} onChange={e => updateField(f.id, { start: parseInt(e.target.value) || 0 })} /></td>
                        <td><input type="number" className="station-input" style={{ padding: '6px', textAlign: 'center', fontSize: '0.8rem' }} value={f.length} onChange={e => updateField(f.id, { length: parseInt(e.target.value) || 0 })} /></td>
                        <td><input type="text" className="station-input" style={{ padding: '6px', fontSize: '0.8rem' }} value={f.name} onChange={e => updateField(f.id, { name: e.target.value })} /></td>
                        <td style={{ textAlign: 'center' }}>
                           <button onClick={() => removeField(f.id)} style={{ background: 'transparent', border: 'none', color: 'var(--accent-color)', cursor: 'pointer', padding: '5px' }}><TrashIcon size={14} /></button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <button className="station-btn" style={{ padding: '15px' }} onClick={addField}>+ APPEND_FIELD_DEFINITION</button>
            </div>
          ) : (
            <div style={{ padding: '100px 40px', textAlign: 'center', opacity: 0.2, fontWeight: 900 }}>WAITING_FOR_RECORD_SELECTION</div>
          )}
        </div>
      </div>

      {/* Configuration Modal */}
      {showConfigModal && (
        <div className="station-modal-overlay" onClick={() => setShowConfigModal(false)}>
          <div className="station-modal" onClick={e => e.stopPropagation()}>
            <h3 className="mainTitle">PRESET_CORE_CONFIG</h3>
            <div className="grid-2">
              <div className="flex-col" style={{ gap: '10px' }}>
                <label className="station-label">CONFIG_NAME</label>
                <input className="station-input" value={preset.name} onChange={e => updatePreset({ name: e.target.value })} />
              </div>
              <div className="flex-col" style={{ gap: '10px' }}>
                <label className="station-label">VERSION</label>
                <input className="station-input" value={preset.version} onChange={e => updatePreset({ version: e.target.value })} />
              </div>
            </div>
            <div className="grid-2">
               <div className="flex-col" style={{ gap: '10px' }}>
                <label className="station-label">MAX_CHUNK</label>
                <input type="number" className="station-input" value={preset.chunkSize} onChange={e => updatePreset({ chunkSize: parseInt(e.target.value) || 0 })} />
              </div>
              <div className="flex-col" style={{ gap: '10px' }}>
                <label className="station-label">WINDOW_OFFSET_X</label>
                <input type="number" className="station-input" step="0.1" value={preset.gawebConfig?.windowOffsetX || 0} onChange={e => updatePreset({ gawebConfig: { ...(preset.gawebConfig || {} as any), windowOffsetX: parseFloat(e.target.value) || 0 }})} />
              </div>
            </div>
            <button className="station-btn station-btn-primary" onClick={() => setShowConfigModal(false)}>CONSOLIDATE_AND_CLOSE</button>
          </div>
        </div>
      )}

      {/* Record Type Editor Modal */}
      {showRTModal && activeRT && (
        <div className="station-modal-overlay" onClick={() => setShowRTModal(false)}>
          <div className="station-modal" onClick={e => e.stopPropagation()}>
            <h3 className="mainTitle">DATA_TYPE_CONFIG: {activeRT.name}</h3>
            <div className="flex-col">
              <label className="station-label">TRIGGER_IDENTIFIER</label>
              <input className="station-input" value={activeRT.trigger} onChange={e => updateRT(activeRTIndex, { trigger: e.target.value })} />
              
              <div className="grid-2">
                 <div className="flex-col" style={{ gap: '10px' }}>
                    <label className="station-label">TRIGGER_POSITION</label>
                    <input type="number" className="station-input" value={activeRT.triggerStart} onChange={e => updateRT(activeRTIndex, { triggerStart: parseInt(e.target.value) || 0 })} />
                 </div>
                 <div className="flex-col" style={{ gap: '10px' }}>
                    <label className="station-label">BEHAVIOR_ROLE</label>
                    <select className="station-select" value={activeRT.behavior} onChange={e => updateRT(activeRTIndex, { behavior: e.target.value as EtlRecordBehavior })}>
                       <option value="DATA">DATA</option>
                       <option value="HEADER">HEADER</option>
                       <option value="FOOTER">FOOTER</option>
                    </select>
                 </div>
              </div>
            </div>
            <button className="station-btn station-btn-primary" onClick={() => setShowRTModal(false)}>APPLY_PROPERTIES</button>
          </div>
        </div>
      )}

      {/* Sample Modal */}
      {showSampleModal && (
        <div className="station-modal-overlay" onClick={() => setShowSampleModal(false)}>
          <div className="station-modal" style={{ maxWidth: '1000px', height: '80vh' }} onClick={e => e.stopPropagation()}>
            <h3 className="mainTitle">DATA_STEREOSCOPE_VIEW</h3>
            <div style={{ flex: 1, minHeight: 0 }}>
              <SamplePreview preset={preset} activeRecordTypeName={activeRT?.name} />
            </div>
            <button className="station-btn" onClick={() => setShowSampleModal(false)}>CLOSE</button>
          </div>
        </div>
      )}
    </div>
  );
};
