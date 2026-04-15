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

    if (score <= 2) return { score, label: 'WEAK', color: 'var(--accent-color)', percent: '25%' };
    if (score <= 4) return { score, label: 'MEDIUM', color: '#ffaa00', percent: '50%' };
    if (score === 5) return { score, label: 'STRONG', color: 'var(--border-color)', percent: '75%' };
    return { score, label: 'OPTIMAL', color: 'var(--border-color)', percent: '100%' };
  };

  const strength = getStrength(password);

  return (
    <div className="station-card">
      <div className="station-card-title">AUTHENTICATION_PARAMETERS</div>
      
      <div className="flex-col" style={{ gap: '10px' }}>
        <label className="station-label">{t('settings.password').toUpperCase()}</label>
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
          <input
            id="master-pwd"
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="ENTER_MASTER_KEY"
            className="station-input"
            style={{ paddingRight: '45px' }}
          />
          <button 
            onClick={() => setShowPassword(!showPassword)}
            className="station-btn"
            style={{ position: 'absolute', right: '5px', height: '30px', width: '30px', padding: 0, boxShadow: 'none', background: 'transparent' }}
          >
            {showPassword ? <EyeIcon size={16} /> : <LockIcon size={16} />}
          </button>
        </div>
        
        {password && (
          <div style={{ marginTop: '5px' }}>
            <div style={{ height: '4px', background: 'rgba(var(--primary-color), 0.1)', overflow: 'hidden' }}>
              <div 
                style={{ height: '100%', width: strength.percent, background: strength.color, transition: 'width 0.3s ease' }}
              />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '5px', fontSize: '0.65rem', fontWeight: 900 }}>
              <span style={{ opacity: 0.5 }}>COMPLEXITY_METRIC</span>
              <span style={{ color: strength.color }}>{strength.label}</span>
            </div>
          </div>
        )}
      </div>

      <div className="grid-2" style={{ marginTop: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
           <input
            type="checkbox"
            id="batchMode"
            checked={batchMode}
            onChange={(e) => setBatchMode(e.target.checked)}
            style={{ accentColor: 'var(--border-color)', width: '18px', height: '18px' }}
          />
           <label htmlFor="batchMode" className="station-label" style={{ cursor: 'pointer' }}>{t('settings.batch_mode').toUpperCase()}</label>
        </div>

        <div className="flex-col" style={{ gap: '5px' }}>
          <label className="station-label">{t('settings.suffix').toUpperCase()}</label>
          <input
            id="suffix-input"
            type="text"
            value={outputSuffix}
            onChange={(e) => setOutputSuffix(e.target.value)}
            className="station-input"
            style={{ fontSize: '0.8rem', padding: '5px 10px' }}
          />
        </div>
      </div>
    </div>
  );
};

export default SettingsPanel;
