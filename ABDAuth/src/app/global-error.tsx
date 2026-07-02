'use client';

/**
 * @purpose Renderiza un componente de error global que muestra errores críticos del sistema y ofrece la opción de resetear el protocolo.
 * @purpose_en Renders a global error boundary component that displays critical system errors and provides an option to reset the protocol.
 * @refactorable true (contains too many state variables and UI parts)
 * @classification UI Component
 * @complexity Low
 * @fingerprint exports:1,imports:2,sig:1hzh3p
 * @lastUpdated 2026-07-02T18:44:12.683Z
 */

import { useEffect, useState } from 'react';
import { ShieldAlert, RefreshCw } from 'lucide-react';

/**
 * 🚨 GLOBAL_ERROR_BOUNDARY
 * PATH: src/app/global-error.tsx
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const [lang, setLang] = useState('es');
  useEffect(() => {
    const match = document.cookie.match(/NEXT_LOCALE=([^;]+)/);
    setLang(match?.[1] || navigator.language?.split('-')[0] || 'es');
  }, []);

  const t: Record<string, Record<string, string>> = {
    es: { title: 'Error crítico del sistema', subtitle: 'Fallo de orquestación · Brecha detectada', unknownMsg: 'Error desconocido en el motor de identidad.', resetLabel: 'Reiniciar protocolo' },
    en: { title: 'Critical System Error', subtitle: 'Orchestration Failure · Breach Detected', unknownMsg: 'Unknown error in identity engine.', resetLabel: 'Restart Protocol' },
  };
  const tr = t[lang] || t.en;
  const title = tr.title;
  const subtitle = tr.subtitle;
  const unknownMsg = tr.unknownMsg;
  const resetLabel = tr.resetLabel;

  return (
    <html lang={lang}>
      <body className="min-h-screen bg-black text-white font-sans flex items-center justify-center p-6 selection:bg-red-500/30">
        <div className="max-w-md w-full bg-card border border-red-500/20 rounded-2xl p-8 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-red-600/10 blur-3xl -mr-16 -mt-16" />
          
          <div className="flex flex-col items-center text-center space-y-6">
            <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center border border-red-500/20 animate-pulse">
              <ShieldAlert size={32} className="text-red-500" />
            </div>
            
            <div className="space-y-2">
              <h2 className="text-xl font-bold tracking-tight uppercase">{title}</h2>
              <p className="text-[10px] text-muted-foreground font-mono uppercase tracking-[0.2em]">
                {subtitle}
              </p>
            </div>

            <div className="w-full bg-black/40 border border-border/50 rounded-lg p-4 font-mono text-[10px] text-red-400 overflow-auto max-h-32 text-left">
              <code>{error.message || unknownMsg}</code>
              {error.digest && (
                <p className="mt-2 text-muted-foreground opacity-50 text-[8px]">
                  DIGEST: {error.digest}
                </p>
              )}
            </div>

            <button
              aria-label={resetLabel}
              onClick={() => reset()}
              className="flex items-center gap-2 px-6 py-2.5 bg-white text-black rounded-full text-xs font-black uppercase tracking-widest hover:bg-gray-200 transition-all active:scale-95"
            >
              <RefreshCw size={14} />
              {resetLabel}
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
