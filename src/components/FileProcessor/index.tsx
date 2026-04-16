'use client';

import React, { useState, useCallback } from 'react';
import { FolderIcon, ArrowUpIcon, ArrowDownIcon, XIcon, ShieldCheckIcon, LockIcon, UnlockIcon } from '@/components/common/Icons';
import { useLanguage } from '@/lib/context/LanguageContext';
import styles from './FileProcessor.module.css';

interface SelectedFile {
  file: File;
  id: string;
}

interface FileProcessorProps {
  files: SelectedFile[];
  setFiles: React.Dispatch<React.SetStateAction<SelectedFile[]>>;
  onClear?: (count: number) => void;
  onSort?: (asc: boolean) => void;
  isProcessing: boolean;
  stats?: { success: number; error: number; skip: number };
}

const FileProcessor: React.FC<FileProcessorProps> = ({ 
  files,
  setFiles,
  onClear,
  onSort,
  isProcessing,
  stats = { success: 0, error: 0, skip: 0 }
}) => {
  const { t } = useLanguage();
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
    <div className="flex-col" style={{ gap: '24px', height: '100%' }}>
      
      <div className="station-card" style={{ padding: '0', overflow: 'hidden' }}>
        <div 
          className={`dropzone ${isDragging ? 'active' : ''}`}
          style={{ 
            height: '140px', 
            border: '2px dashed var(--border-color)', 
            margin: '16px',
            borderRadius: '8px',
            display: 'flex', 
            flexDirection: 'column',
            alignItems: 'center', 
            justifyContent: 'center',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            background: isDragging ? 'var(--bg-color)' : 'transparent',
            borderColor: isDragging ? 'var(--primary-color)' : 'var(--border-color)',
            position: 'relative'
          }}
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
        >
          <FolderIcon size={40} style={{ marginBottom: '8px', opacity: 0.4 }} />
          <p style={{ fontSize: '0.85rem', fontWeight: 600, opacity: 0.6 }}>{t('processor.dropzone')}</p>
          <input 
            type="file" 
            multiple 
            style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer' }}
            onChange={(e) => e.target.files && addFiles(e.target.files)}
          />
        </div>

        <div style={{ display: 'flex', gap: '24px', padding: '16px 24px', borderTop: '1px solid var(--border-color)', alignItems: 'center', background: 'var(--surface-color)' }}>
          <div style={{ flex: 1, display: 'flex', gap: '20px', fontSize: '0.75rem', fontWeight: 700 }}>
            <span>Procesados: <span className="txt-ok">{stats.success}</span></span>
            <span>Retenidos: <span className="txt-warn">{stats.skip}</span></span>
            <span>Errores: <span className="txt-err">{stats.error}</span></span>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button onClick={() => sortFiles(true)} className="station-btn" style={{ padding: '4px 8px', fontSize: '0.7rem' }}>A-Z</button>
            <button onClick={() => sortFiles(false)} className="station-btn" style={{ padding: '4px 8px', fontSize: '0.7rem' }}>Z-A</button>
            <button onClick={clearFiles} className="station-btn" style={{ padding: '4px 8px', fontSize: '0.7rem', color: 'var(--status-err)' }}>Limpiar Lista</button>
          </div>
        </div>
      </div>

      <div style={{ flex: 1, minHeight: 0, border: '1px solid var(--border-color)', borderRadius: '8px', background: 'var(--bg-color)', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        <header style={{ padding: '12px 24px', borderBottom: '1px solid var(--border-color)', background: 'var(--surface-color)', fontSize: '0.75rem', opacity: 0.6, fontWeight: 700, textTransform: 'uppercase' }}>
          Cola de Procesamiento ({files.length})
        </header>
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {files.length === 0 ? (
            <div className={styles.emptyList}>
              <span className={styles.shimmerText}>ESPERANDO FICHEROS...</span>
            </div>
          ) : (
            <div className="flex-col" style={{ gap: '0' }}>
              {files.map(({ file, id }) => (
                <div key={id} style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '12px 24px', borderBottom: '1px solid var(--border-color)' }}>
                  <span style={{ flex: 1, fontWeight: 600, fontSize: '0.9rem' }}>{file.name}</span>
                  <span style={{ opacity: 0.5, fontSize: '0.75rem' }}>{(file.size / 1024).toFixed(1)} KB</span>
                  <button 
                    onClick={() => removeFile(id)} 
                    className="station-btn"
                    style={{ padding: '4px', border: 'none', background: 'transparent' }}
                  >
                    <XIcon size={14} style={{ color: 'var(--status-err)' }} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

    </div>
  );
};

export default FileProcessor;
