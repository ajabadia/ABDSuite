import React, { useState, useEffect } from 'react';
import { useLanguage } from '@/lib/context/LanguageContext';
import { useWorkspace } from '@/lib/context/WorkspaceContext';
import { Operator, UserRole, Capability } from '@/lib/types/auth.types';
import { operatorService } from '@/lib/services/OperatorService';
import { SaveIcon, UserPlusIcon, ShieldCheckIcon, ZapIcon, XIcon, ListIcon, ShieldAlertIcon, RefreshCwIcon } from '@/components/common/Icons';
import { PermissionsService } from '@/lib/services/permissions';
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
      
      // Basic validation
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
    if (!requireFreshAuth(2, 'OPERATORS_MANAGE')) { // Master transfer is extreme high risk
      setError(t('auth.error_insufficient_auth_level') || 'Se requiere autenticación MFA reciente.');
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
    if (!requireFreshAuth(1, 'OPERATORS_MANAGE')) { // Unlock PIN might only need Fresh PIN, but let's stick to policy
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
    <div className="flex-col obsidian-form-technical" style={{ gap: '24px', padding: '24px', background: 'var(--bg-color)', border: '1px solid var(--border-color)', borderRadius: '4px' }}>
      <header className="flex-row technical-header-small" style={{ justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '16px' }}>
        <h3 style={{ fontSize: '0.75rem', margin: 0, letterSpacing: '2px', fontWeight: 900, opacity: 0.5 }}>
          {(selected ? t('common.edit') : t('operator.create_btn')).toUpperCase()}
        </h3>
        <div className="flex-row" style={{ gap: '8px' }}>
             {isPinLocked && canAdminSecurity && (
               <button className="station-btn secondary tiny warning-technical" onClick={handleUnlockPin} disabled={isSaving}>
                  <ShieldAlertIcon size={14} />
                  <span>{t('operator.unlock_pin_btn') || 'UNLOCK'}</span>
               </button>
             )}
             {selected?.mfaEnabled && canAdminSecurity && (
                <button className="station-btn secondary tiny warning-technical" onClick={handleResetMfa} disabled={isSaving}>
                  <RefreshCwIcon size={14} />
                  <span>{t('operator.reset_mfa_btn') || 'RESET MFA'}</span>
                </button>
             )}
             {canTransferMaster && (
               <button className="station-btn secondary tiny warning-technical" onClick={handleTransferMaster} disabled={isSaving}>
                  <ZapIcon size={14} />
                  <span>MASTER XFER</span>
               </button>
             )}
             <button className="station-btn secondary tiny" onClick={onClear} style={{ fontSize: '0.65rem' }}>{t('common.cancel').toUpperCase()}</button>
             <button className="station-btn primary tiny" onClick={handleSave} disabled={isSaving} style={{ background: 'var(--primary-color)', color: '#000', fontWeight: 900 }}>
                <SaveIcon size={14} />
                <span style={{ fontSize: '0.65rem' }}>{isSaving ? '...' : t('common.save').toUpperCase()}</span>
             </button>
        </div>
      </header>

      <div className="flex-col" style={{ gap: '16px' }}>
        {isPinLocked && (
          <div className="alert-box-technical warning" style={{ background: 'rgba(245, 158, 11, 0.1)', border: '1px solid #f59e0b', padding: '10px', borderRadius: '2px' }}>
             <div className="flex-row" style={{ gap: '12px', alignItems: 'center' }}>
                <ShieldAlertIcon size={20} color="#f59e0b" />
                <p style={{ margin: 0, fontSize: '0.65rem', fontWeight: 800, color: '#f59e0b' }}>{t('operator.pin_locked_banner') || 'NODE_LOCKED: FAILED_PIN_THRESHOLD'}</p>
             </div>
          </div>
        )}
        
        <div className="station-form-group-technical">
          <label className="label-technical">{t('operator.username').toUpperCase()}</label>
          <input 
            className="technical-input" 
            value={formData.username || ''} 
            onChange={e => setFormData({ ...formData, username: e.target.value })}
            placeholder="master.root"
          />
        </div>

        <div className="station-form-group-technical">
          <label className="label-technical">{t('operator.display_name').toUpperCase()}</label>
          <input 
            className="technical-input" 
            value={formData.displayName || ''} 
            onChange={e => setFormData({ ...formData, displayName: e.target.value })}
            placeholder="SYSTEM ADMIN"
          />
        </div>

        <div className="station-form-group-technical">
          <label className="label-technical">{t('operator.role').toUpperCase()}</label>
          <select 
            className="technical-input" 
            value={formData.role} 
            onChange={e => setFormData({ ...formData, role: e.target.value as UserRole })}
          >
            <option value="ADMIN">{t('operator.roles.ADMIN').toUpperCase()}</option>
            <option value="TECH">{t('operator.roles.TECH').toUpperCase()}</option>
            <option value="OPERATOR">{t('operator.roles.OPERATOR').toUpperCase()}</option>
          </select>
        </div>

        <div className="station-form-group-technical">
          <label className="label-technical">{selected ? 'UPDATE PIN_CODE (OPTIONAL)' : 'INITIAL PIN_CODE'}</label>
          <input 
            type="password" 
            className="technical-input" 
            value={newPin} 
            onChange={e => setNewPin(e.target.value)}
            placeholder="****"
          />
        </div>
        
        <div className="station-form-group-technical flex-row" style={{ alignItems: 'center', gap: '12px' }}>
            <input 
              type="checkbox" 
              checked={formData.isActive === 1} 
              id="op-active-chk"
              onChange={e => setFormData({ ...formData, isActive: e.target.checked ? 1 : 0 })}
            />
            <label htmlFor="op-active-chk" className="label-technical" style={{ marginBottom: 0, cursor: 'pointer' }}>{t('operator.active').toUpperCase()}</label>
        </div>

        {/* Phase 12.1: Capability Overrides (Advanced Tooling) */}
        {useWorkspace().can('SETTINGS_GLOBAL') && (
          <fieldset style={{ marginTop: '16px', padding: '16px', border: '1px solid var(--border-color)', borderRadius: '2px', background: 'rgba(0,0,0,0.2)' }}>
            <legend className="label-technical" style={{ padding: '0 8px', fontSize: '0.6rem', opacity: 0.5 }}>PERM_OVERRIDE_MATRIX</legend>
            
            <div className="flex-col" style={{ gap: '16px' }}>
              <div className="station-form-group-technical">
                <label className="label-technical" style={{ opacity: 0.4 }}>ADD_CAPS</label>
                <input 
                  className="technical-input"
                  style={{ fontSize: '0.7rem' }}
                  value={(formData.extraCapabilities || []).join(', ')}
                  onChange={e => setFormData({ 
                    ...formData, 
                    extraCapabilities: e.target.value.split(',').map(s => s.trim()).filter(s => s) as Capability[] 
                  })}
                  placeholder="AUDIT_VIEW, ETL_RUN..."
                />
              </div>

              <div className="station-form-group-technical">
                <label className="label-technical" style={{ opacity: 0.4 }}>DENY_CAPS</label>
                <input 
                  className="technical-input"
                  style={{ fontSize: '0.7rem' }}
                  value={(formData.deniedCapabilities || []).join(', ')}
                  onChange={e => setFormData({ 
                    ...formData, 
                    deniedCapabilities: e.target.value.split(',').map(s => s.trim()).filter(s => s) as Capability[] 
                  })}
                  placeholder="CRYPT_USE, SETTINGS_GLOBAL..."
                />
              </div>
            </div>
          </fieldset>
        )}

        {error && (
          <div className="alert-box-technical error" style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid var(--status-err)', padding: '10px', marginTop: '12px' }}>
            <p style={{ margin: 0, color: 'var(--status-err)', fontSize: '0.7rem', fontWeight: 800 }}>[ERR] {error.toUpperCase()}</p>
          </div>
        )}

        {formData.isMaster && (
          <div className="alert-box-technical info" style={{ border: '1px solid var(--primary-color)', padding: '10px', marginTop: '12px', background: 'rgba(56, 189, 248, 0.05)' }}>
             <div className="flex-row" style={{ gap: '12px', alignItems: 'center' }}>
                <ShieldCheckIcon size={20} color="var(--primary-color)" />
                <span style={{ fontSize: '0.65rem', fontWeight: 900, color: 'var(--primary-color)', letterSpacing: '1px' }}>ROOT_IDENTITY_PROTECTED</span>
             </div>
          </div>
        )}
      </div>

      <style jsx>{`
        .label-technical {
          font-family: var(--font-mono);
          font-size: 0.6rem;
          font-weight: 800;
          letter-spacing: 1px;
          margin-bottom: 6px;
          display: block;
          opacity: 0.6;
        }
        .technical-input {
          background: var(--bg-color);
          border: 1px solid var(--border-color);
          color: var(--text-primary);
          padding: 8px 12px;
          font-family: var(--font-mono);
          font-size: 0.75rem;
          width: 100%;
          border-radius: 2px;
          transition: var(--snap);
        }
        .technical-input:focus {
           outline: none;
           border-color: var(--primary-color);
           background: var(--surface-color);
        }
        .warning-technical {
           border-color: var(--status-warn) !important;
           color: var(--status-warn) !important;
           font-size: 0.6rem !important;
           font-weight: 900 !important;
        }
        .warning-technical:hover {
           background: rgba(245, 158, 11, 0.1) !important;
        }
      `}</style>
    </div>
  );
};
