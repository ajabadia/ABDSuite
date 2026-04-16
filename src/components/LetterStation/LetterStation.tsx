'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useLanguage } from '@/lib/context/LanguageContext';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db/db';
import { 
  LetterTemplate, 
  LetterGenerationOptions 
} from '@/lib/types/letter.types';
import { 
  PlayIcon, 
  FolderIcon, 
  TagIcon,
} from '@/components/common/Icons';
import JSZip from 'jszip';

import { useLog } from '@/lib/context/LogContext';
import { LogLevel } from '@/lib/types/log.types';

const LetterStation: React.FC = () => {
  const { t } = useLanguage();
  const { addLog: globalAddLog } = useLog();
  const router = useRouter();
  
  // Resources
  const presets = useLiveQuery(() => db.presets.toArray()) || [];
  const templates = useLiveQuery(() => db.letter_templates.toArray()) || [];
  const mappings = useLiveQuery(() => db.letter_mappings.toArray()) || [];

  // Selections
  const [selectedPresetId, setSelectedPresetId] = useState<number | null>(null);
  const [selectedTemplateId, setSelectedTemplateId] = useState<number | null>(null);
  const [dataFile, setDataFile] = useState<File | null>(null);
  
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
  const workerRef = useRef<Worker | null>(null);

  const addLog = (message: string, type: 'info' | 'error' = 'info') => {
    globalAddLog('LETTER', message, type as LogLevel);
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
    
    setIsProcessing(true);
    addLog(`INICIANDO PROCESO (Lote ${options.lote})...`);
    workerRef.current?.postMessage({ dataFile, template, mapping, etlPreset: preset, options });
  };

  const navigateToConfig = () => {
    router.push('/letter?view=config');
  };

  return (
    <div className="flex-col" style={{ gap: '24px', padding: '24px' }}>
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
                    <button className="station-btn" onClick={navigateToConfig} title="Gestionar Modelos"><FolderIcon size={14} /></button>
                  </div>
                  <button className="station-btn" onClick={navigateToConfig}>Editar</button>
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
                  <label className="station-label">Plantilla Principal</label>
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
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 120px 2fr', gap: '16px', alignItems: 'end' }}>
               <section className="station-card" style={{ flex: 1 }}>
                  <h2 style={{ fontSize: '0.8rem', opacity: 0.6, marginBottom: '8px' }}>Rango</h2>
                  <div style={{ display: 'flex', gap: '16px' }}>
                    <input className="station-input" type="number" placeholder="Desde" value={options.rangeFrom} onChange={e => setOptions({...options, rangeFrom: Number(e.target.value)})} />
                    <input className="station-input" type="number" placeholder="Hasta" value={options.rangeTo} onChange={e => setOptions({...options, rangeTo: Number(e.target.value)})} />
                  </div>
               </section>
               <div style={{ textAlign: 'center' }}>
                  <select className="station-select" value={options.outputType} onChange={e => setOptions({...options, outputType: e.target.value as any})}>
                    <option value="PDF_GAWEB">GAWEB</option>
                    <option value="ZIP">ZIP</option>
                  </select>
               </div>
               <button 
                  className="station-btn station-btn-primary" 
                  disabled={isProcessing}
                  style={{ height: '64px', fontSize: '1.1rem' }}
                  onClick={handleStart}
                >
                  <PlayIcon size={24} /> {isProcessing ? 'GENERANDO...' : 'INICIAR PROCESAMIENTO'}
                </button>
            </div>
    </div>
  );
};

export default LetterStation;
