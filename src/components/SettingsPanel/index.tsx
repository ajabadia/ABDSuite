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
    <div className="station-card flex-col" style={{ gap: '20px' }}>
      <span className="station-form-section-title">PARÁMETROS DE SEGURIDAD</span>
      
      <div className="flex-col" style={{ gap: '20px' }}>
        <div className="station-form-field full">
          <label className="station-label">{t('settings.password')}</label>
          <div className="flex-row" style={{ position: 'relative' }}>
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
            <div className="flex-col" style={{ gap: '4px' }}>
              <div className="station-meter-container">
                <div 
                  className="station-meter-bar"
                  style={{ width: strength.percent, background: strength.color }}
                />
              </div>
              <div className="flex-row" style={{ justifyContent: 'space-between' }}>
                <span style={{ opacity: 0.5, fontSize: '0.6rem', fontWeight: 700 }}>SEGURIDAD_CORE</span>
                <span style={{ color: strength.color, fontWeight: 900, fontSize: '0.65rem' }}>{strength.label.toUpperCase()}</span>
              </div>
            </div>
          )}
        </div>

        <div className="station-form-grid" style={{ paddingTop: '20px', borderTop: '1px solid var(--border-color)' }}>
          <div className="station-checkbox-group" style={{ height: '40px' }}>
             <input
              type="checkbox"
              id="batchMode"
              className="station-checkbox"
              checked={batchMode}
              onChange={(e) => setBatchMode(e.target.checked)}
            />
             <label htmlFor="batchMode" className="station-label" style={{ margin: 0, cursor: 'pointer' }}>{t('settings.batch_mode')}</label>
          </div>

          <div className="station-form-field">
            <label className="station-label">{mode === 'encrypt' ? t('crypt.suffix_encrypt') : t('crypt.suffix_decrypt')}</label>
            <input
              id="suffix-input"
              type="text"
              value={outputSuffix}
              onChange={(e) => setOutputSuffix(e.target.value)}
              className="station-input"
            />
          </div>
        </div>

        {canProcess && (
          <div className="flex-row" style={{ justifyContent: 'flex-end', marginTop: '12px', paddingTop: '20px', borderTop: '1px solid var(--border-color)' }}>
            <button 
              className={`station-btn ${mode === 'encrypt' ? 'station-btn-primary' : ''}`}
              style={{ padding: '0 32px', height: '48px', minWidth: '200px' }}
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
