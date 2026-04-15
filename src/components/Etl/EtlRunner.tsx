'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useLanguage } from '@/lib/context/LanguageContext';
import { EtlPreset } from '@/lib/types/etl.types';
import { EtlProcessorOptions, ProcessorLogEntry } from '@/lib/types/etl-processor.types';
import { RefreshIcon, FolderIcon } from '@/components/common/Icons';
import LogConsole, { LogEntry } from '@/components/LogConsole';

interface EtlRunnerProps {
  presets: EtlPreset[];
  selectedPreset: EtlPreset | null;
  onSelectPreset: (preset: EtlPreset) => void;
}

const EtlRunner: React.FC<EtlRunnerProps> = ({ presets, selectedPreset, onSelectPreset }) => {
  const { t } = useLanguage();
  const [inputFile, setInputFile] = useState<File | null>(null);
  const [outputHandle, setOutputHandle] = useState<FileSystemDirectoryHandle | null>(null);
  const [options, setOptions] = useState<EtlProcessorOptions>({
    startRow: 1,
    endRow: 0,
    chunkSize: 900000,
    outputFormat: 'CSV',
    encoding: 'utf-8',
  });
  
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const workerRef = useRef<Worker | null>(null);
  const outputStreamsRef = useRef<Map<string, { stream: FileSystemWritableFileStream, count: number, part: number }>>(new Map());

  useEffect(() => {
    return () => {
      workerRef.current?.terminate();
    };
  }, []);

  const addLog = (entry: Omit<LogEntry, 'id' | 'timestamp'>) => {
    setLogs(prev => [
      ...prev,
      {
        ...entry,
        id: Math.random().toString(36).substring(2, 9),
        timestamp: new Date(),
      }
    ]);
  };

  const handlePickOutput = async () => {
    try {
      const handle = await (window as any).showDirectoryPicker();
      setOutputHandle(handle);
    } catch (err) {
      console.error('Directory picker cancelled or failed', err);
    }
  };

  const startProcess = async () => {
    if (!inputFile || !selectedPreset || !outputHandle) return;

    setIsProcessing(true);
    setLogs([]);
    outputStreamsRef.current = new Map();

    addLog({ type: 'info', message: `INITIALIZING_ENGINE: ${selectedPreset.name}` });

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
          addLog({ type: 'success', message: 'TASK_COMPLETED_SUCCESSFULLY' });
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
    <div className="flex-col" style={{ gap: '30px' }}>
      <div className="station-card">
        <div className="station-card-title">PROCESS_CONTROL_UNIT</div>
        
        <div className="grid-2" style={{ gap: '25px' }}>
          <div className="flex-col" style={{ gap: '10px' }}>
            <label className="station-label">DATA_INPUT_STREAM</label>
            <div className="flex-row" style={{ gap: '5px' }}>
              <input className="station-input" readOnly value={inputFile?.name || ''} placeholder="RAW_FILE_PATH" style={{ fontSize: '0.8rem' }} />
              <input type="file" id="etl-run-in" style={{ display: 'none' }} onChange={e => setInputFile(e.target.files?.[0] || null)} />
              <button className="station-btn" style={{ padding: '8px 12px', boxShadow: 'none' }} onClick={() => document.getElementById('etl-run-in')?.click()}>...</button>
            </div>
          </div>
          <div className="flex-col" style={{ gap: '10px' }}>
            <label className="station-label">OUTPUT_DESTINATION_HANDLE</label>
            <div className="flex-row" style={{ gap: '5px' }}>
              <input className="station-input" readOnly value={outputHandle?.name || ''} placeholder="DRIVE:\DESTINATION" style={{ fontSize: '0.8rem' }} />
              <button className="station-btn" style={{ padding: '8px 12px', boxShadow: 'none' }} onClick={handlePickOutput}>...</button>
            </div>
          </div>
        </div>

        <div className="flex-col" style={{ gap: '10px', marginTop: '10px' }}>
          <label className="station-label">ACTIVE_PRESET_CONFIGURATION</label>
          <div className="flex-row" style={{ gap: '10px' }}>
            <select 
              className="station-select"
              style={{ flex: 1, padding: '12px' }}
              value={selectedPreset?.id || ''}
              onChange={(e) => {
                const p = presets.find(p => p.id === parseInt(e.target.value));
                if (p) onSelectPreset(p);
              }}
            >
              <option value="">{t('etl.no_presets')}</option>
              {presets.map(p => (
                <option key={p.id} value={p.id}>{p.name} (V{p.version})</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="station-card">
        <div className="station-card-title">ENGINE_PARAMETERS</div>
        <div className="grid-2" style={{ gap: '25px' }}>
           <div className="flex-col" style={{ gap: '10px' }}>
             <label className="station-label">MAX_CHUNK_SIZE</label>
             <input type="number" className="station-input" value={options.chunkSize} onChange={e => setOptions({...options, chunkSize: parseInt(e.target.value) || 0})} />
           </div>
           <div className="flex-col" style={{ gap: '10px' }}>
             <label className="station-label">SERIALIZATION_FORMAT</label>
             <select className="station-select" value={options.outputFormat} onChange={e => setOptions({...options, outputFormat: e.target.value as any})}>
                <option value="CSV">CSV_SEMICOLON</option>
                <option value="JSON">JSON_ARRAY</option>
             </select>
           </div>
        </div>
        <div className="grid-2" style={{ gap: '25px', marginTop: '20px' }}>
           <div className="flex-col" style={{ gap: '10px' }}>
             <label className="station-label">START_AT_ROW</label>
             <input type="number" className="station-input" value={options.startRow} onChange={e => setOptions({...options, startRow: parseInt(e.target.value) || 1})} />
           </div>
           <div className="flex-col" style={{ gap: '10px' }}>
             <label className="station-label">END_AT_ROW (0=EOF)</label>
             <input type="number" className="station-input" value={options.endRow} onChange={e => setOptions({...options, endRow: parseInt(e.target.value) || 0})} />
           </div>
        </div>
      </div>

      <button 
        className="station-btn station-btn-primary"
        style={{ padding: '18px', fontSize: '1.2rem', boxShadow: 'none', border: 'var(--border-thick) solid var(--border-color)' }}
        disabled={!inputFile || !outputHandle || !selectedPreset || isProcessing}
        onClick={startProcess}
      >
        {isProcessing ? 'ENGINE_RUNNING_DO_NOT_INTERRUPT' : 'INITIALIZE_BATCH_PROCESS'}
      </button>

      <div style={{ flex: 1, minHeight: '350px', display: 'flex' }}>
        <LogConsole 
          logs={logs} 
          onClear={() => setLogs([])} 
          onSave={() => {}} 
        />
      </div>
    </div>
  );
};

export default EtlRunner;
