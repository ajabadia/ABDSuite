/**
 * Telemetry Configuration Service (Phase 10)
 * Manages industrial thresholds and corporate identity for the supervision suite.
 */
import { coreDb } from '../db/SystemDB';
import { TelemetryConfig, TelemetryHealthConfig, TelemetrySecurityConfig, AuditSamplingSettings } from '../types/telemetry.types';

const HEALTH_DEFAULTS: TelemetryHealthConfig = {
  minAuditsForRatio: 10,
  warnErrorRatio: 0.1,
  criticalErrorRatio: 0.5,
  qaBreaksWarn: 1,
  qaBreaksCritical: 2,
};

const MAPPING_DEFAULTS = {
  minCoverage: 1.0, 
};

const SAMPLING_DEFAULTS: AuditSamplingSettings = {
  enabled: true,
  maxPerType: 10
};

const SECURITY_DEFAULTS: TelemetrySecurityConfig = {
  failedLoginsWarn: 5,
  failedLoginsCritical: 15,
  locksWarn: 1,
  locksCritical: 2,
  techModeWarn: 1,
  techModeCritical: 2,
  maxPinAttempts: 5,
  pinCooldownMinutes: 15,
  maxMfaAttempts: 5,
  mfaCooldownMinutes: 15,
  sessionInactivityTimeoutMinutes: 15,
  sessionMaxAgeMinutes: 480, // 8 hours
  sessionWarningThresholdMinutes: 2, 
  auditSampling: SAMPLING_DEFAULTS,
  securityThresholds: {
    failedAuthLow: 5,
    failedAuthHigh: 20,
    rbacChangesAttention: 2,
    dataOpsErrorAttention: 1,
    inactivityLocksHigh: 20,
  },
  uiFeatures: {
    letterWizardEnabled: true,
    mappingMobileLayoutEnabled: true,
  },
  mappingThresholds: MAPPING_DEFAULTS,
};

const CORPORATE_DEFAULTS = {
  plantName: 'CENTRO INDUSTRIAL ABD'
};

import { auditService } from './AuditService';

