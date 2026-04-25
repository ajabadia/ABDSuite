'use client';

import React, { useState } from 'react';
import { useWorkspace } from '@/lib/context/WorkspaceContext';
import { XIcon, ShieldCheckIcon, AlertTriangleIcon, RefreshCwIcon } from '@/components/common/Icons';

interface VaultPinModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const VaultPinModal: React.FC<VaultPinModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const { unlockIK } = useWorkspace();
  const [pin, setPin] = useState('');
  const [isError, setIsError] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setIsError(false);

    try {
      const success = await unlockIK(pin);
      if (success) {
        onSuccess?.();
        onClose();
      } else {
        setIsError(true);
      }
    } catch (err) {
      setIsError(true);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="station-modal-overlay" onClick={onClose}>
      <div className="station-modal" style={{ maxWidth: '400px' }} onClick={e => e.stopPropagation()}>
        <header className="station-modal-header" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
          <div className="flex-row" style={{ alignItems: 'center', gap: '12px' }}>
            <div className="station-registry-item-icon" style={{ background: 'var(--primary-color)', color: 'white' }}>
              <ShieldCheckIcon size={18} />
            </div>
            <h3 className="station-registry-item-name" style={{ fontSize: '1.1rem' }}>ABRIR BÓVEDA (PIN)</h3>
          </div>
          <button className="station-btn icon-only" style={{ border: 'none' }} onClick={onClose}>
            <XIcon size={20} />
          </button>
        </header>

        <form onSubmit={handleSubmit} className="station-modal-content" style={{ padding: '32px' }}>
          <div className="flex-col" style={{ gap: '24px', alignItems: 'center' }}>
            <p style={{ textAlign: 'center', fontSize: '0.9rem', opacity: 0.7, lineHeight: 1.5 }}>
              Introduce tu código de acceso industrial para desbloquear el motor de cifrado de la Era 6.
            </p>

            <div className="station-form-field" style={{ width: '100%' }}>
              <input 
                type="password"
                className={`station-input ${isError ? 'err' : ''}`}
                style={{ 
                  textAlign: 'center', 
                  fontSize: '2rem', 
                  letterSpacing: '1rem',
                  height: '60px',
                  background: 'rgba(0,0,0,0.2)'
                }}
                placeholder="••••••"
                maxLength={6}
                autoFocus
                value={pin}
                onChange={e => setPin(e.target.value.replace(/\D/g, ''))}
              />
              {isError && (
                <div className="flex-row" style={{ color: 'var(--status-err)', fontSize: '0.75rem', gap: '8px', marginTop: '8px', justifyContent: 'center' }}>
                  <AlertTriangleIcon size={14} /> PIN_INVALIDO_O_BOVEDA_CORRUPTA
                </div>
              )}
            </div>

            <button 
              type="submit" 
              className="station-btn station-btn-primary" 
              style={{ width: '100%', height: '48px', fontWeight: 800 }}
              disabled={isLoading || pin.length < 4}
            >
              {isLoading ? <><RefreshCwIcon size={18} className="animate-spin" /> ACCEDIENDO...</> : 'DESBLOQUEAR MOTOR'}
            </button>
          </div>
        </form>

        <footer style={{ padding: '16px', background: 'rgba(255,255,255,0.02)', borderTop: '1px solid rgba(255,255,255,0.05)', fontSize: '0.7rem', opacity: 0.4, textAlign: 'center' }}>
          GAWEB_PROTOCOL_ERA_6 // SECURITY_ENFORCED
        </footer>
      </div>
    </div>
  );
};
