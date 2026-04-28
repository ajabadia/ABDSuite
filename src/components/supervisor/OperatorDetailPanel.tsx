'use client';

import React, { useState, useEffect } from 'react';
import { useLanguage } from '@/lib/context/LanguageContext';
import { useWorkspace } from '@/lib/context/WorkspaceContext';
import { Operator, UserRole } from '@/lib/types/auth.types';
import { operatorService } from '@/lib/services/OperatorService';
import { SaveIcon, ShieldCheckIcon, ZapIcon, RefreshCwIcon, ShieldAlertIcon, CheckIcon, CloseIcon } from '@/components/common/Icons';
import { PermissionsService, ALL_CAPABILITIES } from '@/lib/services/permissions';
import { TelemetryConfigService } from '@/lib/services/telemetry-config.service';

interface OperatorDetailPanelProps {
  selected: Operator | null;
  onRefresh: () => void;
  onClear: () => void;
}

export const OperatorDetailPanel: React.FC<OperatorDetailPanelProps> = ({
  selected,
  onRefresh,
  onClear
}) => {
  const { t } = useLanguage();
  const { currentOperator, requireFreshAuth } = useWorkspace();
  const [formData, setFormData] = useState<Partial<Operator>>({});
  const [newPin, setNewPin] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [maxPinAttempts, setMaxPinAttempts] = useState(5);

  useEffect(() => {
    TelemetryConfigService.loadConfig().then(cfg => {
      setMaxPinAttempts(cfg.security.maxPinAttempts ?? 5);
    });
  }, []);

  useEffect(() => {
    if (selected) {
      setFormData(selected);
      setNewPin('');
      setError(null);
    } else {
      setFormData({
        role: 'OPERATOR',
        isActive: 1,
        unitIds: []
      });
    }
  }, [selected]);

  const handleSave = async () => {
    if (!currentOperator) return;
    if (!requireFreshAuth(2, 'OPERATORS_MANAGE')) {
      setError(t('auth.error_insufficient_auth_level') || 'Se requiere autenticación MFA reciente para esta operación.');
      return;
    }
    setIsSaving(true);
    setError(null);
    try {
      const isNew = !selected;
      
      if (!formData.username || !formData.displayName) {
        setError('Missing required fields');
        setIsSaving(false);
        return;
      }

      if (isNew) {
        if (!newPin || newPin.length < 4) {
          setError('PIN required for new operators (min 4 chars)');
          setIsSaving(false);
          return;
        }
        await operatorService.create(formData, newPin, currentOperator.id);
      } else {
        await operatorService.update(selected.id, formData, currentOperator.id, newPin || undefined);
      }

      onRefresh();
      if (isNew) onClear();
    } catch (err: any) {
      console.error('[OPERATOR-MANAGER] Save failed', err);
      setError(err.message === 'LAST_ADMIN_PROTECTION' ? t('operator.error_last_admin') : (err.message || 'Save failed'));
    } finally {
      setIsSaving(false);
    }
  };

  const handleTransferMaster = async () => {
    if (!selected || !currentOperator) return;
    if (!requireFreshAuth(2, 'OPERATORS_MANAGE')) {
      setError(t('auth.error_insufficient_auth_level'));
      return;
    }
    if (!currentOperator.isMaster) return;

    if (selected.role !== 'ADMIN') {
      setError('Target must be an ADMIN to receive master role.');
      return;
    }

    if (selected.isActive === 0) {
      setError('Target operator must be active.');
      return;
    }

    if (!confirm('TRANSFER MASTER ROLE? This will revoke your current root access.')) return;

    setIsSaving(true);
    try {
      await operatorService.transferMasterRole(currentOperator.id, selected.id, currentOperator.id);
      onRefresh();
      window.location.reload(); 
    } catch (err: any) {
      setError(err.message || 'Transfer failed');
    } finally {
      setIsSaving(false);
    }
  };

  const handleUnlockPin = async () => {
    if (!selected || !currentOperator) return;
    if (!requireFreshAuth(1, 'OPERATORS_MANAGE')) {
       setError(t('auth.error_insufficient_auth_level'));
       return;
    }
    if (!confirm(t('operator.confirm_unlock_pin') || 'Unlock this operator PIN?')) return;
    
    setIsSaving(true);
    try {
      await operatorService.update(selected.id, { 
        isActive: 1, 
        failedPinAttempts: 0 
      }, currentOperator.id);
      onRefresh();
    } catch (err: any) {
      setError(err.message || 'Unlock failed');
    } finally {
      setIsSaving(false);
    }
  };

  const handleResetMfa = async () => {
    if (!selected || !currentOperator) return;
    if (!requireFreshAuth(2, 'OPERATORS_MANAGE')) {
       setError(t('auth.error_insufficient_auth_level'));
       return;
    }
    if (!confirm(t('operator.confirm_reset_mfa') || 'Reset MFA for this operator?')) return;

    setIsSaving(true);
    try {
      await operatorService.update(selected.id, {
        mfaEnabled: false,
        mfaSecret: undefined,
        failedMfaAttempts: 0,
        mfaLockedUntil: 0
      }, currentOperator.id);
      onRefresh();
    } catch (err: any) {
      setError(err.message || 'Reset MFA failed');
    } finally {
      setIsSaving(false);
    }
  };

  const canTransferMaster = currentOperator?.isMaster && selected && !selected.isMaster && selected.role === 'ADMIN';
  const isPinLocked = (selected?.isActive === 0 || formData.isActive === 0) && (selected?.failedPinAttempts ?? 0) >= maxPinAttempts;
  const canAdminSecurity = currentOperator?.role === 'ADMIN' || currentOperator?.isMaster;

  const baseCaps = PermissionsService.baseCapabilitiesForRole(formData.role);

  return (
    <div className="flex-col fade-in" style={{ gap: '24px', paddingTop: '16px' }}>
      <header className="flex-row" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
        <div className="flex-row" style={{ gap: '12px', alignItems: 'center' }}>
           <ShieldCheckIcon size={18} color="var(--primary-color)" />
           <h3 className="station-form-section-title" style={{ margin: 0 }}>
             {selected ? t('operator.edit_operator', { name: selected.username.toUpperCase() }) : t('operator.provision_new').toUpperCase()}
           </h3>
        </div>
        <div className="flex-row" style={{ gap: '8px' }}>
             {isPinLocked && canAdminSecurity && (
               <button className="station-btn secondary tiny" style={{ borderColor: 'var(--status-warn)', color: 'var(--status-warn)' }} onClick={handleUnlockPin} disabled={isSaving}>
                  <ShieldAlertIcon size={14} /> {t('operator.unlock_pin').toUpperCase()}
               </button>
             )}
             {selected?.mfaEnabled && canAdminSecurity && (
                <button className="station-btn secondary tiny" style={{ borderColor: 'var(--status-warn)', color: 'var(--status-warn)' }} onClick={handleResetMfa} disabled={isSaving}>
                  <RefreshCwIcon size={14} /> {t('operator.reset_mfa').toUpperCase()}
                </button>
             )}
             {canTransferMaster && (
               <button className="station-btn secondary tiny" style={{ borderColor: 'var(--status-err)', color: 'var(--status-err)' }} onClick={handleTransferMaster} disabled={isSaving}>
                  <ZapIcon size={14} /> {t('operator.xfer_master').toUpperCase()}
               </button>
             )}
             <button className="station-btn secondary tiny" onClick={onClear}>{t('common.cancel').toUpperCase()}</button>
             <button className="station-btn station-btn-primary tiny" onClick={handleSave} disabled={isSaving}>
                <SaveIcon size={14} /> {isSaving ? t('operator.commit').toUpperCase() : t('common.save').toUpperCase()}
             </button>
        </div>
      </header>

      <div className="flex-col" style={{ gap: '20px' }}>
        {isPinLocked && (
          <div className="station-card flex-row" style={{ gap: '16px', borderLeft: '4px solid var(--status-warn)', background: 'rgba(245, 158, 11, 0.05)', padding: '16px', alignItems: 'center' }}>
             <ShieldAlertIcon size={24} color="var(--status-warn)" />
             <div className="flex-col">
                <span className="station-title-main" style={{ fontSize: '0.8rem', color: 'var(--status-warn)' }}>{t('operator.lockout_active').toUpperCase()}</span>
                <span className="station-registry-item-meta">{t('operator.lockout_msg').toUpperCase()}</span>
             </div>
          </div>
        )}

        {formData.isMaster && (
          <div className="station-card flex-row" style={{ gap: '16px', borderLeft: '4px solid var(--primary-color)', background: 'rgba(var(--primary-color-rgb), 0.05)', padding: '16px', alignItems: 'center' }}>
             <ShieldCheckIcon size={24} color="var(--primary-color)" />
             <div className="flex-col">
                <span className="station-title-main" style={{ fontSize: '0.8rem', color: 'var(--primary-color)' }}>{t('operator.root_protection').toUpperCase()}</span>
                <span className="station-registry-item-meta">{t('operator.root_msg').toUpperCase()}</span>
             </div>
          </div>
        )}
        
        <div className="station-card" style={{ padding: '24px' }}>
            <div className="station-form-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
                <div className="station-field-container">
                  <label className="station-registry-item-meta">{t('operator.username').toUpperCase()}</label>
                  <input className="station-input" value={formData.username || ''} onChange={e => setFormData({ ...formData, username: e.target.value })} placeholder="operator.name" />
                </div>

                <div className="station-field-container">
                  <label className="station-registry-item-meta">{t('operator.display_name').toUpperCase()}</label>
                  <input className="station-input" value={formData.displayName || ''} onChange={e => setFormData({ ...formData, displayName: e.target.value })} placeholder={t('operator.full_name_placeholder').toUpperCase()} />
                </div>
            </div>

            <div className="station-form-grid" style={{ gridTemplateColumns: '1fr 1fr', marginTop: '20px' }}>
                <div className="station-field-container">
                  <label className="station-registry-item-meta">{t('operator.role').toUpperCase()}</label>
                  <select className="station-input" value={formData.role} onChange={e => setFormData({ ...formData, role: e.target.value as UserRole })}>
                    <option value="ADMIN">{t('operator.role_admin').toUpperCase()}</option>
                    <option value="TECH">{t('operator.role_tech').toUpperCase()}</option>
                    <option value="OPERATOR">{t('operator.role_operator').toUpperCase()}</option>
                  </select>
                </div>

                <div className="station-field-container">
                  <label className="station-registry-item-meta">{selected ? t('operator.update_pin').toUpperCase() : t('operator.initial_pin').toUpperCase()}</label>
                  <input type="password" className="station-input" value={newPin} onChange={e => setNewPin(e.target.value)} placeholder="****" />
                </div>
            </div>

            <div className="flex-row" style={{ alignItems: 'center', gap: '12px', marginTop: '20px', padding: '12px', background: 'rgba(255,255,255,0.02)', borderRadius: '4px' }}>
                <input type="checkbox" checked={formData.isActive === 1} id="op-active-chk" style={{ width: '18px', height: '18px' }} onChange={e => setFormData({ ...formData, isActive: e.target.checked ? 1 : 0 })} />
                <label htmlFor="op-active-chk" className="station-title-main" style={{ marginBottom: 0, cursor: 'pointer', fontSize: '0.7rem' }}>{t('operator.active_status_label').toUpperCase()}</label>
            </div>
        </div>

        {useWorkspace().can('SETTINGS_GLOBAL') && (
          <div className="flex-col" style={{ gap: '12px' }}>
            <div className="flex-row" style={{ gap: '12px', alignItems: 'center' }}>
                <ZapIcon size={16} color="var(--primary-color)" />
                <h3 className="station-form-section-title" style={{ margin: 0 }}>{t('operator.perm_matrix_title').toUpperCase()}</h3>
            </div>
            
            <div className="station-card flex-col" style={{ padding: 0, overflow: 'hidden' }}>
              <header className="station-table-header" style={{ background: 'rgba(255,255,255,0.03)' }}>
                 <div style={{ flex: 1, paddingLeft: '16px' }}>{t('operator.sys_capability').toUpperCase()}</div>
                 <div style={{ width: '80px', textAlign: 'center' }}>{t('operator.base').toUpperCase()}</div>
                 <div style={{ width: '80px', textAlign: 'center' }}>{t('operator.grant').toUpperCase()}</div>
                 <div style={{ width: '80px', textAlign: 'center', paddingRight: '16px' }}>{t('operator.revoke').toUpperCase()}</div>
              </header>

              <div className="station-registry-scroller" style={{ maxHeight: '400px' }}>
                {ALL_CAPABILITIES.map(cap => {
                  const isBase = baseCaps.includes(cap);
                  const isAdded = (formData.overrideCapabilities?.add || []).includes(cap) || (formData.extraCapabilities || []).includes(cap);
                  const isRemoved = (formData.overrideCapabilities?.remove || []).includes(cap) || (formData.deniedCapabilities || []).includes(cap);
                  const state: 'BASE' | 'ADD' | 'REMOVE' = isRemoved ? 'REMOVE' : (isAdded ? 'ADD' : 'BASE');

                  const handleToggle = (newState: 'BASE' | 'ADD' | 'REMOVE') => {
                    const nextOverrides = {
                      add: [...(formData.overrideCapabilities?.add || []), ...(formData.extraCapabilities || [])].filter(c => c !== cap),
                      remove: [...(formData.overrideCapabilities?.remove || []), ...(formData.deniedCapabilities || [])].filter(c => c !== cap)
                    };
                    if (newState === 'ADD') nextOverrides.add.push(cap);
                    if (newState === 'REMOVE') nextOverrides.remove.push(cap);
                    setFormData({ ...formData, overrideCapabilities: nextOverrides, extraCapabilities: [], deniedCapabilities: [] });
                  };

                  return (
                    <div key={cap} className="flex-row fade-in" style={{ padding: '8px 16px', borderBottom: '1px solid rgba(255,255,255,0.03)', alignItems: 'center', background: state !== 'BASE' ? 'rgba(var(--primary-color-rgb), 0.03)' : 'transparent' }}>
                      <div className="flex-col" style={{ flex: 1 }}>
                        <span className="station-title-main" style={{ fontSize: '0.7rem', color: state === 'ADD' ? 'var(--status-ok)' : state === 'REMOVE' ? 'var(--status-err)' : 'inherit' }}>{cap}</span>
                        <span className="station-registry-item-meta" style={{ fontSize: '0.55rem' }}>{isBase ? t('operator.inherited').toUpperCase() : t('operator.custom_override').toUpperCase()}</span>
                      </div>
                      <div className="flex-row" style={{ width: '240px', gap: '8px', justifyContent: 'flex-end' }}>
                        <button className={`station-btn tiny ${state === 'BASE' ? 'station-btn-primary' : 'secondary'}`} onClick={() => handleToggle('BASE')} style={{ width: '70px', padding: 0 }} title="Restore default"><RefreshCwIcon size={12} /></button>
                        <button className={`station-btn tiny ${state === 'ADD' ? 'station-btn-primary' : 'secondary'}`} onClick={() => handleToggle('ADD')} style={{ width: '70px', padding: 0, color: state === 'ADD' ? '#000' : 'var(--status-ok)' }} title="Explicit grant"><CheckIcon size={12} /></button>
                        <button className={`station-btn tiny ${state === 'REMOVE' ? 'station-btn-primary' : 'secondary'}`} onClick={() => handleToggle('REMOVE')} style={{ width: '70px', padding: 0, color: state === 'REMOVE' ? '#000' : 'var(--status-err)' }} title="Explicit deny"><CloseIcon size={12} /></button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="station-card" style={{ borderLeft: '4px solid var(--status-err)', background: 'rgba(239, 68, 68, 0.05)', padding: '16px' }}>
            <span className="station-title-main" style={{ color: 'var(--status-err)', fontSize: '0.75rem' }}>{t('operator.commit_failure', { error: error.toUpperCase() })}</span>
          </div>
        )}
      </div>
    </div>
  );
};
