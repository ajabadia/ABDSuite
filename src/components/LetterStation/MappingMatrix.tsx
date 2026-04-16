'use client';

import React, { useState, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db/db';
import { 
  LetterTemplate, 
  LetterMapping, 
  LetterMappingEntry,
  CANONICAL_GAWEB_FIELDS 
} from '@/lib/types/letter.types';
import { 
  RefreshCwIcon, 
  SaveIcon, 
  SearchIcon,
  ListIcon,
  FileTextIcon,
  CogIcon,
  CheckCircleIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  AlertTriangleIcon,
  PlusIcon,
  TrashIcon,
  MapIcon,
  UploadIcon,
  DownloadIcon,
  XIcon,
  UndoIcon
} from '@/components/common/Icons';
import JSZip from 'jszip';

const MappingMatrix: React.FC = () => {
  const presets = useLiveQuery(() => db.presets.toArray()) || [];
  const templates = useLiveQuery(() => db.letter_templates.toArray()) || [];
  const allMappings = useLiveQuery(() => db.letter_mappings.toArray()) || [];
  
  const [selectedMappingId, setSelectedMappingId] = useState<number | null>(null);
  const [selectedPresetId, setSelectedPresetId] = useState<number | null>(null);
  const [selectedTemplateId, setSelectedTemplateId] = useState<number | null>(null);
  const [templateVars, setTemplateVars] = useState<string[]>([]);
  const [currentMapping, setCurrentMapping] = useState<LetterMapping | null>(null);

  const [isRegistryExpanded, setIsRegistryExpanded] = useState(true);
  const [isLinkerExpanded, setIsLinkerExpanded] = useState(true);
  
  // UI State
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [undoStack, setUndoStack] = useState<string[]>([]);

  // LOGIC: Select Mapping from Registry
  const handleSelectMapping = (mapping: LetterMapping) => {
    setSelectedMappingId(mapping.id!);
    setSelectedPresetId(mapping.etlPresetId);
    setSelectedTemplateId(mapping.templateId);
    setCurrentMapping(mapping);
    setIsRegistryExpanded(false);
    setIsLinkerExpanded(false); // Resource linker is secondary once loaded
  };

  const recordSnapshot = () => {
    if (currentMapping) setUndoStack(prev => [...prev.slice(-19), JSON.stringify(currentMapping)]);
  };

  const undo = () => {
    if (undoStack.length === 0) return;
    const last = undoStack[undoStack.length - 1];
    setUndoStack(prev => prev.slice(0, -1));
    setCurrentMapping(JSON.parse(last));
  };

  const handleNewMapping = async () => {
    const nextId = (allMappings.length > 0 ? Math.max(...allMappings.map(m => m.id || 0)) : 0) + 1;
    const name = `MAPEADO_AUTO_${nextId}_${new Date().toLocaleDateString().replace(/\//g, '')}`;
    
    const newMapping: LetterMapping = {
      name,
      etlPresetId: 0,
      templateId: 0,
      mappings: [],
      version: '1.0',
      isActive: false, // DRAFT por defecto
      updatedAt: Date.now()
    };

    const id = await db.letter_mappings.add(newMapping);
    
    setSelectedMappingId(id as number);
    setSelectedPresetId(0);
    setSelectedTemplateId(0);
    setCurrentMapping({ ...newMapping, id: id as number });
    
    setIsRegistryExpanded(false);
    setIsLinkerExpanded(true);
  };

  // Load Template Variables
  useEffect(() => {
    async function extractVars() {
      if (!selectedTemplateId) { setTemplateVars([]); return; }
      const template = templates.find(t => t.id === selectedTemplateId);
      if (!template) return;

      let vars: string[] = [];
      try {
        if (template.type === 'DOCX' && template.binaryContent) {
          const zip = await JSZip.loadAsync(template.binaryContent);
          const docXml = await zip.file('word/document.xml')?.async('text');
          if (docXml) {
            const regex = /\{\{(.*?)\}\}/g;
            let match;
            while ((match = regex.exec(docXml)) !== null) {
              const tag = match[1].trim().replace(/<[^>]*>?/gm, '');
              if (tag) vars.push(tag);
            }
          }
        } else if (template.content) {
          const regex = /\{\{(.*?)\}\}/g;
          let match;
          while ((match = regex.exec(template.content)) !== null) {
            vars.push(match[1].trim());
          }
        }
      } catch (e) {
        console.error("Error extracting variables", e);
      }
      setTemplateVars(Array.from(new Set(vars)));
    }
    extractVars();
  }, [selectedTemplateId, templates]);

  const handleUpdateMapping = (templateVar: string, sourceType: LetterMappingEntry['sourceType'], sourceField: string) => {
    if (!currentMapping) return;
    const newMappings = [...currentMapping.mappings];
    const idx = newMappings.findIndex(m => m.templateVar === templateVar);
    
    if (idx !== -1) {
      newMappings[idx] = { ...newMappings[idx], sourceType, sourceField };
    } else {
      newMappings.push({ templateVar, sourceType, sourceField });
    }
    setCurrentMapping({ ...currentMapping, mappings: newMappings });
  };

  const handleAutoMap = () => {
    if (!selectedPresetId || !templateVars.length || !currentMapping) return;
    const preset = presets.find(p => p.id === selectedPresetId);
    if (!preset) return;

    const fields = preset.recordTypes[0]?.fields || [];
    const newMappings: LetterMappingEntry[] = templateVars.map(v => {
      // Direct Match
      const match = fields.find(f => f.Name?.toLowerCase() === v.toLowerCase());
      if (match) return { templateVar: v, sourceType: 'TEMPLATE', sourceField: match.Name };
      
      // Secondary GAWEB Logic
      const gaMatch = CANONICAL_GAWEB_FIELDS.find(g => g.toLowerCase() === v.toLowerCase());
      if (gaMatch) return { templateVar: v, sourceType: 'GAWEB', sourceField: gaMatch };

      return { templateVar: v, sourceType: 'UI_OVERRIDE', sourceField: '' };
    });

    // CRITICAL: Ensure we update state with a fresh object
    recordSnapshot();
    setCurrentMapping({ ...currentMapping, mappings: newMappings });
  };

  const saveMapping = async () => {
    if (!currentMapping || !selectedPresetId || !selectedTemplateId) {
      alert("FALTAN DATOS DE VINCULACIÓN (PRESET Y PLANTILLA)");
      return;
    }
    try {
      recordSnapshot();
      const payload = { 
        ...currentMapping, 
        etlPresetId: selectedPresetId, 
        templateId: selectedTemplateId,
        updatedAt: Date.now() 
      };
      const id = await db.letter_mappings.put(payload);
      setSelectedMappingId(id);
      setIsLinkerExpanded(false); // Colapsar tras guardar para foco en la matriz si se desea
      alert('MAPEADO PERSISTIDO CON ÉXITO');
    } catch (err) { alert(`Error al guardar: ${err}`); }
  };

  const handleDeleteMapping = async (e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    if (confirm("¿ELIMINAR ESTE MAPEADO?")) {
      await db.letter_mappings.delete(id);
      if (selectedMappingId === id) setSelectedMappingId(null);
    }
  };

  const handleExportAll = async () => {
    const data = await db.letter_mappings.toArray();
    const exportPath = {
      type: 'abdfn_mappings_backup',
      payload: data,
      exportedAt: Date.now()
    };
    const blob = new Blob([JSON.stringify(exportPath, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ABDFN_MAPPINGS_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = async () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async (e: any) => {
      const file = e.target.files[0];
      if (file) {
        try {
          const text = await file.text();
          const data = JSON.parse(text);
          if (data.type === 'abdfn_mappings_backup' && Array.isArray(data.payload)) {
            for (const m of data.payload) {
              const { id, ...cleanMapping } = m; 
              await db.letter_mappings.add(cleanMapping);
            }
            alert('MAPEADOS IMPORTADOS CON ÉXITO.');
          } else {
            alert('FORMATO DE ARCHIVO NO VÁLIDO.');
          }
        } catch (err) {
          console.error('IMPORT_ERROR', err);
          alert('ERROR AL IMPORTAR ARCHIVO.');
        }
      }
    };
    input.click();
  };

  const selectedPreset = presets.find(p => p.id === selectedPresetId);
  const selectedTemplate = templates.find(t => t.id === selectedTemplateId);

  return (
    <div className="flex-col" style={{ gap: '24px' }}>
      
      {/* 1. REGISTRO MAESTRO DE MAPEOS - SIEMPRE AL INICIO (ESTÁNDAR) */}
      <section className="station-registry" style={{ marginBottom: '24px' }}>
         <header className="station-registry-header" onClick={() => setIsRegistryExpanded(!isRegistryExpanded)}>
            <div className="station-registry-title">
               <ListIcon size={18} /> MAPPINGS_REGISTRY ({allMappings.length})
            </div>
            {isRegistryExpanded ? <ChevronUpIcon size={20} /> : <ChevronDownIcon size={20} />}
         </header>
         <div className={`station-registry-anim-container ${isRegistryExpanded ? 'expanded' : ''}`}>
           <div className="station-registry-anim-content">
             <div className="station-registry-content" style={{ gap: '16px' }}>
                <div className="station-registry-actions" style={{ justifyContent: 'space-between' }}>
                   <div className="flex-row" style={{ gap: '8px' }}>
                     <button 
                        className="station-btn station-registry-btn-side" 
                        onClick={handleExportAll}
                        title="Exportar Mapeos (JSON↓)"
                     >
                        <DownloadIcon size={14} /> <span style={{fontSize: '0.65rem', fontWeight: 800}}>JSON↓</span>
                     </button>
                     <button 
                        className="station-btn station-registry-btn-side" 
                        onClick={handleImport}
                        title="Importar Mapeos (ALL↑)"
                     >
                        <UploadIcon size={14} /> <span style={{fontSize: '0.65rem', fontWeight: 800}}>ALL↑</span>
                     </button>
                   </div>

                   <button 
                      className="station-btn station-btn-primary station-registry-btn-main" 
                      onClick={handleNewMapping}
                      style={{ flex: 1, maxWidth: '300px' }}
                   >
                      [+] NUEVO MAPEADO INDUSTRIAL
                   </button>
                </div>
                
                <div className="flex-col" style={{ gap: '8px' }}>
                   <div className="station-registry-list">
                     {allMappings.length === 0 && (
                       <div className="station-empty-state" style={{ minHeight: '120px' }}>
                         <span className="station-shimmer-text">SIN MAPEOS REGISTRADOS</span>
                       </div>
                     )}
                     {allMappings.sort((a,b) => (b.id||0)-(a.id||0)).map(m => (
                       <div 
                         key={m.id} 
                         className={`station-registry-item ${selectedMappingId === m.id ? 'active' : ''}`}
                         onClick={() => handleSelectMapping(m)}
                       >
                         <div className="station-registry-item-left">
                           <div className="station-registry-item-icon"><MapIcon size={16} /></div>
                           <div className="station-registry-item-info">
                             <div className="flex-row" style={{ alignItems: 'center', gap: '8px' }}>
                               <span className="station-registry-item-name">{m.name}</span>
                               <span className={`station-badge ${m.isActive ? 'station-badge-green' : 'station-badge-orange'}`} style={{ fontSize: '0.6rem', padding: '1px 6px' }}>
                                 {m.isActive ? 'ACTIVO' : 'DRAFT'}
                               </span>
                             </div>
                             <span className="station-registry-item-meta">
                               v{m.version || '1.0'} • {presets.find(p => p.id === m.etlPresetId)?.name || '---'} {' -> '} 
                               {templates.find(t => t.id === m.templateId)?.name || '---'}
                             </span>
                           </div>
                         </div>
                         <div className="station-registry-item-actions">
                           <button className="station-registry-action-btn" onClick={(e) => handleDeleteMapping(e, m.id!)}>
                             <TrashIcon size={14} style={{ color: 'var(--status-err)' }} />
                           </button>
                         </div>
                       </div>
                     ))}
                   </div>
                </div>
             </div>
           </div>
         </div>
      </section>

      {/* 2. Cabecera Industrial Aseptic v4 - METADATOS DEL MAPEO */}
      {(selectedMappingId || currentMapping) && (
        <header className="station-card shadow-lg animate-in slide-in-from-top duration-500">
           <div className="station-panel-header" style={{ borderBottom: 'none', paddingBottom: 0, marginBottom: 0 }}>
              <div className="flex-col" style={{ gap: '4px' }}>
                <h2 className="station-title-main" style={{ margin: 0 }}>{currentMapping?.name}</h2>
                <div className="flex-row" style={{ alignItems: 'center', gap: '12px' }}>
                   <span style={{ opacity: 0.5, fontSize: '0.75rem', fontWeight: 700 }}>V{currentMapping?.version || '1.0'}</span>
                   <span className={`station-badge ${currentMapping?.isActive ? 'station-badge-green' : 'station-badge-orange'}`}>
                      {currentMapping?.isActive ? 'ACTIVO' : 'DRAFT'}
                   </span>
                </div>
              </div>

              <div className="flex-row" style={{ gap: '12px' }}>
                <button className="station-btn" onClick={undo} disabled={undoStack.length === 0} title="Deshacer"><UndoIcon size={16} /></button>
                <button className="station-btn" onClick={() => setShowConfigModal(true)} title="Configuración de Mapeo">
                  <CogIcon size={16} /> CONFIGURACIÓN
                </button>
                <button className="station-btn station-btn-primary" onClick={saveMapping}>
                  <SaveIcon size={16} /> GUARDAR TRANSFORMACIÓN
                </button>
              </div>
           </div>

           <div className="station-tech-summary" style={{ marginTop: '16px' }}>
              <div className="station-tech-item">
                <span className="station-tech-label">Origen (ETL):</span> {selectedPreset?.name || '---'}
              </div>
              <div className="station-tech-item">
                <span className="station-tech-label">Salida (Doc):</span> {selectedTemplate?.name || '---'}
              </div>
              <div className="station-tech-item">
                <span className="station-tech-label">Actualización:</span> {new Date(currentMapping?.updatedAt || 0).toLocaleString()}
              </div>
              <div className="station-tech-item">
                <span className="station-tech-label">Variables:</span> {templateVars.length}
              </div>
           </div>
        </header>
      )}

      {/* 3. CONFIGURADOR DE VÍNCULOS (RECURSOS) */}
      {(selectedMappingId || currentMapping) && (
        <section className="station-registry" style={{ marginBottom: '24px' }}>
           <header className="station-registry-header" onClick={() => setIsLinkerExpanded(!isLinkerExpanded)}>
              <div className="station-registry-title">
                 <CogIcon size={16} /> RESOURCE_LINKER (VINCULACIÓN)
                 {selectedPreset && selectedTemplate && !isLinkerExpanded && (
                   <span className="station-badge station-badge-blue" style={{ marginLeft: '12px', fontSize: '0.65rem' }}>
                     {selectedPreset.name} + {selectedTemplate.name}
                   </span>
                 )}
              </div>
              {isLinkerExpanded ? <ChevronUpIcon size={18} /> : <ChevronDownIcon size={18} />}
           </header>
           
           <div className={`station-registry-anim-container ${isLinkerExpanded ? 'expanded' : ''}`}>
             <div className="station-registry-anim-content">
               <div className="station-registry-content">
                  <div className="station-form-grid">
                    <div className="station-form-field">
                      <label className="station-label">RECURSO ETL (ALIMENTADOR)</label>
                      <select 
                        className="station-select" 
                        value={selectedPresetId || 0} 
                        onChange={e => setSelectedPresetId(parseInt(e.target.value))}
                      >
                        <option value={0}>-- SELECCIONAR ORIGEN --</option>
                        {presets.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                      </select>
                    </div>
                    <div className="station-form-field">
                      <label className="station-label">RECURSO PLANTILLA (ESTRUCTURA)</label>
                      <select 
                        className="station-select" 
                        value={selectedTemplateId || 0} 
                        onChange={e => setSelectedTemplateId(parseInt(e.target.value))}
                      >
                        <option value={0}>-- SELECCIONAR DESTINO --</option>
                        {templates.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                      </select>
                    </div>
                  </div>
                  
                  <div className="flex-row" style={{ justifyContent: 'flex-end', marginTop: '16px', gap: '8px' }}>
                    <button className="station-btn" onClick={() => setIsLinkerExpanded(false)}>
                      <ChevronUpIcon size={14} /> PLEGAR VINCULO
                    </button>
                    <button className="station-btn station-btn-primary" style={{ padding: '0 24px', height: '40px' }} onClick={() => setIsLinkerExpanded(false)}>
                      <CheckCircleIcon size={16} /> CONFIRMAR VÍNCULO
                    </button>
                  </div>
               </div>
             </div>
           </div>
        </section>
      )}

      {/* 4. MATRIZ DE MAPEADO TÉCNICO */}
      {selectedPresetId && selectedTemplateId && (
        <div className="flex-col fade-in" style={{ marginTop: '24px', gap: '20px' }}>
          <div className="station-toolbar">
             <div style={{ display: 'flex', gap: '24px', alignItems: 'center' }}>
                <div style={{ display: 'flex', gap: '8px' }}>
                   <span className="station-badge station-badge-blue">W</span>
                   <span className="station-badge station-badge-green">G</span>
                   <span className="station-badge station-badge-orange">*</span>
                </div>
                <span style={{ fontWeight: 800, fontSize: '0.8rem' }}>
                   VARIABLES DETECTADAS: {templateVars.length}
                </span>
             </div>
             <div style={{ display: 'flex', gap: '12px' }}>
                <button className="station-btn" onClick={handleAutoMap}>
                   <RefreshCwIcon size={14} /> AUTO-MAPEO
                </button>
                <button className="station-btn station-btn-primary" onClick={saveMapping}>
                   <SaveIcon size={14} /> PERSISTIR MAPEADO
                </button>
             </div>
          </div>

          <div className="station-table-container">
            <table className="station-table">
              <thead>
                <tr>
                  <th style={{ width: '40px' }}>TIPO</th>
                  <th>ETIQUETA EN PLANTILLA</th>
                  <th>ORIGEN DE DATOS</th>
                  <th style={{ width: '120px' }}>ESTADO</th>
                </tr>
              </thead>
              <tbody>
                {templateVars.length === 0 && (
                  <tr>
                    <td colSpan={4} style={{ textAlign: 'center', padding: '60px', opacity: 0.3 }}>
                       <div style={{ fontWeight: 800 }}>NO SE HAN DETECTADO ETIQUETAS {"{{TAG}}"}</div>
                    </td>
                  </tr>
                )}
                {templateVars.map(v => {
                   const map = currentMapping?.mappings.find(m => m.templateVar === v);
                   return (
                     <tr key={v}>
                       <td>
                          {map?.sourceType === 'TEMPLATE' && <span className="station-badge station-badge-blue">W</span>}
                          {map?.sourceType === 'GAWEB' && <span className="station-badge station-badge-green">G</span>}
                          {map?.sourceType === 'UI_OVERRIDE' && <span className="station-badge station-badge-orange">*</span>}
                          {!map && <span style={{ opacity: 0.2 }}>?</span>}
                       </td>
                       <td style={{ fontWeight: 800 }}>{`{{${v}}}`}</td>
                       <td>
                          <select 
                            className="station-select" 
                            style={{ padding: '6px 12px', fontSize: '0.8rem' }}
                            value={map ? `${map.sourceType}:${map.sourceField}` : ''}
                            onChange={e => {
                               const [type, field] = e.target.value.split(':');
                               handleUpdateMapping(v, type as any, field);
                            }}
                          >
                             <option value="">-- SELECCIONAR ORIGEN --</option>
                             <optgroup label="[CSV] COLUMNAS DEL PRESET SELECCIONADO">
                                {selectedPreset?.recordTypes[0]?.fields.map((f, idx) => (
                                   <option key={`${f.Name}-${idx}`} value={`TEMPLATE:${f.Name}`}>{f.Name}</option>
                                ))}
                             </optgroup>
                             <optgroup label="[GAWEB] CAMPOS TÉCNICOS CANÓNICOS">
                                {CANONICAL_GAWEB_FIELDS.map(g => (
                                   <option key={g} value={`GAWEB:${g}`}>{g}</option>
                                ))}
                             </optgroup>
                             <optgroup label="[P] PARÁMETROS DINÁMICOS">
                                <option key="ui-fecha" value="UI_OVERRIDE:FECHA_CARTA">Fecha de la Carta</option>
                                <option key="ui-lote" value="UI_OVERRIDE:LOTE">Número de Lote</option>
                                <option key="ui-oficina" value="UI_OVERRIDE:OFICINA">Código de Oficina</option>
                             </optgroup>
                          </select>
                       </td>
                       <td>
                          {map ? (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--status-ok)', fontWeight: 700 }}>
                               <CheckCircleIcon size={14} /> VINCULADO
                            </div>
                          ) : (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--status-err)', opacity: 0.6 }}>
                               <AlertTriangleIcon size={14} /> PENDIENTE
                            </div>
                          )}
                       </td>
                     </tr>
                   );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
      {/* Modal de Configuración de Mapeo */}
      {showConfigModal && (
        <div className="station-modal-overlay" onClick={() => setShowConfigModal(false)}>
          <div className="station-modal" style={{ maxWidth: '500px' }} onClick={e => e.stopPropagation()}>
            <header className="station-modal-header">
              <h3 className="station-registry-item-name" style={{ fontSize: '1.1rem' }}>CONFIGURACIÓN DEL MAPEADO</h3>
              <button className="station-btn" style={{ border: 'none', padding: '4px' }} onClick={() => setShowConfigModal(false)}><XIcon size={20} /></button>
            </header>
            <div className="station-modal-content">
              <div className="station-form-grid">
                <div className="station-form-field full">
                  <label className="station-label">Nombre del Mapeado</label>
                  <input className="station-input" value={currentMapping?.name} onChange={e => setCurrentMapping({...currentMapping!, name: e.target.value.toUpperCase()})} />
                </div>
                <div className="station-form-field">
                  <label className="station-label">Versión</label>
                  <input className="station-input" value={currentMapping?.version || '1.0'} onChange={e => setCurrentMapping({...currentMapping!, version: e.target.value})} />
                </div>
                <div className="station-form-field full">
                   <div className="flex-row" style={{ gap: '12px', marginTop: '8px' }}>
                    <input type="checkbox" id="map-active" checked={currentMapping?.isActive} onChange={e => setCurrentMapping({...currentMapping!, isActive: e.target.checked})} />
                    <label htmlFor="map-active" className="station-label" style={{ marginBottom: 0 }}>Mapeado activo para producción</label>
                   </div>
                </div>
              </div>
            </div>
            <footer className="station-modal-footer">
               <button className="station-btn station-btn-primary" style={{ width: '100%' }} onClick={() => setShowConfigModal(false)}>ACEPTAR Y CERRAR</button>
            </footer>
          </div>
        </div>
      )}
    </div>
  );
};

export default MappingMatrix;
