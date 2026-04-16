'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useLanguage } from '@/lib/context/LanguageContext';
import { EtlPreset } from '@/lib/types/etl.types';
import { EtlProcessorOptions, ProcessorLogEntry } from '@/lib/types/etl-processor.types';
import { RefreshIcon, FolderIcon, PlayIcon, SquareIcon, CogIcon } from '@/components/common/Icons';
import { useLog } from '@/lib/context/LogContext';
import { LogLevel } from '@/lib/types/log.types';

interface EtlRunnerProps {
  presets: EtlPreset[];
  selectedPreset: EtlPreset | null;
  onSelectPreset: (preset: EtlPreset) => void;
}

const EtlRunner: React.FC<EtlRunnerProps> = ({ presets, selectedPreset, onSelectPreset }) => {
  const { t } = useLanguage();
  const router = useRouter();
  const { addLog: globalAddLog } = useLog();
  const [inputFile, setInputFile] = useState<File | null>(null);
  const [outputHandle, setOutputHandle] = useState<FileSystemDirectoryHandle | null>(null);
  const [options, setOptions] = useState<EtlProcessorOptions>({
    startRow: 1,
    endRow: 0,
    chunkSize: 500000,
    outputFormat: 'CSV',
    encoding: 'utf-8',
  });
  
  const [isProcessing, setIsProcessing] = useState(false);
  const workerRef = useRef<Worker | null>(null);
  const outputStreamsRef = useRef<Map<string, { stream: FileSystemWritableFileStream, count: number, part: number }>>(new Map());

  useEffect(() => {
    return () => {
      workerRef.current?.terminate();
    };
  }, []);

  const addLog = (entry: any) => {
    let level: LogLevel = 'info';
    if (entry.type === 'success') level = 'success';
    if (entry.type === 'error') level = 'error';
    if (entry.type === 'warn') level = 'warn';
    
    globalAddLog('ETL', entry.message, level);
  };

  const handlePickOutput = async () => {
    try {
      const handle = await (window as any).showDirectoryPicker();
      setOutputHandle(handle);
    } catch (err) { }
  };

  const handleEditDesign = () => {
    if (selectedPreset) {
      router.push(`/etl?view=designer&id=${selectedPreset.id}`);
    }
  };

  const startProcess = async () => {
    if (!inputFile || !selectedPreset || !outputHandle) return;

    setIsProcessing(true);
    outputStreamsRef.current = new Map();

    addLog({ type: 'info', message: `Iniciando motor ETL: ${selectedPreset.name}` });

    const worker = new Worker(new URL('../../lib/workers/etl-processor.worker.ts', import.meta.url));
    workerRef.current = worker;

    worker.onmessage = async (e) => {
      const { type, payload } = e.data;
      switch (type) {
        case 'LOG': addLog(payload); break;
        case 'RECORD': await handleRecord(payload); break;
        case 'COMPLETE':
          cleanupStreams();
          setIsProcessing(false);
          addLog({ type: 'success', message: 'Procesamiento finalizado con éxito.' });
          break;
      }
    };

    worker.postMessage({
      file: inputFile,
      preset: selectedPreset,
      options: { ...options, encoding: selectedPreset.encoding as any || options.encoding }
    });
  };

  const handleRecord = async (payload: { typeName: string, data: any, headers: string[] }) => {
    if (!outputHandle) return;
    const { typeName, data, headers } = payload;
    let streamRef = outputStreamsRef.current.get(typeName);

    if (!streamRef || streamRef.count >= options.chunkSize) {
      if (streamRef) await streamRef.stream.close();
      const part = streamRef ? streamRef.part + 1 : 1;
      const fileName = `${inputFile?.name.split('.')[0]}_${typeName}${part > 1 ? `_Part${part}` : ''}.${options.outputFormat.toLowerCase()}`;
      const fileHandle = await outputHandle.getFileHandle(fileName, { create: true });
      const stream = await (fileHandle as any).createWritable();
      
      if (options.outputFormat === 'CSV') {
        const headerLine = headers.join(';') + '\n';
        await stream.write(headerLine);
      } else if (options.outputFormat === 'JSON') {
        await stream.write('[\n');
      }
      streamRef = { stream, count: 0, part };
      outputStreamsRef.current.set(typeName, streamRef);
    }

    if (options.outputFormat === 'CSV') {
      const values = headers.map(h => data[h] || '');
      await streamRef.stream.write(values.join(';') + '\n');
    } else if (options.outputFormat === 'JSON') {
      const prefix = streamRef.count > 0 ? ',\n  ' : '  ';
      await streamRef.stream.write(prefix + JSON.stringify(data));
    }
    streamRef.count++;
  };

  const cleanupStreams = async () => {
    for (const ref of outputStreamsRef.current.values()) {
      if (options.outputFormat === 'JSON') await ref.stream.write('\n]');
      await ref.stream.close();
    }
    outputStreamsRef.current.clear();
  };

  return (
    <div className="flex-col" style={{ gap: '24px', height: '100%' }}>
      
      <div className="station-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h3 style={{ fontSize: '0.8rem', opacity: 0.6, textTransform: 'uppercase' }}>Control de Ejecución</h3>
          {selectedPreset && (
            <button className="station-btn" onClick={handleEditDesign} title="Modificar Diseño del Preset">
              <CogIcon size={16} /> EDITAR DISEÑO
            </button>
          )}
        </div>

        <div className="flex-col" style={{ gap: '16px' }}>
          <div className="grid-2" style={{ gap: '24px' }}>
            <div className="flex-col" style={{ gap: '4px' }}>
              <label className="station-label">Archivo de Entrada</label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input className="station-input" readOnly value={inputFile?.name || ''} placeholder="Seleccionar CSV/TXT..." />
                <input type="file" id="etl-run-in" style={{ display: 'none' }} onChange={e => setInputFile(e.target.files?.[0] || null)} />
                <button className="station-btn" onClick={() => document.getElementById('etl-run-in')?.click()}>...</button>
              </div>
            </div>
            <div className="flex-col" style={{ gap: '4px' }}>
              <label className="station-label">Carpeta de Salida</label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input className="station-input" readOnly value={outputHandle?.name || ''} placeholder="Seleccionar destino..." />
                <button className="station-btn" onClick={handlePickOutput}>...</button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="station-card">
        <h3 style={{ fontSize: '0.8rem', opacity: 0.6, textTransform: 'uppercase', marginBottom: '8px' }}>Parámetros del Motor</h3>
        <div className="grid-2" style={{ gap: '24px' }}>
           <div className="flex-col" style={{ gap: '4px' }}>
             <label className="station-label">Tamaño Partición</label>
             <input type="number" className="station-input" value={options.chunkSize} onChange={e => setOptions({...options, chunkSize: parseInt(e.target.value) || 0})} />
           </div>
           <div className="flex-col" style={{ gap: '4px' }}>
             <label className="station-label">Formato Salida</label>
             <select className="station-select" value={options.outputFormat} onChange={e => setOptions({...options, outputFormat: e.target.value as any})}>
                <option value="CSV">Valores Separados por Punto y Coma (CSV)</option>
                <option value="JSON">Estructura de Datos JSON</option>
             </select>
           </div>
        </div>
        <div className="grid-2" style={{ gap: '24px', marginTop: '12px' }}>
           <div className="flex-col" style={{ gap: '4px' }}>
             <label className="station-label">Fila de Inicio</label>
             <input type="number" className="station-input" value={options.startRow} onChange={e => setOptions({...options, startRow: parseInt(e.target.value) || 1})} />
           </div>
           <div className="flex-col" style={{ gap: '4px' }}>
             <label className="station-label">Fila Final (0 = Fin de Archivo)</label>
             <input type="number" className="station-input" value={options.endRow} onChange={e => setOptions({...options, endRow: parseInt(e.target.value) || 0})} />
           </div>
        </div>
      </div>

      <button 
        className="station-btn station-btn-primary"
        style={{ height: '64px', fontSize: '1.1rem' }}
        disabled={!inputFile || !outputHandle || !selectedPreset || isProcessing}
        onClick={startProcess}
      >
        <PlayIcon size={20} /> {isProcessing ? 'PROCESANDO LOTE...' : 'INICIAR PROCESAMIENTO'}
      </button>
    </div>
  );
};

export default EtlRunner;
