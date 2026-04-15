'use client';

import React, { useState, useEffect } from 'react';
import { useLanguage } from '@/lib/context/LanguageContext';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db/db';
import { 
  LetterMapping, 
  CANONICAL_GAWEB_FIELDS, 
  UI_OVERRIDE_MAPPING,
  MappingSourceType,
  VariableMapping
} from '@/lib/types/letter.types';
import { TrashIcon, CheckIcon, AlertTriangleIcon, ActivityIcon } from '@/components/common/Icons';
import JSZip from 'jszip';

const MappingMatrix: React.FC = () => {
  const { t } = useLanguage();
  
  const templates = useLiveQuery(() => db.letter_templates.toArray()) || [];
  const presets = useLiveQuery(() => db.presets.toArray()) || [];
  const mappings = useLiveQuery(() => db.letter_mappings.toArray()) || [];

  const [selectedMappingId, setSelectedMappingId] = useState<number | null>(null);
  const [activeMapping, setActiveMapping] = useState<Partial<LetterMapping>>({
    name: 'NUEVO_MAPEO',
    mappings: []
  });
  const [extractedVars, setExtractedVars] = useState<string[]>([]);
  const [isExtracting, setIsExtracting] = useState(false);

  // Extract variables (supports HTML and DOCX)
  useEffect(() => {
    const fetchVars = async () => {
      const template = templates.find(t => t.id === activeMapping.templateId);
      if (!template) {
        setExtractedVars([]);
        return;
      }

      setIsExtracting(true);
      try {
        if (template.type === 'DOCX' && template.binaryContent) {
          const zip = await JSZip.loadAsync(template.binaryContent);
          const docXml = await zip.file('word/document.xml')?.async('text');
          if (docXml) {
            const regex = /\{\{(.*?)\}\}/g;
            const matches = new Set<string>();
            let match;
            while ((match = regex.exec(docXml)) !== null) {
              matches.add(match[1].trim().replace(/<[^>]*>?/gm, '')); // Clean XML tags inside var
            }
            setExtractedVars(Array.from(matches));
          }
        } else if (template.type === 'HTML' && template.content) {
          const regex = /\{\{(.*?)\}\}/g;
          const matches = new Set<string>();
          let match;
          while ((match = regex.exec(template.content)) !== null) {
            matches.add(match[1].trim());
          }
          setExtractedVars(Array.from(matches));
        }
      } catch (err) {
        console.error('Extraction error:', err);
      }
      setIsExtracting(false);
    };

    fetchVars();
  }, [activeMapping.templateId, templates]);

  const handleSelectMapping = (m: LetterMapping) => {
    setSelectedMappingId(m.id || null);
    setActiveMapping(m);
  };

  const currentPreset = presets.find(p => p.id === activeMapping.etlPresetId);
  const presetFields = currentPreset ? currentPreset.recordTypes.flatMap(rt => rt.fields.map(f => f.Name || (f as any).name)) : [];
  const uniqueFields = Array.from(new Set(presetFields));

  const updateMapping = (templateVar: string, sourceField: string, sourceType: MappingSourceType) => {
    const newMappings = [...(activeMapping.mappings || [])].filter(m => !(m.templateVar === templateVar && m.sourceType === sourceType));
    if (sourceField) {
      newMappings.push({ templateVar, sourceField, sourceType });
    }
    setActiveMapping({ ...activeMapping, mappings: newMappings });
  };

  const handleAutoMap = () => {
    if (uniqueFields.length === 0) return;
    const normalize = (s: string) => s.replace(/_|\s|-/g, '').toLowerCase();
    const newMappings = [...(activeMapping.mappings || [])];

    extractedVars.forEach(v => {
      if (newMappings.find(m => m.templateVar === v && m.sourceType === 'TEMPLATE')) return;
      const match = uniqueFields.find(f => normalize(f) === normalize(v));
      if (match) newMappings.push({ templateVar: v, sourceField: match, sourceType: 'TEMPLATE' });
    });

    CANONICAL_GAWEB_FIELDS.forEach(f => {
      if (newMappings.find(m => m.templateVar === f && m.sourceType === 'GAWEB')) return;
      const match = uniqueFields.find(cf => normalize(cf) === normalize(f));
      if (match) newMappings.push({ templateVar: f, sourceField: match, sourceType: 'GAWEB' });
    });

    setActiveMapping({ ...activeMapping, mappings: newMappings });
  };

  const handleSave = async () => {
    if (!activeMapping.templateId || !activeMapping.etlPresetId || !activeMapping.name) {
      alert('Faltan campos obligatorios (Nombre, Preset o Plantilla)');
      return;
    }
    const payload = { ...activeMapping, updatedAt: Date.now() } as LetterMapping;
    if (selectedMappingId) {
      await db.letter_mappings.update(selectedMappingId, payload);
    } else {
      const id = await db.letter_mappings.add(payload);
      setSelectedMappingId(id as number);
    }
  };

  const renderMappingRow = (label: string, type: MappingSourceType) => {
    const mapping = activeMapping.mappings?.find(m => m.templateVar === label && m.sourceType === type);
    const isOverride = type === 'GAWEB' && UI_OVERRIDE_MAPPING[label];
    
    return (
      <div key={`${type}-${label}`} style={{ display: 'grid', gridTemplateColumns: '50px 220px 250px 1fr 120px', gap: '5px', padding: '4px 15px', borderBottom: '1px solid #eee', alignItems: 'center', background: mapping ? '#f8f9ff' : 'transparent' }}>
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          {type === 'TEMPLATE' && <span style={{ background: '#337ab7', color: '#fff', padding: '2px 6px', fontSize: '0.65rem', fontWeight: 900, borderRadius: '2px' }}>W</span>}
          {type === 'GAWEB' && !isOverride && <span style={{ background: '#5cb85c', color: '#fff', padding: '2px 6px', fontSize: '0.65rem', fontWeight: 900, borderRadius: '2px' }}>G</span>}
          {isOverride && <span style={{ background: '#f0ad4e', color: '#fff', padding: '2px 6px', fontSize: '0.65rem', fontWeight: 900, borderRadius: '2px' }}>*</span>}
        </div>
        <div style={{ fontSize: '0.8rem', fontWeight: mapping ? 900 : 400, color: mapping ? '#000' : '#666' }}>{label}</div>
        <div>
          <select 
            className="station-select"
            style={{ padding: '2px', fontSize: '0.75rem', height: '24px' }}
            value={mapping?.sourceField || ''}
            onChange={(e) => updateMapping(label, e.target.value, type)}
          >
            <option value="">{isOverride ? '-- DESDE PANTALLA --' : '-- Sin mapear --'}</option>
            {uniqueFields.map(f => <option key={f} value={f}>{f}</option>)}
          </select>
        </div>
        <div style={{ fontSize: '0.75rem', color: mapping ? '#333' : '#999', fontStyle: 'italic' }}>
          {mapping ? 'Ejemplo de dato...' : (isOverride ? 'Parámetro pantalla principal' : '')}
        </div>
        <div style={{ textAlign: 'right', fontSize: '0.7rem', fontWeight: 900, color: mapping ? '#5cb85c' : (isOverride ? '#f0ad4e' : '#999') }}>
           {mapping ? '✓ Mapeado' : (isOverride ? '⚡ Pantalla' : '⏸ Sin mapear')}
        </div>
      </div>
    );
  };

  return (
    <div style={{ display: 'flex', height: '100%', gap: '1px', background: '#ccc' }}>
      <aside style={{ width: '250px', background: '#f0f0f0', borderRight: '1px solid #aaa', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '15px' }}>
          <button className="station-btn" style={{ width: '100%', fontWeight: 900 }} onClick={() => { setSelectedMappingId(null); setActiveMapping({ name: 'NUEVO_MAPEO', mappings: [] }); }}>
            + NUEVO MAPEO
          </button>
        </div>
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {mappings.map(m => (
            <div 
              key={m.id} 
              style={{ padding: '10px 15px', borderBottom: '1px solid #ddd', cursor: 'pointer', background: selectedMappingId === m.id ? '#fff' : 'transparent', fontWeight: selectedMappingId === m.id ? 900 : 400 }}
              onClick={() => handleSelectMapping(m)}
            >
              {m.name}
            </div>
          ))}
        </div>
      </aside>

      <main style={{ flex: 1, background: '#fff', display: 'flex', flexDirection: 'column' }}>
         <header style={{ padding: '10px 15px', background: '#ffffdd', borderBottom: '1px solid #eedd88', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 900, display: 'flex', gap: '15px' }}>
               <span>LEYENDA:</span>
               <span><span style={{ background: '#337ab7', color: '#fff', padding: '1px 4px', marginRight: '4px' }}>W</span> Variable Word</span>
               <span><span style={{ background: '#5cb85c', color: '#fff', padding: '1px 4px', marginRight: '4px' }}>G</span> Campo GAWEB</span>
               <span><span style={{ background: '#f0ad4e', color: '#fff', padding: '1px 4px', marginRight: '4px' }}>*</span> Valor Pantalla</span>
            </div>
            <button className="station-btn station-btn-primary" style={{ padding: '4px 15px' }} onClick={handleSave}>GUARDAR MAPEO</button>
         </header>

         <div style={{ padding: '15px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', background: '#f9f9f9', borderBottom: '1px solid #eee' }}>
            <div className="flex-col">
              <label style={{ fontSize: '0.65rem', fontWeight: 900, color: '#666' }}>NOMBRE DEL MAPEO:</label>
              <input className="station-input" value={activeMapping.name} onChange={(e) => setActiveMapping({...activeMapping, name: e.target.value})} />
            </div>
            <div className="flex-row" style={{ gap: '15px' }}>
               <div className="flex-col" style={{ flex: 1 }}>
                  <label style={{ fontSize: '0.65rem', fontWeight: 900, color: '#666' }}>ETL PRESET ORIGEN:</label>
                  <select className="station-select" value={activeMapping.etlPresetId} onChange={(e) => setActiveMapping({...activeMapping, etlPresetId: Number(e.target.value)})}>
                    <option value="">-- Seleccionar --</option>
                    {presets.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
               </div>
               <div className="flex-col" style={{ flex: 1 }}>
                  <label style={{ fontSize: '0.65rem', fontWeight: 900, color: '#666' }}>PLANTILLA WORD/HTML:</label>
                  <select className="station-select" value={activeMapping.templateId} onChange={(e) => setActiveMapping({...activeMapping, templateId: Number(e.target.value)})}>
                    <option value="">-- Seleccionar --</option>
                    {templates.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                  </select>
               </div>
            </div>
         </div>

         <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '50px 220px 250px 1fr 120px', gap: '5px', padding: '5px 15px', background: '#eee', fontSize: '0.7rem', fontWeight: 900, borderBottom: '1px solid #ccc' }}>
              <div />
              <div>CAMPO/VARIABLE</div>
              <div>COLUMNA CSV/EXCEL</div>
              <div>EJEMPLO</div>
              <div style={{ textAlign: 'right' }}>ESTADO</div>
            </div>
            <div style={{ flex: 1, overflowY: 'auto' }}>
              {isExtracting && <div style={{ padding: '20px', textAlign: 'center', fontSize: '0.8rem', opacity: 0.5 }}>Escanenado variables del documento...</div>}
              {extractedVars.map(v => renderMappingRow(v, 'TEMPLATE'))}
              <div style={{ padding: '5px 15px', background: '#f0f0f0', fontSize: '0.65rem', fontWeight: 900, color: '#888', borderBottom: '1px solid #ddd' }}>— CAMPOS GAWEB —</div>
              {CANONICAL_GAWEB_FIELDS.map(f => renderMappingRow(f, 'GAWEB'))}
            </div>
         </div>

         <footer style={{ padding: '10px 15px', borderTop: '2px solid #ccc', background: '#f0f0f0', display: 'flex', gap: '15px' }}>
            <button className="station-btn" style={{ background: '#fff', padding: '5px 15px' }} onClick={handleAutoMap}>Auto-Mapear</button>
            <button className="station-btn" style={{ background: '#fff', padding: '5px 15px' }} onClick={() => setActiveMapping({...activeMapping, mappings: []})}>Limpiar</button>
         </footer>
      </main>
    </div>
  );
};

export default MappingMatrix;
