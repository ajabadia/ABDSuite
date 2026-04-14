'use client';

import React, { useState } from 'react';
import { EyeIcon, LockIcon } from '@/components/common/Icons';
import { useLanguage } from '@/lib/context/LanguageContext';
import styles from './SettingsPanel.module.css';

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
    if (!pwd) return { score: 0, label: '', class: '' };
    let score = 0;
    if (pwd.length >= 8) score++;
    if (pwd.length >= 12) score++;
    if (/[A-Z]/.test(pwd)) score++;
    if (/[a-z]/.test(pwd)) score++;
    if (/[0-9]/.test(pwd)) score++;
    if (/[^A-Za-z0-9]/.test(pwd)) score++;

    if (score <= 2) return { score, label: t('settings.weak'), fillClass: styles.weakFill, textClass: styles.weakText, percent: '25%' };
    if (score <= 4) return { score, label: t('settings.medium'), fillClass: styles.mediumFill, textClass: styles.mediumText, percent: '50%' };
    if (score === 5) return { score, label: t('settings.strong'), fillClass: styles.strongFill, textClass: styles.strongText, percent: '75%' };
    return { score, label: t('settings.very_strong'), fillClass: styles.veryStrongFill, textClass: styles.veryStrongText, percent: '100%' };
  };

  const strength = getStrength(password);

  return (
    <section className="module-section" aria-labelledby="settings-title">
      <h2 id="settings-title" className={styles.title}>{t('settings.title')}</h2>
      
      <div className={styles.field}>
        <label htmlFor="master-pwd">{t('settings.password')}</label>
        <div className={styles.passwordWrapper}>
          <input
            id="master-pwd"
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder={t('settings.password_placeholder')}
            className={styles.input}
          />
          <button 
            onClick={() => setShowPassword(!showPassword)}
            className={styles.toggleBtn}
            title={showPassword ? t('settings.hide_pwd') : t('settings.show_pwd')}
            aria-label={showPassword ? t('settings.hide_pwd') : t('settings.show_pwd')}
          >
            {showPassword ? <EyeIcon size={20} aria-hidden="true" /> : <LockIcon size={20} aria-hidden="true" />}
          </button>
        </div>
        
        {password && (
          <div className={styles.strengthMeter}>
            <div className={styles.strengthBarContainer}>
              <div 
                className={`${styles.strengthBarFill} ${strength.fillClass}`} 
                style={{ width: strength.percent }}
              />
            </div>
            <div className={styles.strengthInfo}>
              <span>{t('settings.strength')}</span>
              <span className={strength.textClass}>{strength.label}</span>
            </div>
          </div>
        )}
      </div>

      <div className={styles.optionsGrid}>
        <div className={styles.checkboxField}>
          <input
            type="checkbox"
            id="batchMode"
            checked={batchMode}
            onChange={(e) => setBatchMode(e.target.checked)}
          />
          <label htmlFor="batchMode">{t('settings.batch_mode')}</label>
        </div>

        <div className={styles.field}>
          <label htmlFor="suffix-input">{t('settings.suffix')}</label>
          <input
            id="suffix-input"
            type="text"
            value={outputSuffix}
            onChange={(e) => setOutputSuffix(e.target.value)}
            placeholder="_decrypted"
            className={styles.smallInput}
            aria-label={t('settings.suffix')}
          />
        </div>
      </div>
    </section>
  );
};

export default SettingsPanel;
