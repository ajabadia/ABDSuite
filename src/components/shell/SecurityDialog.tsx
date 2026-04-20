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
    <div className="station-modal-overlay">
       <div className="station-modal" style={{ width: '800px', maxWidth: '95vw' }}>
          <header className="station-modal-header technical-header-small">
             <div className="flex-row" style={{ gap: '12px', alignItems: 'center' }}>
                <LockIcon size={20} color="var(--primary-color)" />
                <h2 style={{ fontSize: '0.75rem', letterSpacing: '2px', fontWeight: 900, opacity: 0.5, margin: 0 }}>SECURITY & INTEROP CONSOLE</h2>
             </div>
             <button onClick={onClose} className="station-btn secondary tiny">
                <XIcon size={18} />
             </button>
          </header>

          <div className="station-modal-content" style={{ padding: 0, display: 'grid', gridTemplateColumns: '220px 1fr', height: '500px', overflow: 'hidden' }}>
             {/* Sidebar Tabs */}
             <div style={{ background: 'var(--surface-color)', borderRight: '1px solid var(--border-color)', padding: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <button 
                  className={`station-nav-item ${activeTab === 'MFA' ? 'active' : ''}`}
                  onClick={() => setActiveTab('MFA')}
                  style={{ border: 'none', background: 'transparent' }}
                >
                  <ShieldCheckIcon size={18} />
                  <span style={{ fontSize: '0.7rem', fontWeight: 800 }}>DOBLE FACTOR</span>
                </button>
                <button 
                  className={`station-nav-item ${activeTab === 'SYNC' ? 'active' : ''}`}
                  onClick={() => setActiveTab('SYNC')}
                  style={{ border: 'none', background: 'transparent' }}
                >
                  <RefreshIcon size={18} />
                  <span style={{ fontSize: '0.7rem', fontWeight: 800 }}>P2P SYNC</span>
                </button>
             </div>

             {/* Content Area */}
             <div className="flex-col" style={{ padding: '32px', overflowY: 'auto' }}>
                {activeTab === 'MFA' && (
                  <div className="flex-col" style={{ gap: '32px', height: '100%' }}>
                     <div>
                        <h3 className="section-title-technical" style={{ color: 'var(--primary-color)', marginBottom: '16px' }}>CONFIGURACIÓN TOTP</h3>
                        <div className="flex-row" style={{ gap: '12px', alignItems: 'center', background: 'var(--surface-color)', padding: '20px', border: '1px solid var(--border-color)', borderRadius: '2px' }}>
                           <input 
                            type="checkbox" 
                            checked={mfaEnabled} 
                            onChange={(e) => setMfaEnabled(e.target.checked)}
                            style={{ width: '20px', height: '20px', cursor: 'pointer' }}
                           />
                           <label style={{ fontSize: '0.75rem', fontWeight: 800, fontFamily: 'var(--font-mono)' }}>HABILITAR SEGUNDO FACTOR (APP)</label>
                        </div>
                     </div>

                     {mfaEnabled && (
                       <div className="flex-col animate-fade-in" style={{ gap: '24px' }}>
                          <p style={{ fontSize: '0.7rem', opacity: 0.5, lineHeight: '1.6', fontFamily: 'var(--font-mono)' }}>
                            Escanee el código QR con Google Authenticator o Microsoft Authenticator para vincular su terminal de forma segura.
                          </p>

                          {mfaSecret && (
                            <div className="flex-col" style={{ alignItems: 'center', gap: '20px', background: '#fff', padding: '32px', borderRadius: '4px', border: '4px solid var(--primary-color)' }}>
                               <div dangerouslySetInnerHTML={{ __html: qrSvg || '' }} />
                               <div className="flex-col" style={{ alignItems: 'center' }}>
                                  <span style={{ color: '#000', fontSize: '0.6rem', opacity: 0.5, fontWeight: '900', letterSpacing: '1px' }}>CÓDIGO_SECRETO_INDUSTRIAL</span>
                                  <code style={{ fontSize: '1.4rem', color: '#000', fontWeight: 900, letterSpacing: '4px' }}>{mfaSecret}</code>
                               </div>
                            </div>
                          )}

                          <button className="station-btn secondary" onClick={handleGenerateMfa} style={{ height: '40px' }}>
                             <KeyIcon size={16} />
                             <span style={{ fontSize: '0.7rem' }}>{mfaSecret ? 'REGENERAR_CLAVE' : 'CONFIGURAR_MFA'}</span>
                          </button>
                       </div>
                     )}

                     <div style={{ marginTop: 'auto', paddingTop: '32px' }}>
                        <button 
                          className="station-btn primary" 
                          style={{ width: '100%', height: '56px', background: 'var(--primary-color)', color: '#000' }}
                          onClick={handleSaveMfa}
                          disabled={isSaving}
                        >
                           <ShieldCheckIcon size={20} />
                           <span style={{ fontWeight: 900, letterSpacing: '1px' }}>GUARDAR CONFIGURACIÓN SEGURA</span>
                        </button>
                     </div>
                  </div>
                )}

                {activeTab === 'SYNC' && <SyncPanel />}
             </div>
          </div>
          
          <style jsx>{`
            .section-title-technical {
              font-size: 0.65rem;
              letter-spacing: 2px;
              font-weight: 900;
              opacity: 0.5;
            }
          `}</style>
       </div>
    </div>
  );
};
