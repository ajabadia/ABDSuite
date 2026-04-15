'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useLanguage } from '@/lib/context/LanguageContext';
import { EtlPreset, EtlRecordType } from '@/lib/types/etl.types';

interface SamplePreviewProps {
  preset: EtlPreset;
  activeRecordTypeName?: string;
}

export const SamplePreview: React.FC<SamplePreviewProps> = ({ preset, activeRecordTypeName }) => {
  const { t } = useLanguage();
  const [lines, setLines] = useState<string[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [encoding, setEncoding] = useState(preset.encoding || 'utf-8');

  useEffect(() => {
    setEncoding(preset.encoding || 'utf-8');
  }, [preset.encoding]);

  const loadFile = useCallback((file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      setLines(text.split(/\r?\n/).slice(0, 100)); // Load first 100 lines
    };
    reader.readAsText(file, encoding);
  }, [encoding]);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) loadFile(file);
  };

  const isLineInRange = (line: number, range: string) => {
    if (!range) return false;
    const parts = range.split(',');
    for (const part of parts) {
      if (part.includes('-')) {
        const [start, end] = part.split('-').map(Number);
        if (line >= start && line <= end) return true;
      } else {
        if (Number(part) === line) return true;
      }
    }
    return false;
  };

  const matchesPattern = (input: string, pattern: string) => {
    if (input.length !== pattern.length) return false;
    for (let i = 0; i < pattern.length; i++) {
       if (pattern[i] === '?') continue;
       if (pattern[i] === '*') { if (input[i] !== ' ') return false; continue; }
       if (pattern[i] !== input[i]) return false;
    }
    return true;
  };

  const getLineMatch = (line: string, index: number) => {
    const totalLines = index + 1;
    const headerMatch = preset.recordTypes.find(r => r.behavior === 'HEADER' && isLineInRange(totalLines, r.range));
    if (headerMatch) return headerMatch;

    for (const rule of preset.recordTypes.filter(r => r.behavior === 'DATA')) {
      if (!rule.trigger) continue;
      const start = preset.recordTypeLen > 0 ? preset.recordTypeStart : rule.triggerStart;
      const len = preset.recordTypeLen > 0 ? preset.recordTypeLen : rule.trigger.length;
      if (line.length < start + len) continue;
      const cand = line.substring(start, start + len).trim();
      if (preset.recordTypeLen > 0) {
        if (matchesPattern(cand, rule.trigger)) return rule;
      } else {
        const spec = line.substring(rule.triggerStart, rule.triggerStart + rule.trigger.length);
        if (matchesPattern(spec, rule.trigger)) return rule;
      }
    }
    return null;
  };

  return (
    <div className="station-card" style={{ height: '100%', margin: 0 }}>
      <div className="station-card-title">DATA_SPECTROMETER_VIEW</div>

      <div 
        className="station-card"
        style={{ flex: 1, minHeight: 0, overflowY: 'auto', background: 'rgba(0,0,0,0.5)', cursor: 'crosshair', borderStyle: isDragging ? 'dashed' : 'solid' }}
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
      >
        {lines.length === 0 ? (
          <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', opacity: 0.2 }}>
            <p style={{ fontWeight: 900 }}>[DRAG_DATA_FILE_TO_PREVIEW]</p>
            <small>TEXT_UTF8_MONO_ONLY</small>
          </div>
        ) : (
          <div style={{ padding: '10px' }}>
            {lines.map((line, i) => {
              const match = getLineMatch(line, i);
              const isActive = match?.name === activeRecordTypeName;
              return (
                <div key={i} style={{ display: 'flex', gap: '15px', padding: '2px 0', borderBottom: '1px solid rgba(var(--primary-color), 0.05)', background: isActive ? 'rgba(var(--primary-color), 0.1)' : 'transparent' }}>
                  <span style={{ width: '40px', opacity: 0.3, fontSize: '0.7rem', fontWeight: 900, textAlign: 'right', fontFamily: 'inherit' }}>{(i + 1).toString().padStart(3, '0')}</span>
                  <pre style={{ margin: 0, fontSize: '0.85rem', whiteSpace: 'pre', flex: 1, fontFamily: 'inherit', color: match ? 'var(--border-color)' : 'var(--text-secondary)' }}>{line || ' '}</pre>
                  {match && (
                    <span style={{ fontSize: '0.6rem', fontWeight: 900, padding: '1px 5px', background: 'var(--border-color)', color: 'var(--bg-color)', fontFamily: 'inherit' }}>
                      {match.name.substring(0, 12)}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
