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
import { CryptoService } from '../services/crypto.service';
import { EncryptedFieldContainer } from '../types/crypto.types';

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
  isLocked: boolean;
  lockSession: () => void;
  unlockSession: (pin: string) => Promise<boolean>;
  refreshActivity: () => void;
  requireFreshAuth: (level: 1 | 2, cap?: Capability) => boolean;
  requestStepUp: (level: 1 | 2) => Promise<boolean>;
  isStepUpDialogOpen: boolean;
  setIsStepUpDialogOpen: (open: boolean) => void;
  pendingStepUpLevel: number;
  installationKey: CryptoKey | null;
  unlockIK: (pin: string) => Promise<boolean>;
  isVaultChallengeOpen: boolean;
  setIsVaultChallengeOpen: (open: boolean) => void;
}

const WorkspaceContext = createContext<WorkspaceContextType | undefined>(undefined);

const SESSION_KEY = 'abdfn_active_session';

export const WorkspaceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentOperator, setCurrentOperator] = useState<Operator | null>(null);
  const [currentUnit, setCurrentUnit] = useState<WorkspaceUnit | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isBootstrapNeeded, setIsBootstrapNeeded] = useState(false);
  const [isLocked, setIsLocked] = useState(false);
  const [lastActivityAt, setLastActivityAt] = useState(Date.now());
  const [installationKey, setInstallationKey] = useState<CryptoKey | null>(null);
  const [isStepUpDialogOpen, setIsStepUpDialogOpen] = useState(false);
  const [pendingStepUpLevel, setPendingStepUpLevel] = useState<number>(1);
  const [stepUpResolver, setStepUpResolver] = useState<((val: boolean) => void) | null>(null);
  const [isVaultChallengeOpen, setIsVaultChallengeOpen] = useState(false);

  // Link DBs to the local IK state
  useEffect(() => {
    coreDb.setKeyProvider(() => installationKey);
    // Explicitly import to avoid circular dependency issues if any
    import('../db/db').then(m => {
        m.ABDFNSuiteDB.setKeyProvider(() => installationKey);
    });
  }, [installationKey]);

  // Initial Sync
  useEffect(() => {
    const init = async () => {
      try {
        const unitsCount = await coreDb.units.count();
        const operatorsCount = await coreDb.operators.count();
        const settings = await coreDb.coreSettings.get('global');
        const hasIK = !!settings?.encryptedInstallationKey;

        if (unitsCount === 0 || operatorsCount === 0 || !hasIK) {
          if (operatorsCount > 0 && !hasIK) {
            console.warn('[ABDFN-SECURITY] Operators found but no Installation Key (IK) present. Forcing re-bootstrap for Phase 14 stability.');
          }
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

            // Validar expiración absoluta
            const now = Date.now();
            if (session.expiresAt && now > session.expiresAt) {
              console.warn('[ABDFN-WORKSPACE] Session expired absolutely');
              localStorage.removeItem(SESSION_KEY);
              setIsLoading(false);
              return;
            }

            // Validar inactividad estricta ante recarga (ej. si pasó más de timeout mientras estaba cerrado)
            const config = await TelemetryConfigService.loadConfig();
            const timeoutMs = (config.security.sessionInactivityTimeoutMinutes ?? 15) * 60000;
            if (now - session.lastActivityAt > timeoutMs) {
               console.warn('[ABDFN-WORKSPACE] Session inactive for too long on reload');
               localStorage.removeItem(SESSION_KEY);
               setIsLoading(false);
               return;
            }

            if (unit) await setActiveUnit(unit.id);
            setCurrentOperator(operator || null);
            setCurrentUnit(unit || null);
            setLastActivityAt(Date.now());
          } else {
            localStorage.removeItem(SESSION_KEY);
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
    const settings = await coreDb.coreSettings.get('global');
    const hasIK = !!settings?.encryptedInstallationKey;
    
    setIsBootstrapNeeded(unitsCount === 0 || operatorsCount === 0 || !hasIK);
  };

  const login = async (pin: string): Promise<{ success: boolean; mfaRequired: boolean }> => {
    try {
      const config = await TelemetryConfigService.loadConfig();
      const maxPinAttempts = config.security.maxPinAttempts ?? 5;
      const sessionMaxAge = config.security.sessionMaxAgeMinutes ?? 480;

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

      // --- PHASE 14: AUTO-UNLOCK IK ON ADMIN LOGIN ---
      if (operator.role === 'ADMIN') {
        const success = await unlockIK(pin);
        if (!success) {
          console.error('[ABDFN-SECURITY] Failed to unlock IK during admin login.');
          // In an ultra-strict environment we might abort, 
          // but for now we log and continue (legacy data will still work).
        }
      }
      // --- END PHASE 14 ---
      
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
      } else {
        // Create skeleton session for unit selection phase
        const now = Date.now();
        const session: AuthSession = {
           operatorId: operator.id,
           unitId: '', // Pending
           lastLoginAt: now,
           lastActivityAt: now,
           expiresAt: now + (sessionMaxAge * 60000),
           mfaVerifiedAt: null,
           mfaStep: 1,
           authLevel: 1
        };
        localStorage.setItem(SESSION_KEY, JSON.stringify(session));
      }

      return { success: true, mfaRequired: false };
    } catch (err) {
      console.error('[ABDFN-AUTH] Login failed', err);
      return { success: false, mfaRequired: false };
    }
  };

  const verifyMfa = async (token: string): Promise<boolean> => {
    if (!currentOperator) return false;

    try {
      // 1. Get secret (either from operator or enrollment temporary state)
      // Note: If we are in Step-Up and it's a new enrollment, the secret might be temporary.
      // But for simplicity in Phase 15.4, we assume the secret is already in the operator or we've just set it.
      if (!currentOperator.mfaSecret) {
         console.error('[ABDFN-MFA] Verification attempted without secret container.');
         return false;
      }

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
        // Log Audit
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
            context: { method: 'TOTP', flow: isStepUpDialogOpen ? 'STEP_UP' : 'LOGIN' }
          }
        });

        // Update Operator state in DB if it was an enrollment
        if (!currentOperator.mfaEnabled) {
           await coreDb.operators.update(currentOperator.id, {
             mfaEnabled: true,
             mfaVerifiedAt: now
           });
           setCurrentOperator({ ...currentOperator, mfaEnabled: true });
        }

        await coreDb.operators.update(currentOperator.id, { 
          lastLogin: Date.now(),
          failedMfaAttempts: 0,
          mfaLockedUntil: 0
        });

        // Update Session in localStorage
        const saved = localStorage.getItem(SESSION_KEY);
        if (saved) {
           const session: AuthSession = JSON.parse(saved);
           session.mfaVerifiedAt = now;
           session.authLevel = Math.max(session.authLevel, isStepUpDialogOpen ? (pendingStepUpLevel as 1 | 2) : 2) as (1 | 2);
           localStorage.setItem(SESSION_KEY, JSON.stringify(session));
        }

        if (!isStepUpDialogOpen && currentOperator.unitIds.length === 1) {
          const unit = await coreDb.units.get(currentOperator.unitIds[0]);
          if (unit) await selectUnit(unit);
        }

        // Resolve pending step-up if active
        if (stepUpResolver) {
           stepUpResolver(true);
           setStepUpResolver(null);
           setIsStepUpDialogOpen(false);
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

    const config = await TelemetryConfigService.loadConfig();
    const sessionMaxAge = config.security.sessionMaxAgeMinutes ?? 480;
    const now = Date.now();

    const session: AuthSession = {
      operatorId: currentOperator.id,
      unitId: unit.id,
      lastLoginAt: now,
      lastActivityAt: now,
      expiresAt: now + (sessionMaxAge * 60000),
      mfaVerifiedAt: currentOperator.mfaEnabled ? now : null,
      mfaStep: 2,
      authLevel: currentOperator.mfaEnabled ? 2 : 1
    };
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    setIsLocked(false);
    setLastActivityAt(now);
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

  const lockSession = () => {
    if (!currentOperator) return;
    setIsLocked(true);
    auditService.log({
      module: 'SECURITY',
      messageKey: 'auth.session.lock',
      status: 'INFO',
      operatorId: currentOperator.id,
      details: { 
        eventType: 'AUTHSESSIONLOCK', 
        entityType: 'OPERATOR', 
        actorId: currentOperator.id,
        context: { reason: 'manual' }
      }
    });
  };

  const unlockSession = async (pin: string): Promise<boolean> => {
    if (!currentOperator) return false;
    const pinHash = await hashPin(pin);
    if (currentOperator.pinHash === pinHash) {
      setIsLocked(false);
      refreshActivity();
      auditService.log({
        module: 'SECURITY',
        messageKey: 'auth.session.unlock',
        status: 'SUCCESS',
        operatorId: currentOperator.id,
        details: { 
          eventType: 'AUTHSESSIONUNLOCK', 
          entityType: 'OPERATOR', 
          actorId: currentOperator.id 
        }
      });
      return true;
    }
    return false;
  };

  const refreshActivity = () => {
    if (isLocked) return;
    const now = Date.now();
    setLastActivityAt(now);
    
    // Persistir actividad en disco para validación post-recarga
    const saved = localStorage.getItem(SESSION_KEY);
    if (saved) {
      const session: AuthSession = JSON.parse(saved);
      session.lastActivityAt = now;
      localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    }
  };

  const unlockIK = async (pin: string): Promise<boolean> => {
    if (!pin) return false;
    try {
      const cleanPin = pin.trim();

      // 1. Get encrypted IK from core settings
      const settings = await coreDb.coreSettings.get('global');
      if (!settings || !settings.encryptedInstallationKey) {
        console.warn('[ABDFN-SECURITY] No encrypted IK found in coreSettings');
        return false;
      }

      // 2. Decode the master salt from Base64
      const masterSalt = settings.masterSalt 
        ? CryptoService.fromBase64(settings.masterSalt)
        : new TextEncoder().encode('ABDFN_ROOT_SALT_V6');

      // 3. Derive Master Key from PIN
      const masterKey = await CryptoService.deriveMasterKeyFromPin(cleanPin, masterSalt);

      // 4. Decrypt the IK container
      const container = settings.encryptedInstallationKey as EncryptedFieldContainer;
      
      // Industrial Fallback (Phase 18.5): Absolute Recovery Strategy
      // We brute-force all plausible AAD permutations to recover from past schema evolutions.
      const candidates = CryptoService.getAADPermutations('ABDFN_CORE', null, 'coreSettings', 'global', 'encryptedInstallationKey');
      
      let ikBytes: Uint8Array | null = null;
      let lastErr: any = null;

      for (const candidate of candidates) {
        try {
          ikBytes = await CryptoService.decryptField(container, masterKey, candidate.bytes);
          console.warn(`[ABDFN-SECURITY] Vault recovered via AAD permutation: ${candidate.label}`);
          break; // Success!
        } catch (err: any) {
          lastErr = err;
          continue; // Try next candidate
        }
      }

      if (!ikBytes) {
        throw lastErr || new Error('All AAD recovery candidates failed.');
      }

      // 5. Import the bytes as the actual CryptoKey for the session
      const ik = await crypto.subtle.importKey(
        'raw',
        ikBytes.buffer as ArrayBuffer,
        { name: 'AES-GCM' },
        true,
        ['encrypt', 'decrypt']
      );

      setInstallationKey(ik);
      console.info('[ABDFN-SECURITY] Installation Key UNLOCKED and loaded to memory.');
      return true;
    } catch (err) {
      console.error('[ABDFN-SECURITY] Failed to unlock IK', err);
      return false;
    }
  };

  const requireFreshAuth = (level: 1 | 2, cap?: Capability): boolean => {
    if (!currentOperator) return false;
    
    const saved = localStorage.getItem(SESSION_KEY);
    if (!saved) return false;
    const session: AuthSession = JSON.parse(saved);

    // Si pedimos Nivel 2 y solo tenemos Nivel 1, rechazar
    if (level === 2 && session.authLevel < 2) return false;

    const now = Date.now();
    
    // Verificación de frescura (Nivel 2: MFA debe ser reciente - ej. < 1h)
    if (level === 2 && session.mfaVerifiedAt) {
      const mfaAge = (now - session.mfaVerifiedAt) / 60000;
      if (mfaAge > 60) return false; // Hardcoded 1h for now, can be configured
    }

    // Verificación de inactividad de seguridad (Auth Level Freshness)
    const activityAge = (now - session.lastActivityAt) / 60000;
    if (activityAge > 15) return false;

    return true; 
  };

  const requestStepUp = async (level: 1 | 2): Promise<boolean> => {
    if (requireFreshAuth(level)) return true;
    
    // If we reach here, we need to show the step-up UI
    setPendingStepUpLevel(level);
    setIsStepUpDialogOpen(true);
    
    return new Promise((resolve) => {
      setStepUpResolver(() => resolve);
    });
  };

  // Heartbeat & Inactivity Watcher (Phase 13.1)
  useEffect(() => {
    if (!currentOperator || isLocked) return;

    const controller = new AbortController();
    const refresh = () => refreshActivity();

    window.addEventListener('mousemove', refresh, { signal: controller.signal });
    window.addEventListener('keydown', refresh, { signal: controller.signal });
    window.addEventListener('visibilitychange', refresh, { signal: controller.signal });

    const interval = setInterval(async () => {
      const config = await TelemetryConfigService.loadConfig();
      const timeoutMs = (config.security.sessionInactivityTimeoutMinutes ?? 15) * 60000;
      const now = Date.now();

      if (!isLocked && now - lastActivityAt > timeoutMs) {
        console.warn('[ABDFN-SECURITY] Inactivity timeout reached');
        setIsLocked(true);
        auditService.log({
          module: 'SECURITY',
          messageKey: 'auth.session.lock',
          status: 'INFO',
          operatorId: currentOperator.id,
          details: { 
            eventType: 'AUTHSESSIONLOCK', 
            entityType: 'OPERATOR', 
            actorId: currentOperator.id,
            context: { reason: 'inactivity' }
          }
        });
      }
    }, 30000); // Check every 30s

    return () => {
      controller.abort();
      clearInterval(interval);
    };
  }, [currentOperator, isLocked, lastActivityAt]);

  return (
    <WorkspaceContext.Provider value={{ 
      currentOperator, 
      currentUnit, 
      isLoading, 
      isBootstrapNeeded,
      isLocked,
      login, 
      logout, 
      selectUnit,
      refreshBootstrapStatus,
      verifyMfa,
      can,
      lockSession,
      unlockSession,
      refreshActivity,
      requireFreshAuth,
      requestStepUp,
      isStepUpDialogOpen,
      setIsStepUpDialogOpen,
      pendingStepUpLevel,
      installationKey,
      unlockIK,
      isVaultChallengeOpen,
      setIsVaultChallengeOpen
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
