/**
 * ABDFN Unified Suite - Telemetry & Supervision Types (Phase 10)
 * Defines the industrial data contract for cross-unit monitoring.
 */

export type TelemetryTimeBucket = 'LAST_HOUR' | 'LAST_24H' | 'LAST_7DAYS';

export interface TelemetryKpiBucket {
  bucket: TelemetryTimeBucket;
  docsProcessed: number;
  auditsRun: number;
  auditsWithErrors: number;
  letterQaLotes: {
    match: number;
    break: number;
    noGolden: number;
  };
  cryptOps: {
    encrypt: number;
    decrypt: number;
    errors: number;
  };
}

export type UnitHealthStatus = 'OK' | 'WARN' | 'CRITICAL';
export type SecuritySeverity = 'OK' | 'WARN' | 'CRITICAL';

export interface UnitTelemetrySnapshot {
  unitId: string;
  unitCode: string;
  unitName: string;

  health: UnitHealthStatus;
  lastActivityAt: number | null;

  kpiBuckets: TelemetryKpiBucket[];

  security: {
    failedLogins: number;
    techModeActivations: number;
    locksTriggered: number;
    severity: SecuritySeverity;
  };

  qa: {
    mappingsWithGolden: number;
    mappingsWithoutGolden: number;
    recentBreaks: number; // e.g. BREAK en última 24h
  };

  storage: {
    estimatedUsageBytes: number | null;
    estimatedQuotaBytes: number | null;
    usagePercent: number | null;
  };
}

export interface GlobalTelemetrySnapshot {
  generatedAt: number;
  suiteVersion: string; // "ASEPTIC v6.0-IND ERA 6"

  units: UnitTelemetrySnapshot[];

  globalTotals: {
    totalUnits: number;
    totalDocs24h: number;
    totalAudits24h: number;
    totalQaBreaks24h: number;
    letterQaLotes: {
      match: number;
      break: number;
      noGolden: number;
    };
    cryptOps: {
      encrypt: number;
      decrypt: number;
      errors: number;
    };
  };

  security: {
    totalFailedLogins: number;
    totalLocksTriggered: number;
    totalTechModeActivations: number;
  };

  governance: {
    operatorRoleChanges24h: number;
    operatorOverrideChanges24h: number;
    configChanges24h: number;
  };
}

export interface TelemetryHealthConfig {
  minAuditsForRatio: number;
  warnErrorRatio: number;
  criticalErrorRatio: number;
  qaBreaksWarn: number;
  qaBreaksCritical: number;
}

export interface SecurityThresholds {
  failedAuthLow: number;      // debajo de este, OK
  failedAuthHigh: number;     // a partir de este, ALERTA
  rbacChangesAttention: number; // cambios RBAC/día a partir de los cuales avisar
  dataOpsErrorAttention: number; // nº de errores de dump/sync en ventana
  inactivityLocksHigh: number;
}

export interface MappingThresholds {
  minCoverage: number; // 0.0 - 1.0 (eg. 1.0 = 100% required)
}

export interface UiFeaturesConfig {
  letterWizardEnabled: boolean;
  mappingMobileLayoutEnabled: boolean;
}

export interface AuditSamplingSettings {
  enabled: boolean;
  maxPerType: number; // Maximum errors to preview per type (sampling)
}

export interface TelemetrySecurityConfig {
  failedLoginsWarn: number;
  failedLoginsCritical: number;
  locksWarn: number;
  locksCritical: number;
  techModeWarn: number;
  techModeCritical: number;
  maxPinAttempts: number;
  pinCooldownMinutes: number;
  maxMfaAttempts: number;
  mfaCooldownMinutes: number;
  sessionInactivityTimeoutMinutes: number;
  sessionMaxAgeMinutes: number;
  sessionWarningThresholdMinutes: number; // minutes before expiry to show warning
  securityThresholds: SecurityThresholds;
  mappingThresholds: MappingThresholds;
  uiFeatures: UiFeaturesConfig;
  auditSampling: AuditSamplingSettings;
}

export interface TelemetryConfig {
  health: TelemetryHealthConfig;
  security: TelemetrySecurityConfig;
  corporate: {
    logoBase64?: string;
    plantName: string;
  };
}
