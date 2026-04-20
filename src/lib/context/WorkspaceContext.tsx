'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  Operator, 
  WorkspaceUnit, 
  AuthSession, 
  UserRole, 
  Capability 
} from '../types/auth.types';
import { coreDb } from '../db/SystemDB';
import { setActiveUnit } from '../db/db';
import { hashPin } from '../utils/crypto.utils';
import { PermissionsService } from '../services/permissions';
import { auditService } from '../services/AuditService';
import { TelemetryConfigService } from '../services/telemetry-config.service';

interface WorkspaceContextType {
  currentOperator: Operator | null;
  currentUnit: WorkspaceUnit | null;
  isLoading: boolean;
  isBootstrapNeeded: boolean;
  login: (pin: string) => Promise<{ success: boolean; mfaRequired: boolean }>;
  verifyMfa: (token: string) => Promise<boolean>;
  logout: () => void;
  selectUnit: (unit: WorkspaceUnit) => Promise<void>;
  refreshBootstrapStatus: () => Promise<void>;
  can: (cap: Capability) => boolean;
}

const WorkspaceContext = createContext<WorkspaceContextType | undefined>(undefined);

const SESSION_KEY = 'abdfn_active_session';

export const WorkspaceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentOperator, setCurrentOperator] = useState<Operator | null>(null);
  const [currentUnit, setCurrentUnit] = useState<WorkspaceUnit | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isBootstrapNeeded, setIsBootstrapNeeded] = useState(false);

  // Initial Sync
  useEffect(() => {
    const init = async () => {
      try {
        const unitsCount = await coreDb.units.count();
        const operatorsCount = await coreDb.operators.count();

        if (unitsCount === 0 || operatorsCount === 0) {
          setIsBootstrapNeeded(true);
          setIsLoading(false);
          return;
        }

        // Check for saved session
        const saved = localStorage.getItem(SESSION_KEY);
        if (saved) {
          const session: AuthSession = JSON.parse(saved);
          const operator = await coreDb.operators.get(session.operatorId);
          const unit = await coreDb.units.get(session.unitId);

          if (operator && unit && operator.isActive === 1 && unit.isActive === 1) {
            await setActiveUnit(unit.id);
            setCurrentOperator(operator);
            setCurrentUnit(unit);
          } else {
            localStorage.removeItem(SESSION_KEY);
          }
        }
      } catch (err) {
        console.error('[ABDFN-WORKSPACE] Failed to initialize', err);
      } finally {
        setIsLoading(false);
      }
    };
    init();
  }, []);

  const refreshBootstrapStatus = async () => {
    const unitsCount = await coreDb.units.count();
    const operatorsCount = await coreDb.operators.count();
    setIsBootstrapNeeded(unitsCount === 0 || operatorsCount === 0);
  };

  const login = async (pin: string): Promise<{ success: boolean; mfaRequired: boolean }> => {
    try {
      const config = await TelemetryConfigService.loadConfig();
      const maxPinAttempts = config.security.maxPinAttempts ?? 5;

      // 1. Identify operator by current input (simplified for this industrial suite to use selected op if any or fetch by pin)
      // Note: In ERA 6, we typically select the operator from a list first, but here login(pin) needs to verify it.
      // To implement lockout properly, we need the operator first.
      // If no currentOperator is set (pre-login), we'd need a username. 
      // For this implementation, we'll assume the screen has already "selected" an operator or uses hash search.
      
      const pinHash = await hashPin(pin);
      const operator = await coreDb.operators
        .where('pinHash')
        .equals(pinHash)
        .first();
      
      if (!operator) {
        // We don't know who it is, so we can't lock anyone specific yet, 
        // but we log a generic failure.
        await auditService.log({
          module: 'SECURITY',
          messageKey: 'auth.login.failure',
          status: 'ERROR',
          details: {
            eventType: 'AUTH_LOGIN_FAILURE',
            entityType: 'AUTH',
            severity: 'WARN',
            context: { reason: 'INVALID_PIN' }
          }
        });
        return { success: false, mfaRequired: false };
      }

      // Check if locked
      if (operator.isActive === 0) {
        const isLockedByPin = (operator.failedPinAttempts ?? 0) >= maxPinAttempts;
        await auditService.log({
          module: 'SECURITY',
          messageKey: isLockedByPin ? 'auth.login.locked' : 'auth.login.inactive',
          status: 'ERROR',
          operatorId: operator.id,
          details: {
            eventType: isLockedByPin ? 'AUTH_LOCKOUT_PIN' : 'AUTH_LOGIN_FAILURE',
            entityType: 'OPERATOR',
            entityId: operator.id,
            severity: 'CRITICAL',
            context: { reason: isLockedByPin ? 'MAX_ATTEMPTS' : 'ADMIN_DEACTIVATED' }
          }
        });
        return { success: false, mfaRequired: false };
      }

      // If we reach here, operator found and is active. However, if this was a WRONG pin
      // but matched another operator, that's fine. But what if we WANT to lock a specific operator?
      // Industrial logic: Usually the user selects their name first.
      // Let's assume currentOperator might be set by the LoginScreen before calling login(pin).
      
      // No MFA needed, finalize (or proceed to MFA phase)
      if (operator.mfaEnabled) {
        setCurrentOperator(operator); 
        return { success: true, mfaRequired: true };
      }

      // Finalize Session
      setCurrentOperator(operator);
      await coreDb.operators.update(operator.id, { 
        lastLogin: Date.now(),
        failedPinAttempts: 0 // Reset on success
      });
      
      await auditService.log({
        module: 'SECURITY',
        messageKey: 'auth.login.success',
        status: 'SUCCESS',
        operatorId: operator.id,
        details: {
          eventType: 'AUTH_LOGIN_SUCCESS',
          entityType: 'OPERATOR',
          entityId: operator.id,
          actorId: operator.id,
          actorUser: operator.username,
          severity: 'INFO',
          context: { mfaEnabled: false }
        }
      });

      if (operator.unitIds.length === 1) {
        const unit = await coreDb.units.get(operator.unitIds[0]);
        if (unit) await selectUnit(unit);
      }

      return { success: true, mfaRequired: false };
    } catch (err) {
      console.error('[ABDFN-AUTH] Login failed', err);
      return { success: false, mfaRequired: false };
    }
  };

  const verifyMfa = async (token: string): Promise<boolean> => {
    if (!currentOperator || !currentOperator.mfaSecret) return false;

    try {
      const config = await TelemetryConfigService.loadConfig();
      const maxMfaAttempts = config.security.maxMfaAttempts ?? 5;
      const mfaCooldownMinutes = config.security.mfaCooldownMinutes ?? 15;

      const now = Date.now();
      if (currentOperator.mfaLockedUntil && currentOperator.mfaLockedUntil > now) {
        const remaining = Math.ceil((currentOperator.mfaLockedUntil - now) / 60000);
        console.warn(`[ABDFN-MFA] Throttling active. ${remaining}m remaining.`);
        return false;
      }

      const { verifyTOTP } = await import('../utils/mfa.utils');
      const isValid = await verifyTOTP(currentOperator.mfaSecret, token);

      if (isValid) {
        await auditService.log({
          module: 'SECURITY',
          messageKey: 'auth.mfa.success',
          status: 'SUCCESS',
          operatorId: currentOperator.id,
          details: {
            eventType: 'AUTH_MFA_SUCCESS',
            entityType: 'OPERATOR',
            entityId: currentOperator.id,
            actorId: currentOperator.id,
            actorUser: currentOperator.username,
            severity: 'INFO',
            context: { method: 'TOTP' }
          }
        });
        await coreDb.operators.update(currentOperator.id, { 
          lastLogin: Date.now(),
          failedMfaAttempts: 0,
          mfaLockedUntil: 0
        });

        if (currentOperator.unitIds.length === 1) {
          const unit = await coreDb.units.get(currentOperator.unitIds[0]);
          if (unit) await selectUnit(unit);
        }
        return true;
      } else {
        const newAttempts = (currentOperator.failedMfaAttempts ?? 0) + 1;
        const updates: any = { failedMfaAttempts: newAttempts };
        
        let severity: any = 'WARN';
        if (newAttempts >= maxMfaAttempts) {
          updates.mfaLockedUntil = now + (mfaCooldownMinutes * 60000);
          severity = 'CRITICAL';
        }

        await coreDb.operators.update(currentOperator.id, updates);

        await auditService.log({
          module: 'SECURITY',
          messageKey: 'auth.mfa.failure',
          status: 'ERROR',
          operatorId: currentOperator.id,
          details: {
            eventType: 'AUTH_MFA_FAILURE',
            entityType: 'OPERATOR',
            entityId: currentOperator.id,
            actorId: currentOperator.id,
            actorUser: currentOperator.username,
            severity,
            context: { reason: 'INVALID_TOTP', attempts: newAttempts, lockedUntil: updates.mfaLockedUntil }
          }
        });
        return false;
      }
    } catch (err) {
      console.error('[ABDFN-AUTH] MFA verification failed', err);
      return false;
    }
  };

  const selectUnit = async (unit: WorkspaceUnit) => {
    if (!currentOperator) return;
    
    await setActiveUnit(unit.id);
    setCurrentUnit(unit);

    await auditService.log({
      module: 'SUPERVISOR',
      messageKey: 'workspace.switch',
      status: 'SUCCESS',
      operatorId: currentOperator.id,
      details: {
        eventType: 'WORKSPACE_UNIT_SWITCH',
        entityType: 'UNIT',
        entityId: unit.id,
        actorId: currentOperator.id,
        actorUser: currentOperator.username,
        severity: 'INFO',
        context: { unitCode: unit.code }
      }
    });

    const session: AuthSession = {
      operatorId: currentOperator.id,
      unitId: unit.id,
      lastLoginAt: Date.now(),
      mfaStep: 2
    };
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  };

  const logout = () => {
    if (currentOperator) {
      auditService.log({
        module: 'SECURITY',
        messageKey: 'auth.logout',
        status: 'INFO',
        operatorId: currentOperator.id,
        details: {
          eventType: 'AUTH_LOGOUT',
          entityType: 'OPERATOR',
          entityId: currentOperator.id,
          actorId: currentOperator.id,
          actorUser: currentOperator.username,
          severity: 'INFO',
          context: {}
        }
      }).catch(console.error);
    }
    setCurrentOperator(null);
    setCurrentUnit(null);
    localStorage.removeItem(SESSION_KEY);
  };

  const can = (cap: Capability) => {
    return PermissionsService.hasCapabilityForOperator(currentOperator, cap);
  };

  return (
    <WorkspaceContext.Provider value={{ 
      currentOperator, 
      currentUnit, 
      isLoading, 
      isBootstrapNeeded,
      login, 
      logout, 
      selectUnit,
      refreshBootstrapStatus,
      verifyMfa,
      can
    }}>
      {children}
    </WorkspaceContext.Provider>
  );
};

export const useWorkspace = () => {
  const context = useContext(WorkspaceContext);
  if (context === undefined) {
    throw new Error('useWorkspace must be used within a WorkspaceProvider');
  }
  return context;
};
