'use client';

/**
 * @purpose Gestiona el estado y contexto para la vista del menú mega de inquilino, facilitando la comunicación entre SmartNavbar y TenantSelectorConnector.
 * @purpose_en Manages the state and context for the tenant mega-menu view-mode, facilitating communication between SmartNavbar and TenantSelectorConnector.
 * @refactorable false
 * @classification Context/Provider
 * @complexity Low
 * @fingerprint exports:3,imports:1,sig:1rmcq2z
 * @lastUpdated 2026-06-23T23:01:30.202Z
 */

/**
 * React Context to communicate mega‑menu view‑mode from SmartNavbar
 * to TenantSelectorConnector — avoiding React.cloneElement which
 * fails with server‑to‑client boundary elements in React 19.
 */
import { createContext, useContext } from 'react';

export interface TenantMegaMenuValue {
  variant: 'dropdown' | 'trigger' | 'content';
  isOpen: boolean;
}

const TenantMegaMenuContext = createContext<TenantMegaMenuValue | null>(null);

export const TenantMegaMenuProvider = TenantMegaMenuContext.Provider;

export function useTenantMegaMenu(): TenantMegaMenuValue | null {
  return useContext(TenantMegaMenuContext);
}
