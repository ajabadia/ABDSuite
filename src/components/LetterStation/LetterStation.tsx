'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useLanguage } from '@/lib/context/LanguageContext';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db/db';
import { 
  LetterTemplate, 
  LetterMapping, 
  LetterGenerationOptions 
} from '@/lib/types/letter.types';
import { EtlPreset } from '@/lib/types/etl.types';
import PresetEditorModal from './PresetEditorModal';
import MappingMatrix from './MappingMatrix';
import { 
  PlayIcon, 
  SquareIcon, 
  FolderIcon, 
  RefreshCwIcon,
  TagIcon,
  MapIcon,
  SearchIcon,
  FileTextIcon
} from '@/components/common/Icons';
import JSZip from 'jszip';

const LetterStation: React.FC = () => {
  const { t } = useLanguage();
  
  // Data Resources (IndexedDB)
  const presets = useLiveQuery(() => db.presets.toArray()) || [];
  const templates = useLiveQuery(() => db.letter_templates.toArray()) || [];
  const mappings = useLiveQuery(() => db.letter_mappings.toArray()) || [];

  // Selections
  const [selectedPresetId, setSelectedPresetId] = useState<number | null>(null);
  const [selectedTemplateId, setSelectedTemplateId] = useState<number | null>(null);
  const [dataFile, setDataFile] = useState<File | null>(null);
  
  // Modals
  const [showPresetEditor, setShowPresetEditor] = useState(false);
  const [showMappingMatrix, setShowMappingMatrix] = useState(false);

  // Lote Parameters (Matches Screenshot v2.0 Step 2)
  const [options, setOptions] = useState<LetterGenerationOptions>({
    lote: '0013',
    oficina: '00000',
    codDocumento: 'x00054',
    fechaGeneracion: new Date().toISOString().split('T')[0].replace(/-/g, ''),
    fechaCarta: '20251218',
    rangeFrom: 0,
    rangeTo: 0,
    outputType: 'PDF_GAWEB'
  });

  // Engine state
  const [isProcessing, setIsProcessing] = useState(false);
  const [logs, setLogs] = useState<{timestamp: string, message: string, type: 'info' | 'error'}[]>([]);
  const workerRef = useRef<Worker | null>(null);

  const addLog = (message: string, type: 'info' | 'error' = 'info') => {
    const timestamp = new Date().toTimeString().split(' ')[0];
    setLogs(prev => [...prev, { timestamp, message, type }]);
  };

  useEffect(() => {
    if (typeof window !== 'undefined') {
      workerRef.current = new Worker(new URL('../../lib/workers/document-engine.worker.ts', import.meta.url));
      workerRef.current.onmessage = (e) => {
        const { type, payload } = e.data;
        if (type === 'LOG') addLog(payload.message, payload.type);
        if (type === 'PROGRESS') { /* Progress logic */ }
        if (type === 'COMPLETE') {
          setIsProcessing(false);
          addLog('GENERACIÓN FINALIZADA CON ÉXITO.');
          const url = URL.createObjectURL(payload);
          const a = document.createElement('a');
          a.href = url;
          a.download = `GEN_CARTAS_${options.lote}_${Date.now()}.zip`;
          a.click();
        }
      };
    }
    return () => workerRef.current?.terminate();
  }, [options.lote]);

  const handleTemplateUpload = async (file: File) => {
    try {
      const buffer = await file.arrayBuffer();
      const newTemplate: LetterTemplate = {
        name: file.name,
        type: file.name.toLowerCase().endsWith('.docx') ? 'DOCX' : 'HTML',
        binaryContent: buffer,
        updatedAt: Date.now()
      };
      const id = await db.letter_templates.add(newTemplate);
      setSelectedTemplateId(id as number);
      addLog(`PLANTILLA DOCX CARGADA: ${file.name}`);
    } catch (err) { addLog(`ERROR_UPLOAD: ${err}`, 'error'); }
  };

  const handleShowTags = async () => {
    const template = templates.find(t => t.id === selectedTemplateId);
    if (!template) { alert('Seleccione plantilla.'); return; }
    let tags: string[] = [];
    if (template.type === 'DOCX' && template.binaryContent) {
      const zip = await JSZip.loadAsync(template.binaryContent);
      const docXml = await zip.file('word/document.xml')?.async('text');
      if (docXml) {
        const regex = /\{\{(.*?)\}\}/g;
        let match;
        while ((match = regex.exec(docXml)) !== null) {
          tags.push(match[1].trim().replace(/<[^>]*>?/gm, ''));
        }
      }
    }
    alert(`ETIQUETAS IDENTIFICADAS:\n\n${Array.from(new Set(tags)).join('\n') || 'Ninguna'}`);
  };

  const handleStart = () => {
    if (!dataFile || !selectedTemplateId || !selectedPresetId) {
      addLog('ERROR: Faltan recursos requeridos.', 'error');
      return;
    }
    const template = templates.find(t => t.id === selectedTemplateId);
    const mapping = mappings.find(m => m.templateId === selectedTemplateId && m.etlPresetId === selectedPresetId);
    const preset = presets.find(p => p.id === selectedPresetId);
    
    if (!mapping) { addLog('ERROR: Se requiere configurar el MAPEO para este Preset.', 'error'); return; }

    setIsProcessing(true);
    setLogs([]);
    addLog(`INICIANDO PROCESO INDUSTRIAL (Lote ${options.lote})...`);
    workerRef.current?.postMessage({ dataFile, template, mapping, etlPreset: preset, options });
  };

  return (
    <div className="station-container flex-col" style={{ gap: '0', background: '#f0f0f0', color: '#000', height: '100%', overflow: 'hidden' }}>
      
      {/* Paso 1 */}
      <section className="station-card" style={{ margin: '15px', padding: '15px', border: '1px solid #ccc', boxShadow: 'none' }}>
        <span className="station-card-title" style={{ top: '-11px', left: '15px', background: '#f0f0f0', padding: '0 5px', fontSize: '0.85rem', fontWeight: 900 }}>
          Paso 1: Selección de Archivos y Presets
        </span>
        
        <div className="flex-col" style={{ gap: '10px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '150px 1fr 120px', gap: '10px', alignItems: 'center' }}>
            <label className="station-label" style={{ marginBottom: 0 }}>Preset GAWEB:</label>
            <div style={{ display: 'flex', gap: '5px' }}>
              <select className="station-select" style={{ flex: 1 }} value={selectedPresetId || ''} onChange={e => setSelectedPresetId(Number(e.target.value))}>
                <option value="">-- Seleccionar --</option>
                {presets.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
              <button className="station-btn" style={{ padding: '4px 8px' }} onClick={() => setShowPresetEditor(true)}><FolderIcon size={14} /></button>
              <button className="station-btn" style={{ padding: '4px 8px' }}><RefreshCwIcon size={14} /></button>
            </div>
            <button className="station-btn" style={{ fontWeight: 900 }} onClick={() => setShowPresetEditor(true)}>Ver</button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '150px 1fr 100px 100px', gap: '10px', alignItems: 'center' }}>
            <label className="station-label" style={{ marginBottom: 0 }}>Archivo Datos:</label>
            <input className="station-input" readOnly value={dataFile?.name || ''} placeholder="IDLE..." />
            <label className="station-btn" style={{ padding: '5px', textAlign: 'center', cursor: 'pointer' }}>
              Explorar..
              <input type="file" hidden onChange={e => setDataFile(e.target.files?.[0] || null)} />
            </label>
            <button className="station-btn">Vista</button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '150px 1fr 100px 100px', gap: '10px', alignItems: 'center' }}>
            <label className="station-label" style={{ marginBottom: 0 }}>Plantilla DOCX:</label>
            <select className="station-select" value={selectedTemplateId || ''} onChange={e => setSelectedTemplateId(Number(e.target.value))}>
              <option value="">-- Seleccionar --</option>
              {templates.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
            <label className="station-btn" style={{ padding: '5px', textAlign: 'center', cursor: 'pointer' }}>
              Explorar..
              <input type="file" hidden onChange={e => e.target.files?.[0] && handleTemplateUpload(e.target.files?.[0])} />
            </label>
            <button className="station-btn" onClick={handleShowTags}>Etiquetas</button>
          </div>
        </div>
      </section>

      {/* Paso 2 */}
      <section className="station-card" style={{ margin: '0 15px 15px 15px', padding: '15px', border: '1px solid #ccc', boxShadow: 'none' }}>
        <span className="station-card-title" style={{ top: '-11px', left: '15px', background: '#f0f0f0', padding: '0 5px', fontSize: '0.85rem', fontWeight: 900 }}>
          Paso 2: Parámetros del Lote (Sobrescriben Preset)
        </span>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px' }}>
          <div className="flex-col" style={{ gap: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <label className="station-label" style={{ width: '120px', marginBottom: 0 }}>F. Generación:</label>
              <input className="station-input" style={{ width: '120px' }} value={options.fechaGeneracion} onChange={e => setOptions({...options, fechaGeneracion: e.target.value})} />
              <button className="station-btn" style={{ padding: '4px 10px' }} onClick={() => setOptions({...options, fechaGeneracion: new Date().toISOString().split('T')[0].replace(/-/g, '')})}>Hoy</button>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <label className="station-label" style={{ width: '120px', marginBottom: 0 }}>Lote:</label>
              <input className="station-input" style={{ width: '80px' }} value={options.lote} onChange={e => setOptions({...options, lote: e.target.value})} />
              <label className="station-label" style={{ width: '120px', textAlign: 'right', marginBottom: 0 }}>Cód. Documento:</label>
              <input className="station-input" style={{ width: '100px' }} value={options.codDocumento} onChange={e => setOptions({...options, codDocumento: e.target.value})} />
            </div>
          </div>
          <div className="flex-col" style={{ gap: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <label className="station-label" style={{ width: '120px', marginBottom: 0 }}>F. Carta:</label>
              <input className="station-input" style={{ width: '120px' }} value={options.fechaCarta} onChange={e => setOptions({...options, fechaCarta: e.target.value})} />
              <button className="station-btn" style={{ padding: '4px 10px' }} onClick={() => setOptions({...options, fechaCarta: new Date().toISOString().split('T')[0].replace(/-/g, '')})}>Hoy</button>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <label className="station-label" style={{ width: '120px', marginBottom: 0 }}>Oficina:</label>
              <input className="station-input" style={{ width: '100px' }} value={options.oficina} onChange={e => setOptions({...options, oficina: e.target.value})} />
            </div>
          </div>
        </div>
      </section>

      {/* Paso 3 */}
      <section className="station-card" style={{ margin: '0 15px 15px 15px', padding: '15px', border: '1px solid #ccc', boxShadow: 'none' }}>
        <span className="station-card-title" style={{ top: '-11px', left: '15px', background: '#f0f0f0', padding: '0 5px', fontSize: '0.85rem', fontWeight: 900 }}>
          Paso 3: Selección de Registros y Salida
        </span>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <label className="station-label" style={{ width: '120px', marginBottom: 0 }}>Desde Registro:</label>
            <input className="station-input" style={{ width: '80px' }} type="number" value={options.rangeFrom} onChange={e => setOptions({...options, rangeFrom: Number(e.target.value)})} />
            <label className="station-label" style={{ marginBottom: 0 }}>Hasta:</label>
            <input className="station-input" style={{ width: '80px' }} type="number" value={options.rangeTo} onChange={e => setOptions({...options, rangeTo: Number(e.target.value)})} />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <label className="station-label" style={{ width: '120px', marginBottom: 0 }}>Tipo Salida:</label>
            <select className="station-select" style={{ flex: 1 }} value={options.outputType} onChange={e => setOptions({...options, outputType: e.target.value as any})}>
              <option value="PDF_GAWEB">DOCX + GAWEB (Empaquetado Industrial)</option>
              <option value="ZIP">Solo ZIP de Word</option>
            </select>
          </div>
        </div>
      </section>

      {/* Action Block */}
      <div style={{ display: 'flex', gap: '20px', padding: '0 15px 15px 15px' }}>
        <button className="station-btn" style={{ height: '60px', flex: 1, background: '#e1e100', color: '#000', fontSize: '1.1rem', fontWeight: 900 }} onClick={() => setShowMappingMatrix(true)}>
          <MapIcon size={20} /> MAPEO...
        </button>
        <button className="station-btn" disabled={isProcessing} style={{ height: '60px', flex: 2, background: '#5bc0de', color: '#000', fontSize: '1.1rem', fontWeight: 900 }} onClick={handleStart}>
          <PlayIcon size={20} /> {isProcessing ? 'PROCESANDO...' : 'INICIAR GENERACIÓN'}
        </button>
        <button className="station-btn" style={{ height: '60px', width: '120px', background: '#d9534f', color: '#fff', fontSize: '1.1rem', fontWeight: 900 }} onClick={() => { workerRef.current?.terminate(); setIsProcessing(false); addLog('PROCESO CANCELADO', 'error'); }}>
          <SquareIcon size={20} /> PARAR
        </button>
      </div>

      {/* Local Console */}
      <div style={{ flex: 1, margin: '0 15px 15px 15px', background: '#fff', border: '1px solid #ccc', padding: '10px', overflowY: 'auto', fontFamily: 'monospace', fontSize: '0.85rem' }}>
        {logs.map((log, i) => (
          <div key={i} style={{ color: log.type === 'error' ? '#d00' : '#444' }}>
            [{log.timestamp}] {log.message}
          </div>
        ))}
      </div>

      {/* Modals */}
      {showPresetEditor && (
        <PresetEditorModal 
          onSave={async (p) => { await db.presets.put(p); setShowPresetEditor(false); }} 
          onClose={() => setShowPresetEditor(false)} 
        />
      )}

      {showMappingMatrix && (
        <div className="station-modal-overlay" style={{ zIndex: 1000 }}>
           <div className="station-modal" style={{ maxWidth: '1100px', height: '90vh' }}>
              <header className="station-console-header" style={{ padding: '10px 20px', background: '#e1e100', color: '#000', display: 'flex', justifyContent: 'space-between' }}>
                 <div style={{ fontWeight: 900 }}>Mapeo de Variables y Campos (DOCX Parity)</div>
                 <button className="station-btn" style={{ padding: '2px 8px', border: 'none', background: 'transparent', fontWeight: 900 }} onClick={() => setShowMappingMatrix(false)}>X</button>
              </header>
              <MappingMatrix />
           </div>
        </div>
      )}

    </div>
  );
};

export default LetterStation;
