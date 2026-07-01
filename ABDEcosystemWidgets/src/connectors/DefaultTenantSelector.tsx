'use client';

/**
 * @purpose Renderiza un `TenantSelectorConnector` con el prop `enableContexts` activado.
 * @purpose_en Renders a `TenantSelectorConnector` with the `enableContexts` prop enabled.
 * @refactorable false
 * @classification UI Component
 * @complexity Low
 * @fingerprint exports:2,imports:1,sig:48ihy8
 * @lastUpdated 2026-06-29T22:22:59.336Z
 */

import { TenantSelectorConnector, type TenantSelectorConnectorProps } from './TenantSelectorConnector.js';

export type DefaultTenantSelectorProps = Omit<TenantSelectorConnectorProps, 'enableContexts'>;

export function DefaultTenantSelector(props: DefaultTenantSelectorProps) {
  return <TenantSelectorConnector {...props} enableContexts />;
}
