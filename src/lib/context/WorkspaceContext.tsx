'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { Operator, WorkspaceUnit, AuthSession } from '../types/auth.types';
import { coreDb } from '../db/SystemDB';
import { setActiveUnit } from '../db/db';
import { hashPin } from '../utils/crypto.utils';

interface WorkspaceContextType {
  currentOperator: Operator | null;
  currentUnit: WorkspaceUnit | null;
  isLoading: boolean;
  isBootstrapNeeded: boolean;
  login: (pin: string) => Promise<boolean>;
  logout: () => void;
  selectUnit: (unit: WorkspaceUnit) => Promise<void>;
  refreshBootstrapStatus: () => Promise<void>;
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

  const login = async (pin: string): Promise<boolean> => {
    try {
      const pinHash = await hashPin(pin);
      console.log(`[ABDFN-AUTH] Checking PIN Hash: ${pinHash}`);

      // Explicit Dexie query instead of object shortcut
      const operator = await coreDb.operators
        .where('pinHash')
        .equals(pinHash)
        .first();
      
      if (!operator || !operator.isActive) {
        console.warn(`[ABDFN-AUTH] Access denied for PIN hash: ${pinHash}. Found operator: ${!!operator}, Active: ${operator?.isActive}`);
        await coreDb.system_log.add({
          id: crypto.randomUUID(),
          timestamp: Date.now(),
          action: 'AUTH_LOGIN_FAILURE',
          status: 'ERROR',
          details: `Intento de acceso fallido: PIN incorrecto o cuenta inactiva. (Hash: ${pinHash.substring(0, 8)}...)`
        });
        return false;
      }

      setCurrentOperator(operator);

      await coreDb.system_log.add({
        id: crypto.randomUUID(),
        timestamp: Date.now(),
        action: 'AUTH_LOGIN_SUCCESS',
        status: 'SUCCESS',
        details: `Operador [${operator.name}] identificado.`
      });

      // If only one unit, select it automatically
      if (operator.unitIds.length === 1) {
        const unit = await coreDb.units.get(operator.unitIds[0]);
        if (unit) await selectUnit(unit);
      }

      return true;
    } catch (err) {
      console.error('[ABDFN-AUTH] Login failed', err);
      return false;
    }
  };

  const selectUnit = async (unit: WorkspaceUnit) => {
    if (!currentOperator) return;
    
    await setActiveUnit(unit.id);
    setCurrentUnit(unit);

    await coreDb.system_log.add({
      id: crypto.randomUUID(),
      timestamp: Date.now(),
      action: 'WORKSPACE_SWITCH',
      status: 'SUCCESS',
      details: `Cambio a unidad [${unit.code}] por operador [${currentOperator.name}].`
    });

    const session: AuthSession = {
      operatorId: currentOperator.id,
      unitId: unit.id,
      lastLoginAt: Date.now()
    };
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  };

  const logout = () => {
    if (currentOperator) {
      coreDb.system_log.add({
        id: crypto.randomUUID(),
        timestamp: Date.now(),
        action: 'AUTH_LOGOUT',
        status: 'INFO',
        details: `Cierre de sesión: ${currentOperator.name}.`
      }).catch(console.error);
    }
    setCurrentOperator(null);
    setCurrentUnit(null);
    localStorage.removeItem(SESSION_KEY);
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
      refreshBootstrapStatus
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
