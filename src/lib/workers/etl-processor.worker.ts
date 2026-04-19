/**
 * ETL Processor Worker - ABDFN Aseptic Engine
 * Translates legacy C# ProcessorService logic to pure TypeScript.
 * Mandato 100% Inglés - Aseptic Standard ERA 6.
 */

import { EtlPreset, EtlRecordType, EtlField } from '../types/etl.types';
import { EtlProcessorOptions } from '../types/etl-processor.types';

// Wildcard matching logic from C#
const matchesPattern = (input: string, pattern: string): boolean => {
  if (input.length !== pattern.length) return false;

  for (let i = 0; i < pattern.length; i++) {
    const p = pattern[i];
    const c = input[i];

    if (p === '?') continue; // Match Any
    if (p === '*') {
      // Legacy C# Rule: * matches Space specifically
      if (c !== ' ') return false;
      continue;
    }
    if (p !== c) return false;
  }
  return true;
};

// Line range parsing from C# (e.g. "1-10,15")
const isLineInRange = (line: number, range: string): boolean => {
  if (!range || range.trim() === '') return false;
  
  const parts = range.split(',');
  for (const part of parts) {
    const trimmed = part.trim();
    if (trimmed.includes('-')) {
      const [start, end] = trimmed.split('-').map(s => parseInt(s, 10));
      if (!isNaN(start) && !isNaN(end) && line >= start && line <= end) return true;
    } else {
      const val = parseInt(trimmed, 10);
      if (!isNaN(val) && line === val) return true;
    }
  }
  return false;
};

// Identify Record Type based on triggers and ranges
const identifyRecordType = (line: string, lineNum: number, preset: EtlPreset): EtlRecordType | null => {
  // 1. Check Header/Footer ranges first
  const headerRules = preset.recordTypes.filter(r => r.behavior === 'HEADER');
  const hMatch = headerRules.find(r => isLineInRange(lineNum, r.range));
  if (hMatch) return hMatch;

  const footerRules = preset.recordTypes.filter(r => r.behavior === 'FOOTER');
  const fMatch = footerRules.find(r => isLineInRange(lineNum, r.range));
  if (fMatch) return fMatch;

  // 2. Data Matching logic
  const dataRules = preset.recordTypes.filter(r => r.behavior === 'DATA');
  let fallback: EtlRecordType | null = null;

  for (const rule of dataRules) {
    if (!rule.trigger || rule.trigger === '') {
      fallback = fallback || rule;
      continue;
    }

    if (line.length < rule.triggerStart + rule.trigger.length) continue;
    const candidate = line.substring(rule.triggerStart, rule.triggerStart + rule.trigger.length);
    
    if (matchesPattern(candidate, rule.trigger)) return rule;
  }

  return fallback;
};

// Field parsing logic
const parseLine = (line: string, fields: EtlField[]): Record<string, string> => {
  const result: Record<string, string> = {};
  for (const field of fields) {
    let val = '';
    if (field.start < line.length) {
      const length = Math.min(field.length, line.length - field.start);
      val = line.substring(field.start, field.start + length).trim();
    }
    result[field.name] = val;
  }
  return result;
};

// Main Processing Loop
self.onmessage = async (e) => {
  const { file, preset, options }: { file: File, preset: EtlPreset, options: EtlProcessorOptions } = e.data;

  try {
    const reader = file.stream().getReader();
    const decoder = new TextDecoder(options.encoding);
    let lineCount = 0;
    let partialLine = '';
    let isCancelled = false;

    self.postMessage({ type: 'LOG', payload: { type: 'info', message: `Starting process: ${file.name}` } });

    while (true) {
      const { done, value } = await reader.read();
      if (done || isCancelled) break;

      const text = decoder.decode(value, { stream: true });
      const lines = (partialLine + text).split(/\r?\n/);
      partialLine = lines.pop() || '';

      for (const line of lines) {
        lineCount++;
        
        // Skip logic (StartRow / EndRow)
        if (lineCount < options.startRow) continue;
        if (options.endRow > 0 && lineCount > options.endRow) {
          isCancelled = true;
          break;
        }

        const rt = identifyRecordType(line, lineCount, preset);
        if (rt) {
          const data = parseLine(line, rt.fields);
          
          // Send record back for writing
          self.postMessage({ 
            type: 'RECORD', 
            payload: { 
              typeName: rt.name, 
              data, 
              presetName: preset.name,
              headers: rt.fields.sort((a,b) => a.start - b.start).map(f => f.name)
            } 
          });
        }

        if (lineCount % 1000 === 0) {
          self.postMessage({ type: 'PROGRESS', payload: { processedLines: lineCount } });
        }
      }
    }

    self.postMessage({ type: 'LOG', payload: { type: 'success', message: `Process finished. Total lines: ${lineCount}` } });
    self.postMessage({ type: 'COMPLETE' });

  } catch (err: any) {
    self.postMessage({ type: 'LOG', payload: { type: 'error', message: `FATAL ERROR: ${err.message}` } });
  }
};
