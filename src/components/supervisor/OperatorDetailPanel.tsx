'use client';

import React, { useState, useEffect } from 'react';
import { Operator, OperatorRole } from '@/lib/types/auth.types';
import { useLanguage } from '@/lib/context/LanguageContext';
import { useWorkspace } from '@/lib/context/WorkspaceContext';
import { coreDb } from '@/lib/db/SystemDB';
import { hashPin } from '@/lib/utils/crypto.utils';
import { operatorService } from '@/lib/services/OperatorService';
import { SaveIcon, TrashIcon, UserPlusIcon, ShieldCheckIcon, ZapIcon } from '@/components/common/Icons';

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

  const validateLastAdmin = async (opId: string, nextActive: number, nextRole: OperatorRole) => {
    if (!opId) return true; // New user is safe
    
    const activeAdmins = await coreDb.operators
      .where('role').equals('ADMIN')
      .filter(op => op.isActive === 1)
      .toArray();

    if (activeAdmins.length === 1 && activeAdmins[0].id === opId) {
      if (nextActive === 0 || nextRole !== 'ADMIN') {
        return false;
      }
    }
    return true;
  };

  const handleSave = async () => {
    setIsSaving(true);
    setError(null);
    try {
      const isNew = !selected;
      const finalData = { ...formData } as Operator;

      // Validation
      if (!finalData.username || !finalData.name) {
        setError('Missing required fields');
        return;
      }

      // Protection: Last Admin
      const isSafe = await validateLastAdmin(selected?.id || '', finalData.isActive, finalData.role);
      if (!isSafe) {
        setError(t('operator.error_last_admin'));
        return;
      }

      if (isNew) {
        if (!newPin || newPin.length < 4) {
          setError('PIN required for new operators');
          return;
        }
        finalData.id = crypto.randomUUID();
        finalData.pinHash = await hashPin(newPin);
        finalData.createdAt = Date.now();
        finalData.updatedAt = Date.now();
        finalData.mfaEnabled = false;
        await coreDb.operators.add(finalData);
      } else {
        if (newPin) {
          finalData.pinHash = await hashPin(newPin);
        }
        finalData.updatedAt = Date.now();
        await coreDb.operators.update(selected.id, finalData);
      }

      onRefresh();
      if (isNew) onClear();
    } catch (err) {
      console.error('[OPERATOR-MANAGER] Save failed', err);
      setError('Save failed');
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
      // Session needs refresh but context handles it generally via DB state
      window.location.reload(); // Force full reload for security state refresh
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
                <span>{t('common.save')}</span>
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
            value={formData.name || ''} 
            onChange={e => setFormData({ ...formData, name: e.target.value })}
            placeholder="SYSTEM ADMIN"
          />
        </div>
        <div className="station-form-group">
          <label className="station-label">{t('operator.role').toUpperCase()}</label>
          <select 
            className="station-input" 
            value={formData.role} 
            onChange={e => setFormData({ ...formData, role: e.target.value as any })}
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
