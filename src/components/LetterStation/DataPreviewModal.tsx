'use client';

import React, { useState, useEffect } from 'react';
import { useLanguage } from '@/lib/context/LanguageContext';

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
    <div className="station-modal-overlay">
      <div className="station-modal" style={{ maxWidth: '90%', width: '1000px', height: '80%' }}>
        <header className="station-console-header" style={{ padding: '15px 25px' }}>
          <div style={{ fontWeight: 900, fontSize: '0.9rem' }}>VISTA_PREVIA_DE_DATOS: {file.name}</div>
          <button className="station-btn" style={{ background: 'transparent', border: 'none', boxShadow: 'none', padding: '0', fontSize: '1.5rem' }} onClick={onClose}>&times;</button>
        </header>

        <div style={{ flex: 1, overflow: 'auto', padding: '0', background: 'var(--bg-color)' }}>
          {loading ? (
            <div style={{ padding: '40px', textAlign: 'center', fontWeight: 900, opacity: 0.5 }}>ANALYZING_DATA_STREAM...</div>
          ) : (
            <div className="station-table-container" style={{ border: 'none' }}>
              <table className="station-table">
                <thead>
                  <tr>
                    {headers.map((h, i) => <th key={i}>{h}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row, ri) => (
                    <tr key={ri}>
                      {row.map((cell, ci) => <td key={ci} style={{ fontSize: '0.8rem' }}>{cell}</td>)}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <footer style={{ padding: '15px 25px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: 'var(--border-thick) solid var(--border-color)' }}>
          <span style={{ fontSize: '0.7rem', opacity: 0.6, fontWeight: 900 }}>{rows.length} FILAS MOSTRADAS DE {file.size} BYTES</span>
          <button className="station-btn" onClick={onClose}>CERRAR</button>
        </footer>
      </div>
    </div>
  );
};

export default DataPreviewModal;
