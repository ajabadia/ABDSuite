'use client';

/**
 * @purpose Gestiona el proceso de conversión de OCR para archivos subidos, permitiendo a los usuarios seleccionar un idioma y descargar el texto extraido.
 * @purpose_en Manages the OCR conversion process for uploaded files, allowing users to select a language and download the extracted text.
 * @refactorable true (contains too many state variables and UI parts)
 * @classification UI Component
 * @complexity Medium
 * @fingerprint exports:1,imports:3,sig:kimose
 * @lastUpdated 2026-06-28T08:33:25.715Z
 */

import React, { useState, useRef } from 'react';
import { useTranslations } from 'next-intl';
import { ScanText, X, Download, Loader2, AlertTriangle, CheckCircle, Globe, Monitor } from 'lucide-react';
import { performOcrLocally, isBrowserOcrSupported } from '@/services/ocr-browser';

const LANGUAGE_OPTIONS = [
  { value: 'eng', label: 'English' },
  { value: 'spa', label: 'Spanish' },
  { value: 'fra', label: 'French' },
  { value: 'deu', label: 'German' },
  { value: 'ita', label: 'Italian' },
  { value: 'por', label: 'Portuguese' },
  { value: 'cat', label: 'Catalan' },
  { value: 'ara', label: 'Arabic' },
  { value: 'chi_sim', label: 'Chinese (Simplified)' },
  { value: 'chi_tra', label: 'Chinese (Traditional)' },
  { value: 'jpn', label: 'Japanese' },
  { value: 'kor', label: 'Korean' },
  { value: 'rus', label: 'Russian' },
  { value: 'spa+eng', label: 'Spanish + English' },
  { value: 'fra+eng', label: 'French + English' },
];

export default function OcrConvertClient() {
  const t = useTranslations('admin');
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [language, setLanguage] = useState('spa+eng');
  const [loading, setLoading] = useState(false);
  const [localLoading, setLocalLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [confidence, setConfidence] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const browserSupported = isBrowserOcrSupported();

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    setResult(null);
    setError(null);
    setConfidence(null);
    const url = URL.createObjectURL(f);
    setPreview(url);
  };

  const toBase64 = (blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        resolve(result.split(',')[1]);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  };

  const handleServerOcr = async () => {
    if (!file) return;
    setLoading(true);
    setError(null);
    setResult(null);
    setConfidence(null);

    try {
      const base64 = await toBase64(file);
      const res = await fetch('/api/v1/convert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: base64,
          mimeType: file.type || 'image/jpeg',
          to: 'text/plain',
          ocr: true,
          language,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'OCR failed');

      setResult(data.output);
      if (data.confidence != null) setConfidence(data.confidence);
    } catch (err: unknown) {
      const e = err as Error;
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLocalOcr = async () => {
    if (!file) return;
    setLocalLoading(true);
    setError(null);
    setResult(null);
    setConfidence(null);

    try {
      const data = await performOcrLocally(file, { language });
      setResult(data.text);
      setConfidence(data.confidence);
    } catch (err: unknown) {
      const e = err as Error;
      setError(e.message);
    } finally {
      setLocalLoading(false);
    }
  };

  const handleDownload = () => {
    if (!result) return;
    const name = file ? file.name.replace(/\.[^/.]+$/, '') : 'ocr-result';
    const blob = new Blob([result], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${name}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="btn-secondary-console text-[10px] font-mono tracking-widest uppercase py-3 px-6 inline-flex items-center gap-2"
        aria-label="Extract text with OCR"
      >
        <ScanText className="w-4 h-4" />
        OCR (image to text)
      </button>
    );
  }

  return (
    <div className="border border-border p-6 bg-card/40 backdrop-blur-sm flex flex-col gap-6">
      <div className="flex justify-between items-center border-b border-border/40 pb-2">
        <h3 className="font-mono text-xs font-black uppercase tracking-widest text-primary flex items-center gap-2">
          <ScanText className="w-4 h-4" />
          OCR TEXT EXTRACTION
        </h3>
        <button onClick={() => setOpen(false)} className="text-muted-foreground hover:text-foreground" aria-label="Close OCR tool">
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="font-mono text-xs">
        <input
          ref={inputRef}
          type="file"
          accept="image/*,application/pdf"
          onChange={handleFileSelect}
          className="block w-full text-[10px] file:mr-4 file:py-2 file:px-4 file:border-0 file:text-[10px] file:font-mono file:font-bold file:tracking-widest file:uppercase file:bg-primary file:text-primary-foreground hover:file:opacity-80"
        />
      </div>

      {preview && !file?.type.includes('pdf') && (
        <div className="border border-border/30 bg-background/50 p-2 flex items-center justify-center max-h-48 overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={preview} alt="Preview" className="max-h-44 object-contain" />
        </div>
      )}

      {file && (
        <div className="flex flex-col gap-2 font-mono text-xs">
          <label className="text-muted-foreground text-[8px] tracking-wider uppercase">{t('language')}</label>
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className="bg-background border border-border px-3 py-2 text-xs font-mono text-foreground focus:outline-none focus:border-primary"
          >
            {LANGUAGE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
      )}

      {file && (
        <div className="flex gap-3">
          <button
            onClick={handleServerOcr}
            disabled={loading || localLoading}
            className="btn-primary-console text-[10px] font-mono tracking-widest uppercase py-3 px-6 inline-flex items-center justify-center gap-2 disabled:opacity-50"
            aria-label="Run OCR on server"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                EXTRACTING...
              </>
            ) : (
              <>
                <Globe className="w-4 h-4" />
                OCR (server)
              </>
            )}
          </button>
          {browserSupported && (
            <button
              onClick={handleLocalOcr}
              disabled={loading || localLoading}
              className="btn-secondary-console text-[10px] font-mono tracking-widest uppercase py-3 px-6 inline-flex items-center justify-center gap-2 disabled:opacity-50"
              aria-label="Run OCR locally"
            >
              {localLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  EXTRACTING...
                </>
              ) : (
                <>
                  <Monitor className="w-4 h-4" />
                  OCR (local)
                </>
              )}
            </button>
          )}
        </div>
      )}

      {error && (
        <div className="border border-destructive/20 bg-destructive/5 text-destructive p-4 flex items-center gap-2 font-mono text-[10px] font-black uppercase tracking-wider">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {confidence !== null && (
        <div className="font-mono text-[10px] text-muted-foreground">
          Confidence: {confidence.toFixed(1)}%
        </div>
      )}

      {result !== null && (
        <div className="flex flex-col gap-3">
          <div className="flex justify-between items-center">
            <span className="font-mono text-[10px] text-emerald-500 font-black uppercase tracking-wider flex items-center gap-2">
              <CheckCircle className="w-4 h-4" />
              TEXT EXTRACTED
            </span>
            <button
              onClick={handleDownload}
              className="btn-secondary-console text-[9px] font-mono tracking-widest uppercase py-2 px-4 inline-flex items-center gap-2"
              aria-label="Download extracted text"
            >
              <Download className="w-3.5 h-3.5" />
              DOWNLOAD TXT
            </button>
          </div>
          <pre className="border border-border/30 bg-background/50 p-4 text-[10px] font-mono text-muted-foreground max-h-96 overflow-auto whitespace-pre-wrap break-all">
            {result.length > 10000 ? result.slice(0, 10000) + '\n\n... (truncated, download for full output)' : result}
          </pre>
        </div>
      )}
    </div>
  );
}
