'use client';

/**
 * @purpose Renderiza una notificacion emergente con el proveedor de almacenamiento activo.
 * @purpose_en Renders a badge displaying the active storage provider.
 * @refactorable false
 * @classification UI Component
 * @complexity Low
 * @fingerprint exports:1,imports:2,sig:t7wk0a
 * @lastUpdated 2026-06-30T11:18:18.763Z
 */

import { useState, useEffect } from 'react';
import { HardDrive } from 'lucide-react';

const FILES_BASE = process.env.NEXT_PUBLIC_FILES_URL || 'https://files.abdia.es';

export function StorageProviderBadge() {
  const [provider, setProvider] = useState('CARGANDO...');

  useEffect(() => {
    fetch(`${FILES_BASE}/api/v1/storage/active-provider`, { credentials: 'include' })
      .then(r => r.ok ? r.json() : { provider: 'CLOUDINARY' })
      .then(d => setProvider(d.provider || 'CLOUDINARY'))
      .catch((e) => {
        console.warn('[STORAGE_PROVIDER] Fetch failed, using default', e);
        setProvider('CLOUDINARY');
      });
  }, []);

  return (
    <div className="bg-card border p-4 rounded flex items-center justify-between">
      <div className="flex items-center gap-2">
        <HardDrive className="w-4 h-4 text-muted-foreground" />
        <span className="text-[9px] font-mono font-black text-muted-foreground uppercase">ALMACENAMIENTO_ACTIVO</span>
      </div>
      <div className="text-lg font-mono font-black text-primary uppercase">{provider}</div>
    </div>
  );
}
