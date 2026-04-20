import React, { useState, useEffect } from 'react';
import { Operator, UserRole, Capability } from '@/lib/types/auth.types';
import { useLanguage } from '@/lib/context/LanguageContext';
import { useWorkspace } from '@/lib/context/WorkspaceContext';
import { operatorService } from '@/lib/services/OperatorService';
import { SaveIcon, UserPlusIcon, ShieldCheckIcon, ZapIcon, XIcon, ListIcon } from '@/components/common/Icons';

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
  const { currentOperator } = useWorkspace();
  const [formData, setFormData] = useState<Partial<Operator>>({});
  const [newPin, setNewPin] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  const canTransferMaster = currentOperator?.isMaster && selected && !selected.isMaster && selected.role === 'ADMIN';

  return (
    <div className="flex-col" style={{ gap: '20px' }}>
      <header className="flex-row" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 style={{ fontSize: '1.1rem', margin: 0 }}>
          {selected ? t('common.edit') : t('operator.create_btn')}
        </h3>
        <div className="flex-row" style={{ gap: '12px' }}>
             {canTransferMaster && (
               <button className="station-btn secondary warning" onClick={handleTransferMaster} disabled={isSaving}>
                  <ZapIcon size={18} />
                  <span>TRANSFER MASTER</span>
               </button>
             )}
             <button className="station-btn secondary" onClick={onClear}>{t('common.cancel')}</button>
             <button className="station-btn primary" onClick={handleSave} disabled={isSaving}>
                <SaveIcon size={18} />
                <span>{isSaving ? '...' : t('common.save')}</span>
             </button>
        </div>
      </header>

      <div className="station-form-grid" style={{ gridTemplateColumns: '1fr' }}>
        <div className="station-form-group">
          <label className="station-label">{t('operator.username').toUpperCase()}</label>
          <input 
            className="station-input" 
            value={formData.username || ''} 
            onChange={e => setFormData({ ...formData, username: e.target.value })}
            placeholder="master.root"
          />
        </div>
        <div className="station-form-group">
          <label className="station-label">{t('operator.display_name').toUpperCase()}</label>
          <input 
            className="station-input" 
            value={formData.displayName || ''} 
            onChange={e => setFormData({ ...formData, displayName: e.target.value })}
            placeholder="SYSTEM ADMIN"
          />
        </div>
        <div className="station-form-group">
          <label className="station-label">{t('operator.role').toUpperCase()}</label>
          <select 
            className="station-input" 
            value={formData.role} 
            onChange={e => setFormData({ ...formData, role: e.target.value as UserRole })}
          >
            <option value="ADMIN">{t('operator.roles.ADMIN')}</option>
            <option value="TECH">{t('operator.roles.TECH')}</option>
            <option value="OPERATOR">{t('operator.roles.OPERATOR')}</option>
          </select>
        </div>
        <div className="station-form-group">
          <label className="station-label">{selected ? 'UPDATE PIN (OPTIONAL)' : 'INITIAL PIN'}</label>
          <input 
            type="password" 
            className="station-input" 
            value={newPin} 
            onChange={e => setNewPin(e.target.value)}
            placeholder="****"
          />
        </div>
        
        <div className="station-form-group">
           <label className="flex-row" style={{ gap: '12px', alignItems: 'center', cursor: 'pointer' }}>
              <input 
                type="checkbox" 
                checked={formData.isActive === 1} 
                onChange={e => setFormData({ ...formData, isActive: e.target.checked ? 1 : 0 })}
              />
              <span className="station-label" style={{ marginBottom: 0 }}>{t('operator.active').toUpperCase()}</span>
           </label>
        </div>

        {/* Phase 12.1: Capability Overrides (Advanced Tooling) */}
        {useWorkspace().can('SETTINGS_GLOBAL') && (
          <fieldset style={{ marginTop: '16px', padding: '16px', border: '1px solid var(--border-color)', borderRadius: '4px', background: 'rgba(0,0,0,0.1)' }}>
            <legend className="station-label" style={{ padding: '0 8px', fontWeight: 800, fontSize: '0.65rem', opacity: 0.7 }}>ADVANCED_CAPABILITY_OVERRIDES</legend>
            
            <div className="flex-col" style={{ gap: '12px' }}>
              <div className="station-form-group">
                <label className="station-label" style={{ fontSize: '0.65rem' }}>EXTRA_CAPABILITIES (Comma separated)</label>
                <input 
                  className="station-input"
                  style={{ fontSize: '0.8rem', fontFamily: 'monospace' }}
                  value={(formData.extraCapabilities || []).join(', ')}
                  onChange={e => setFormData({ 
                    ...formData, 
                    extraCapabilities: e.target.value.split(',').map(s => s.trim()).filter(s => s) as Capability[] 
                  })}
                  placeholder="AUDIT_VIEW, ETL_RUN..."
                />
              </div>

              <div className="station-form-group">
                <label className="station-label" style={{ fontSize: '0.65rem' }}>DENIED_CAPABILITIES (Comma separated)</label>
                <input 
                  className="station-input"
                  style={{ fontSize: '0.8rem', fontFamily: 'monospace' }}
                  value={(formData.deniedCapabilities || []).join(', ')}
                  onChange={e => setFormData({ 
                    ...formData, 
                    deniedCapabilities: e.target.value.split(',').map(s => s.trim()).filter(s => s) as Capability[] 
                  })}
                  placeholder="CRYPT_USE, LETTER_GENERATE..."
                />
              </div>
              <p style={{ margin: 0, fontSize: '0.6rem', opacity: 0.5, fontStyle: 'italic' }}>
                Priority Rule: DENIED &gt; (BASE_ROLE || EXTRAS).
              </p>
            </div>
          </fieldset>
        )}

        {error && (
          <div className="alert-box error animate-shake">
            <p>{error}</p>
          </div>
        )}

        {formData.isMaster && (
          <div className="alert-box warning">
             <div className="flex-row" style={{ gap: '12px' }}>
                <ShieldCheckIcon size={20} />
                <span>ROOT OPERATOR: Protected Identity. Restricted Deletion.</span>
             </div>
          </div>
        )}
      </div>
    </div>
  );
};
