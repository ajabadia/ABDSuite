'use client';

import React, { useState, useEffect } from 'react';
import { useLanguage } from '@/lib/context/LanguageContext';
import { useWorkspace } from '@/lib/context/WorkspaceContext';
import { coreDb } from '@/lib/db/SystemDB';
import { Operator, WorkspaceUnit } from '@/lib/types/auth.types';
import { ShieldIcon, UserIcon, BuildingIcon, XIcon, DeleteIcon, CheckIcon, KeyIcon, ShieldCheckIcon } from '../common/Icons';

export const LoginScreen: React.FC = () => {
  const { t } = useLanguage();
  const { login, verifyMfa, selectUnit, currentOperator, logout, isLocked, unlockSession, installationKey } = useWorkspace();
  
  const [pin, setPin] = useState('');
  const [operators, setOperators] = useState<Operator[]>([]);
  const [units, setUnits] = useState<WorkspaceUnit[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loginSuccess, setLoginSuccess] = useState(false);
  const [availableUnits, setAvailableUnits] = useState<WorkspaceUnit[]>([]);
  const [mfaPhase, setMfaPhase] = useState(false);
  const [mfaToken, setMfaToken] = useState('');

  useEffect(() => {
    const loadOps = async () => {
      try {
        if (!coreDb.isOpen()) await coreDb.open();
        const allOps = (await coreDb.operators.toArray()).filter(o => o.isActive);
        setOperators(allOps);
        const allUnits = (await coreDb.units.toArray()).filter(u => u.isActive);
        setUnits(allUnits);
      } catch (err) {
        console.error('[ABDFN-AUTH] Metadata load failed', err);
      }
    };
    loadOps();
  }, []);

  useEffect(() => {
    if (currentOperator && currentOperator.unitIds.length > 1) {
      const filtered = units.filter(u => currentOperator.unitIds.includes(u.id));
      setAvailableUnits(filtered);
    }
  }, [currentOperator, units]);

  const handleKeyPress = (num: string) => {
    setError(null);
    if (!mfaPhase) {
      if (pin.length < 6) setPin(prev => prev + num);
    } else {
      if (mfaToken.length < 6) setMfaToken(prev => prev + num);
    }
  };

  const handleBackspace = () => {
    if (!mfaPhase) {
      setPin(prev => prev.slice(0, -1));
    } else {
      setMfaToken(prev => prev.slice(0, -1));
    }
  };

  const handleSubmit = async () => {
    setError(null);

    if (!mfaPhase) {
      if (pin.length < 4) return;
      const result = await login(pin);
      if (result.success) {
        if (result.mfaRequired) {
          setMfaPhase(true);
        } else {
          setLoginSuccess(true);
        }
      } else {
        setError(t('auth.login.error_pin'));
        setPin('');
      }
    } else if (isLocked) {
      if (pin.length < 4) return;
      const success = await unlockSession(pin);
      if (!success) {
        setError(t('auth.login.error_pin'));
        setPin('');
      } else {
        setLoginSuccess(true);
      }
    } else {
      if (mfaToken.length < 6) return;
      const success = await verifyMfa(mfaToken);
      if (success) {
        setLoginSuccess(true);
      } else {
        setError(t('auth.mfa.invalid'));
        setMfaToken('');
      }
    }
  };


  // Physical Keyboard Support
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key >= '0' && e.key <= '9') {
        handleKeyPress(e.key);
      } else if (e.key === 'Backspace') {
        handleBackspace();
      } else if (e.key === 'Enter') {
        handleSubmit();
      } else if (e.key === 'Escape') {
        if (mfaPhase) {
          setMfaPhase(false);
          setMfaToken('');
        } else {
          setPin('');
        }
        setError(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [pin, mfaPhase, mfaToken]);

  const handleUnitSelect = async (unit: WorkspaceUnit) => {
    await selectUnit(unit);
  };

  // If logged in but multi-unit, show unit selector
  if (currentOperator && currentOperator.unitIds.length > 1) {
    return (
      <div className="station-modal-overlay" style={{ background: 'var(--bg-primary)' }}>
        <div className="flex-col" style={{ gap: '40px', alignItems: 'center' }}>
              <header style={{ textAlign: 'center' }}>
                 <h1 style={{ fontSize: '2rem', letterSpacing: '4px', marginBottom: '8px' }}>{(t('auth.login.unit_selection_title') || 'SELECCIÓN DE UNIDAD').toUpperCase()}</h1>
                 <p style={{ opacity: 0.5 }}>{ (t('operator.role') || 'ROL').toUpperCase() }: { (currentOperator.displayName || currentOperator.username || 'OPERATOR').toUpperCase() }</p>
              </header>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(1, 1fr)', gap: '16px', width: '400px' }}>
             {availableUnits.map(unit => (
               <button 
                key={unit.id}
                className="station-btn"
                style={{ 
                  height: '80px', 
                  fontSize: '1.1rem', 
                  justifyContent: 'flex-start', 
                  padding: '0 24px',
                  border: '1px solid var(--border-primary)'
                }}
                onClick={() => handleUnitSelect(unit)}
               >
                 <BuildingIcon size={20} style={{ marginRight: '16px', opacity: 0.5 }} />
                 <div className="flex-col" style={{ alignItems: 'flex-start' }}>
                    <span style={{ fontSize: '0.8rem', opacity: 0.5 }}>[{ (unit.code || '???').toUpperCase() }]</span>
                    <span>{ (unit.name || 'UNKNOWN').toUpperCase() }</span>
                 </div>
               </button>
             ))}
          </div>

          <button className="station-btn station-btn-secondary" onClick={logout}>
            {t('auth.mfa.back_btn')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="station-modal-overlay" style={{ background: 'var(--bg-primary)', overflow: 'hidden' }}>
       <div style={{ 
         display: 'grid', 
         gridTemplateColumns: '1fr auto', 
         gap: '64px', 
         alignItems: 'center', 
         width: '100%', 
         maxWidth: '900px', 
         background: 'rgba(255,255,255,0.02)',
         padding: '48px',
         border: '1px solid var(--border-color)',
         borderRadius: 'var(--radius-std)',
         position: 'relative'
       }}>
          
          {/* Column 1: Identity & Feedback */}
          <div className="flex-col" style={{ gap: '32px', alignItems: 'center', borderRight: '1px solid var(--border-color)', paddingRight: '48px' }}>
            <header className="flex-col" style={{ alignItems: 'center', gap: '8px' }}>
               <div className="flex-row" style={{ gap: '10px', alignItems: 'center' }}>
                  <ShieldIcon size={32} color="var(--accent-primary)" />
                  <h1 style={{ fontSize: '1.4rem', fontWeight: 900, letterSpacing: '4px', margin: 0 }}>{t('ui.title')}</h1>
               </div>
               <div style={{ height: '2px', width: '100%', background: 'var(--accent-primary)', opacity: 0.2 }} />
               <p style={{ fontSize: '0.75rem', opacity: 0.4, letterSpacing: '3px', textTransform: 'uppercase', fontWeight: 'bold' }}>{t('dashboard.sys_status_online')}</p>
            </header>

            <div className="flex-col" style={{ alignItems: 'center', gap: '16px', width: '100%' }}>
               <span style={{ fontSize: '0.7rem', opacity: 0.4, fontWeight: 'bold', letterSpacing: '2px' }}>
                 {isLocked ? `[ TERMINAL_LOCKED - ${(currentOperator?.username || 'SYSTEM').toUpperCase()} ]` : mfaPhase ? `[ ${t('auth.mfa.placeholder_token')} - TOTP ]` : `[ ${t('audit.tabSecurity')} ]`}
               </span>
               
               {/* PIN / MFA Digit Feedback */}
               <div className="flex-row" style={{ gap: '12px', height: '50px', alignItems: 'center', justifyContent: 'center' }}>
                  {!mfaPhase ? (
                    pin.length === 0 ? (
                      <span style={{ opacity: 0.2, fontSize: '0.75rem', letterSpacing: '4px' }}>{t('auth.login.placeholder_pin')}</span>
                    ) : (
                      pin.split('').map((_, idx) => (
                        <div key={`pin-${idx}`} className="flex-center" style={{ width: '32px', height: '48px', borderBottom: '3px solid var(--accent-primary)', fontSize: '2rem', color: 'var(--accent-primary)', transform: 'translateY(-2px)', animation: 'fadeIn 0.2s ease-out' }}>*</div>
                      ))
                    )
                  ) : (
                    mfaToken.length === 0 ? (
                      <span style={{ opacity: 0.2, fontSize: '0.75rem', letterSpacing: '4px' }}>{t('auth.mfa.placeholder_token')}</span>
                    ) : (
                      mfaToken.split('').map((char, idx) => (
                        <div key={`mfa-${idx}`} className="flex-center" style={{ width: '32px', height: '48px', borderBottom: '3px solid var(--accent-secondary)', fontSize: '2rem', color: 'var(--accent-secondary)', transform: 'translateY(-2px)', animation: 'fadeIn 0.2s ease-out' }}>
                          {char}
                        </div>
                      ))
                    )
                  )}
               </div>

               {error && (
                 <div className="alert-box error animate-fade-in" style={{ padding: '8px 16px', fontSize: '0.8rem', width: '100%', textAlign: 'center' }}>
                   <span>{error}</span>
                 </div>
               )}
            </div>

            {/* Technical mode hint */}
            {!mfaPhase && (
              <div style={{ marginTop: '12px' }}>
                <button 
                  className="station-btn" 
                  style={{ border: 'none', background: 'transparent', opacity: 0.4, fontSize: '0.65rem', fontWeight: 'bold' }}
                  onDoubleClick={() => window.dispatchEvent(new KeyboardEvent('keydown', { ctrlKey: true, shiftKey: true, key: 'F12' }))}
                >
                    <KeyIcon size={12} style={{ marginRight: '6px' }} />
                    {t('auth.login.technical_mode')}
                </button>
              </div>
            )}
            
            {isLocked && (
               <button 
                className="station-btn" 
                style={{ marginTop: '12px', border: 'none', background: 'transparent', opacity: 0.5, fontSize: '0.75rem' }}
                onClick={logout}
              >
                {t('auth.login.switch_user')}
              </button>
            )}
            {mfaPhase && (
              <button 
                className="station-btn" 
                style={{ marginTop: '12px', border: 'none', background: 'transparent', opacity: 0.5, fontSize: '0.75rem' }}
                onClick={() => { setMfaPhase(false); setMfaToken(''); setError(null); }}
              >
                {t('auth.mfa.back_btn')}
              </button>
            )}

            {!installationKey && (
              <div 
                className="alert-box warning animate-pulse" 
                style={{ marginTop: '24px', fontSize: '0.65rem', padding: '12px', border: '1px dashed var(--status-warn)' }}
              >
                <div className="flex-row" style={{ gap: '8px', alignItems: 'center', marginBottom: '4px' }}>
                   <KeyIcon size={12} />
                   <strong>SECURITY_ENGINE_LOCKED</strong>
                </div>
                <span>{t('auth.login.master_required_hint')}</span>
              </div>
            )}
          </div>

          {/* Column 2: Control Panel (Numpad) */}
          <div className="flex-col" style={{ alignItems: 'center', gap: '24px' }}>
             <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
                {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map(n => (
                  <button 
                    key={n} 
                    className="station-btn" 
                    style={{ width: '70px', height: '70px', fontSize: '1.4rem', borderRadius: '50%', padding: 0 }}
                    onClick={() => handleKeyPress(n)}
                  >
                    {n}
                  </button>
                ))}
                <button 
                  className="station-btn" 
                  style={{ width: '70px', height: '70px', borderRadius: '50%', background: 'transparent', border: 'none', padding: 0 }}
                  onClick={() => { setPin(''); setError(null); }} 
                >
                  <XIcon size={20} style={{ opacity: 0.5 }} />
                </button>
                <button 
                  className="station-btn" 
                  style={{ width: '70px', height: '70px', fontSize: '1.4rem', borderRadius: '50%', padding: 0 }}
                  onClick={() => handleKeyPress('0')}
                >
                  0
                </button>
                <button 
                  className="station-btn" 
                  style={{ width: '70px', height: '70px', borderRadius: '50%', background: 'transparent', border: 'none', padding: 0 }}
                  onClick={handleBackspace}
                >
                  <DeleteIcon size={20} style={{ opacity: 0.5 }} />
                </button>
             </div>

             <button 
                className={`station-btn ${mfaPhase ? 'primary-secondary' : 'primary'} large`}
                style={{ width: '100%', height: '56px', fontSize: '1rem', letterSpacing: '2px', gap: '12px' }}
                onClick={handleSubmit}
             >
                {mfaPhase ? <ShieldCheckIcon size={20} /> : <CheckIcon size={20} />}
                {isLocked ? (t('auth.login.unlock_btn')) : mfaPhase ? (t('auth.mfa.verify_btn')) : (t('auth.login.access_btn'))}
             </button>
          </div>
       </div>

       {/* Floating Industrial Status */}
       <div className="station-integrity-badge" style={{ position: 'fixed', bottom: '24px', right: '24px', pointerEvents: 'none' }}>
         <div className="integrity-dot" />
         <span>{t('ui.title')} v6.0.0</span>
       </div>
    </div>
  );
};
