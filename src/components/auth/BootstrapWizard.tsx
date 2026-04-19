'use client';

import React, { useState } from 'react';
import { useLanguage } from '@/lib/context/LanguageContext';
import { useWorkspace } from '@/lib/context/WorkspaceContext';
import { coreDb } from '@/lib/db/SystemDB';
import { hashPin } from '@/lib/utils/crypto.utils';
import { ShieldAlertIcon, UserPlusIcon, BuildingIcon, CheckIcon, LoaderIcon } from '../common/Icons';

export const BootstrapWizard: React.FC = () => {
  const { t } = useLanguage();
  const { refreshBootstrapStatus } = useWorkspace();
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);

  // Admin Data
  const [adminName, setAdminName] = useState('');
  const [pin, setPin] = useState('');
  const [pinConfirm, setPinConfirm] = useState('');

  // Unit Data
  const [unitCode, setUnitCode] = useState('UNIT01');
  const [unitName, setUnitName] = useState('');

  const [error, setError] = useState<string | null>(null);

  const handleBootstrap = async () => {
    if (pin !== pinConfirm) {
      setError('auth.bootstrap.error_pin_mismatch');
      return;
    }
    if (pin.length < 4 || pin.length > 6 || !/^\d+$/.test(pin)) {
      setError('auth.bootstrap.error_pin_format');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const unitId = crypto.randomUUID();
      const adminId = crypto.randomUUID();
      const pinHash = await hashPin(pin);
      console.log(`[ABDFN-BOOTSTRAP] Admin initialized with PIN Hash: ${pinHash}`);

      // 1. Create Unit
      await coreDb.units.add({
        id: unitId,
        code: unitCode,
        name: unitName || 'PRE-DEPÁRTAMENTO',
        createdAt: Date.now(),
        updatedAt: Date.now(),
        isActive: 1 // Industrial standard: use 0/1 instead of boolean for indexing
      });

      // 2. Create Admin
      await coreDb.operators.add({
        id: adminId,
        name: adminName || 'SISTEMAS',
        pinHash,
        role: 'ADMIN',
        unitIds: [unitId],
        createdAt: Date.now(),
        updatedAt: Date.now(),
        isActive: 1 // Industrial standard: use 0/1 instead of boolean for indexing
      });

      await refreshBootstrapStatus();
    } catch (err) {
      console.error('[ABDFN-BOOTSTRAP] Critical Failure', err);
      setError('auth.bootstrap.error_save_failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="station-modal-overlay" style={{ background: 'var(--bg-primary)' }}>
      <div className="station-modal" style={{ maxWidth: '500px', border: '1px solid var(--accent-primary)' }}>
        <header className="station-modal-header" style={{ borderColor: 'var(--accent-primary)' }}>
          <div className="flex-row" style={{ gap: '12px' }}>
            <ShieldAlertIcon size={24} color="var(--accent-primary)" />
            <div className="flex-col">
              <h2 className="station-modal-title" style={{ fontSize: '1.2rem' }}>ABDFN SUITE</h2>
              <p className="station-modal-subtitle" style={{ color: 'var(--accent-primary)' }}>ASEPTIC BOOTSTRAP v6.0</p>
            </div>
          </div>
        </header>

        <div className="station-modal-body" style={{ padding: '32px' }}>
          {step === 1 && (
            <div className="flex-col animate-fade-in" style={{ gap: '24px' }}>
              <div className="flex-row" style={{ gap: '8px', opacity: 0.7 }}>
                <UserPlusIcon size={16} />
                <span className="station-label">CONFIGURACIÓN DE ADMINISTRADOR MAESTRO</span>
              </div>
              
              <div className="flex-col" style={{ gap: '16px' }}>
                <div className="station-form-group">
                  <label className="station-label">NOMBRE DEL OPERADOR</label>
                  <input 
                    className="station-input" 
                    value={adminName} 
                    onChange={e => setAdminName(e.target.value)} 
                    placeholder="Ej: SISTEMAS"
                  />
                </div>
                <div className="station-form-group">
                  <label className="station-label">PIN INDUSTRIAL (4-6 DÍGITOS)</label>
                  <input 
                    type="password"
                    maxLength={6}
                    className="station-input" 
                    value={pin} 
                    onChange={e => setPin(e.target.value)} 
                    placeholder="****"
                    style={{ letterSpacing: '8px' }}
                  />
                </div>
                <div className="station-form-group">
                  <label className="station-label">CONFIRMAR PIN</label>
                  <input 
                    type="password"
                    maxLength={6}
                    className="station-input" 
                    value={pinConfirm} 
                    onChange={e => setPinConfirm(e.target.value)} 
                    placeholder="****"
                    style={{ letterSpacing: '8px' }}
                  />
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="flex-col animate-fade-in" style={{ gap: '24px' }}>
              <div className="flex-row" style={{ gap: '8px', opacity: 0.7 }}>
                <BuildingIcon size={16} />
                <span className="station-label">REGISTRO DE UNIDAD / DEPARTAMENTO</span>
              </div>

              <div className="flex-col" style={{ gap: '16px' }}>
                <div className="station-form-group">
                  <label className="station-label">CÓDIGO DE UNIDAD</label>
                  <input 
                    className="station-input" 
                    value={unitCode} 
                    onChange={e => setUnitCode(e.target.value)} 
                    placeholder="UNIT01"
                  />
                </div>
                <div className="station-form-group">
                  <label className="station-label">NOMBRE DEL DEPARTAMENTO</label>
                  <input 
                    className="station-input" 
                    value={unitName} 
                    onChange={e => setUnitName(e.target.value)} 
                    placeholder="Ej: DEPÓSITOS RETAIL"
                  />
                </div>
              </div>

              <div className="alert-box warning" style={{ fontSize: '11px', opacity: 0.8 }}>
                <p>⚠️ SE CREARÁ UNA BASE DE DATOS FÍSICA INDEPENDIENTE PARA ESTA UNIDAD.</p>
              </div>
            </div>
          )}

          {error && (
            <div className="alert-box error" style={{ marginTop: '24px' }}>
              <p>{error}</p>
            </div>
          )}
        </div>

        <footer className="station-modal-footer" style={{ justifyContent: 'space-between' }}>
          <div>
             <span className="station-label" style={{ opacity: 0.5 }}>PASO {step} DE 2</span>
          </div>
          <div className="flex-row" style={{ gap: '12px' }}>
            {step === 2 && (
              <button 
                className="station-btn station-btn-secondary" 
                onClick={() => setStep(1)}
              >
                VOLVER
              </button>
            )}
            
            {step === 1 ? (
              <button 
                className="station-btn station-btn-primary" 
                disabled={!adminName || pin.length < 4}
                onClick={() => setStep(2)}
              >
                SIGUIENTE
              </button>
            ) : (
              <button 
                className="station-btn station-btn-primary" 
                disabled={!unitCode || isLoading}
                onClick={handleBootstrap}
              >
                {isLoading ? <LoaderIcon className="animate-spin" size={16} /> : <CheckIcon size={16} />}
                {isLoading ? 'PROCESANDO...' : 'SITUAR SISTEMA'}
              </button>
            )}
          </div>
        </footer>
      </div>

      <div className="station-integrity-badge" style={{ position: 'fixed', bottom: '24px', right: '24px', pointerEvents: 'none' }}>
         <div className="integrity-dot blink" />
         <span>ASEPTIC BOOTSTRAP MODE</span>
      </div>
    </div>
  );
};
