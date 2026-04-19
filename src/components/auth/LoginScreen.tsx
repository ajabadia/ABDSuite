'use client';

import React, { useState, useEffect } from 'react';
import { useLanguage } from '@/lib/context/LanguageContext';
import { useWorkspace } from '@/lib/context/WorkspaceContext';
import { coreDb } from '@/lib/db/SystemDB';
import { Operator, WorkspaceUnit } from '@/lib/types/auth.types';
import { ShieldIcon, UserIcon, BuildingIcon, XIcon, DeleteIcon, CheckIcon, KeyIcon } from '../common/Icons';

export const LoginScreen: React.FC = () => {
  const { t } = useLanguage();
  const { login, selectUnit, currentOperator, logout } = useWorkspace();
  
  const [pin, setPin] = useState('');
  const [operators, setOperators] = useState<Operator[]>([]);
  const [units, setUnits] = useState<WorkspaceUnit[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loginSuccess, setLoginSuccess] = useState(false);
  const [availableUnits, setAvailableUnits] = useState<WorkspaceUnit[]>([]);

  useEffect(() => {
    const loadOps = async () => {
      try {
        if (!coreDb.isOpen()) await coreDb.open();
        const allOps = await coreDb.operators.where('isActive').equals(1).toArray();
        setOperators(allOps);
        const allUnits = await coreDb.units.where('isActive').equals(1).toArray();
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
    if (pin.length < 6) {
      setPin(prev => prev + num);
    }
  };

  const handleBackspace = () => {
    setPin(prev => prev.slice(0, -1));
  };

  const handleSubmit = async () => {
    if (pin.length < 4) return;
    
    // Aseptic requirement: Clear error indicator before attempt
    setError(null);

    const success = await login(pin);
    if (!success) {
      setError('PIN ACCESO DENEGADO');
      // Aseptic requirement: Clear PIN on failure to prevent digit accumulation
      setPin('');
    } else {
      setLoginSuccess(true);
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
        setPin('');
        setError(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [pin]);

  const handleUnitSelect = async (unit: WorkspaceUnit) => {
    await selectUnit(unit);
  };

  // If logged in but multi-unit, show unit selector
  if (currentOperator && currentOperator.unitIds.length > 1) {
    return (
      <div className="station-modal-overlay" style={{ background: 'var(--bg-primary)' }}>
        <div className="flex-col" style={{ gap: '40px', alignItems: 'center' }}>
          <header style={{ textAlign: 'center' }}>
             <h1 style={{ fontSize: '2rem', letterSpacing: '4px', marginBottom: '8px' }}>SELECCIÓN DE UNIDAD</h1>
             <p style={{ opacity: 0.5 }}>OPERARIO: {currentOperator.name.toUpperCase()}</p>
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
                    <span style={{ fontSize: '0.8rem', opacity: 0.5 }}>[{unit.code}]</span>
                    <span>{unit.name}</span>
                 </div>
               </button>
             ))}
          </div>

          <button className="station-btn station-btn-secondary" onClick={logout}>
            VOLVER AL LOGIN
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
          <div className="flex-col" style={{ gap: '40px', alignItems: 'center', borderRight: '1px solid var(--border-color)', paddingRight: '64px' }}>
            <header className="flex-col" style={{ alignItems: 'center', gap: '12px' }}>
               <div className="flex-row" style={{ gap: '12px', alignItems: 'center' }}>
                  <ShieldIcon size={40} color="var(--accent-primary)" />
                  <h1 style={{ fontSize: '2rem', letterSpacing: '8px', margin: 0 }}>ABDFN SUITE</h1>
               </div>
               <div style={{ height: '2px', width: '100%', background: 'var(--accent-primary)', opacity: 0.3 }} />
               <p style={{ fontSize: '1rem', opacity: 0.6, letterSpacing: '4px', textTransform: 'uppercase' }}>INDUSTRIAL ACCESS NODE</p>
            </header>

            <div className="flex-col" style={{ alignItems: 'center', gap: '24px', width: '100%' }}>
               <span style={{ fontSize: '0.8rem', opacity: 0.4, fontWeight: 'bold', letterSpacing: '2px' }}>[ IDENTIFICACIÓN ]</span>
               
               {/* PIN Digit Feedback (CENTRED DYNAMICALLY) */}
               <div className="flex-row" style={{ gap: '16px', height: '60px', alignItems: 'center', justifyContent: 'center' }}>
                  {pin.length === 0 ? (
                    <span style={{ opacity: 0.2, fontSize: '0.8rem', letterSpacing: '4px' }}>INTRODUZCA PIN</span>
                  ) : (
                    pin.split('').map((_, idx) => (
                      <div 
                        key={`filled-${idx}`}
                        className="flex-center"
                        style={{ 
                          width: '40px', 
                          height: '56px', 
                          borderBottom: '4px solid var(--accent-primary)',
                          fontSize: '2.5rem',
                          color: 'var(--accent-primary)',
                          transform: 'translateY(-4px)',
                          animation: 'fadeIn 0.2s ease-out'
                        }} 
                      >
                        *
                      </div>
                    ))
                  )}
               </div>

               {error && (
                 <div className="alert-box error animate-fade-in" style={{ padding: '12px 24px', fontSize: '0.9rem', width: '100%', textAlign: 'center' }}>
                   <span>{error}</span>
                 </div>
               )}
            </div>

            {/* Technical mode hint at the bottom of the left column */}
            <div style={{ marginTop: '20px' }}>
               <button 
                className="station-btn" 
                style={{ border: 'none', background: 'transparent', opacity: 0.4, fontSize: '0.75rem', fontWeight: 'bold' }}
                onDoubleClick={() => window.dispatchEvent(new KeyboardEvent('keydown', { ctrlKey: true, shiftKey: true, key: 'F12' }))}
               >
                  <KeyIcon size={14} style={{ marginRight: '8px' }} />
                  MODO TÉCNICO (DOBLE CLICK)
               </button>
            </div>
          </div>

          {/* Column 2: Control Panel (Numpad) */}
          <div className="flex-col" style={{ alignItems: 'center', gap: '32px' }}>
             <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
                {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map(n => (
                  <button 
                    key={n} 
                    className="station-btn" 
                    style={{ width: '75px', height: '75px', fontSize: '1.5rem', borderRadius: '50%', padding: 0 }}
                    onClick={() => handleKeyPress(n)}
                  >
                    {n}
                  </button>
                ))}
                <button 
                  className="station-btn" 
                  style={{ width: '75px', height: '75px', borderRadius: '50%', background: 'transparent', border: 'none', padding: 0 }}
                  onClick={() => { setPin(''); setError(null); }} 
                >
                  <XIcon size={24} style={{ opacity: 0.5 }} />
                </button>
                <button 
                  className="station-btn" 
                  style={{ width: '75px', height: '75px', fontSize: '1.5rem', borderRadius: '50%', padding: 0 }}
                  onClick={() => handleKeyPress('0')}
                >
                  0
                </button>
                <button 
                  className="station-btn" 
                  style={{ width: '75px', height: '75px', borderRadius: '50%', background: 'transparent', border: 'none', padding: 0 }}
                  onClick={handleBackspace}
                >
                  <DeleteIcon size={24} style={{ opacity: 0.5 }} />
                </button>
             </div>

             <button 
              className="station-btn station-btn-primary" 
              style={{ width: '100%', height: '64px', fontSize: '1.2rem', letterSpacing: '2px' }}
              disabled={pin.length < 4}
              onClick={handleSubmit}
             >
                <CheckIcon size={24} style={{ marginRight: '16px' }} />
                ACCEDER
             </button>
          </div>
       </div>

       {/* Floating Industrial Status */}
       <div className="station-integrity-badge" style={{ position: 'fixed', bottom: '24px', right: '24px', pointerEvents: 'none' }}>
         <div className="integrity-dot" />
         <span>SECURE NODE v6.0.0</span>
       </div>
    </div>
  );
};
