/**
 * @purpose Gestiona banderas de características para ABDEcosystemWidgets, permitiendo la configuración en tiempo de ejecución de los ajustes globales.
 * @purpose_en Manages feature flags for ABDEcosystemWidgets, allowing runtime configuration of global settings.
 * @refactorable false
 * @classification Type Definition
 * @complexity Low
 * @fingerprint exports:2,imports:0,sig:14bum57
 * @lastUpdated 2026-06-23T23:02:41.210Z
 */

// Feature flag configuration for ABDEcosystemWidgets
type FeatureFlags = {
  /** Enables live telemetry mode globally. Set to false to disable across all apps. */
  liveModeEnabled: boolean;
};

const _flags: FeatureFlags = {
  liveModeEnabled: true,
};

/**
 * Global feature flags for ABDEcosystemWidgets.
 * Consumers can override at runtime via {@link configureFeatureFlags}.
 */
export const featureFlags: Readonly<FeatureFlags> = _flags;

/**
 * Override one or more feature flags at runtime.
 * Call this during app initialisation before mounting widgets.
 *
 * @example
 * ```ts
 * import { configureFeatureFlags } from '@ajabadia/ecosystem-widgets';
 * configureFeatureFlags({ liveModeEnabled: false });
 * ```
 */
export function configureFeatureFlags(overrides: Partial<FeatureFlags>): void {
  Object.assign(_flags, overrides);
}

