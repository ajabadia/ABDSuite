'use client';

import React from 'react';
import { useWorkspace } from '@/lib/context/WorkspaceContext';

/**
 * VaultStatusReactor - Componente DRY para la cabecera industrial.
 * Muestra el estado del Vault y lanza el desafío de PIN si está bloqueado.
 * Implementa efecto latido (animate-pulse) en estado crítico.
 */
export const VaultStatusReactor: React.FC = () => {
  const { 
    installationKey, 
    setIsVaultChallengeOpen 
  } = useWorkspace();

  if (!installationKey) {
    return (
      <button 
        onClick={() => setIsVaultChallengeOpen(true)}
        className="station-btn tiny err animate-pulse" 
        style={{ 
          padding: '6px 16px', 
          background: 'rgba(239, 68, 68, 0.1)', 
          color: 'var(--status-err)', 
          border: '1px solid var(--status-err)',
          fontWeight: 800,
          letterSpacing: '0.05rem',
          fontSize: '10px',
          boxShadow: '0 0 15px rgba(239, 68, 68, 0.2)'
        }}
      >
        🔒 MOTOR BLOQUEADO (PIN REQUERIDO)
      </button>
    );
  }

  return (
    <div 
      className="station-badge success tiny" 
      style={{ 
        fontSize: '10px', 
        fontWeight: 700,
        padding: '6px 16px',
        background: 'rgba(34, 197, 94, 0.1)',
        color: 'var(--status-success)',
        border: '1px solid var(--status-success)',
        display: 'flex',
        alignItems: 'center',
        gap: '6px'
      }}
    >
      🛡️ VAULT_OPEN (ENGINE_READY)
    </div>
  );
};
