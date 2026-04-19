'use client';

import React, { useState, useEffect } from 'react';
import { useLanguage } from '@/lib/context/LanguageContext';
import { XIcon } from '@/components/common/Icons';

interface DataPreviewModalProps {
  file: File;
  onClose: () => void;
}

const DataPreviewModal: React.FC<DataPreviewModalProps> = ({ file, onClose }) => {
  const { t } = useLanguage();
  const [headers, setHeaders] = useState<string[]>([]);
  const [rows, setRows] = useState<string[][]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const lines = text.split(/\r?\n/).filter(line => line.trim() !== '');
      if (lines.length > 0) {
        const delimiter = lines[0].includes(';') ? ';' : ',';
        const parsedHeaders = lines[0].split(delimiter);
        const parsedRows = lines.slice(1, 11).map(line => line.split(delimiter));
        
        setHeaders(parsedHeaders);
        setRows(parsedRows);
      }
      setLoading(false);
    };
    reader.readAsText(file);
  }, [file]);

  return (
    <div className="station-modal-overlay" onClick={onClose}>
      <div 
        className="station-modal" 
        style={{ maxWidth: '90%', width: '1000px', height: '80%', padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}
        onClick={e => e.stopPropagation()}
      >
        <header style={{ padding: '16px 24px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ fontSize: '1rem', fontWeight: 800 }}>{t('letter.ui.data_preview').toUpperCase()}: {file.name}</h2>
          <button className="station-btn" style={{ border: 'none', padding: '4px' }} onClick={onClose}>
            <XIcon size={20} />
          </button>
        </header>

        <div style={{ flex: 1, overflow: 'auto', background: 'var(--bg-color)' }}>
          {loading ? (
            <div style={{ padding: '48px', textAlign: 'center', opacity: 0.5 }}>{t('letter.ui.analyzing_flow')}</div>
          ) : (
            <div className="station-table-container" style={{ border: 'none', borderRadius: 0 }}>
              <table className="station-table">
                <thead>
                  <tr>
                    {headers.map((h, i) => <th key={i}>{h}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row, ri) => (
                    <tr key={ri}>
                      {row.map((cell, ci) => <td key={ci}>{cell}</td>)}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <footer style={{ padding: '16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border-color)', background: 'var(--surface-color)' }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Muestra de 10 filas • {file.size} bytes</span>
          <button className="station-btn" onClick={onClose}>Cerrar</button>
        </footer>
      </div>
    </div>
  );
};

export default DataPreviewModal;
