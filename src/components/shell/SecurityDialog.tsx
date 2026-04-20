/**
 * Industrial Security & Sync Dialog (Phase 9)
 * Console for managing MFA and P2P synchronization settings.
 */
'use client';

import React, { useState, useEffect } from 'react';
import { useWorkspace } from '@/lib/context/WorkspaceContext';
import { generateTotpSecret, buildOtpAuthUri } from '@/lib/utils/mfa.utils';
import { QrGenerator } from '@/lib/utils/qr.utils';
import { coreDb } from '@/lib/db/SystemDB';
import { SyncPanel } from './SyncPanel';
import { LockIcon, ShieldCheckIcon, RefreshIcon, XIcon, CheckIcon, KeyIcon } from '../common/Icons';

interface SecurityDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SecurityDialog: React.FC<SecurityDialogProps> = ({ isOpen, onClose }) => {
  const { currentOperator } = useWorkspace();
  const [activeTab, setActiveTab] = useState<'MFA' | 'SYNC'>('MFA');
  const [mfaEnabled, setMfaEnabled] = useState(currentOperator?.mfaEnabled || false);
  const [mfaSecret, setMfaSecret] = useState(currentOperator?.mfaSecret || '');
  const [qrSvg, setQrSvg] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (isOpen && currentOperator) {
      setMfaEnabled(!!currentOperator.mfaEnabled);
      setMfaSecret(currentOperator.mfaSecret || '');
    }
  }, [isOpen, currentOperator]);

  const handleGenerateMfa = () => {
    const secret = generateTotpSecret();
    const uri = buildOtpAuthUri(secret, currentOperator?.displayName || 'Operator');
    const svg = QrGenerator.generateSvg(uri, 200);
    setMfaSecret(secret);
    setQrSvg(svg);
  };

  const handleSaveMfa = async () => {
    if (!currentOperator) return;
    setIsSaving(true);
    try {
      await coreDb.operators.update(currentOperator.id, {
        mfaEnabled: mfaEnabled,
        mfaSecret: mfaSecret,
        updatedAt: Date.now()
      });
      // In a real app, we'd refresh the currentOperator in context
      window.location.reload(); 
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="station-modal-overlay" style={{ zIndex: 1000 }}>
       <div className="flex-col" style={{ 
         width: '700px', 
         background: 'var(--bg-primary)', 
         border: '1px solid var(--border-color)', 
         borderRadius: 'var(--radius-std)',
         overflow: 'hidden'
       }}>
          <header className="flex-row" style={{ padding: '20px 24px', background: 'rgba(255,255,255,0.03)', borderBottom: '1px solid var(--border-color)', justifyContent: 'space-between', alignItems: 'center' }}>
             <div className="flex-row" style={{ gap: '12px', alignItems: 'center' }}>
                <LockIcon size={20} color="var(--accent-primary)" />
                <h2 style={{ fontSize: '0.9rem', letterSpacing: '4px', margin: 0 }}>SECURITY & INTEROP CONSOLE</h2>
             </div>
             <button onClick={onClose} className="station-btn" style={{ border: 'none', background: 'transparent', padding: '4px' }}>
                <XIcon size={20} />
             </button>
          </header>

          <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr', height: '500px' }}>
             {/* Sidebar Tabs */}
             <div style={{ background: 'rgba(0,0,0,0.2)', borderRight: '1px solid var(--border-color)', padding: '12px' }}>
                <button 
                  className={`station-nav-item ${activeTab === 'MFA' ? 'active' : ''}`}
                  onClick={() => setActiveTab('MFA')}
                  style={{ width: '100%', marginBottom: '8px', border: 'none', background: 'transparent' }}
                >
                  <ShieldCheckIcon size={18} />
                  <span style={{ fontSize: '0.8rem' }}>DOBLE FACTOR</span>
                </button>
                <button 
                  className={`station-nav-item ${activeTab === 'SYNC' ? 'active' : ''}`}
                  onClick={() => setActiveTab('SYNC')}
                  style={{ width: '100%', border: 'none', background: 'transparent' }}
                >
                  <RefreshIcon size={18} />
                  <span style={{ fontSize: '0.8rem' }}>P2P SYNC</span>
                </button>
             </div>

             {/* Content Area */}
             <div style={{ padding: '32px', overflowY: 'auto' }}>
                {activeTab === 'MFA' && (
                  <div className="flex-col" style={{ gap: '32px' }}>
                     <div>
                        <h3 style={{ fontSize: '0.8rem', letterSpacing: '2px', color: 'var(--accent-primary)', marginBottom: '16px' }}>CONFIGURACIÓN TOTP</h3>
                        <div className="flex-row" style={{ gap: '12px', alignItems: 'center', background: 'rgba(255,255,255,0.02)', padding: '16px', borderRadius: '4px' }}>
                           <input 
                            type="checkbox" 
                            checked={mfaEnabled} 
                            onChange={(e) => setMfaEnabled(e.target.checked)}
                            style={{ width: '20px', height: '20px', cursor: 'pointer' }}
                           />
                           <label style={{ fontSize: '0.9rem', fontWeight: 600 }}>HABILITAR SEGUNDO FACTOR (APP)</label>
                        </div>
                     </div>

                     {mfaEnabled && (
                       <div className="flex-col animate-fade-in" style={{ gap: '24px' }}>
                          <p style={{ fontSize: '0.8rem', opacity: 0.6, lineHeight: '1.5' }}>
                            Escanee el código QR con Google Authenticator o Microsoft Authenticator para vincular su terminal.
                          </p>

                          {mfaSecret && (
                            <div className="flex-col" style={{ alignItems: 'center', gap: '20px', background: '#fff', padding: '24px', borderRadius: '8px' }}>
                               <div dangerouslySetInnerHTML={{ __html: qrSvg || '' }} />
                               <div className="flex-col" style={{ alignItems: 'center' }}>
                                  <span style={{ color: '#000', fontSize: '0.6rem', opacity: 0.5, fontWeight: 'bold' }}>CÓDIGO SECRETO</span>
                                  <code style={{ fontSize: '1.2rem', color: '#000', fontWeight: 900, letterSpacing: '2px' }}>{mfaSecret}</code>
                               </div>
                            </div>
                          )}

                          <button className="station-btn" onClick={handleGenerateMfa}>
                             <KeyIcon size={16} />
                             {mfaSecret ? 'GENERAR NUEVA CLAVE' : 'CONFIGURAR MFA'}
                          </button>
                       </div>
                     )}

                     <div style={{ marginTop: 'auto', paddingTop: '32px', borderTop: '1px solid var(--border-color)' }}>
                        <button 
                          className="station-btn station-btn-primary" 
                          style={{ width: '100%', height: '48px' }}
                          onClick={handleSaveMfa}
                          disabled={isSaving}
                        >
                           <CheckIcon size={18} />
                           GUARDAR CONFIGURACIÓN SEGURA
                        </button>
                     </div>
                  </div>
                )}

                {activeTab === 'SYNC' && <SyncPanel />}
             </div>
          </div>
       </div>
    </div>
  );
};
