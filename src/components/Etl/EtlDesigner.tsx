'use client';

import React, { useState } from 'react';
import { useLanguage } from '@/lib/context/LanguageContext';
import { EtlPreset, EtlRecordType, EtlField, EtlRecordBehavior } from '@/lib/types/etl.types';
import { SamplePreview } from './SamplePreview';
import { CogIcon, EyeIcon, TrashIcon } from '@/components/common/Icons';
import styles from './EtlDesigner.module.css';

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

    if (activeRT.fields.length > 0) {
      const confirmed = confirm(t('common.confirm_delete_with_fields') || 'AVISO: El tipo tiene campos asociados. ¿Deseas borrarlo? Esta acción no es reversible.');
      if (!confirmed) return;
    } else {
      const confirmed = confirm(t('common.confirm_delete') || '¿BORRAR TIPO DE REGISTRO?');
      if (!confirmed) return;
    }

    const newRTs = preset.recordTypes.filter((_, i) => i !== activeRTIndex);
    updatePreset({ recordTypes: newRTs });
    setActiveRTIndex(Math.max(0, activeRTIndex - 1));
  };

  const addField = () => {
    if (!activeRT) return;
    const newField: EtlField = { 
      id: `f_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      name: 'NEW_FIELD', 
      start: 0, 
      length: 10 
    };
    const newFields = [...activeRT.fields, newField];
    updateRT(activeRTIndex, { fields: newFields });
  };

  const updateField = (id: string, patch: Partial<EtlField>) => {
    if (!activeRT) return;
    const newFields = activeRT.fields.map(f => f.id === id ? { ...f, ...patch } : f);
    updateRT(activeRTIndex, { fields: newFields });
  };

  const removeField = (id: string) => {
    if (!activeRT) return;
    const newFields = activeRT.fields.filter(f => f.id !== id);
    updateRT(activeRTIndex, { fields: newFields });
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <h2 className={styles.mainTitle}>{preset.name || 'SIN_NOMBRE'}</h2>
          
          <div className={styles.badgesRow}>
            <span className={styles.versionBadge}>v{preset.version || '0.0'}</span>
            <span className={`${styles.statusIndicator} ${preset.isActive ? styles.statusActive : styles.statusInactive}`}>
              {preset.isActive ? 'ACTIVO' : 'INACTIVO'}
            </span>
          </div>

          <div className={styles.techSummary}>
            {preset.chunkSize > 0 && (
              <div className={styles.techItem}>
                <span className={styles.techLabel}>Chunk:</span> {preset.chunkSize}
              </div>
            )}
            {preset.encoding && (
              <div className={styles.techItem}>
                <span className={styles.techLabel}>Enc:</span> {preset.encoding.toUpperCase()}
              </div>
            )}
            {preset.recordTypeStart > 0 && (
              <div className={styles.techItem}>
                <span className={styles.techLabel}>PosTipo:</span> {preset.recordTypeStart}
              </div>
            )}
            {preset.recordTypeLen > 0 && (
              <div className={styles.techItem}>
                <span className={styles.techLabel}>LenTipo:</span> {preset.recordTypeLen}
              </div>
            )}
            {preset.defaultRecordType && (
              <div className={styles.techItem}>
                <span className={styles.techLabel}>Def:</span> {preset.defaultRecordType}
              </div>
            )}
            {preset.headerTypeId && (
              <div className={styles.techItem}>
                <span className={styles.techLabel}>HeaderId:</span> {preset.headerTypeId}
              </div>
            )}
          </div>
        </div>

        <div className={styles.headerRight}>
          <button className={styles.gearBtn} onClick={() => setShowConfigModal(true)} title="Configuración">
            <CogIcon size={24} />
          </button>
          <button className={styles.saveBtn} onClick={onSave}>{t('etl.save_preset')}</button>
        </div>
      </header>

      {/* Configuration Modal */}
      {showConfigModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <div className={styles.modalHeader}>
              <h3 className={styles.mainTitle}>CONFIGURACIÓN DE PRESET</h3>
              <button 
                className={styles.miniBtn} 
                onClick={() => setShowConfigModal(false)}
                style={{ padding: '8px 16px' }}
              >
                CERRAR [ESC]
              </button>
            </div>

            <div className={styles.modalBody}>
              <div className={styles.group}>
                <h4 className={styles.groupTitle}>METADATOS</h4>
                <div className={styles.modalRow}>
                  <div className={styles.field} style={{ flex: 1 }}>
                    <label>NOMBRE CONFIGURACIÓN</label>
                    <input 
                      value={preset.name} 
                      onChange={e => updatePreset({ name: e.target.value })} 
                      className={styles.input}
                    />
                  </div>
                  <div className={styles.field}>
                    <label>VERSIÓN</label>
                    <input 
                      value={preset.version} 
                      onChange={e => updatePreset({ version: e.target.value })} 
                      className={styles.input}
                      style={{ width: '80px' }}
                    />
                  </div>
                  <div className={styles.field} style={{ justifyContent: 'flex-end', paddingBottom: '8px' }}>
                    <label className={styles.checkboxField}>
                      <input 
                        type="checkbox" 
                        checked={preset.isActive}
                        onChange={e => updatePreset({ isActive: e.target.checked })}
                      />
                      ACTIVO
                    </label>
                  </div>
                </div>
              </div>

              <div className={styles.group} style={{ marginTop: '16px' }}>
                <h4 className={styles.groupTitle}>PARÁMETROS TÉCNICOS</h4>
                <div className={styles.modalRow}>
                  <div className={styles.field}>
                    <label>MAX FILAS (CHUNKING)</label>
                    <input 
                      type="number"
                      value={preset.chunkSize} 
                      onChange={e => updatePreset({ chunkSize: parseInt(e.target.value) || 0 })} 
                      className={styles.input}
                      style={{ width: '150px' }}
                    />
                  </div>
                  <div className={styles.field}>
                    <label>ENCODING</label>
                    <select 
                      value={preset.encoding} 
                      onChange={e => updatePreset({ encoding: e.target.value })}
                      className={styles.select}
                    >
                      <option value="utf-8">UTF-8</option>
                      <option value="windows-1252">Windows-1252 (Latin-1)</option>
                    </select>
                  </div>
                  <div className={styles.field}>
                    <label>POS TIPO</label>
                    <input 
                      type="number"
                      value={preset.recordTypeStart} 
                      onChange={e => updatePreset({ recordTypeStart: parseInt(e.target.value) || 0 })} 
                      className={styles.input}
                      style={{ width: '80px' }}
                    />
                  </div>
                  <div className={styles.field}>
                    <label>LEN TIPO</label>
                    <input 
                      type="number"
                      value={preset.recordTypeLen} 
                      onChange={e => updatePreset({ recordTypeLen: parseInt(e.target.value) || 0 })} 
                      className={styles.input}
                      style={{ width: '80px' }}
                    />
                  </div>
                </div>
                <div className={styles.modalRow} style={{ marginTop: '16px' }}>
                  <div className={styles.field}>
                    <label>TIPO POR DEFECTO</label>
                    <input 
                      value={preset.defaultRecordType} 
                      onChange={e => updatePreset({ defaultRecordType: e.target.value })} 
                      className={styles.input}
                      style={{ width: '150px' }}
                    />
                  </div>
                  <div className={styles.field}>
                    <label>ID CABECERA</label>
                    <input 
                      value={preset.headerTypeId} 
                      onChange={e => updatePreset({ headerTypeId: e.target.value })} 
                      className={styles.input}
                      style={{ width: '150px' }}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className={styles.modalActions}>
              <button 
                className={styles.undoBtn} 
                onClick={undo}
                disabled={undoStack.length === 0}
                style={{ padding: '8px 24px', fontSize: '0.9rem' }}
              >
                DESHACER CAMBIOS [CTRL+Z]
              </button>
            </div>
          </div>
        </div>
      )}

      <div className={styles.workspace}>
        {/* Left: Record Types List */}
        <div className={styles.rtList}>
          <div className={styles.rtListHeader}>
            <span>{t('etl.record_types')}</span>
            <button className={styles.miniBtn} onClick={addRT}>+</button>
          </div>
          <div className={styles.rtListItems}>
            {preset.recordTypes.map((rt, i) => (
              <button 
                key={i} 
                className={`${styles.rtBtn} ${activeRTIndex === i ? styles.rtActive : ''}`}
                onClick={() => setActiveRTIndex(i)}
              >
                [{rt.trigger?.substring(0, 1) || 'D'}] {rt.name}
              </button>
            ))}
          </div>
        </div>

        {/* Center: Editor */}
        <div className={styles.editor}>
          {activeRT ? (
            <div className={styles.rtEditor}>
              <div className={styles.rtPropsGroup}>
                <h4 className={styles.groupTitle}>PROPIEDADES DEL TIPO SELECCIONADO</h4>
                
                <div className={styles.rtPropsRow}>
                  <div className={styles.techSummary}>
                    <div className={styles.techItem}>
                      <span className={styles.techLabel}>Nombre:</span> {activeRT.name}
                    </div>
                    <div className={styles.techItem}>
                      <span className={styles.techLabel}>Rol:</span> {activeRT.behavior}
                    </div>
                    {activeRT.trigger && (
                      <div className={styles.techItem}>
                        <span className={styles.techLabel}>Trigger:</span> "{activeRT.trigger}" @ {activeRT.triggerStart}
                      </div>
                    )}
                    {activeRT.range && (
                      <div className={styles.techItem}>
                        <span className={styles.techLabel}>Rango:</span> {activeRT.range}
                      </div>
                    )}
                  </div>

                  <div className={styles.groupActions}>
                    <button className={styles.gearBtn} onClick={() => setShowSampleModal(true)} title="Ver Fichero Muestra">
                      <EyeIcon size={20} />
                    </button>
                    <button className={styles.gearBtn} onClick={() => setShowRTModal(true)} title="Editar Propiedades">
                      <CogIcon size={20} />
                    </button>
                    <button className={styles.deleteBtnRed} onClick={removeRecordType} title="Borrar Tipo de Registro">
                      <TrashIcon size={18} />
                    </button>
                  </div>
                </div>
              </div>

              {/* Record Type Configuration Modal */}
              {showRTModal && (
                <div className={styles.modalOverlay}>
                  <div className={styles.modalContent}>
                    <div className={styles.modalHeader}>
                      <h3 className={styles.mainTitle}>CONFIGURACIÓN DE TIPO: {activeRT.name}</h3>
                      <button 
                        className={styles.miniBtn} 
                        onClick={() => setShowRTModal(false)}
                        style={{ padding: '8px 16px' }}
                      >
                        CERRAR [ESC]
                      </button>
                    </div>

                    <div className={styles.modalBody}>
                      <div className={styles.group}>
                        <h4 className={styles.groupTitle}>IDENTIFICACIÓN Y ROL</h4>
                        <div className={styles.modalRow}>
                          <div className={styles.field} style={{ flex: 1 }}>
                            <label>NOMBRE DEL TIPO</label>
                            <input 
                              value={activeRT.name} 
                              onChange={e => updateRT(activeRTIndex, { name: e.target.value })}
                              className={styles.input}
                            />
                          </div>
                          <div className={styles.field}>
                            <label>ROL / COMPORTAMIENTO</label>
                            <select 
                              value={activeRT.behavior} 
                              onChange={e => updateRT(activeRTIndex, { behavior: e.target.value as EtlRecordBehavior })}
                              className={styles.select}
                              style={{ width: '180px' }}
                            >
                              <option value="DATA">DATA (DATOS)</option>
                              <option value="HEADER">HEADER (CABECERA)</option>
                              <option value="FOOTER">FOOTER (PIE)</option>
                            </select>
                          </div>
                        </div>

                        <div className={styles.modalRow} style={{ marginTop: '16px' }}>
                          <div className={styles.field} style={{ flex: 1 }}>
                            <label>TRIGGER (DISPARADOR)</label>
                            <div style={{ display: 'flex', gap: '8px' }}>
                                <input 
                                  value={activeRT.trigger} 
                                  onChange={e => updateRT(activeRTIndex, { trigger: e.target.value })}
                                  className={styles.input}
                                  placeholder="Ej: ABC, ?BC, *BC"
                                />
                                <button 
                                  className={styles.helpBtn}
                                  onClick={() => alert('Ayuda de Triggers:\n\n• Texto normal: Coincisencia exacta.\n• ? : Cualquier carácter.\n• * : Espacio en blanco.')}
                                >
                                  ?
                                </button>
                            </div>
                          </div>
                          <div className={styles.field}>
                            <label>POSICIÓN TRIGGER</label>
                            <input 
                              type="number"
                              value={activeRT.triggerStart} 
                              onChange={e => updateRT(activeRTIndex, { triggerStart: parseInt(e.target.value) || 0 })}
                              className={styles.input}
                              style={{ width: '120px' }}
                            />
                          </div>
                          <div className={styles.field}>
                            <label>RANGO DE FILAS</label>
                            <input 
                              value={activeRT.range || ''} 
                              onChange={e => updateRT(activeRTIndex, { range: e.target.value })}
                              className={styles.input}
                              style={{ width: '120px' }}
                              placeholder="Ej: 1-2, 3"
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className={styles.modalActions}>
                      <button 
                        className={styles.undoBtn} 
                        onClick={undo}
                        disabled={undoStack.length === 0}
                        style={{ padding: '8px 24px', fontSize: '0.9rem' }}
                      >
                        DESHACER [CTRL+Z]
                      </button>
                    </div>
                  </div>
                </div>
              )}

              <div className={styles.fieldsSection}>
                <div className={styles.fieldsHeader}>
                  <span>
                    {t('etl.fields')} 
                    <small style={{ marginLeft: '12px', opacity: 0.7 }}>
                      {(() => {
                        const total = activeRT.fields.reduce((max, f) => Math.max(max, f.start + f.length), 0);
                        const isOver = activeRT.maxLength && total > activeRT.maxLength;
                        return (
                          <span style={{ color: isOver ? 'var(--accent-color)' : 'inherit' }}>
                            [TOTAL: {total}{activeRT.maxLength ? ` / ${activeRT.maxLength}` : ''}]
                            {isOver ? ' ⚠ OVER_LIMIT' : ''}
                          </span>
                        );
                      })()}
                    </small>
                  </span>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button 
                      onClick={() => {
                        if (!activeRT) return;
                        const sorted = [...activeRT.fields].sort((a,b) => a.start - b.start);
                        let pos = 0;
                        const compacted = sorted.map(f => {
                          const nf = { ...f, start: pos };
                          pos += f.length;
                          return nf;
                        });
                        updateRT(activeRTIndex, { fields: compacted });
                      }}
                      className={styles.miniBtn}
                      title="COMPACT"
                    >
                      ⇶
                    </button>
                    <button onClick={addField} className={styles.miniBtn}>+ ADD_FIELD</button>
                  </div>
                </div>
                <div className={styles.fieldsTable}>
                  <div className={styles.tableHead}>
                    <span style={{ width: '40px' }}>ST</span>
                    <span style={{ width: '40px' }}>LEN</span>
                    <span style={{ flex: 1 }}>NAME</span>
                  </div>
                  {[...activeRT.fields]
                    .sort((a, b) => (Number(a.start) || 0) - (Number(b.start) || 0))
                    .map((f, fi, arr) => {
                      const prev = arr[fi - 1];
                      const start = Number(f.start) || 0;
                      const len = Number(f.length) || 0;
                      const prevEnd = prev ? (Number(prev.start) || 0) + (Number(prev.length) || 0) : 0;
                      
                      const hasOverlap = prev && (prevEnd > start);
                      const hasGap = prev && (prevEnd < start);

                      return (
                        <div key={f.id || fi} className={`${styles.tableRow} ${hasOverlap ? styles.overlapRow : ''} ${hasGap ? styles.gapRow : ''}`}>
                          <input 
                            type="number" 
                            value={f.start} 
                            onChange={e => updateField(f.id, { start: Math.max(0, parseInt(e.target.value) || 0) })}
                            className={styles.tableInput}
                            style={{ width: '40px' }}
                          />
                          <input 
                            type="number" 
                            min="1"
                            value={f.length} 
                            onChange={e => updateField(f.id, { length: Math.max(1, parseInt(e.target.value) || 1) })}
                            className={styles.tableInput}
                            style={{ width: '40px' }}
                          />
                          <input 
                            value={f.name} 
                            onChange={e => updateField(f.id, { name: e.target.value })}
                            className={styles.tableInput}
                            style={{ flex: 1 }}
                          />
                          <div style={{ display: 'flex', gap: '4px' }}>
                            {hasOverlap && <span title="OVERLAP_ERROR" style={{ color: '#ff7777', fontWeight: 900 }}>⚠</span>}
                            {hasGap && <span title="GAP_DETECTED" style={{ color: 'var(--accent-color)', opacity: 0.5 }}>⬚</span>}
                            <button 
                              className={styles.removeField}
                              onClick={() => removeField(f.id)}
                            >
                              <TrashIcon size={14} />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>
            </div>
          ) : (
            <div className={styles.noRT}>{t('etl.record_types')} - SELECT_OR_CREATE</div>
          )}
        </div>
      </div>

      {/* Sample File Modal */}
      {showSampleModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent} style={{ height: '85vh', display: 'flex', flexDirection: 'column' }}>
            <div className={styles.modalHeader}>
              <h3 className={styles.mainTitle}>FICHERO DE MUESTRA</h3>
              <button 
                className={styles.miniBtn} 
                onClick={() => setShowSampleModal(false)}
                style={{ padding: '8px 16px' }}
              >
                CERRAR [ESC]
              </button>
            </div>
            
            <div className={styles.modalBody} style={{ flex: 1, minHeight: 0 }}>
              <SamplePreview preset={preset} activeRecordTypeName={activeRT?.name} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
