'use client';

import React, { useState } from 'react';
import { useWorkspace } from '@/lib/context/WorkspaceContext';
import { useLanguage } from '@/lib/context/LanguageContext';
import { ShieldAlertIcon, LockIcon, UnlockIcon, LoaderIcon } from '@/components/common/Icons';

export const SessionShield: React.FC = () => {
    const { t } = useLanguage();
    const { isLocked, currentOperator, unlockSession } = useWorkspace();
    const [pin, setPin] = useState('');
    const [isUnlocking, setIsUnlocking] = useState(false);
    const [error, setError] = useState(false);

    if (!isLocked || !currentOperator) return null;

    const handleUnlock = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsUnlocking(true);
        setError(false);
        
        try {
            const success = await unlockSession(pin);
            if (!success) {
                setError(true);
                setPin('');
            }
        } finally {
            setIsUnlocking(false);
        }
    };

    return (
        <div className="session-shield-overlay animate-fade-in">
            <div className="session-shield-content station-card">
                <div className="flex-col" style={{ alignItems: 'center', gap: '24px', textAlign: 'center' }}>
                    <div className="shield-icon-wrapper">
                        <LockIcon size={48} color="var(--primary-color)" />
                    </div>
                    
                    <div className="flex-col" style={{ gap: '8px' }}>
                        <h2 style={{ letterSpacing: '4px', fontWeight: 900, margin: 0 }}>SESSION_LOCKED</h2>
                        <span style={{ fontSize: '0.75rem', opacity: 0.5 }}>OPERATOR: {currentOperator.username.toUpperCase()}</span>
                    </div>

                    <div className="shield-warning-box">
                        <ShieldAlertIcon size={16} />
                        <span>ESTA ESTACIÓN ESTÁ PROTEGIDA POR POLÍTICA DE SEGURIDAD INDUSTRIAL</span>
                    </div>

                    <form onSubmit={handleUnlock} className="flex-col" style={{ gap: '16px', width: '100%', maxWidth: '300px' }}>
                        <div className="station-form-field">
                            <label className="station-label">INGRESAR PIN DE DESBLOQUEO</label>
                            <input 
                                type="password"
                                className={`station-input ${error ? 'error' : ''}`}
                                style={{ textAlign: 'center', letterSpacing: '8px', fontSize: '1.5rem' }}
                                value={pin}
                                onChange={(e) => setPin(e.target.value)}
                                placeholder="••••"
                                autoFocus
                                disabled={isUnlocking}
                            />
                            {error && <span style={{ color: 'var(--status-err)', fontSize: '0.65rem', marginTop: '4px', fontWeight: 800 }}>CREDENCIALES INCORRECTAS</span>}
                        </div>

                        <button 
                            type="submit" 
                            className="station-btn station-btn-primary" 
                            disabled={isUnlocking || pin.length < 4}
                            style={{ height: '48px' }}
                        >
                            {isUnlocking ? <LoaderIcon className="spin" size={20} /> : <><UnlockIcon size={18} /> DESBLOQUEAR</>}
                        </button>
                    </form>
                </div>
            </div>

            <style jsx>{`
                .session-shield-overlay {
                    position: fixed;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: rgba(0, 0, 0, 0.95);
                    backdrop-filter: blur(10px);
                    z-index: 9999;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    padding: 20px;
                }
                .session-shield-content {
                    width: 100%;
                    max-width: 500px;
                    padding: 48px;
                    border: 1px solid rgba(var(--primary-color-rgb), 0.2);
                    box-shadow: 0 0 40px rgba(0, 0, 0, 0.5), 0 0 20px rgba(var(--primary-color-rgb), 0.1);
                }
                .shield-icon-wrapper {
                    width: 100px;
                    height: 100px;
                    background: rgba(var(--primary-color-rgb), 0.05);
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    border: 1px solid rgba(var(--primary-color-rgb), 0.1);
                    margin-bottom: 8px;
                }
                .shield-warning-box {
                    background: rgba(239, 68, 68, 0.1);
                    border: 1px solid rgba(239, 68, 68, 0.2);
                    padding: 12px 20px;
                    border-radius: 4px;
                    color: var(--status-err);
                    font-size: 0.65rem;
                    font-weight: 800;
                    display: flex;
                    align-items: center;
                    gap: 12px;
                }
                input.error {
                    border-color: var(--status-err) !important;
                    background: rgba(239, 68, 68, 0.05) !important;
                }
            `}</style>
        </div>
    );
};
