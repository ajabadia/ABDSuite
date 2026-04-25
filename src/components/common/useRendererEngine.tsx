/**
 * ABDFN Suite - Renderer Engine Hook (Phase 19)
 * Exposes the high-fidelity rendering pipeline via context.
 */

'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';
import { RendererHost } from './RendererHost';

export type RendererEngine = {
  renderToPdf: (blob: Blob, filename: string) => Promise<Blob>;
  captureFingerprint: (blob: Blob, filename: string) => Promise<string>;
};

const RendererContext = createContext<RendererEngine | null>(null);

export const RendererProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [engine, setEngine] = useState<RendererEngine | null>(null);

  return (
    <RendererContext.Provider value={engine}>
      {children}
      <RendererHost
        onReady={(eng: RendererEngine) => setEngine(eng)}
      />
    </RendererContext.Provider>
  );
};

/**
 * Access the industrial rendering engine.
 * Returns null if the engine is not yet initialized.
 */
export const useRendererEngine = () => {
  const ctx = useContext(RendererContext);
  return ctx;
};
