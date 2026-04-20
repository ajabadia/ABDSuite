'use client';

import React, { useState, useEffect } from 'react';
import { useWorkspace } from '@/lib/context/WorkspaceContext';
import { useLanguage } from '@/lib/context/LanguageContext';
import { 
  ShieldAlertIcon, 
  XIcon, 
  CheckIcon, 
  DeleteIcon,
  ZapIcon,
  ShieldCheckIcon,
  RefreshCwIcon
} from '@/components/common/Icons';
import { generateTotpSecret } from '@/lib/utils/mfa.utils';
import { coreDb } from '@/lib/db/SystemDB';

export const StepUpAuthModal: React.FC = () => {
  const { 
    isStepUpDialogOpen, 
    setIsStepUpDialogOpen, 
    pendingStepUpLevel, 
    currentOperator,
    verifyMfa 
  } = useWorkspace();
  const { t } = useLanguage();

  const [token, setToken] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  
  // Enrollment state
  const [isEnrolling, setIsEnrolling] = useState(false);
  const [tempSecret, setTempSecret] = useState<string | null>(null);

  useEffect(() => {
    if (isStepUpDialogOpen) {
      setToken('');
      setError(null);
      
      // Force enrollment check
      if (currentOperator && !currentOperator.mfaEnabled) {
        setIsEnrolling(true);
        const secret = generateTotpSecret();
        setTempSecret(secret);
        
        // Update operator in memory (not DB yet, only on successful verification)
        // Note: verifyMfa in WorkspaceContext will handle the DB update on success.
        // But it needs the secret to check the token.
        // Temporary override for verification:
        currentOperator.mfaSecret = secret;
      } else {
        setIsEnrolling(false);
        setTempSecret(null);
      }
    }
  }, [isStepUpDialogOpen, currentOperator]);

  if (!isStepUpDialogOpen) return null;

  const handleKeyPress = (num: string) => {
    if (token.length < 6) {
      setToken(prev => prev + num);
      setError(null);
    }
  };

  const handleBackspace = () => {
    setToken(prev => prev.slice(0, -1));
  };

  const handleSubmit = async () => {
    if (token.length < 6) return;
    setIsVerifying(true);
    setError(null);
    
    try {
      const success = await verifyMfa(token);
      if (!success) {
        setError(t('auth.mfa.invalid') || 'Token inválido');
        setToken('');
      }
    } catch (err) {
      setError('Error de verificación');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleCancel = () => {
    setIsStepUpDialogOpen(false);
    // Ideally we'd resolve the pending promise to false here, 
    // but verifyMfa handles success. We need a way to reject/resolve false.
    // In WorkspaceContext, we should handle the modal close as a failure if it's still pending.
    // (WorkspaceContext has the resolver logic).
  };

  return (
    <div className="station-modal-overlay animate-fade-in" style={{ zIndex: 9999 }}>
      <div className="station-modal" style={{ maxWidth: '760px', background: 'var(--bg-primary)' }}>
        
        <header className="station-modal-header technical-header-small">
           <div className="flex-row" style={{ gap: '12px', alignItems: 'center' }}>
              <ShieldAlertIcon size={16} color={isEnrolling ? "var(--status-warn)" : "var(--accent-primary)"} />
              <span style={{ fontSize: '0.75rem', fontWeight: 900, letterSpacing: '2px', opacity: 0.5 }}>
                {isEnrolling ? 'MFA_ENROLLMENT' : 'SECURITY_VERIFICATION'}
              </span>
           </div>
           <button onClick={handleCancel} className="station-btn secondary tiny">
              <span style={{ fontSize: '0.65rem' }}>ESC</span>
           </button>
        </header>        <div className="station-modal-content" style={{ padding: '0', overflow: 'hidden' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(300px, 1fr) auto', minHeight: '400px' }}>
            
            {/* Column 1: Technical Info & Secret */}
            <div className="flex-col" style={{ 
              padding: '32px', 
              gap: '24px', 
              background: 'rgba(0,0,0,0.1)',
              borderRight: '1px solid var(--border-color)'
            }}>
              <header className="flex-col" style={{ gap: '8px' }}>
                <h2 style={{ fontSize: '1.1rem', margin: 0, letterSpacing: '2px', fontWeight: 900 }}>
                  {isEnrolling ? 'ENROLAMIENTO MFA' : 'VERIFICACIÓN'}
                </h2>
                <div style={{ height: '2px', width: '32px', background: 'var(--accent-primary)', opacity: 0.5 }} />
                <p style={{ fontSize: '0.65rem', opacity: 0.5, margin: 0, textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 'bold' }}>
                  Nivel de Autorización: {pendingStepUpLevel}
                </p>
              </header>

              {isEnrolling && tempSecret ? (
                <div className="alert-box warning" style={{ 
                  fontSize: '0.75rem', 
                  background: 'rgba(255,157,0,0.02)', 
                  border: '1px solid var(--status-warn)',
                  padding: '20px',
                  borderRadius: '2px'
                }}>
                   <p style={{ margin: '0 0 16px 0', opacity: 0.8, fontWeight: 'bold' }}>Vincule su aplicación mediante esta clave manual:</p>
                   <div style={{ 
                     background: 'var(--bg-color)', 
                     padding: '16px', 
                     fontSize: '1rem', 
                     fontFamily: 'var(--font-mono)', 
                     textAlign: 'center', 
                     letterSpacing: '3px',
                     border: '1px solid var(--border-color)',
                     color: 'var(--status-warn)',
                     fontWeight: 900,
                     wordBreak: 'break-all'
                   }}>
                     {tempSecret.match(/.{1,4}/g)?.join(' ')}
                   </div>
                   <p style={{ margin: '16px 0 0 0', opacity: 0.5, fontSize: '0.7rem', lineHeight: '1.4' }}>
                     Introduzca el código de 6 dígitos generado tras sincronizar su dispositivo (Google Auth / Authy).
                   </p>
                </div>
              ) : (
                <div style={{ flex: 1, display: 'flex', alignItems: 'center' }}>
                  <p style={{ fontSize: '0.8rem', opacity: 0.6, lineHeight: '1.6' }}>
                    Esta operación requiere un factor de autenticación adicional. El código TOTP generado en su dispositivo es necesario para validar su identidad.
                  </p>
                </div>
              )}
            </div>

            {/* Column 2: Operation & Numpad */}
            <div className="flex-col" style={{ padding: '32px', gap: '32px', alignItems: 'center', background: 'var(--bg-primary)' }}>
              {/* Token Display Integration */}
              <div className="flex-col" style={{ gap: '12px', alignItems: 'center' }}>
                <span style={{ fontSize: '0.6rem', opacity: 0.4, fontWeight: 'bold', letterSpacing: '2px' }}>[ TOKEN_INPUT_BUFFER ]</span>
                <div className="flex-row" style={{ gap: '10px' }}>
                  {[0,1,2,3,4,5].map(i => (
                    <div 
                      key={i} 
                      className="flex-center"
                      style={{ 
                        width: '32px', 
                        height: '40px', 
                        borderBottom: `3px solid ${token.length > i ? (isEnrolling ? 'var(--status-warn)' : 'var(--accent-primary)') : 'var(--border-color)'}`,
                        fontSize: '1.4rem',
                        fontFamily: 'var(--font-mono)',
                        fontWeight: 900,
                        opacity: token.length > i ? 1 : 0.1
                      }}
                    >
                      {token[i] || '0'}
                    </div>
                  ))}
                </div>
                {error && <p style={{ color: 'var(--error)', fontSize: '0.7rem', margin: '4px 0 0 0', fontWeight: 'bold' }}>{error}</p>}
              </div>

              {/* Numpad Circles */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
                {['1', '2', '3', '4', '5', '6', '7', '8', '9', 'X', '0', 'DEL'].map(val => (
                  <button
                    key={val}
                    className="station-btn"
                    style={{ 
                      width: '60px', 
                      height: '60px', 
                      padding: 0, 
                      fontSize: '1.1rem', 
                      borderRadius: '50%',
                      background: val === 'X' || val === 'DEL' ? 'transparent' : 'var(--surface-color)',
                      border: val === 'X' || val === 'DEL' ? 'none' : '1px solid var(--border-color)',
                      boxShadow: 'none'
                    }}
                    onClick={() => {
                      if (val === 'X') setToken('');
                      else if (val === 'DEL') handleBackspace();
                      else handleKeyPress(val);
                    }}
                  >
                    {val === 'DEL' ? <DeleteIcon size={18} style={{ opacity: 0.5 }} /> : val === 'X' ? <XIcon size={18} style={{ opacity: 0.5 }} /> : val}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        <footer className="station-modal-footer" style={{ gap: '16px' }}>
          <button className="station-btn secondary small" style={{ minWidth: '120px' }} onClick={handleCancel}>
            {t('common.cancel').toUpperCase()}
          </button>
          <div style={{ flex: 1 }} />
          <button 
            className={`station-btn ${isEnrolling ? 'primary-secondary' : 'primary'} small`} 
            style={{ minWidth: '160px' }} 
            disabled={token.length < 6 || isVerifying}
            onClick={handleSubmit}
          >
            {isVerifying ? <RefreshCwIcon size={18} className="spin" /> : <CheckIcon size={18} />}
            <span style={{ marginLeft: '8px' }}>{isEnrolling ? 'ENROLAR' : 'VERIFICAR'}</span>
          </button>
        </footer>
      </div>
      <style jsx>{`
        .obsidian-depth {
          animation: slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        }
        @keyframes slideUp {
          from { transform: translateY(20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `}</style>
    </div>
  );
};