export class TelemetryConfigService {
  static async loadConfig(): Promise<TelemetryConfig> {
    const row = await coreDb.coreSettings.get('GLOBAL_SETTINGS');
    
    return {
      health: {
        minAuditsForRatio: row?.telemetryHealth?.minAuditsForRatio ?? HEALTH_DEFAULTS.minAuditsForRatio,
        warnErrorRatio: row?.telemetryHealth?.warnErrorRatio ?? HEALTH_DEFAULTS.warnErrorRatio,
        criticalErrorRatio: row?.telemetryHealth?.criticalErrorRatio ?? HEALTH_DEFAULTS.criticalErrorRatio,
        qaBreaksWarn: row?.telemetryHealth?.qaBreaksWarn ?? HEALTH_DEFAULTS.qaBreaksWarn,
        qaBreaksCritical: row?.telemetryHealth?.qaBreaksCritical ?? HEALTH_DEFAULTS.qaBreaksCritical,
      },
      security: {
        failedLoginsWarn: row?.telemetrySecurity?.failedLoginsWarn ?? SECURITY_DEFAULTS.failedLoginsWarn,
        failedLoginsCritical: row?.telemetrySecurity?.failedLoginsCritical ?? SECURITY_DEFAULTS.failedLoginsCritical,
        locksWarn: row?.telemetrySecurity?.locksWarn ?? SECURITY_DEFAULTS.locksWarn,
        locksCritical: row?.telemetrySecurity?.locksCritical ?? SECURITY_DEFAULTS.locksCritical,
        techModeWarn: row?.telemetrySecurity?.techModeWarn ?? SECURITY_DEFAULTS.techModeWarn,
        techModeCritical: row?.telemetrySecurity?.techModeCritical ?? SECURITY_DEFAULTS.techModeCritical,
        maxPinAttempts: row?.telemetrySecurity?.maxPinAttempts ?? SECURITY_DEFAULTS.maxPinAttempts,
        pinCooldownMinutes: row?.telemetrySecurity?.pinCooldownMinutes ?? SECURITY_DEFAULTS.pinCooldownMinutes,
        maxMfaAttempts: row?.telemetrySecurity?.maxMfaAttempts ?? SECURITY_DEFAULTS.maxMfaAttempts,
        mfaCooldownMinutes: row?.telemetrySecurity?.mfaCooldownMinutes ?? SECURITY_DEFAULTS.mfaCooldownMinutes,
        sessionInactivityTimeoutMinutes: row?.telemetrySecurity?.sessionInactivityTimeoutMinutes ?? SECURITY_DEFAULTS.sessionInactivityTimeoutMinutes,
        sessionMaxAgeMinutes: row?.telemetrySecurity?.sessionMaxAgeMinutes ?? SECURITY_DEFAULTS.sessionMaxAgeMinutes,
        sessionWarningThresholdMinutes: row?.telemetrySecurity?.sessionWarningThresholdMinutes ?? SECURITY_DEFAULTS.sessionWarningThresholdMinutes,
        securityThresholds: {
          failedAuthLow: row?.telemetrySecurity?.securityThresholds?.failedAuthLow ?? SECURITY_DEFAULTS.securityThresholds.failedAuthLow,
          failedAuthHigh: row?.telemetrySecurity?.securityThresholds?.failedAuthHigh ?? SECURITY_DEFAULTS.securityThresholds.failedAuthHigh,
          rbacChangesAttention: row?.telemetrySecurity?.securityThresholds?.rbacChangesAttention ?? SECURITY_DEFAULTS.securityThresholds.rbacChangesAttention,
          dataOpsErrorAttention: row?.telemetrySecurity?.securityThresholds?.dataOpsErrorAttention ?? SECURITY_DEFAULTS.securityThresholds.dataOpsErrorAttention,
          inactivityLocksHigh: row?.telemetrySecurity?.securityThresholds?.inactivityLocksHigh ?? SECURITY_DEFAULTS.securityThresholds.inactivityLocksHigh,
        },
        uiFeatures: {
          letterWizardEnabled: row?.telemetrySecurity?.uiFeatures?.letterWizardEnabled ?? SECURITY_DEFAULTS.uiFeatures.letterWizardEnabled,
          mappingMobileLayoutEnabled: row?.telemetrySecurity?.uiFeatures?.mappingMobileLayoutEnabled ?? SECURITY_DEFAULTS.uiFeatures.mappingMobileLayoutEnabled,
        },
        mappingThresholds: {
          minCoverage: row?.telemetrySecurity?.mappingThresholds?.minCoverage ?? SECURITY_DEFAULTS.mappingThresholds.minCoverage,
        },
        auditSampling: {
          enabled: row?.telemetrySecurity?.auditSampling?.enabled ?? SAMPLING_DEFAULTS.enabled,
          maxPerType: row?.telemetrySecurity?.auditSampling?.maxPerType ?? SAMPLING_DEFAULTS.maxPerType,
        }
      },
      corporate: {
        logoBase64: row?.corporate?.logoBase64,
        plantName: row?.corporate?.plantName ?? CORPORATE_DEFAULTS.plantName,
      }
    };
  }

  static async saveConfig(partial: Partial<TelemetryConfig>, performedBy?: string): Promise<void> {
    const existing = await coreDb.coreSettings.get('GLOBAL_SETTINGS');
    
    const next = {
      id: 'GLOBAL_SETTINGS',
      telemetryHealth: { ...existing?.telemetryHealth, ...partial.health },
      telemetrySecurity: { ...existing?.telemetrySecurity, ...partial.security },
      corporate: { ...existing?.corporate, ...partial.corporate }
    };

    await coreDb.coreSettings.put(next);

    // Audit Config Change
    await auditService.log({
      module: 'SUPERVISOR',
      messageKey: 'telemetry.config.update',
      status: 'WARNING',
      operatorId: performedBy,
      details: {
        eventType: 'TELEMETRY_CONFIG_UPDATE',
        entityType: 'TELEMETRY_CONFIG',
        entityId: 'GLOBAL',
        actorId: performedBy,
        severity: 'WARN',
        context: {
          updatedGroups: Object.keys(partial).join(', ')
        }
      }
    });
  }

  static async resetToDefaults(): Promise<void> {
    await coreDb.coreSettings.put({
      id: 'GLOBAL_SETTINGS',
      telemetryHealth: HEALTH_DEFAULTS,
      telemetrySecurity: { ...SECURITY_DEFAULTS, auditSampling: SAMPLING_DEFAULTS },
      corporate: CORPORATE_DEFAULTS
    });
  }
}
