'use client';

import React, { useState, useCallback } from 'react';
import { FolderIcon, ArrowUpIcon, ArrowDownIcon, XIcon, ShieldCheckIcon, LockIcon, UnlockIcon, TrashIcon } from '@/components/common/Icons';
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
  emptyIcon?: React.ReactNode;
  hideEmpty?: boolean;
}

const FileProcessor: React.FC<FileProcessorProps> = ({ 
  files,
  setFiles,
  onClear,
  onSort,
  isProcessing,
  stats = { success: 0, error: 0, skip: 0 },
  emptyIcon = <ShieldCheckIcon size={64} style={{ marginBottom: '16px' }} />,
  hideEmpty = false
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
          className={`station-dropzone ${isDragging ? 'active' : ''}`}
          style={{ margin: '16px' }}
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
        >
          <FolderIcon size={40} style={{ marginBottom: '8px', opacity: 0.4 }} />
          <p className="station-shimmer-text" style={{ fontSize: '0.85rem' }}>{t('processor.dropzone').toUpperCase()}</p>
          <input 
            type="file" 
            multiple 
            onChange={(e) => e.target.files && addFiles(e.target.files)}
          />
        </div>

        <header className="station-registry-header" style={{ cursor: 'default', display: 'flex', justifyContent: 'space-between' }}>
          <div className="flex-row" style={{ alignItems: 'baseline', gap: '16px' }}>
            <span className="station-registry-item-name">{t('processor.processing_queue', { n: files.length }).toUpperCase()}</span>
            <div className="station-tech-summary" style={{ border: 'none', marginTop: 0, paddingTop: 0, gap: '12px', opacity: 0.8 }}>
              <div className="station-tech-item"><span className="station-tech-label">OK:</span> <span className="txt-ok">{stats.success}</span></div>
              <div className="station-tech-item"><span className="station-tech-label">SKP:</span> <span className="txt-warn">{stats.skip}</span></div>
              <div className="station-tech-item"><span className="station-tech-label">ERR:</span> <span className="txt-err">{stats.error}</span></div>
            </div>
          </div>
          <div className="flex-row" style={{ gap: '8px' }}>
            <button onClick={() => sortFiles(true)} className="station-btn" style={{ padding: '4px' }} title={t('processor.sort_az').toUpperCase()}><ArrowUpIcon size={16} /></button>
            <button onClick={() => sortFiles(false)} className="station-btn" style={{ padding: '4px' }} title={t('processor.sort_za').toUpperCase()}><ArrowDownIcon size={16} /></button>
            <button onClick={clearFiles} className="station-btn" style={{ padding: '4px', color: 'var(--status-err)' }} title={t('processor.clear_list').toUpperCase()}><TrashIcon size={16} /></button>
          </div>
        </header>
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {files.length === 0 ? (
            !hideEmpty && (
              <div className="station-empty-state">
                {emptyIcon}
                <span className="station-shimmer-text">{t('processor.waiting_files').toUpperCase()}</span>
              </div>
            )
          ) : (
            <div className="station-file-list">
              {files.map(({ file, id }) => (
                <div key={id} className="station-file-item">
                  <span className="fileName">{file.name}</span>
                  <span className="fileSize">{(file.size / 1024).toFixed(1)} KB</span>
                  <button 
                    onClick={() => removeFile(id)} 
                    className="station-btn"
                    style={{ padding: '0px', border: 'none', background: 'transparent' }}
                  >
                    <XIcon size={16} style={{ color: 'var(--status-err)' }} />
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
