'use client';

import React, { useState } from 'react';
import { EyeIcon, LockIcon } from '@/components/common/Icons';
import { useLanguage } from '@/lib/context/LanguageContext';

interface SettingsPanelProps {
  password: string;
  setPassword: (val: string) => void;
  batchMode: boolean;
  setBatchMode: (val: boolean) => void;
  outputSuffix: string;
  setOutputSuffix: (val: string) => void;
}

const SettingsPanel: React.FC<SettingsPanelProps> = ({
  password,
  setPassword,
  batchMode,
  setBatchMode,
  outputSuffix,
  setOutputSuffix
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

    if (score <= 2) return { score, label: 'Débil', color: 'var(--status-err)', percent: '25%' };
    if (score <= 4) return { score, label: 'Media', color: 'var(--status-warn)', percent: '50%' };
    if (score === 5) return { score, label: 'Fuerte', color: 'var(--status-ok)', percent: '75%' };
    return { score, label: 'Óptima', color: 'var(--status-ok)', percent: '100%' };
  };

  const strength = getStrength(password);

  return (
    <div className="station-card">
      <h3 style={{ fontSize: '0.8rem', opacity: 0.6, textTransform: 'uppercase', marginBottom: '16px' }}>Parámetros de Seguridad</h3>
      
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
            <label className="station-label">{t('settings.suffix')}</label>
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
      </div>
    </div>
  );
};

export default SettingsPanel;
