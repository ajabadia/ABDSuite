'use client';

/**
 * @purpose Renderiza una interfaz de usuario para convertir texto a voz con opciones para seleccionar la voz, formato de salida y reproducción de audio/descarga.
 * @purpose_en Renders a user interface for converting text to speech with options for voice selection, output format, and audio playback/download.
 * @refactorable true (contains too many state variables and UI parts)
 * @classification UI Component
 * @complexity Medium
 * @fingerprint exports:1,imports:3,sig:ri8ixt
 * @lastUpdated 2026-06-28T08:33:30.470Z
 */

import React, { useState, useRef } from 'react';
import { useTranslations } from 'next-intl';
import { Volume2, X, Download, Loader2, AlertTriangle, CheckCircle, Globe, Monitor, Play, Square } from 'lucide-react';
import { speakWithWebSpeech, synthesizeAudioLocally, isBrowserTtsSupported } from '@/services/tts-browser';

const VOICE_GROUPS = [
  {
    label: 'American Female',
    voices: [
      { value: 'af_heart', label: 'Heart' },
      { value: 'af_alloy', label: 'Alloy' },
      { value: 'af_aoede', label: 'Aoede' },
      { value: 'af_bella', label: 'Bella' },
      { value: 'af_jessica', label: 'Jessica' },
      { value: 'af_kore', label: 'Kore' },
      { value: 'af_nicole', label: 'Nicole' },
      { value: 'af_nova', label: 'Nova' },
      { value: 'af_river', label: 'River' },
      { value: 'af_sarah', label: 'Sarah' },
      { value: 'af_sky', label: 'Sky' },
    ],
  },
  {
    label: 'American Male',
    voices: [
      { value: 'am_adam', label: 'Adam' },
      { value: 'am_echo', label: 'Echo' },
      { value: 'am_eric', label: 'Eric' },
      { value: 'am_fenrir', label: 'Fenrir' },
      { value: 'am_liam', label: 'Liam' },
      { value: 'am_michael', label: 'Michael' },
      { value: 'am_onyx', label: 'Onyx' },
      { value: 'am_puck', label: 'Puck' },
      { value: 'am_santa', label: 'Santa' },
    ],
  },
  {
    label: 'British Female',
    voices: [
      { value: 'bf_emma', label: 'Emma' },
      { value: 'bf_isabella', label: 'Isabella' },
      { value: 'bf_alice', label: 'Alice' },
      { value: 'bf_lily', label: 'Lily' },
    ],
  },
  {
    label: 'British Male',
    voices: [
      { value: 'bm_george', label: 'George' },
      { value: 'bm_lewis', label: 'Lewis' },
      { value: 'bm_daniel', label: 'Daniel' },
      { value: 'bm_fable', label: 'Fable' },
    ],
  },
];

const OUTPUT_OPTIONS = [
  { value: 'audio/wav', label: 'WAV' },
  { value: 'audio/mp3', label: 'MP3' },
  { value: 'audio/ogg', label: 'OGG' },
];

