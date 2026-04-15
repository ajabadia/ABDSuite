'use client';

import React, { useState, useCallback } from 'react';
import { FolderIcon, ArrowUpIcon, ArrowDownIcon, CloseIcon } from '@/components/common/Icons';
import { useLanguage } from '@/lib/context/LanguageContext';

interface SelectedFile {
  file: File;
  id: string;
}

interface FileProcessorProps {
  onProcess: (files: File[], mode: 'encrypt' | 'decrypt') => void;
  onClear?: (count: number) => void;
  onSort?: (asc: boolean) => void;
  isProcessing: boolean;
  clearOnFinish: boolean;
  stats?: { success: number; error: number; skip: number };
}

const FileProcessor: React.FC<FileProcessorProps> = ({ 
  onProcess, 
  onClear,
  onSort,
  isProcessing,
  clearOnFinish,
  stats = { success: 0, error: 0, skip: 0 }
}) => {
  const { t } = useLanguage();
  const [files, setFiles] = useState<SelectedFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);

  const addFiles = useCallback((newFiles: FileList | File[]) => {
    const fileList = Array.from(newFiles);
    setFiles(prev => {
      const uniqueNewFiles = fileList.filter(nf => 
        !prev.some(p => p.file.name === nf.name && p.file.size === nf.size)
      ).map(f => ({ file: f, id: Math.random().toString(36).substr(2, 9) }));
      
      return [...prev, ...uniqueNewFiles];
    });
  }, []);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files) {
      addFiles(e.dataTransfer.files);
    }
  };

  const removeFile = (id: string) => {
    setFiles(prev => prev.filter(f => f.id !== id));
  };

  const clearFiles = () => {
    const count = files.length;
    setFiles([]);
    if (onClear && count > 0) onClear(count);
  };

  const sortFiles = (asc: boolean) => {
    setFiles(prev => {
      const sorted = [...prev].sort((a, b) => 
        asc ? a.file.name.localeCompare(b.file.name) : b.file.name.localeCompare(a.file.name)
      );
      return sorted;
    });
    if (onSort) onSort(asc);
  };

  return (
    <div className="station-card" style={{ gap: '25px', paddingBottom: '30px' }}>
      <div className="station-card-title">ASEPTIC_VAULT_CONTROLLER</div>

      <div 
        className={`station-card ${isDragging ? 'active' : ''}`}
        style={{ height: '140px', borderStyle: 'dashed', cursor: 'pointer', justifyContent: 'center', alignItems: 'center', boxShadow: 'none', background: 'rgba(var(--primary-color), 0.03)' }}
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
      >
        <div style={{ textAlign: 'center', pointerEvents: 'none' }}>
          <FolderIcon size={48} style={{ marginBottom: '10px', opacity: 0.8 }} />
          <p style={{ fontWeight: 900, textTransform: 'uppercase', letterSpacing: '1px' }}>{t('processor.dropzone')}</p>
        </div>
        <input 
          type="file" 
          multiple 
          style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer' }}
          onChange={(e) => e.target.files && addFiles(e.target.files)}
        />
      </div>

      <div style={{ display: 'flex', gap: '20px', background: 'rgba(var(--primary-color), 0.05)', padding: '12px 20px', border: 'var(--border-thin) solid var(--border-color)', alignItems: 'center' }}>
        <div style={{ flex: 1, display: 'flex', gap: '20px', fontSize: '0.75rem', fontWeight: 900 }}>
          <span>PROCESSED: <b className="txt-ok">{stats.success}</b></span>
          <span>RETAINED: <b className="txt-warn">{stats.skip}</b></span>
          <span>ANOMALIES: <b className="txt-err">{stats.error}</b></span>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={() => sortFiles(true)} className="station-btn" style={{ padding: '4px 10px', boxShadow: 'none', fontSize: '0.7rem' }}>A-Z</button>
          <button onClick={() => sortFiles(false)} className="station-btn" style={{ padding: '4px 10px', boxShadow: 'none', fontSize: '0.7rem' }}>Z-A</button>
          <button onClick={clearFiles} className="station-btn" style={{ padding: '4px 10px', color: 'var(--accent-color)', boxShadow: 'none', fontSize: '0.7rem' }}>[CLEAR]</button>
        </div>
      </div>

      <div style={{ flex: 1, minHeight: '350px', maxHeight: '500px', overflowY: 'auto', border: 'var(--border-thick) solid var(--border-color)', background: 'var(--bg-color)', padding: '0' }}>
        {files.length === 0 ? (
          <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0.15, fontWeight: 900, letterSpacing: '2px' }}>IDLE_WAITING_FOR_DATA_STREAM</div>
        ) : (
          <div className="flex-col" style={{ gap: '0' }}>
            {files.map(({ file, id }) => (
              <div key={id} style={{ display: 'flex', alignItems: 'center', gap: '15px', padding: '10px 20px', borderBottom: '1px solid var(--border-color)', fontSize: '0.85rem' }}>
                <span style={{ flex: 1, fontWeight: 800 }}>{file.name}</span>
                <span style={{ opacity: 0.5, fontSize: '0.7rem', fontWeight: 900 }}>{(file.size / 1024).toFixed(1)} KB</span>
                <button 
                  onClick={() => removeFile(id)} 
                  style={{ background: 'transparent', border: 'none', color: 'var(--accent-color)', fontWeight: 900, cursor: 'pointer', padding: '5px' }}
                >
                  <CloseIcon size={14} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="grid-2" style={{ gap: '20px' }}>
        <button 
          className="station-btn station-btn-primary"
          style={{ padding: '18px', fontSize: '1.1rem', boxShadow: 'none' }}
          disabled={files.length === 0 || isProcessing}
          onClick={() => {
            onProcess(files.map(f => f.file), 'encrypt');
            if (clearOnFinish) setFiles([]);
          }}
        >
          {isProcessing ? t('processor.processing').toUpperCase() : t('processor.encrypt_all').toUpperCase()}
        </button>
        <button 
          className="station-btn"
          style={{ padding: '18px', fontSize: '1.1rem', boxShadow: 'none' }}
          disabled={files.length === 0 || isProcessing}
          onClick={() => {
            onProcess(files.map(f => f.file), 'decrypt');
            if (clearOnFinish) setFiles([]);
          }}
        >
          {isProcessing ? t('processor.processing').toUpperCase() : t('processor.decrypt_all').toUpperCase()}
        </button>
      </div>
    </div>
  );
};

export default FileProcessor;
