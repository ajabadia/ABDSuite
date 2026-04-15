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
import { EtlPreset } from '@/lib/types/etl.types';
import JSZip from 'jszip';
import { RefreshCwIcon, SaveIcon, SearchIcon } from '@/components/common/Icons';

const MappingMatrix: React.FC = () => {
  const presets = useLiveQuery(() => db.presets.toArray()) || [];
  const templates = useLiveQuery(() => db.letter_templates.toArray()) || [];
  
  const [selectedPresetId, setSelectedPresetId] = useState<number | null>(null);
  const [selectedTemplateId, setSelectedTemplateId] = useState<number | null>(null);
  const [templateVars, setTemplateVars] = useState<string[]>([]);
  const [currentMapping, setCurrentMapping] = useState<LetterMapping | null>(null);

  // Load Template Variables
  useEffect(() => {
    async function extractVars() {
      if (!selectedTemplateId) { setTemplateVars([]); return; }
      const template = templates.find(t => t.id === selectedTemplateId);
      if (!template) return;

      let vars: string[] = [];
      if (template.type === 'DOCX' && template.binaryContent) {
        const zip = await JSZip.loadAsync(template.binaryContent);
        const docXml = await zip.file('word/document.xml')?.async('text');
        if (docXml) {
          const regex = /\{\{(.*?)\}\}/g;
          let match;
          while ((match = regex.exec(docXml)) !== null) {
            vars.push(match[1].trim().replace(/<[^>]*>?/gm, ''));
          }
        }
      } else if (template.content) {
          const regex = /\{\{(.*?)\}\}/g;
          let match;
          while ((match = regex.exec(template.content)) !== null) {
            vars.push(match[1].trim());
          }
      }
      setTemplateVars(Array.from(new Set(vars)));
    }
    extractVars();
  }, [selectedTemplateId, templates]);

  // Load Mapping from DB
  useEffect(() => {
    if (selectedPresetId && selectedTemplateId) {
      db.letter_mappings
        .where({ etlPresetId: selectedPresetId, templateId: selectedTemplateId })
        .first()
        .then(m => setCurrentMapping(m || { 
            etlPresetId: selectedPresetId, 
            templateId: selectedTemplateId, 
            mappings: [], 
            updatedAt: Date.now() 
          })
        );
    } else {
      setCurrentMapping(null);
    }
  }, [selectedPresetId, selectedTemplateId]);

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
    if (!currentMapping || !selectedPresetId) return;
    const preset = presets.find(p => p.id === selectedPresetId);
    if (!preset) return;

    const fields = preset.recordTypes[0].fields;
    const newMappings: LetterMappingEntry[] = templateVars.map(v => {
      // Direct Match
      const match = fields.find(f => f.Name.toLowerCase() === v.toLowerCase());
      if (match) return { templateVar: v, sourceType: 'TEMPLATE', sourceField: match.Name };
      
      // Secondary GAWEB Logic
      const gaMatch = CANONICAL_GAWEB_FIELDS.find(g => g.label.toLowerCase() === v.toLowerCase());
      if (gaMatch) return { templateVar: v, sourceType: 'GAWEB', sourceField: gaMatch.key };

      return { templateVar: v, sourceType: 'UI_OVERRIDE', sourceField: '' };
    });

    setCurrentMapping({ ...currentMapping, mappings: newMappings });
  };

  const saveMapping = async () => {
    if (!currentMapping) return;
    try {
      await db.letter_mappings.put({ ...currentMapping, updatedAt: Date.now() });
      alert('MAPEO GUARDADO CORRECTAMENTE');
    } catch (err) { alert(`Error al guardar: ${err}`); }
  };

  return (
    <div className="flex-col" style={{ gap: '20px' }}>
      
      {/* Selector de Combinación */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', padding: '16px', border: '1px solid var(--border-color)', borderRadius: '8px' }}>
         <div className="flex-col" style={{ gap: '4px' }}>
            <label className="station-label">Paso A: Seleccionar Preset</label>
            <select className="station-select" value={selectedPresetId || ''} onChange={e => setSelectedPresetId(Number(e.target.value))}>
               <option value="">-- Preset GAWEB --</option>
               {presets.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
         </div>
         <div className="flex-col" style={{ gap: '4px' }}>
            <label className="station-label">Paso B: Seleccionar Plantilla Word</label>
            <select className="station-select" value={selectedTemplateId || ''} onChange={e => setSelectedTemplateId(Number(e.target.value))}>
               <option value="">-- Plantilla DOCX --</option>
               {templates.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
         </div>
      </div>

      {/* Acciones de Matriz */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
         <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
            <div style={{ display: 'flex', gap: '8px', fontSize: '0.7rem' }}>
               <span className="station-badge station-badge-blue" title="Word Variable">W</span>
               <span className="station-badge station-badge-green" title="GAWEB Field">G</span>
               <span className="station-badge station-badge-orange" title="UI Override">[*]</span>
            </div>
            <span style={{ fontSize: '0.8rem', opacity: 0.6 }}>Variables detectadas: {templateVars.length}</span>
         </div>
         <div style={{ display: 'flex', gap: '10px' }}>
            <button className="station-btn" onClick={handleAutoMap}><RefreshCwIcon size={14} /> Auto-Mapeo</button>
            <button className="station-btn station-btn-primary" onClick={saveMapping} disabled={!currentMapping}><SaveIcon size={14} /> Guardar Mapeo</button>
         </div>
      </div>

      {/* La Matriz */}
      <div className="station-table-container" style={{ minHeight: '400px' }}>
        <table className="station-table">
          <thead>
            <tr>
              <th style={{ width: '40px' }}>TIPO</th>
              <th>VARIABLE EN DOCUMENTO</th>
              <th>ORIGEN DE DATOS (FIELD)</th>
              <th style={{ width: '100px' }}>ESTADO</th>
            </tr>
          </thead>
          <tbody>
            {templateVars.length === 0 && (
              <tr>
                <td colSpan={4} style={{ textAlign: 'center', padding: '40px', opacity: 0.3 }}>
                  SELECCIONE UNA PLANTILLA PARA EXTRAER VARIABLES
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
                   <td style={{ fontWeight: 700 }}>{`{{${v}}}`}</td>
                   <td>
                      <select 
                        className="station-select" 
                        style={{ padding: '4px 8px', fontSize: '0.8rem' }}
                        value={map ? `${map.sourceType}:${map.sourceField}` : ''}
                        onChange={e => {
                           const [type, field] = e.target.value.split(':');
                           handleUpdateMapping(v, type as any, field);
                        }}
                      >
                         <option value="">-- Seleccionar Origen --</option>
                         <optgroup label="[CSV] Columnas del Preset">
                            {presets.find(p => p.id === selectedPresetId)?.recordTypes[0].fields.map(f => (
                               <option key={f.Name} value={`TEMPLATE:${f.Name}`}>{f.Name}</option>
                            ))}
                         </optgroup>
                         <optgroup label="[GAWEB] Campos Canónicos">
                            {CANONICAL_GAWEB_FIELDS.map(g => (
                               <option key={g.key} value={`GAWEB:${g.key}`}>{g.label}</option>
                            ))}
                         </optgroup>
                         <optgroup label="[P] Parámetros de Pantalla">
                            <option value="UI_OVERRIDE:FECHA_CARTA">Fecha de la Carta</option>
                            <option value="UI_OVERRIDE:LOTE">Número de Lote</option>
                            <option value="UI_OVERRIDE:OFICINA">Código de Oficina</option>
                         </optgroup>
                      </select>
                   </td>
                   <td>
                      {map ? <span className="txt-ok">Vinculado</span> : <span className="txt-err">Pendiente</span>}
                   </td>
                 </tr>
               );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default MappingMatrix;
