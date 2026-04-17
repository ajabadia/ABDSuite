'use client';

import React, { useState, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db/db';
import { 
  LetterTemplate, 
  LetterMapping, 
  VariableMapping,
  CANONICAL_GAWEB_FIELDS 
} from '@/lib/types/letter.types';
import { 
  RefreshCwIcon, 
  SaveIcon, 
  SearchIcon,
  ListIcon,
  FileTextIcon,
  CogIcon,
  ArrowDownIcon,
  ArrowUpIcon,
  CheckCircleIcon,
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
import { useLanguage } from '@/lib/context/LanguageContext';

const MappingMatrix: React.FC = () => {
  const { t } = useLanguage();
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
    setIsLinkerExpanded(false);
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
    const name = `MAPEADO_AUTO_${nextId}`;
    
    const newMapping: LetterMapping = {
      name,
      etlPresetId: 0,
      templateId: 0,
      mappings: [],
      version: '1.0',
      isActive: false,
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
          const xmlFiles = Object.keys(zip.files).filter(name => name.endsWith('.xml'));
          const tagRegex = /\{\{(.*?)\}\}/g;
          for (const name of xmlFiles) {
             const content = await zip.file(name)?.async('text');
             if (content) {
                let match;
                while ((match = tagRegex.exec(content)) !== null) {
                   const tag = match[1].trim().replace(/<[^>]*>?/gm, '');
                   if (tag) vars.push(tag);
                }
             }
          }
        } else if (template.content) {
          const regex = /\{\{(.*?)\}\}/g;
          let match;
          while ((match = regex.exec(template.content)) !== null) {
            vars.push(match[1].trim());
          }
        }
      } catch (e) { console.error(e); }
      setTemplateVars(Array.from(new Set(vars)));
    }
    extractVars();
  }, [selectedTemplateId, templates]);

  const handleUpdateMapping = (templateVar: string, sourceType: VariableMapping['sourceType'], sourceField: string) => {
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
    const dataRT = preset.recordTypes.find(rt => rt.name === 'DATA') || preset.recordTypes[0];
    const fields = dataRT?.fields || [];
    const newMappings: VariableMapping[] = templateVars.map(v => {
      // Direct Match con normalización robusta
      const match = fields.find(f => {
         const fName = (f.name || "").toLowerCase();
         return fName === v.toLowerCase();
      });
      if (match) return { templateVar: v, sourceType: 'TEMPLATE', sourceField: match.name };
      const gaMatch = CANONICAL_GAWEB_FIELDS.find(g => g.toLowerCase() === v.toLowerCase());
      if (gaMatch) return { templateVar: v, sourceType: 'GAWEB', sourceField: gaMatch };
      return { templateVar: v, sourceType: 'UI_OVERRIDE', sourceField: '' };
    });
    recordSnapshot();
    setCurrentMapping({ ...currentMapping, mappings: newMappings });
  };

  const saveMapping = async () => {
    if (!currentMapping || !selectedPresetId || !selectedTemplateId) {
      return;
    }
    try {
      recordSnapshot();
      const payload = { ...currentMapping, etlPresetId: selectedPresetId, templateId: selectedTemplateId, updatedAt: Date.now() };
      const id = await db.letter_mappings.put(payload);
      setSelectedMappingId(id);
      setIsLinkerExpanded(false);
    } catch (err) {}
  };

  const handleDeleteMapping = async (e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    if (confirm(t('common.confirm_delete').toUpperCase())) {
      await db.letter_mappings.delete(id);
      if (selectedMappingId === id) setSelectedMappingId(null);
    }
  };

  const handleExportAll = async () => {
    const data = await db.letter_mappings.toArray();
    const exportPath = { type: 'abdfn_mappings_backup', payload: data, exportedAt: Date.now() };
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
          }
        } catch (err) {}
      }
    };
    input.click();
  };

  const selectedPreset = presets.find(p => p.id === selectedPresetId);
  const selectedTemplate = templates.find(t => t.id === selectedTemplateId);
  const dataRT = selectedPreset?.recordTypes.find(rt => rt.name === 'DATA') || selectedPreset?.recordTypes[0];

  return (
    <div className="flex-col" style={{ gap: '24px' }}>
      <section className="station-registry">
         <div className="station-registry-header" onClick={() => setIsRegistryExpanded(!isRegistryExpanded)}>
            <div className="station-registry-title"><ListIcon size={18} /> {t('letter.ui.mapping_brain').toUpperCase()} ({allMappings.length})</div>
            {isRegistryExpanded ? <ArrowUpIcon size={20} /> : <ArrowDownIcon size={20} />}
         </div>
         <div className={`station-registry-anim-container ${isRegistryExpanded ? 'expanded' : ''}`}>
           <div className="station-registry-anim-content">
             <div className="station-registry-content">
                <div className="station-registry-actions" style={{ justifyContent: 'space-between' }}>
                   <div className="flex-row" style={{ gap: '8px' }}>
                     <button className="station-btn" onClick={handleExportAll}><DownloadIcon size={14} /> JSON↓</button>
                     <button className="station-btn" onClick={handleImport}><UploadIcon size={14} /> ALL↑</button>
                   </div>
                   <button className="station-btn station-btn-primary" onClick={handleNewMapping} style={{ flex: 1, maxWidth: '300px' }}>{t('letter.ui.btn_generate').toUpperCase()}</button>
                </div>
                <div className="station-registry-list">
                  {allMappings.sort((a,b) => (b.id||0)-(a.id||0)).map(m => (
                    <div key={m.id} className={`station-registry-item ${selectedMappingId === m.id ? 'active' : ''}`} onClick={() => handleSelectMapping(m)}>
                      <div className="station-registry-item-left">
                        <div className="station-registry-item-icon"><MapIcon size={16} /></div>
                        <div className="station-registry-item-info">
                          <span className="station-registry-item-name">{m.name}</span>
                          <span className="station-registry-item-meta">{presets.find(p => p.id === m.etlPresetId)?.name || '---'} {' -> '} {templates.find(t => t.id === m.templateId)?.name || '---'}</span>
                        </div>
                      </div>
                      <button className="station-registry-action-btn" onClick={(e) => handleDeleteMapping(e, m.id!)}><TrashIcon size={14} /></button>
                    </div>
                  ))}
                </div>
             </div>
           </div>
         </div>
      </section>

      {!selectedMappingId && (
        <div className="station-empty-state">
          <MapIcon size={64} style={{ marginBottom: '16px' }} />
          <span className="station-shimmer-text">MAPPING_ENGINE_STANDBY</span>
        </div>
      )}

      {(selectedMappingId || currentMapping) && (
        <div className="station-card">
           <div className="station-panel-header">
              <div className="flex-col"><h2 className="station-title-main" style={{ margin: 0 }}>{currentMapping?.name}</h2></div>
              <div className="flex-row" style={{ gap: '12px' }}>
                <button className="station-btn" onClick={undo} disabled={undoStack.length === 0}><UndoIcon size={16} /></button>
                <button className="station-btn" onClick={() => setShowConfigModal(true)}><CogIcon size={16} /> {t('settings.title').toUpperCase()}</button>
                <button className="station-btn station-btn-primary" onClick={saveMapping}><SaveIcon size={16} /> {t('common.save').toUpperCase()}</button>
              </div>
           </div>
           <div className="station-tech-summary" style={{ marginTop: '16px' }}>
              <div className="station-tech-item"><span className="station-tech-label">{t('letter.ui.resources')}:</span> {selectedPreset?.name || '---'}</div>
              <div className="station-tech-item"><span className="station-tech-label">{t('letter.ui.output_format')}:</span> {selectedTemplate?.name || '---'}</div>
           </div>
        </div>
      )}

      {(selectedMappingId || currentMapping) && (
        <section className="station-registry">
           <div className="station-registry-header" onClick={() => setIsLinkerExpanded(!isLinkerExpanded)}>
              <div className="station-registry-title"><CogIcon size={16} /> RESOURCE_LINKER</div>
              {isLinkerExpanded ? <ArrowUpIcon size={18} /> : <ArrowDownIcon size={18} />}
           </div>
           <div className={`station-registry-anim-container ${isLinkerExpanded ? 'expanded' : ''}`}>
             <div className="station-registry-anim-content"><div className="station-registry-content"><div className="station-form-grid">
               <div className="station-form-field"><label className="station-label">{t('letter.ui.data_file').toUpperCase()}</label><select className="station-select" value={selectedPresetId || 0} onChange={e => setSelectedPresetId(parseInt(e.target.value))}><option value={0}>-- {t('letter.ui.waiting_data').toUpperCase()} --</option>{presets.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select></div>
               <div className="station-form-field"><label className="station-label">{t('letter.ui.template_visual').toUpperCase()}</label><select className="station-select" value={selectedTemplateId || 0} onChange={e => setSelectedTemplateId(parseInt(e.target.value))}><option value={0}>-- {t('letter.ui.select_template').toUpperCase()} --</option>{templates.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}</select></div>
             </div></div></div>
           </div>
        </section>
      )}

      {selectedPresetId && selectedTemplateId && (
        <div className="flex-col" style={{ marginTop: '24px', gap: '20px' }}>
          <div className="station-toolbar">
             <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}><span className="station-badge station-badge-blue">W</span><span style={{ fontWeight: 800 }}>{t('letter.ui.mapping_brain').toUpperCase()}: {templateVars.length}</span></div>
             <div style={{ display: 'flex', gap: '12px' }}><button className="station-btn" onClick={handleAutoMap}><RefreshCwIcon size={14} /> {t('letter.ui.auto_map').toUpperCase()}</button><button className="station-btn station-btn-primary" onClick={saveMapping}><SaveIcon size={14} /> {t('common.save').toUpperCase()}</button></div>
          </div>
          <div className="station-table-container">
            <table className="station-table">
              <thead><tr><th style={{ width: '40px' }}>TYP</th><th>{t('etl.field_name').toUpperCase()}</th><th>SOURCE</th><th style={{ width: '120px' }}>STATUS</th></tr></thead>
              <tbody>
                {templateVars.map(v => {
                   const map = currentMapping?.mappings.find(m => m.templateVar === v);
                   return (
                     <tr key={v}>
                       <td>{map?.sourceType === 'TEMPLATE' ? 'W' : 'G'}</td>
                       <td style={{ fontWeight: 800 }}>{`{{${v}}}`}</td>
                       <td>
                          <select className="station-select" style={{ fontSize: '0.8rem' }} value={map ? `${map.sourceType}:${map.sourceField}` : ''} onChange={e => { const [type, field] = e.target.value.split(':'); handleUpdateMapping(v, type as any, field); }}>
                             <option value="">-- {t('letter.ui.select_mapping').toUpperCase()} --</option>
                             <optgroup label="[CSV] COLUMNS">
                                {dataRT?.fields.map((f: any, idx) => (
                                   <option key={idx} value={`TEMPLATE:${f.Name || f.name}`}>{f.Name || f.name}</option>
                                ))}
                             </optgroup>
                             <optgroup label="[GAWEB] TECHNICALS">{CANONICAL_GAWEB_FIELDS.map(g => <option key={g} value={`GAWEB:${g}`}>{g}</option>)}</optgroup>
                          </select>
                       </td>
                       <td>{map ? 'LINKED' : 'PENDING'}</td>
                     </tr>
                   );
                 })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Sello de Integridad (Era 5) */}
      <div className="station-integrity-badge" style={{ position: 'fixed', bottom: '24px', right: '24px' }}>
         <div className="integrity-dot" />
         <FileTextIcon size={14} />
         <span>ESTÁNDAR GAWEB v.1</span>
      </div>
    </div>
  );
};

export default MappingMatrix;
