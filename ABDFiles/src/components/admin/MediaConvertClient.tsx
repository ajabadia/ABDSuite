'use client';

/**
 * @purpose Gestiona la conversión de archivos de medios utilizando un cliente local y maneja las interacciones de UI para la selección, conversión y descarga de archivos.
 * @purpose_en Manages the conversion of media files using a local client and handles UI interactions for file selection, conversion, and download.
 * @refactorable true (contains too many state variables and UI parts)
 * @classification UI Component
 * @complexity Medium
 * @fingerprint exports:1,imports:3,sig:apl8e2
 * @lastUpdated 2026-06-28T08:33:24.390Z
 */

import React, { useState, useRef } from 'react';
import { useTranslations } from 'next-intl';
import { Film, X, Download, Loader2, AlertTriangle, CheckCircle, Globe, Monitor } from 'lucide-react';
import { convertMediaLocally, isBrowserMediaSupported } from '@/services/media-browser';

const OUTPUT_OPTIONS = [
  { value: 'audio/mp3', label: 'MP3 (audio)', group: 'audio' },
  { value: 'audio/wav', label: 'WAV (audio)', group: 'audio' },
  { value: 'audio/ogg', label: 'OGG (audio)', group: 'audio' },
  { value: 'audio/flac', label: 'FLAC (audio)', group: 'audio' },
  { value: 'audio/aac', label: 'AAC (audio)', group: 'audio' },
  { value: 'video/mp4', label: 'MP4 (video)', group: 'video' },
  { value: 'video/webm', label: 'WebM (video)', group: 'video' },
];

export default function MediaConvertClient() {
  const t = useTranslations('admin');
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [toFormat, setToFormat] = useState('audio/mp3');
  const [loading, setLoading] = useState(false);
  const [localLoading, setLocalLoading] = useState(false);
  const [result, setResult] = useState<Uint8Array | null>(null);
  const [resultMime, setResultMime] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const browserSupported = isBrowserMediaSupported();

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    setResult(null);
    setError(null);
  };

  const toBase64 = async (blob: Blob): Promise<string> => {
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

  const handleServerConvert = async () => {
    if (!file) return;
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const base64 = await toBase64(file);
      const res = await fetch('/api/v1/convert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: base64,
          mimeType: file.type || 'audio/mpeg',
          to: toFormat,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Conversion failed');

      const binaryStr = atob(data.output);
      const bytes = new Uint8Array(binaryStr.length);
      for (let i = 0; i < binaryStr.length; i++) {
        bytes[i] = binaryStr.charCodeAt(i);
      }
      setResult(bytes);
      setResultMime(data.mimeType);
    } catch (err: unknown) {
      const e = err as Error;
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLocalConvert = async () => {
    if (!file) return;
    setLocalLoading(true);
    setError(null);
    setResult(null);

    try {
      const data = await convertMediaLocally(file, { to: toFormat });
      setResult(data);
      setResultMime(toFormat);
    } catch (err: unknown) {
      const e = err as Error;
      setError(e.message);
    } finally {
      setLocalLoading(false);
    }
  };

  const handleDownload = () => {
    if (!result || !file) return;
    const ext = toFormat.split('/')[1] || 'mp3';
    const name = file.name.replace(/\.[^/.]+$/, '') || 'converted';
    const blob = new Blob([result as unknown as BlobPart], { type: resultMime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${name}.${ext}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="btn-secondary-console text-[10px] font-mono tracking-widest uppercase py-3 px-6 inline-flex items-center gap-2"
        aria-label="Convert media"
      >
        <Film className="w-4 h-4" />
        CONVERT MEDIA
      </button>
    );
  }

  return (
    <div className="border border-border p-6 bg-card/40 backdrop-blur-sm flex flex-col gap-6">
      <div className="flex justify-between items-center border-b border-border/40 pb-2">
        <h3 className="font-mono text-xs font-black uppercase tracking-widest text-primary flex items-center gap-2">
          <Film className="w-4 h-4" />
          MEDIA CONVERTER
        </h3>
        <button onClick={() => setOpen(false)} className="text-muted-foreground hover:text-foreground" aria-label="Close media converter">
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="font-mono text-xs">
        <input
          ref={inputRef}
          type="file"
          accept="audio/*,video/*"
          onChange={handleFileSelect}
          className="block w-full text-[10px] file:mr-4 file:py-2 file:px-4 file:border-0 file:text-[10px] file:font-mono file:font-bold file:tracking-widest file:uppercase file:bg-primary file:text-primary-foreground hover:file:opacity-80"
        />
      </div>

      {file && (
        <div className="text-[10px] font-mono text-muted-foreground">
          {file.name} ({(file.size / 1024 / 1024).toFixed(1)} MB)
        </div>
      )}

      {file && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 font-mono text-xs">
          <div className="flex flex-col gap-2">
            <label className="text-muted-foreground text-[8px] tracking-wider uppercase">{t('outputFormat')}</label>
            <select
              value={toFormat}
              onChange={(e) => setToFormat(e.target.value)}
              className="bg-background border border-border px-3 py-2 text-xs font-mono text-foreground focus:outline-none focus:border-primary"
            >
              <optgroup label="Audio">
                {OUTPUT_OPTIONS.filter((o) => o.group === 'audio').map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </optgroup>
              <optgroup label="Video">
                {OUTPUT_OPTIONS.filter((o) => o.group === 'video').map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </optgroup>
            </select>
          </div>
        </div>
      )}

      {file && (
        <div className="flex gap-3">
          <button
            onClick={handleServerConvert}
            disabled={loading || localLoading}
            className="btn-primary-console text-[10px] font-mono tracking-widest uppercase py-3 px-6 inline-flex items-center justify-center gap-2 disabled:opacity-50"
            aria-label="Convert on server"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                CONVERTING...
              </>
            ) : (
              <>
                <Globe className="w-4 h-4" />
                CONVERT (server)
              </>
            )}
          </button>
          {browserSupported && (
            <button
              onClick={handleLocalConvert}
              disabled={loading || localLoading}
              className="btn-secondary-console text-[10px] font-mono tracking-widest uppercase py-3 px-6 inline-flex items-center justify-center gap-2 disabled:opacity-50"
              aria-label="Convert locally"
            >
              {localLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  CONVERTING...
                </>
              ) : (
                <>
                  <Monitor className="w-4 h-4" />
                  CONVERT LOCALLY
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

      {result !== null && (
        <div className="flex flex-col gap-3">
          <div className="flex justify-between items-center">
            <span className="font-mono text-[10px] text-emerald-500 font-black uppercase tracking-wider flex items-center gap-2">
              <CheckCircle className="w-4 h-4" />
              CONVERSION SUCCESSFUL
            </span>
            <button
              onClick={handleDownload}
              className="btn-secondary-console text-[9px] font-mono tracking-widest uppercase py-2 px-4 inline-flex items-center gap-2"
              aria-label="Download converted media"
            >
              <Download className="w-3.5 h-3.5" />
              DOWNLOAD
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
