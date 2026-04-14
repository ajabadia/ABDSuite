'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useLanguage } from '@/lib/context/LanguageContext';
import { EtlPreset, EtlRecordType } from '@/lib/types/etl.types';
import styles from './SamplePreview.module.css';

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

  const getLineMatch = (line: string, index: number) => {
    const totalLines = index + 1;

    // 1. Check Headers by Range
    const headerMatch = preset.recordTypes.find(r => r.behavior === 'HEADER' && isLineInRange(totalLines, r.range));
    if (headerMatch) return headerMatch;

    // 2. Check Data by Trigger
    return identifyRecordType(line, preset.recordTypes.filter(r => r.behavior === 'DATA'));
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

  const identifyRecordType = (line: string, rules: EtlRecordType[]) => {
    let fallback: EtlRecordType | null = null;
    
    for (const rule of rules) {
      if (!rule.trigger) {
        fallback = fallback || rule;
        continue;
      }

      // 1. Determine identification window
      // If global len is set, use global pos/len. Else use rule-specific trigger pos.
      const start = preset.recordTypeLen > 0 ? preset.recordTypeStart : rule.triggerStart;
      const len = preset.recordTypeLen > 0 ? preset.recordTypeLen : rule.trigger.length;
      
      if (line.length < start + len) continue;
      
      // 2. Extract and Compare
      const candidate = line.substring(start, start + len).trim();
      
      // If global len is used, we compare the trimmed candidate with the rule trigger
      if (preset.recordTypeLen > 0) {
        if (matchesPattern(candidate, rule.trigger)) return rule;
      } else {
        // Legacy/Specific behavior: match exact length of trigger
        const specificCandidate = line.substring(rule.triggerStart, rule.triggerStart + rule.trigger.length);
        if (matchesPattern(specificCandidate, rule.trigger)) return rule;
      }
    }
    return fallback;
  };

  const matchesPattern = (input: string, pattern: string) => {
    if (input.length !== pattern.length) return false;
    for (let i = 0; i < pattern.length; i++) {
      const p = pattern[i];
      const c = input[i];
      if (p === '?') continue;
      if (p === '*') {
        if (c !== ' ') return false;
        continue;
      }
      if (p !== c) return false;
    }
    return true;
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <span className={styles.label}>{t('etl.sample_file')}</span>
        {lines.length > 0 && (
          <button className={styles.clearBtn} onClick={() => setLines([])}>
            {t('processor.clear_list')}
          </button>
        )}
      </header>

      <div 
        className={`${styles.viewport} ${isDragging ? styles.dragging : ''} ${lines.length === 0 ? styles.empty : ''}`}
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
      >
        {lines.length === 0 ? (
          <div className={styles.dropPrompt}>
            <p>ARRASTRA ARCHIVOS AQUÍ O HAZ CLIC PARA SELECCIONAR</p>
            <small>(TEXT_FILE_ONLY / MAX_PREVIEW_100_ROWS)</small>
          </div>
        ) : (
          <div className={styles.codeArea}>
            {lines.map((line, i) => {
              const match = getLineMatch(line, i);
              const isActive = match?.name === activeRecordTypeName;
              
              return (
                <div 
                  key={i} 
                  className={`${styles.line} ${match ? styles.matched : ''} ${isActive ? styles.activeLine : ''}`}
                >
                  <span className={styles.lineNo}>{(i + 1).toString().padStart(3, '0')}</span>
                  <div className={styles.textContainer}>
                    <pre className={styles.text}>{line || ' '}</pre>
                    {match && (
                      <div className={styles.matchTag} data-behavior={match.behavior}>
                        {match.name.substring(0, 10)}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
