'use client';

/**
 * @purpose Gestiona el menú de usuario y estado para un cliente de conversión de habla a texto, incluyendo selección de archivos, opciones de idioma/modelo/formato de salida, transcripción local y visualización de resultados.
 * @purpose_en Manages the user interface and state for a speech-to-text conversion client, including file selection, language/model/output format choices, local transcription, and result display.
 * @refactorable true (contains too many state variables and UI parts)
 * @classification UI Component
 * @complexity Medium
 * @fingerprint exports:1,imports:4,sig:1gpwsf
 * @lastUpdated 2026-07-02T18:45:42.461Z
 */

import React, { useState, useRef, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { Mic, X, Download, Loader2, AlertTriangle, CheckCircle, Globe, Monitor, Copy } from 'lucide-react';
import { transcribeAudioLocally, isBrowserSttSupported } from '@/services/stt-browser';

const LANGUAGE_OPTIONS = [
  { value: '', label: 'Auto-detect' },
  { value: 'en', label: 'English' },
  { value: 'es', label: 'Spanish' },
  { value: 'fr', label: 'French' },
  { value: 'de', label: 'German' },
  { value: 'it', label: 'Italian' },
  { value: 'pt', label: 'Portuguese' },
  { value: 'nl', label: 'Dutch' },
  { value: 'ja', label: 'Japanese' },
  { value: 'ko', label: 'Korean' },
  { value: 'zh', label: 'Chinese' },
  { value: 'ar', label: 'Arabic' },
  { value: 'ru', label: 'Russian' },
];

const MODEL_OPTIONS = [
  { value: 'tiny.en', label: 'Tiny (English only, ~75 MB)', server: true },
  { value: 'tiny', label: 'Tiny (Multilingual, ~75 MB)', server: true },
  { value: 'base.en', label: 'Base English (~150 MB)', server: false },
  { value: 'base', label: 'Base Multilingual (~150 MB)', server: false },
];

const OUTPUT_OPTIONS = [
  { value: 'text', label: 'Plain text' },
  { value: 'srt', label: 'SRT subtitles' },
  { value: 'vtt', label: 'VTT subtitles' },
];

export default function SttConvertClient() {
  const t = useTranslations('admin');
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [language, setLanguage] = useState('');
  const [model, setModel] = useState('tiny.en');
  const [outputFormat, setOutputFormat] = useState('text');
  const [loading, setLoading] = useState(false);
  const [localLoading, setLocalLoading] = useState(false);
  const [localPhase, setLocalPhase] = useState<'idle' | 'downloading' | 'transcribing'>('idle');
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const browserSupported = isBrowserSttSupported();
  const [audioPreview, setAudioPreview] = useState<string | null>(null);

  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail as { progress: number; phase: string };
      setDownloadProgress(detail.progress);
      if (detail.phase === 'download') {
        setLocalPhase('downloading');
      }
    };
    window.addEventListener('stt-model-progress', handler);
    return () => window.removeEventListener('stt-model-progress', handler);
  }, []);

  useEffect(() => {
    if (localPhase === 'downloading') {
      setLocalPhase('transcribing');
    }
  }, [localLoading, localPhase]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    setResult(null);
    setError(null);
    const url = URL.createObjectURL(f);
    setAudioPreview(url);
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
          mimeType: file.type || 'audio/wav',
          to: outputFormat,
          language: language || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Transcription failed');

      setResult(data.output);
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
    setLocalPhase('downloading');
    setDownloadProgress(0);
    setError(null);
    setResult(null);

    try {
      const data = await transcribeAudioLocally(file, {
        model: model as 'tiny.en' | 'tiny' | 'base.en' | 'base',
        language: language || undefined,
      });

      if (outputFormat === 'srt' && data.chunks) {
        setResult(formatSrt(data.chunks));
      } else if (outputFormat === 'vtt' && data.chunks) {
        setResult(formatVtt(data.chunks));
      } else {
        setResult(data.text);
      }
    } catch (err: unknown) {
      const e = err as Error;
      setError(e.message);
    } finally {
      setLocalLoading(false);
      setLocalPhase('idle');
    }
  };

  const formatSrt = (chunks: Array<{ timestamp: number[]; text: string }>): string => {
    const fmt = (seconds: number): string => {
      const h = Math.floor(seconds / 3600);
      const m = Math.floor((seconds % 3600) / 60);
      const s = seconds % 60;
      const ms = Math.round((s - Math.floor(s)) * 1000);
      return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(Math.floor(s)).padStart(2, '0')},${String(ms).padStart(3, '0')}`;
    };
    return chunks.map((c, i) => `${i + 1}\n${fmt(c.timestamp[0])} --> ${fmt(c.timestamp[1])}\n${c.text.trim()}\n`).join('\n');
  };

  const formatVtt = (chunks: Array<{ timestamp: number[]; text: string }>): string => {
    const fmt = (seconds: number): string => {
      const h = Math.floor(seconds / 3600);
      const m = Math.floor((seconds % 3600) / 60);
      const s = seconds % 60;
      const ms = Math.round((s - Math.floor(s)) * 1000);
      return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(Math.floor(s)).padStart(2, '0')}.${String(ms).padStart(3, '0')}`;
    };
    return 'WEBVTT\n\n' + chunks.map((c) => `${fmt(c.timestamp[0])} --> ${fmt(c.timestamp[1])}\n${c.text.trim()}\n`).join('\n');
  };

  const handleCopy = () => {
    if (!result) return;
    navigator.clipboard.writeText(result);
  };

  const handleDownload = () => {
    if (!result) return;
    const name = file ? file.name.replace(/\.[^/.]+$/, '') : 'transcription';
    const ext = outputFormat === 'srt' ? 'srt' : outputFormat === 'vtt' ? 'vtt' : 'txt';
    const blob = new Blob([result], { type: 'text/plain;charset=utf-8' });
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
        aria-label="Speech to text"
      >
        <Mic className="w-4 h-4" />
        SPEECH TO TEXT
      </button>
    );
  }

  return (
    <div className="border border-border p-6 bg-card/40 backdrop-blur-sm flex flex-col gap-6">
      <div className="flex justify-between items-center border-b border-border/40 pb-2">
        <h3 className="font-mono text-xs font-black uppercase tracking-widest text-primary flex items-center gap-2">
          <Mic className="w-4 h-4" />
          SPEECH-TO-TEXT
        </h3>
        <button onClick={() => setOpen(false)} className="text-muted-foreground hover:text-foreground" aria-label="Close speech to text">
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="font-mono text-xs">
        <input
          ref={inputRef}
          type="file"
          accept="audio/*"
          onChange={handleFileSelect}
          className="block w-full text-[10px] file:mr-4 file:py-2 file:px-4 file:border-0 file:text-[10px] file:font-mono file:font-bold file:tracking-widest file:uppercase file:bg-primary file:text-primary-foreground hover:file:opacity-80"
        />
      </div>

      {audioPreview && file && (
        <div className="border border-border/30 bg-background/50 p-3">
          <audio controls src={audioPreview} className="w-full h-8">
            Your browser does not support the audio element.
          </audio>
          <div className="text-[10px] font-mono text-muted-foreground mt-1">
            {file.name} ({(file.size / 1024 / 1024).toFixed(1)} MB)
          </div>
        </div>
      )}

      {file && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 font-mono text-xs">
          <div className="flex flex-col gap-2">
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

          <div className="flex flex-col gap-2">
            <label className="text-muted-foreground text-[8px] tracking-wider uppercase">{t('outputFormat')}</label>
            <select
              value={outputFormat}
              onChange={(e) => setOutputFormat(e.target.value)}
              className="bg-background border border-border px-3 py-2 text-xs font-mono text-foreground focus:outline-none focus:border-primary"
            >
              {OUTPUT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-muted-foreground text-[8px] tracking-wider uppercase">
              Model {browserSupported ? '(local only)' : ''}
            </label>
            <select
              value={model}
              onChange={(e) => setModel(e.target.value)}
              className="bg-background border border-border px-3 py-2 text-xs font-mono text-foreground focus:outline-none focus:border-primary"
            >
              {MODEL_OPTIONS.filter((m) => browserSupported || m.server).map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
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
            aria-label="Transcribe on server"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                TRANSCRIBING...
              </>
            ) : (
              <>
                <Globe className="w-4 h-4" />
                TRANSCRIBE (server)
              </>
            )}
          </button>
          {browserSupported && (
            <button
              onClick={handleLocalConvert}
              disabled={loading || localLoading}
              className="btn-secondary-console text-[10px] font-mono tracking-widest uppercase py-3 px-6 inline-flex items-center justify-center gap-2 disabled:opacity-50"
              aria-label="Transcribe locally"
            >
              {localLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {localPhase === 'downloading'
                    ? `DOWNLOADING MODEL ${Math.round(downloadProgress * 100)}%...`
                    : 'TRANSCRIBING...'}
                </>
              ) : (
                <>
                  <Monitor className="w-4 h-4" />
                  TRANSCRIBE (local)
                </>
              )}
            </button>
          )}
        </div>
      )}

      {downloadProgress > 0 && localPhase === 'downloading' && (
        <div className="w-full bg-border/30 rounded-none h-2">
          <div
            className="bg-primary h-2 transition-all duration-300"
            style={{ width: `${downloadProgress * 100}%` }}
          />
        </div>
      )}

      {error && (
        <div className="border border-destructive/20 bg-destructive/5 text-destructive p-4 flex items-center gap-2 font-mono text-[10px] font-black uppercase tracking-wider">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span className="whitespace-pre-wrap">{error}</span>
        </div>
      )}

      {result !== null && (
        <div className="flex flex-col gap-3">
          <div className="flex justify-between items-center">
            <span className="font-mono text-[10px] text-emerald-500 font-black uppercase tracking-wider flex items-center gap-2">
              <CheckCircle className="w-4 h-4" />
              TRANSCRIPTION COMPLETE
            </span>
            <div className="flex gap-2">
              <button
                onClick={handleCopy}
                className="btn-secondary-console text-[9px] font-mono tracking-widest uppercase py-2 px-4 inline-flex items-center gap-2"
                aria-label="Copy transcription"
              >
                <Copy className="w-3.5 h-3.5" />
                COPY
              </button>
              <button
                onClick={handleDownload}
                className="btn-secondary-console text-[9px] font-mono tracking-widest uppercase py-2 px-4 inline-flex items-center gap-2"
                aria-label="Download transcription"
              >
                <Download className="w-3.5 h-3.5" />
                DOWNLOAD
              </button>
            </div>
          </div>
          <pre className="border border-border/30 bg-background/50 p-4 text-[10px] font-mono text-muted-foreground max-h-96 overflow-auto whitespace-pre-wrap break-all">
            {result.length > 10000 ? result.slice(0, 10000) + '\n\n... (truncated, download for full output)' : result}
          </pre>
        </div>
      )}
    </div>
  );
}
