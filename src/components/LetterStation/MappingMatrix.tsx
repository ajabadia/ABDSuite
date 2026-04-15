'use client';

import React, { useState } from 'react';
import { useLanguage } from '@/lib/context/LanguageContext';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db/db';
import { 
  LetterMapping, 
  CANONICAL_GAWEB_FIELDS, 
  UI_OVERRIDE_MAPPING,
  MappingSourceType
} from '@/lib/types/letter.types';
import { TrashIcon } from '@/components/common/Icons';

const MappingMatrix: React.FC = () => {
  const { t } = useLanguage();
  
  const templates = useLiveQuery(() => db.letter_templates.toArray()) || [];
  const presets = useLiveQuery(() => db.presets.toArray()) || [];
  const mappings = useLiveQuery(() => db.letter_mappings.toArray()) || [];

  const [selectedMappingId, setSelectedMappingId] = useState<number | null>(null);
  const [activeMapping, setActiveMapping] = useState<Partial<LetterMapping>>({
    name: 'NEW_MAPPING',
    mappings: []
  });

  const extractVariables = (html: string): string[] => {
    const regex = /\{\{(.*?)\}\}/g;
    const matches = new Set<string>();
    let match;
    while ((match = regex.exec(html)) !== null) {
      matches.add(match[1].trim());
    }
    return Array.from(matches);
  };

  const handleSelectMapping = (m: LetterMapping) => {
    setSelectedMappingId(m.id || null);
    setActiveMapping(m);
  };

  const currentTemplate = templates.find(t => t.id === activeMapping.templateId);
  const currentPreset = presets.find(p => p.id === activeMapping.etlPresetId);

  const templateVars = currentTemplate ? extractVariables(currentTemplate.content) : [];
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

    templateVars.forEach(v => {
      const alreadyMapped = newMappings.find(m => m.templateVar === v && m.sourceType === 'TEMPLATE');
      if (alreadyMapped) return;
      const normV = normalize(v);
      const match = uniqueFields.find(f => normalize(f) === normV);
      if (match) newMappings.push({ templateVar: v, sourceField: match, sourceType: 'TEMPLATE' });
    });

    CANONICAL_GAWEB_FIELDS.forEach(f => {
      const alreadyMapped = newMappings.find(m => m.templateVar === f && m.sourceType === 'GAWEB');
      if (alreadyMapped) return;
      const normF = normalize(f);
      const match = uniqueFields.find(cf => normalize(cf) === normF);
      if (match) newMappings.push({ templateVar: f, sourceField: match, sourceType: 'GAWEB' });
    });

    setActiveMapping({ ...activeMapping, mappings: newMappings });
  };

  const handleSave = async () => {
    if (!activeMapping.templateId || !activeMapping.etlPresetId || !activeMapping.name) {
      alert('REQUIRED_FIELDS_MISSING');
      return;
    }
    const payload = { ...activeMapping, updatedAt: Date.now() } as LetterMapping;
    if (selectedMappingId) {
      await db.letter_mappings.update(selectedMappingId, payload);
    } else {
      const id = await db.letter_mappings.add(payload);
      setSelectedMappingId(id as number);
    }
    alert('MAPPING_SAVED');
  };

  const matrixGridStyle = { display: 'grid', gridTemplateColumns: '40px 180px 220px 1fr 120px', gap: '15px' };

  const renderMappingRow = (label: string, type: MappingSourceType) => {
    const mapping = activeMapping.mappings?.find(m => m.templateVar === label && m.sourceType === type);
    const isOverride = type === 'GAWEB' && UI_OVERRIDE_MAPPING[label];
    
    return (
      <div key={`${type}-${label}`} className="station-matrix-row" style={matrixGridStyle}>
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          {type === 'TEMPLATE' && <span className="station-badge station-badge-blue">W</span>}
          {type === 'GAWEB' && !isOverride && <span className="station-badge station-badge-green">G</span>}
          {isOverride && <span className="station-badge station-badge-orange">*</span>}
        </div>
        <div style={{ fontWeight: 700, opacity: 0.9 }}>
          {type === 'GAWEB' ? t(`audit.fields.${label}`) : label}
        </div>
        <div>
          <select 
            className="station-select"
            style={{ padding: '4px', fontSize: '0.8rem' }}
            value={mapping?.sourceField || ''}
            onChange={(e) => updateMapping(label, e.target.value, type)}
          >
            <option value="">{isOverride ? '-- DESDE PANTALLA --' : '-- SIN MAPEAR --'}</option>
            {uniqueFields.map(f => <option key={f} value={f}>{f}</option>)}
          </select>
        </div>
        <div style={{ fontStyle: 'italic', opacity: 0.5, fontSize: '0.75rem', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {mapping ? 'PROBE_VALUE' : (isOverride ? 'FLASH_VALUE' : '')}
        </div>
        <div className={`txt-ok`} style={{ textAlign: 'right', fontSize: '0.75rem', opacity: mapping ? 1 : 0.4 }}>
           {mapping ? '✓ OK' : (isOverride ? '⚡ READY' : '⏸ IDLE')}
        </div>
      </div>
    );
  };

  return (
    <div style={{ display: 'flex', height: '100%', gap: '1px', background: 'var(--border-color)' }}>
      <aside style={{ width: '280px', background: 'var(--bg-color)', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '20px' }}>
          <button className="station-btn" style={{ width: '100%' }} onClick={() => { setSelectedMappingId(null); setActiveMapping({ name: 'NEW_MAPPING', mappings: [] }); }}>
            + NEW_MAPPING
          </button>
        </div>
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {mappings.map(m => (
            <div 
              key={m.id} 
              className={`nav-item ${selectedMappingId === m.id ? 'active' : ''}`} 
              style={{ borderBottom: '1px solid var(--border-color)', padding: '12px 20px' }}
              onClick={() => handleSelectMapping(m)}
            >
              <span>{m.name}</span>
              <button className="station-btn" style={{ padding: '4px', background: 'transparent', boxShadow: 'none', border: 'none' }} onClick={(e) => { e.stopPropagation(); m.id && db.letter_mappings.delete(m.id); }}>
                <TrashIcon size={14} />
              </button>
            </div>
          ))}
        </div>
      </aside>

      <main style={{ flex: 1, background: 'var(--bg-color)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
         <header style={{ padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)' }}>
            <div className="flex-row" style={{ fontSize: '0.75rem', opacity: 0.8, gap: '15px' }}>
               <span>LEYENDA:</span>
               <span className="station-badge station-badge-blue">W</span> TEMPLATE
               <span className="station-badge station-badge-green">G</span> GAWEB
               <span className="station-badge station-badge-orange">*</span> SCREEN
            </div>
            <button className="station-btn station-btn-primary" onClick={handleSave}>SAVE_MAPPING</button>
         </header>

         <div className="flex-col" style={{ padding: '20px', borderBottom: '1px solid var(--border-color)', background: 'rgba(0,0,0,0.05)' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '20px', alignItems: 'center' }}>
               <label className="station-label">MAPPING_NAME:</label>
               <input className="station-input" value={activeMapping.name} onChange={(e) => setActiveMapping({...activeMapping, name: e.target.value})} />
            </div>
            <div className="grid-2">
               <div>
                  <label className="station-label">SOURCE (ETL PRESET):</label>
                  <select className="station-select" value={activeMapping.etlPresetId} onChange={(e) => setActiveMapping({...activeMapping, etlPresetId: Number(e.target.value)})}>
                    <option value="">-- SELECT PRESET --</option>
                    {presets.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
               </div>
               <div>
                  <label className="station-label">TARGET (TEMPLATE):</label>
                  <select className="station-select" value={activeMapping.templateId} onChange={(e) => setActiveMapping({...activeMapping, templateId: Number(e.target.value)})}>
                    <option value="">-- SELECT TEMPLATE --</option>
                    {templates.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                  </select>
               </div>
            </div>
         </div>

         {activeMapping.templateId && activeMapping.etlPresetId ? (
           <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
              <div style={{ ...matrixGridStyle, padding: '10px 15px', background: 'var(--border-color)', color: 'var(--bg-color)', fontWeight: 900, fontSize: '0.75rem', textTransform: 'uppercase' }}>
                <div />
                <div>CAMPO/VAR</div>
                <div>COLUMNA_ETL</div>
                <div>EJEMPLO</div>
                <div style={{ textAlign: 'right' }}>ESTADO</div>
              </div>
              
              <div style={{ flex: 1, overflowY: 'auto' }}>
                {templateVars.map(v => renderMappingRow(v, 'TEMPLATE'))}
                <div className="separator-industrial">CAMPOS GAWEB CANÓNICOS</div>
                {CANONICAL_GAWEB_FIELDS.map(f => renderMappingRow(f, 'GAWEB'))}
              </div>

              <footer style={{ padding: '20px', borderTop: 'var(--border-thick) solid var(--border-color)', display: 'flex', gap: '20px' }}>
                <button className="station-btn" style={{ background: '#1e88e5', color: '#fff' }} onClick={handleAutoMap}>AUTO-MAPEAR</button>
                <button className="station-btn" onClick={() => setActiveMapping({...activeMapping, mappings: []})}>LIMPIAR_TODO</button>
              </footer>
           </div>
         ) : (
           <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0.3, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '4px' }}>
             SELECCIONE PRESET Y PLANTILLA PARA ACTIVAR MATRIZ
           </div>
         )}
      </main>
    </div>
  );
};

export default MappingMatrix;
