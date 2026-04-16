'use client';

import React, { useState } from 'react';
import { EyeIcon, LockIcon, ShieldCheckIcon, UnlockIcon } from '@/components/common/Icons';
import { useLanguage } from '@/lib/context/LanguageContext';

interface SettingsPanelProps {
  mode: 'encrypt' | 'decrypt';
  password: string;
  setPassword: (val: string) => void;
  batchMode: boolean;
  setBatchMode: (val: boolean) => void;
  outputSuffix: string;
  setOutputSuffix: (val: string) => void;
  onProcess: () => void;
  isProcessing: boolean;
  canProcess: boolean;
}

const SettingsPanel: React.FC<SettingsPanelProps> = ({
  mode,
  password,
  setPassword,
  batchMode,
  setBatchMode,
  outputSuffix,
  setOutputSuffix,
  onProcess,
  isProcessing,
  canProcess
}) => {
  const { t } = useLanguage();
  const [showPassword, setShowPassword] = useState(false);

  const getStrength = (pwd: string) => {
    if (!pwd) return { score: 0, label: '', color: 'transparent', percent: '0%' };
    let score = 0;
    if (pwd.length >= 8) score++;
    if (pwd.length >= 12) score++;
    if (/[A-Z]/.test(pwd)) score++;
    if (/[a-z]/.test(pwd)) score++;
    if (/[0-9]/.test(pwd)) score++;
    if (/[^A-Za-z0-9]/.test(pwd)) score++;

    if (score <= 2) return { score, label: t('settings.weak'), color: 'var(--status-err)', percent: '25%' };
    if (score <= 4) return { score, label: t('settings.medium'), color: 'var(--status-warn)', percent: '50%' };
    if (score === 5) return { score, label: t('settings.strong'), color: 'var(--status-ok)', percent: '75%' };
    return { score, label: t('settings.very_strong'), color: 'var(--status-ok)', percent: '100%' };
  };

  const strength = getStrength(password);

  return (
    <div className="station-card" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <h3 style={{ fontSize: '0.8rem', opacity: 0.6, textTransform: 'uppercase', marginBottom: '8px' }}>Parámetros de Seguridad</h3>
      
      <div className="flex-col" style={{ gap: '16px' }}>
        <div className="flex-col" style={{ gap: '4px' }}>
          <label className="station-label">{t('settings.password')}</label>
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            <input
              id="master-pwd"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Introduce clave maestra..."
              className="station-input"
              style={{ paddingRight: '44px' }}
            />
            <button 
              onClick={() => setShowPassword(!showPassword)}
              className="station-btn"
              style={{ position: 'absolute', right: '4px', height: '32px', width: '32px', padding: 0, border: 'none' }}
            >
              {showPassword ? <EyeIcon size={16} /> : <LockIcon size={16} />}
            </button>
          </div>
          
          {password && (
            <div style={{ marginTop: '8px' }}>
              <div style={{ height: '4px', background: 'var(--bg-color)', borderRadius: '2px', overflow: 'hidden' }}>
                <div 
                  style={{ height: '100%', width: strength.percent, background: strength.color, transition: 'width 0.3s ease' }}
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px', fontSize: '0.65rem' }}>
                <span style={{ opacity: 0.5 }}>SEGURIDAD DE CLAVE</span>
                <span style={{ color: strength.color, fontWeight: 700 }}>{strength.label.toUpperCase()}</span>
              </div>
            </div>
          )}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginTop: '8px', paddingTop: '16px', borderTop: '1px solid var(--border-color)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
             <input
              type="checkbox"
              id="batchMode"
              checked={batchMode}
              onChange={(e) => setBatchMode(e.target.checked)}
              style={{ width: '18px', height: '18px' }}
            />
             <label htmlFor="batchMode" className="station-label" style={{ marginBottom: 0, cursor: 'pointer' }}>{t('settings.batch_mode')}</label>
          </div>

          <div className="flex-col" style={{ gap: '4px' }}>
            <label className="station-label">{mode === 'encrypt' ? t('crypt.suffix_encrypt') : t('crypt.suffix_decrypt')}</label>
            <input
              id="suffix-input"
              type="text"
              value={outputSuffix}
              onChange={(e) => setOutputSuffix(e.target.value)}
              className="station-input"
              style={{ fontSize: '0.85rem' }}
            />
          </div>
        </div>

        {canProcess && (
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '12px', paddingTop: '20px', borderTop: '1px solid var(--border-color)' }}>
            <button 
              className={`station-btn ${mode === 'encrypt' ? 'station-btn-primary' : ''}`}
              style={{ 
                height: '48px', 
                padding: '0 32px', 
                fontSize: '0.9rem', 
                display: 'flex', 
                alignItems: 'center', 
                gap: '12px',
                minWidth: '180px',
                justifyContent: 'center'
              }}
              disabled={isProcessing}
              onClick={onProcess}
            >
              {isProcessing ? (
                t('processor.processing')
              ) : (
                <>
                  {mode === 'encrypt' ? <ShieldCheckIcon size={18} /> : <UnlockIcon size={18} />}
                  {mode === 'encrypt' ? t('crypt.cipher_action') : t('crypt.decipher_action')}
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default SettingsPanel;
