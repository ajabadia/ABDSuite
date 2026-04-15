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
  
  // Resources
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

  // Lote Options
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

  // Engine
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

  // Handlers
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
    addLog(`INICIANDO PROCESO (Lote ${options.lote})...`);
    workerRef.current?.postMessage({ dataFile, template, mapping, etlPreset: preset, options });
  };

  return (
    <div className="flex-col" style={{ height: '100%', gap: '24px' }}>
      
      {/* Paso 1: Configuración de Recursos */}
      <section className="station-card">
        <h2 style={{ fontSize: '0.8rem', opacity: 0.6, marginBottom: '8px' }}>Paso 1: Selección de Recursos</h2>
        
        <div className="flex-col" style={{ gap: '12px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '150px 1fr 120px', gap: '16px', alignItems: 'center' }}>
            <label className="station-label">Preset GAWEB</label>
            <div style={{ display: 'flex', gap: '8px' }}>
              <select className="station-select" style={{ flex: 1 }} value={selectedPresetId || ''} onChange={e => setSelectedPresetId(Number(e.target.value))}>
                <option value="">-- Seleccionar --</option>
                {presets.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
              <button className="station-btn" onClick={() => setShowPresetEditor(true)}><FolderIcon size={14} /></button>
            </div>
            <button className="station-btn" onClick={() => setShowPresetEditor(true)}>Editar</button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '150px 1fr 120px', gap: '16px', alignItems: 'center' }}>
            <label className="station-label">Archivo de Datos</label>
            <input className="station-input" readOnly value={dataFile?.name || ''} placeholder="Seleccione archivo..." />
            <label className="station-btn">
              Explorar..
              <input type="file" hidden onChange={e => setDataFile(e.target.files?.[0] || null)} />
            </label>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '150px 1fr 120px', gap: '16px', alignItems: 'center' }}>
            <label className="station-label">Plantilla Word</label>
            <select className="station-select" value={selectedTemplateId || ''} onChange={e => setSelectedTemplateId(Number(e.target.value))}>
              <option value="">-- Seleccionar --</option>
              {templates.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
            <div style={{ display: 'flex', gap: '8px' }}>
              <label className="station-btn" style={{ flex: 1 }}>
                Subir
                <input type="file" hidden onChange={e => e.target.files?.[0] && handleTemplateUpload(e.target.files?.[0])} />
              </label>
              <button className="station-btn" onClick={handleShowTags} title="Ver Etiquetas"><TagIcon size={14} /></button>
            </div>
          </div>
        </div>
      </section>

      {/* Paso 2: Parámetros */}
      <section className="station-card">
        <h2 style={{ fontSize: '0.8rem', opacity: 0.6, marginBottom: '8px' }}>Paso 2: Parámetros del Lote</h2>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px' }}>
          <div className="flex-col" style={{ gap: '12px' }}>
            <div className="flex-col" style={{ gap: '4px' }}>
              <label className="station-label">Fecha Generación</label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input className="station-input" value={options.fechaGeneracion} onChange={e => setOptions({...options, fechaGeneracion: e.target.value})} />
                <button className="station-btn" onClick={() => setOptions({...options, fechaGeneracion: new Date().toISOString().split('T')[0].replace(/-/g, '')})}>Hoy</button>
              </div>
            </div>
            <div className="flex-col" style={{ gap: '4px' }}>
              <label className="station-label">Lote</label>
              <input className="station-input" value={options.lote} onChange={e => setOptions({...options, lote: e.target.value})} />
            </div>
          </div>
          <div className="flex-col" style={{ gap: '12px' }}>
            <div className="flex-col" style={{ gap: '4px' }}>
              <label className="station-label">Fecha Carta</label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input className="station-input" value={options.fechaCarta} onChange={e => setOptions({...options, fechaCarta: e.target.value})} />
                <button className="station-btn" onClick={() => setOptions({...options, fechaCarta: new Date().toISOString().split('T')[0].replace(/-/g, '')})}>Hoy</button>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div className="flex-col" style={{ gap: '4px' }}>
                <label className="station-label">Oficina</label>
                <input className="station-input" value={options.oficina} onChange={e => setOptions({...options, oficina: e.target.value})} />
              </div>
              <div className="flex-col" style={{ gap: '4px' }}>
                <label className="station-label">Cód. Documento</label>
                <input className="station-input" value={options.codDocumento} onChange={e => setOptions({...options, codDocumento: e.target.value})} />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Paso 3: Salida */}
      <section className="station-card">
        <h2 style={{ fontSize: '0.8rem', opacity: 0.6, marginBottom: '8px' }}>Paso 3: Rango y Empaquetado</h2>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px' }}>
          <div style={{ display: 'flex', gap: '16px', alignItems: 'end' }}>
             <div className="flex-col" style={{ gap: '4px', flex: 1 }}>
                <label className="station-label">Desde</label>
                <input className="station-input" type="number" value={options.rangeFrom} onChange={e => setOptions({...options, rangeFrom: Number(e.target.value)})} />
             </div>
             <div className="flex-col" style={{ gap: '4px', flex: 1 }}>
                <label className="station-label">Hasta</label>
                <input className="station-input" type="number" value={options.rangeTo} onChange={e => setOptions({...options, rangeTo: Number(e.target.value)})} />
             </div>
          </div>
          <div className="flex-col" style={{ gap: '4px' }}>
            <label className="station-label">Tipo de Salida</label>
            <select className="station-select" value={options.outputType} onChange={e => setOptions({...options, outputType: e.target.value as any})}>
              <option value="PDF_GAWEB">PROCESADO DOCX + GAWEB</option>
              <option value="ZIP">SOLO ZIP WORD</option>
            </select>
          </div>
        </div>
      </section>

      {/* Acciones Principales */}
      <div style={{ display: 'flex', gap: '16px' }}>
        <button 
          className="station-btn" 
          style={{ height: '64px', flex: 1, fontWeight: 800 }} 
          onClick={() => setShowMappingMatrix(true)}
        >
          <MapIcon size={20} /> CONFIGURAR MAPEO
        </button>
        <button 
          className="station-btn station-btn-primary" 
          disabled={isProcessing}
          style={{ height: '64px', flex: 2, fontSize: '1.1rem' }}
          onClick={handleStart}
        >
          <PlayIcon size={24} /> {isProcessing ? 'GENERANDO PAQUETE...' : 'INICIAR PROCESO'}
        </button>
        <button 
          className="station-btn" 
          style={{ height: '64px', width: '120px', color: 'var(--status-err)' }}
          onClick={() => { workerRef.current?.terminate(); setIsProcessing(false); addLog('PROCESO INTERRUMPIDO', 'error'); }}
        >
          <SquareIcon size={20} /> PARAR
        </button>
      </div>

      {/* Consola Industrial Moderna */}
      <div style={{ flex: 1, minHeight: '200px', background: 'var(--surface-color)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '16px', overflowY: 'auto' }}>
        {logs.length === 0 && <div style={{ opacity: 0.2, fontSize: '0.8rem' }}>SISTEMA LISTO PARA PROCESAMIENTO BATCH</div>}
        {logs.map((log, i) => (
          <div key={i} style={{ fontSize: '0.85rem', marginBottom: '4px', color: log.type === 'error' ? 'var(--status-err)' : 'var(--text-primary)' }}>
            <span style={{ opacity: 0.5 }}>[{log.timestamp}]</span> {log.message}
          </div>
        ))}
      </div>

      {/* Modales Modernizados */}
      {showPresetEditor && (
        <PresetEditorModal 
          onSave={async (p) => { await db.presets.put(p); setShowPresetEditor(false); }} 
          onClose={() => setShowPresetEditor(false)} 
        />
      )}

      {showMappingMatrix && (
        <div className="station-modal-overlay">
           <div className="station-modal" style={{ maxWidth: '1100px', height: '90vh', padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
              <header style={{ padding: '16px 24px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                 <h3 style={{ fontSize: '1rem', fontWeight: 800 }}>MATRIZ DE MAPEO DOCX</h3>
                 <button className="station-btn" style={{ padding: '4px 8px', border: 'none' }} onClick={() => setShowMappingMatrix(false)}>X</button>
              </header>
              <div style={{ flex: 1, overflow: 'auto', padding: '24px' }}>
                <MappingMatrix />
              </div>
           </div>
        </div>
      )}

    </div>
  );
};

export default LetterStation;
