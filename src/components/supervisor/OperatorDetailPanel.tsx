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
    <div className="flex-col fade-in" style={{ gap: '24px' }}>
      <header className="flex-row" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 className="station-form-section-title" style={{ margin: 0 }}>
          {(selected ? t('common.edit') : t('operator.create_btn')).toUpperCase()}
        </h3>
        <div className="flex-row" style={{ gap: '8px' }}>
             {isPinLocked && canAdminSecurity && (
               <button className="station-btn secondary tiny" style={{ borderColor: 'var(--status-warn)', color: 'var(--status-warn)' }} onClick={handleUnlockPin} disabled={isSaving}>
                  <ShieldAlertIcon size={14} /> UNLOCK
               </button>
             )}
             {selected?.mfaEnabled && canAdminSecurity && (
                <button className="station-btn secondary tiny" style={{ borderColor: 'var(--status-warn)', color: 'var(--status-warn)' }} onClick={handleResetMfa} disabled={isSaving}>
                  <RefreshCwIcon size={14} /> RESET MFA
                </button>
             )}
             {canTransferMaster && (
               <button className="station-btn secondary tiny" style={{ borderColor: 'var(--status-err)', color: 'var(--status-err)' }} onClick={handleTransferMaster} disabled={isSaving}>
                  <ZapIcon size={14} /> MASTER XFER
               </button>
             )}
             <button className="station-btn secondary tiny" onClick={onClear}>{t('common.cancel').toUpperCase()}</button>
             <button className="station-btn station-btn-primary tiny" onClick={handleSave} disabled={isSaving}>
                <SaveIcon size={14} /> {isSaving ? '...' : t('common.save').toUpperCase()}
             </button>
        </div>
      </header>

      <div className="flex-col" style={{ gap: '16px' }}>
        {isPinLocked && (
          <div className="station-registry-sync-header" style={{ borderColor: 'var(--status-warn)', background: 'rgba(var(--status-warn-rgb), 0.1)', padding: '12px' }}>
             <div className="flex-row" style={{ gap: '12px', alignItems: 'center' }}>
                <ShieldAlertIcon size={20} color="var(--status-warn)" />
                <span className="station-title-main" style={{ fontSize: '0.65rem', color: 'var(--status-warn)' }}>NODE_LOCKED: FAILED_PIN_THRESHOLD</span>
             </div>
          </div>
        )}
        
        <div className="station-field-container">
          <label className="station-registry-item-meta">{t('operator.username').toUpperCase()}</label>
          <input className="station-input" value={formData.username || ''} onChange={e => setFormData({ ...formData, username: e.target.value })} placeholder="master.root" />
        </div>

        <div className="station-field-container">
          <label className="station-registry-item-meta">{t('operator.display_name').toUpperCase()}</label>
          <input className="station-input" value={formData.displayName || ''} onChange={e => setFormData({ ...formData, displayName: e.target.value })} placeholder="SYSTEM ADMIN" />
        </div>

        <div className="station-field-container">
          <label className="station-registry-item-meta">{t('operator.role').toUpperCase()}</label>
          <select className="station-input" value={formData.role} onChange={e => setFormData({ ...formData, role: e.target.value as UserRole })}>
            <option value="ADMIN">{t('operator.roles.ADMIN').toUpperCase()}</option>
            <option value="TECH">{t('operator.roles.TECH').toUpperCase()}</option>
            <option value="OPERATOR">{t('operator.roles.OPERATOR').toUpperCase()}</option>
          </select>
        </div>

        <div className="station-field-container">
          <label className="station-registry-item-meta">{selected ? 'UPDATE PIN_CODE (OPTIONAL)' : 'INITIAL PIN_CODE'}</label>
          <input type="password" className="station-input" value={newPin} onChange={e => setNewPin(e.target.value)} placeholder="****" />
        </div>
        
        <div className="flex-row" style={{ alignItems: 'center', gap: '12px' }}>
            <input type="checkbox" checked={formData.isActive === 1} id="op-active-chk" onChange={e => setFormData({ ...formData, isActive: e.target.checked ? 1 : 0 })} />
            <label htmlFor="op-active-chk" className="station-registry-item-meta" style={{ marginBottom: 0, cursor: 'pointer' }}>{t('operator.active').toUpperCase()}</label>
        </div>

        {useWorkspace().can('SETTINGS_GLOBAL') && (
          <div className="flex-col" style={{ marginTop: '16px', gap: '12px' }}>
            <span className="station-form-section-title">PERM_OVERRIDE_MATRIX</span>
            
            <div className="flex-col" style={{ gap: '4px', border: '1px solid var(--border-color)', borderRadius: '2px', background: 'rgba(0,0,0,0.2)' }}>
              <header className="flex-row" style={{ padding: '8px 12px', borderBottom: '1px solid var(--border-color)', background: 'var(--surface-color)', fontSize: '0.55rem', opacity: 0.4, fontWeight: 900 }}>
                 <div style={{ flex: 1 }}>CAPABILITY</div>
                 <div style={{ width: '60px', textAlign: 'center' }}>BASE</div>
                 <div style={{ width: '60px', textAlign: 'center' }}>ALLOW</div>
                 <div style={{ width: '60px', textAlign: 'center' }}>DENY</div>
              </header>

              <div className="station-registry-scroller" style={{ maxHeight: '300px' }}>
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
                    <div key={cap} className={`flex-row fade-in`} style={{ padding: '8px 12px', borderBottom: '1px solid rgba(255,255,255,0.02)', alignItems: 'center', background: state !== 'BASE' ? 'rgba(var(--primary-color-rgb), 0.05)' : 'transparent' }}>
                      <div className="flex-col" style={{ flex: 1 }}>
                        <span className="station-title-main" style={{ fontSize: '0.7rem' }}>{cap}</span>
                        {isBase && <span className="station-registry-item-meta" style={{ fontSize: '0.5rem' }}>INHERITED</span>}
                      </div>
                      <div className="flex-row" style={{ width: '180px', gap: '4px' }}>
                        <button className={`station-btn tiny ${state === 'BASE' ? 'station-btn-primary' : 'secondary'}`} onClick={() => handleToggle('BASE')} style={{ width: '56px', padding: 0 }}><RefreshCwIcon size={10} /></button>
                        <button className={`station-btn tiny ${state === 'ADD' ? 'station-btn-primary' : 'secondary'}`} onClick={() => handleToggle('ADD')} style={{ width: '56px', padding: 0, color: state === 'ADD' ? '#000' : 'var(--status-ok)' }}><CheckIcon size={12} /></button>
                        <button className={`station-btn tiny ${state === 'REMOVE' ? 'station-btn-primary' : 'secondary'}`} onClick={() => handleToggle('REMOVE')} style={{ width: '56px', padding: 0, color: state === 'REMOVE' ? '#000' : 'var(--status-err)' }}><CloseIcon size={12} /></button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="station-registry-sync-header" style={{ borderColor: 'var(--status-err)', background: 'rgba(var(--status-err-rgb), 0.1)', padding: '10px' }}>
            <span className="station-title-main" style={{ color: 'var(--status-err)', fontSize: '0.7rem' }}>[ERR] {error.toUpperCase()}</span>
          </div>
        )}

        {formData.isMaster && (
          <div className="station-registry-sync-header" style={{ borderColor: 'var(--primary-color)', padding: '10px', background: 'rgba(var(--primary-color-rgb), 0.05)' }}>
             <div className="flex-row" style={{ gap: '12px', alignItems: 'center' }}>
                <ShieldCheckIcon size={20} color="var(--primary-color)" />
                <span className="station-title-main" style={{ fontSize: '0.65rem', color: 'var(--primary-color)' }}>ROOT_IDENTITY_PROTECTED</span>
             </div>
          </div>
        )}
      </div>
    </div>
  );
};