export default function TtsConvertClient() {
  const t = useTranslations('admin');
  const [open, setOpen] = useState(false);
  const [text, setText] = useState('');
  const [voice, setVoice] = useState('af_heart');
  const [speed, setSpeed] = useState(1);
  const [outputFormat, setOutputFormat] = useState('audio/wav');
  const [serverLoading, setServerLoading] = useState(false);
  const [localLoading, setLocalLoading] = useState(false);
  const [localPhase, setLocalPhase] = useState<'idle' | 'loading-model' | 'generating'>('idle');
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);
  const browserSupported = isBrowserTtsSupported();

  React.useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail as { progress: number; phase: string };
      setDownloadProgress(detail.progress);
      if (detail.phase === 'loading') {
        setLocalPhase('loading-model');
      }
    };
    window.addEventListener('tts-model-progress', handler);
    return () => window.removeEventListener('tts-model-progress', handler);
  }, []);

  const handleServerGenerate = async () => {
    if (!text.trim()) return;
    setServerLoading(true);
    setError(null);
    setAudioUrl(null);
    setSuccess(false);

    try {
      const res = await fetch('/api/v1/convert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: text,
          mimeType: 'text/plain',
          to: outputFormat,
          voice,
          speed,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'TTS generation failed');

      const audioBlob = base64ToBlob(data.output, data.mimeType);
      const url = URL.createObjectURL(audioBlob);
      setAudioUrl(url);
      setSuccess(true);
    } catch (err: unknown) {
      const e = err as Error;
      setError(e.message);
    } finally {
      setServerLoading(false);
    }
  };

  const handleLocalGenerate = async () => {
    if (!text.trim()) return;
    setLocalLoading(true);
    setLocalPhase('loading-model');
    setDownloadProgress(0);
    setError(null);
    setAudioUrl(null);
    setSuccess(false);

    try {
      const result = await synthesizeAudioLocally(text, { voice, speed });
      const url = URL.createObjectURL(result.blob);
      setAudioUrl(url);
      setSuccess(true);
      setLocalPhase('idle');
    } catch (err: unknown) {
      const e = err as Error;
      setError(e.message);
    } finally {
      setLocalLoading(false);
      setLocalPhase('idle');
    }
  };

  const handlePlayPreview = async () => {
    if (isPlaying) {
      speechSynthesis.cancel();
      setIsPlaying(false);
      return;
    }

    if (!text.trim()) return;
    setIsPlaying(true);
    try {
      await speakWithWebSpeech(text, { voice, speed });
    } catch {
      // Silently fail Web Speech preview
    } finally {
      setIsPlaying(false);
    }
  };

  const handleDownload = () => {
    if (!audioUrl) return;
    const a = document.createElement('a');
    a.href = audioUrl;
    const ext = outputFormat.split('/')[1] || 'wav';
    a.download = `tts_output.${ext}`;
    a.click();
  };

  const base64ToBlob = (base64: string, mimeType: string): Blob => {
    const byteChars = atob(base64);
    const byteArrays: BlobPart[] = [];
    for (let offset = 0; offset < byteChars.length; offset += 512) {
      const slice = byteChars.slice(offset, offset + 512);
      const byteNumbers = new Array<number>(slice.length);
      for (let i = 0; i < slice.length; i++) {
        byteNumbers[i] = slice.charCodeAt(i);
      }
      byteArrays.push(new Uint8Array(byteNumbers).buffer);
    }
    return new Blob(byteArrays, { type: mimeType });
  };

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="btn-secondary-console text-[10px] font-mono tracking-widest uppercase py-3 px-6 inline-flex items-center gap-2"
        aria-label="Text to speech"
      >
        <Volume2 className="w-4 h-4" />
        TEXT TO SPEECH
      </button>
    );
  }

  return (
    <div className="border border-border p-6 bg-card/40 backdrop-blur-sm flex flex-col gap-6">
      <div className="flex justify-between items-center border-b border-border/40 pb-2">
        <h3 className="font-mono text-xs font-black uppercase tracking-widest text-primary flex items-center gap-2">
          <Volume2 className="w-4 h-4" />
          TEXT-TO-SPEECH
        </h3>
        <button onClick={() => setOpen(false)} className="text-muted-foreground hover:text-foreground" aria-label="Close text to speech">
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="font-mono text-xs">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Enter text to synthesize..."
          rows={4}
          className="w-full bg-background border border-border px-3 py-2 text-xs font-mono text-foreground focus:outline-none focus:border-primary resize-vertical"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 font-mono text-xs">
        <div className="flex flex-col gap-2">
          <label className="text-muted-foreground text-[8px] tracking-wider uppercase">{t('voice')}</label>
          <select
            value={voice}
            onChange={(e) => setVoice(e.target.value)}
            className="bg-background border border-border px-3 py-2 text-xs font-mono text-foreground focus:outline-none focus:border-primary"
          >
            {VOICE_GROUPS.map((group) => (
              <optgroup key={group.label} label={group.label}>
                {group.voices.map((v) => (
                  <option key={v.value} value={v.value}>{v.label}</option>
                ))}
              </optgroup>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-muted-foreground text-[8px] tracking-wider uppercase">
            Speed: {speed.toFixed(1)}x
          </label>
          <input
            type="range"
            min="0.5"
            max="2"
            step="0.1"
            value={speed}
            onChange={(e) => setSpeed(parseFloat(e.target.value))}
            className="w-full accent-primary"
          />
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
      </div>

      <div className="flex gap-3 flex-wrap">
        {browserSupported && (
          <button
            onClick={handlePlayPreview}
            disabled={!text.trim() || serverLoading || localLoading}
            className="btn-secondary-console text-[10px] font-mono tracking-widest uppercase py-3 px-6 inline-flex items-center justify-center gap-2 disabled:opacity-50"
            aria-label="Preview with browser speech"
          >
            {isPlaying ? (
              <>
                <Square className="w-4 h-4" />
                STOP
              </>
            ) : (
              <>
                <Play className="w-4 h-4" />
                PREVIEW (browser)
              </>
            )}
          </button>
        )}
        <button
          onClick={handleServerGenerate}
          disabled={!text.trim() || serverLoading || localLoading}
          className="btn-primary-console text-[10px] font-mono tracking-widest uppercase py-3 px-6 inline-flex items-center justify-center gap-2 disabled:opacity-50"
          aria-label="Generate on server"
        >
          {serverLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              GENERATING...
            </>
          ) : (
            <>
              <Globe className="w-4 h-4" />
              GENERATE (server)
            </>
          )}
        </button>
        {browserSupported && (
          <button
            onClick={handleLocalGenerate}
            disabled={!text.trim() || serverLoading || localLoading}
            className="btn-secondary-console text-[10px] font-mono tracking-widest uppercase py-3 px-6 inline-flex items-center justify-center gap-2 disabled:opacity-50"
            aria-label="Generate locally"
          >
            {localLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                {localPhase === 'loading-model'
                  ? `LOADING MODEL ${Math.round(downloadProgress * 100)}%...`
                  : 'GENERATING...'}
              </>
            ) : (
              <>
                <Monitor className="w-4 h-4" />
                GENERATE (local)
              </>
            )}
          </button>
        )}
      </div>

      {downloadProgress > 0 && localPhase === 'loading-model' && (
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

      {success && audioUrl && (
        <div className="flex flex-col gap-3">
          <div className="flex justify-between items-center">
            <span className="font-mono text-[10px] text-emerald-500 font-black uppercase tracking-wider flex items-center gap-2">
              <CheckCircle className="w-4 h-4" />
              AUDIO GENERATED
            </span>
            <button
              onClick={handleDownload}
              className="btn-secondary-console text-[9px] font-mono tracking-widest uppercase py-2 px-4 inline-flex items-center gap-2"
              aria-label="Download audio"
            >
              <Download className="w-3.5 h-3.5" />
              DOWNLOAD
            </button>
          </div>
          <audio
            ref={audioRef}
            controls
            src={audioUrl}
            className="w-full h-8"
          >
            Your browser does not support the audio element.
          </audio>
        </div>
      )}
    </div>
  );
}
