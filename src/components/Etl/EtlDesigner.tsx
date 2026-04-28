'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useLanguage } from '@/lib/context/LanguageContext';
import { useWorkspace } from '@/lib/context/WorkspaceContext';
import { ForbiddenPanel } from '@/components/common/ForbiddenPanel';
import { 
  EtlPreset, 
  EtlRecordType, 
  EtlField, 
  EtlRecordBehavior 
} from '@/lib/types/etl.types';
import { 
  CogIcon, 
  SaveIcon, 
  PlayIcon, 
  UndoIcon, 
  TrashIcon, 
  EyeIcon, 
  XIcon, 
  ListIcon 
} from '@/components/common/Icons';
import { SamplePreview } from './SamplePreview';

import { StationHeader } from '@/components/shell/StationHeader';

interface EtlDesignerProps {
  preset: EtlPreset;
  onUpdate: (updated: EtlPreset) => void;
  onSave: () => void;
  canEdit?: boolean;
}

export const EtlDesigner: React.FC<EtlDesignerProps> = ({ preset, onUpdate, onSave, canEdit = true }) => {
  const { t } = useLanguage();
  const { can } = useWorkspace();
  const router = useRouter();

  const isAllowed = can('ETL_EDIT_PRESETS');

  if (!isAllowed) {
    return <ForbiddenPanel capability="ETL_EDIT_PRESETS" />;
  }

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
      name: `NODE_${preset.recordTypes.length + 1}`,
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
    if (!confirm(t('common.confirm_delete').toUpperCase())) return;
    const newRTs = preset.recordTypes.filter((_, i) => i !== activeRTIndex);
    updatePreset({ recordTypes: newRTs });
    setActiveRTIndex(Math.max(0, activeRTIndex - 1));
  };

  const addField = () => {
    if (!activeRT) return;
    const newField: EtlField = { 
      id: `f_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      name: 'FIELD', start: 0, length: 1 
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
    <div className="flex-col animate-fade-in" style={{ gap: '24px', height: '100%', padding: '0 24px' }}>
      
      <StationHeader 
        title={preset.name || t('etl.no_name')}
        engineId={`ETL_CORE_V6_${preset.recordTypes.length}_NODES`}
        actions={
            <div className="flex-row" style={{ gap: '12px' }}>
                <button className="station-btn secondary icon-only" onClick={undo} disabled={undoStack.length === 0} title="Undo">
                    <UndoIcon size={16} />
                </button>
                <button className="station-btn secondary" onClick={() => setShowConfigModal(true)}>
                    <CogIcon size={16} /> {t('settings.title').toUpperCase()}
                </button>
                <button className="station-btn success" onClick={onSave}>
                    <SaveIcon size={16} /> {t('common.save').toUpperCase()}
                </button>
                <button 
                    className="station-btn primary" 
                    onClick={handleLaunchExecutor}
                    style={{ fontWeight: 900 }}
                >
                    <PlayIcon size={16} /> {t('etl.launch_executor').toUpperCase()}
                </button>
            </div>
        }
      />

      <div className="station-tech-summary" style={{ marginTop: '-8px' }}>
          <div className="station-tech-item"><span className="station-tech-label">{t('etl.chunk_buffer').toUpperCase()}:</span> {preset.chunkSize}</div>
          <div className="station-tech-item"><span className="station-tech-label">{t('etl.encoding').toUpperCase()}:</span> {preset.encoding?.toUpperCase()}</div>
          <div className="station-tech-item"><span className="station-tech-label">{t('etl.descriptor_pos').toUpperCase()}:</span> {preset.recordTypeStart}</div>
          <div className="station-tech-item"><span className="station-tech-label">{t('etl.descriptor_len').toUpperCase()}:</span> {preset.recordTypeLen}</div>
          <div className="station-tech-item">
            <span className={`station-badge ${preset.isActive ? 'success' : 'warn'}`}>
                {preset.isActive ? t('etl.operational').toUpperCase() : t('etl.draft_mode').toUpperCase()}
            </span>
          </div>
      </div>

      <div className="station-editor-area" style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: '24px', flex: 1, minHeight: 0 }}>
        
        {/* Lista de Registros */}
        <div className="flex-col" style={{ gap: '12px' }}>
          <span className="station-form-section-title">{t('etl.node_registry').toUpperCase()}</span>
          <div className="station-card" style={{ padding: '8px', flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', background: 'rgba(0,0,0,0.1)' }}>
            <div className="station-registry-list" style={{ flex: 1 }}>
              {preset.recordTypes.length === 0 && (
                <div className="station-empty-state">
                   <ListIcon size={48} style={{ marginBottom: '12px', opacity: 0.2 }} />
                   <span className="station-shimmer-text">{t('etl.empty').toUpperCase()}</span>
                </div>
              )}
              {preset.recordTypes.map((rt, i) => (
                <div 
                  key={i} 
                  className={`station-registry-item ${activeRTIndex === i ? 'active' : ''}`}
                  onClick={() => setActiveRTIndex(i)}
                  style={{ margin: '2px 0', borderRadius: '4px' }}
                >
                  <div className="station-registry-item-left">
                    <div className="station-registry-item-icon">
                      <span className="station-badge info" style={{ minWidth: '24px', padding: '0 4px', fontSize: '0.6rem', fontWeight: 900 }}>{rt.trigger || 'DEF'}</span>
                    </div>
                    <div className="station-registry-item-info">
                      <span className="station-registry-item-name" style={{ fontSize: '0.75rem', fontWeight: 800 }}>{rt.name}</span>
                      <span className="station-registry-item-meta">{rt.behavior} • {rt.fields.length} {t('etl.fields').toUpperCase()}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <button className="station-btn primary" style={{ marginTop: '8px', height: '40px', fontWeight: 900 }} onClick={addRT}>+ {t('etl.add_rt').toUpperCase()}</button>
          </div>
        </div>

        {/* Editor de Campos */}
        <div className="flex-col" style={{ gap: '12px' }}>
          <span className="station-form-section-title">{t('etl.field_map').toUpperCase()}</span>
          <div className="station-card" style={{ flex: 1, minHeight: 0, padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            {activeRT ? (
              <>
                <header className="station-registry-header" style={{ padding: '16px 24px', borderBottom: '1px solid rgba(255,255,255,0.05)', background: 'rgba(255,255,255,0.02)' }}>
                  <div className="flex-row" style={{ alignItems: 'baseline', gap: '12px' }}>
                    <h4 className="station-registry-item-name" style={{ fontSize: '1rem', letterSpacing: '1px', fontWeight: 900 }}>{activeRT.name}</h4>
                    <span className="station-badge info" style={{ fontSize: '0.6rem' }}>{activeRT.behavior}</span>
                  </div>
                  <div className="flex-row" style={{ gap: '8px' }}>
                    <button className="station-btn secondary icon-only" title="Preview" onClick={() => setShowSampleModal(true)}><EyeIcon size={16} /></button>
                    <button className="station-btn secondary" onClick={() => setShowRTModal(true)}><CogIcon size={16} /> {t('etl.node_props').toUpperCase()}</button>
                    <button className="station-btn icon-only err" onClick={removeRecordType}><TrashIcon size={16} /></button>
                  </div>
                </header>

                <div className="station-table-container" style={{ border: 'none', borderRadius: 0, flex: 1, overflowY: 'auto' }}>
                  <table className="station-table">
                    <thead>
                      <tr>
                        <th style={{ width: '120px', textAlign: 'center' }}>{t('etl.start').toUpperCase()}</th>
                        <th style={{ width: '120px', textAlign: 'center' }}>{t('etl.length').toUpperCase()}</th>
                        <th>{t('etl.field_id').toUpperCase()}</th>
                        <th style={{ width: '60px' }}></th>
                      </tr>
                    </thead>
                    <tbody>
                      {activeRT.fields.sort((a,b) => a.start - b.start).map((f, idx) => (
                        <tr key={f.id || `f-${idx}`} className={f.length === 0 ? 'warn' : ''}>
                          <td><input type="number" className="station-input" style={{ textAlign: 'center', fontWeight: 800, fontSize: '0.8rem' }} value={f.start} onChange={e => updateField(f.id, { start: parseInt(e.target.value) || 0 })} /></td>
                          <td><input type="number" className="station-input" style={{ textAlign: 'center', fontWeight: 800, fontSize: '0.8rem', color: 'var(--primary-color)' }} value={f.length} onChange={e => updateField(f.id, { length: parseInt(e.target.value) || 0 })} /></td>
                          <td><input type="text" className="station-input" style={{ letterSpacing: '1px', fontWeight: 700, fontSize: '0.8rem' }} value={f.name} onChange={e => updateField(f.id, { name: e.target.value.toUpperCase() })} /></td>
                          <td style={{ textAlign: 'center' }}>
                             <button onClick={() => removeField(f.id)} className="station-btn icon-only err" style={{ opacity: 0.5 }}><TrashIcon size={14} /></button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div style={{ padding: '16px', borderTop: '1px solid rgba(255,255,255,0.05)', background: 'rgba(0,0,0,0.1)' }}>
                   <button className="station-btn primary" style={{ width: '100%', height: '48px', fontSize: '1rem', fontWeight: 900 }} onClick={addField}>+ {t('etl.add_field').toUpperCase()}</button>
                </div>
              </>
            ) : (
              <div className="station-empty-state">
                <ListIcon size={64} style={{ marginBottom: '16px', opacity: 0.1 }} />
                <span className="station-shimmer-text">{t('etl.empty').toUpperCase()}</span>
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
              <h3 className="station-registry-item-name" style={{ fontSize: '1.2rem', color: 'var(--primary-color)', fontWeight: 900 }}>{t('etl.preferences').toUpperCase()}</h3>
              <button className="station-btn icon-only" onClick={() => setShowConfigModal(false)}><XIcon size={20} /></button>
            </header>
            <div className="station-modal-content">
              <div className="station-form-grid">
                <div className="station-form-field full">
                  <label className="station-label">{t('etl.field_name').toUpperCase()}</label>
                  <input className="station-input" value={preset.name} onChange={e => updatePreset({ name: e.target.value })} />
                </div>
                <div className="station-form-field">
                  <label className="station-label">{t('etl.version_tag').toUpperCase()}</label>
                  <input className="station-input" value={preset.version} readOnly style={{ opacity: 0.5 }} />
                </div>
                <div className="station-form-field">
                  <label className="station-label">{t('etl.last_update').toUpperCase()}</label>
                  <input className="station-input" value={new Date(preset.updatedAt || Date.now()).toLocaleDateString()} readOnly style={{ opacity: 0.5 }} />
                </div>
              </div>
            </div>
            <footer className="station-modal-footer">
               <button className="station-btn primary" style={{ flex: 1, height: '48px', fontWeight: 900 }} onClick={() => setShowConfigModal(false)}>{t('common.save').toUpperCase()}</button>
            </footer>
          </div>
        </div>
      )}

      {showRTModal && activeRT && (
        <div className="station-modal-overlay" onClick={() => setShowRTModal(false)}>
          <div className="station-modal" style={{ maxWidth: '450px' }} onClick={e => e.stopPropagation()}>
            <header className="station-modal-header">
              <h3 className="station-registry-item-name" style={{ fontSize: '1.2rem', color: 'var(--primary-color)', fontWeight: 900 }}>{t('etl.node_props').toUpperCase()}</h3>
              <button className="station-btn icon-only" onClick={() => setShowRTModal(false)}><XIcon size={20} /></button>
            </header>
            <div className="station-modal-content">
              <div className="station-form-grid">
                <div className="station-form-field full">
                  <label className="station-label">{t('etl.trigger').toUpperCase()}</label>
                  <input className="station-input" style={{ letterSpacing: '2px', fontWeight: 900, color: 'var(--primary-color)' }} value={activeRT.trigger} onChange={e => updateRT(activeRTIndex, { trigger: e.target.value })} />
                </div>
                
                <div className="station-form-field">
                  <label className="station-label">{t('etl.start').toUpperCase()}</label>
                  <input type="number" className="station-input" value={activeRT.triggerStart} onChange={e => updateRT(activeRTIndex, { triggerStart: parseInt(e.target.value) || 0 })} />
                </div>
                <div className="station-form-field">
                  <label className="station-label">{t('etl.behavior').toUpperCase()}</label>
                  <select className="station-select" value={activeRT.behavior} onChange={e => updateRT(activeRTIndex, { behavior: e.target.value as EtlRecordBehavior })}>
                      <option value="DATA">{t('etl.data_stream').toUpperCase()}</option>
                      <option value="HEADER">{t('etl.header_block').toUpperCase()}</option>
                      <option value="FOOTER">{t('etl.footer_block').toUpperCase()}</option>
                  </select>
                </div>
              </div>
            </div>
            <footer className="station-modal-footer">
              <button className="station-btn primary" style={{ width: '100%', height: '48px', fontWeight: 900 }} onClick={() => setShowRTModal(false)}>{t('common.save').toUpperCase()}</button>
            </footer>
          </div>
        </div>
      )}

      {showSampleModal && (
        <div className="station-modal-overlay" onClick={() => setShowSampleModal(false)}>
          <div className="station-modal" style={{ maxWidth: '1000px', height: '85vh'}} onClick={e => e.stopPropagation()}>
            <header className="station-modal-header">
              <div className="flex-row" style={{ alignItems: 'baseline', gap: '12px' }}>
                <h3 className="station-registry-item-name" style={{ fontSize: '1.2rem', fontWeight: 900 }}>{t('etl.sample_file').toUpperCase()}</h3>
                <span className="station-badge info" style={{ fontWeight: 900 }}>{activeRT?.name}</span>
              </div>
              <button className="station-btn icon-only" onClick={() => setShowSampleModal(false)}><XIcon size={20} /></button>
            </header>
            <div className="station-modal-content" style={{ padding: '0' }}>
              <SamplePreview preset={preset} activeRecordTypeName={activeRT?.name} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
