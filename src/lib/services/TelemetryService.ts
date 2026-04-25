/**
 * ABDFN Telemetry Service (Phase 10)
 * Aggregates diagnostic data across all departmental units.
 */
import { ABDFNSuiteDB } from '../db/db';
import { coreDb } from '../db/SystemDB';
import { TelemetryConfigService } from './telemetry-config.service';
import { 
  GlobalTelemetrySnapshot, 
  UnitTelemetrySnapshot, 
  TelemetryKpiBucket, 
  TelemetryConfig, 
  TelemetryTimeBucket,
  UnitHealthStatus,
  SecuritySeverity
} from '../types/telemetry.types';

export class TelemetryService {
  private static snapshotCache: GlobalTelemetrySnapshot | null = null;
  private static cacheTimestamp = 0;
  private static readonly CACHE_TTL = 30000; // 30 seconds for industrial stability

  static invalidateCache(): void {
    this.snapshotCache = null;
    this.cacheTimestamp = 0;
  }

  static async getGlobalSnapshot(forceRefresh = false): Promise<GlobalTelemetrySnapshot> {
    const now = Date.now();
    if (!forceRefresh && this.snapshotCache && (now - this.cacheTimestamp < this.CACHE_TTL)) {
      return this.snapshotCache;
    }

    const config = await TelemetryConfigService.loadConfig();
    const units = await coreDb.units.toArray(); 
    
    const unitSnapshots: UnitTelemetrySnapshot[] = [];
    
    // We process units sequentially to minimize IndexedDB resource contention in browser
    for (const u of units) {
      const unitDb = new ABDFNSuiteDB(u.id);
      try {
        await unitDb.open();
        const snap = await this.buildUnitSnapshot(unitDb, u, now, config);
        unitSnapshots.push(snap);
      } catch (err) {
        console.error(`[TELEMETRY] Failed to probe unit ${u.code}:`, err);
      } finally {
        unitDb.close();
      }
    }

    const globalSnapshot = await this.aggregateGlobal(unitSnapshots, now);
    
    this.snapshotCache = globalSnapshot;
    this.cacheTimestamp = now;
    
    return globalSnapshot;
  }

  private static async buildUnitSnapshot(
    db: ABDFNSuiteDB, 
    unit: any, 
    now: number, 
    config: TelemetryConfig
  ): Promise<UnitTelemetrySnapshot> {
    const weekStart = now - (7 * 24 * 60 * 60 * 1000);
    const dayStart = now - (24 * 60 * 60 * 1000);
    const hourStart = now - (60 * 60 * 1000);

    // Fetch relevant history
    const allRecentRecords = await db.audit_history_v6
      .where('timestamp')
      .aboveOrEqual(weekStart)
      .toArray();

    const buckets: TelemetryKpiBucket[] = [
      this.makeEmptyBucket('LAST_HOUR'),
      this.makeEmptyBucket('LAST_24H'),
      this.makeEmptyBucket('LAST_7DAYS')
    ];

    let lastActivityAt: number | null = null;
    let failedLogins = 0;
    let locksTriggered = 0;
    let techModeActivations = 0;
    let samplingChanges24h = 0;

    for (const r of allRecentRecords) {
      const ts = r.timestamp;
      if (!lastActivityAt || ts > lastActivityAt) lastActivityAt = ts;

      // Map record to buckets
      const targets = buckets.filter(b => {
        if (b.bucket === 'LAST_HOUR') return ts >= hourStart;
        if (b.bucket === 'LAST_24H') return ts >= dayStart;
        return true; // Last 7 days
      });

      // Parse details
      try {
        const details = JSON.parse(r.details || '{}');
        
        if (r.module === 'LETTER') {
            for (const b of targets) {
                b.docsProcessed += 1;
                if (details.qaStatus === 'MATCH') b.letterQaLotes.match++;
                if (details.qaStatus === 'BREAK') b.letterQaLotes.break++;
                if (details.qaStatus === 'NOGOLDEN') b.letterQaLotes.noGolden++;
            }
        } else if (r.module === 'AUDIT') {
            for (const b of targets) {
                b.auditsRun += 1;
                if (r.status === 'ERROR') b.auditsWithErrors++;
            }
        } else if (r.module === 'CRYPT') {
            for (const b of targets) {
                if (details.mode === 'encrypt') b.cryptOps.encrypt += (details.success || 0);
                if (details.mode === 'decrypt') b.cryptOps.decrypt += (details.success || 0);
                b.cryptOps.errors += (details.error || 0);
                b.docsProcessed += (details.success || 0);
            }
        } else if (r.action === 'AUTH_FAILED') {
            failedLogins++;
        } else if (r.action === 'PIN_LOCK') {
            locksTriggered++;
        } else if (r.action === 'TECH_MODE_ENTER') {
            techModeActivations++;
        } else if (r.action === 'gaweb.sampling.update') {
            samplingChanges24h++;
        }
      } catch (e) { /* skip malformed logs */ }
    }

    // Storage estimation
    let storageDetails: { 
      estimatedUsageBytes: number | null; 
      estimatedQuotaBytes: number | null; 
      usagePercent: number | null; 
    } = { estimatedUsageBytes: null, estimatedQuotaBytes: null, usagePercent: null };
    if (typeof navigator !== 'undefined' && navigator.storage?.estimate) {
        const est = await navigator.storage.estimate();
        if (est.usage && est.quota) {
            storageDetails = {
                estimatedUsageBytes: est.usage,
                estimatedQuotaBytes: est.quota,
                usagePercent: (est.usage / est.quota) * 100
            };
        }
    }

    // QA Stats
    const mappingsCount = await db.lettermappings_v6.count();
    const goldenCount = await db.golden_tests_v6.count(); // Approximation

    const qaStats = {
      mappingsWithGolden: goldenCount,
      mappingsWithoutGolden: Math.max(0, mappingsCount - goldenCount),
      recentBreaks: buckets.find(b => b.bucket === 'LAST_24H')?.letterQaLotes.break ?? 0
    };

    const health = this.computeHealth(buckets, qaStats, config.health);
    const securitySeverity = this.computeSecuritySeverity(failedLogins, locksTriggered, techModeActivations, config.security);

    return {
      unitId: unit.id,
      unitCode: unit.code,
      unitName: unit.name,
      health,
      lastActivityAt,
      kpiBuckets: buckets,
      security: {
        failedLogins,
        techModeActivations,
        locksTriggered,
        samplingChanges24h,
        severity: securitySeverity
      },
      qa: qaStats,
      storage: storageDetails
    };
  }

  private static makeEmptyBucket(bucket: TelemetryTimeBucket): TelemetryKpiBucket {
    return {
      bucket,
      docsProcessed: 0,
      auditsRun: 0,
      auditsWithErrors: 0,
      letterQaLotes: { match: 0, break: 0, noGolden: 0 },
      cryptOps: { encrypt: 0, decrypt: 0, errors: 0 }
    };
  }

  private static computeHealth(buckets: TelemetryKpiBucket[], qa: any, cfg: any): UnitHealthStatus {
    const last24 = buckets.find(b => b.bucket === 'LAST_24H')!;
    const errorRatio = last24.auditsRun >= cfg.minAuditsForRatio ? last24.auditsWithErrors / last24.auditsRun : 0;

    if (qa.recentBreaks >= cfg.qaBreaksCritical || errorRatio >= cfg.criticalErrorRatio) return 'CRITICAL';
    if (qa.recentBreaks >= cfg.qaBreaksWarn || errorRatio >= cfg.warnErrorRatio) return 'WARN';
    return 'OK';
  }

  private static computeSecuritySeverity(failed: number, locks: number, tech: number, cfg: any): SecuritySeverity {
    if (failed >= cfg.failedLoginsCritical || locks >= cfg.locksCritical) return 'CRITICAL';
    if (failed >= cfg.failedLoginsWarn || locks >= cfg.locksWarn) return 'WARN';
    return 'OK';
  }

  private static async aggregateGlobal(units: UnitTelemetrySnapshot[], now: number): Promise<GlobalTelemetrySnapshot> {
    const totals = {
      totalUnits: units.length,
      totalDocs24h: 0,
      totalAudits24h: 0,
      totalQaBreaks24h: 0,
      letterQaLotes: { match: 0, break: 0, noGolden: 0 },
      cryptOps: { encrypt: 0, decrypt: 0, errors: 0 }
    };

    let totalFailed = 0;
    let totalLocks = 0;
    let totalTech = 0;
    let totalSamplingChanges = 0;

    for (const u of units) {
       const b24 = u.kpiBuckets.find(b => b.bucket === 'LAST_24H')!;
       totals.totalDocs24h += b24.docsProcessed;
       totals.totalAudits24h += b24.auditsRun;
       totals.totalQaBreaks24h += b24.letterQaLotes.break;
       
       totals.letterQaLotes.match += b24.letterQaLotes.match;
       totals.letterQaLotes.break += b24.letterQaLotes.break;
       totals.letterQaLotes.noGolden += b24.letterQaLotes.noGolden;

       totals.cryptOps.encrypt += b24.cryptOps.encrypt;
       totals.cryptOps.decrypt += b24.cryptOps.decrypt;
       totals.cryptOps.errors += b24.cryptOps.errors;

       totalFailed += u.security.failedLogins;
       totalLocks += u.security.locksTriggered;
       totalTech += u.security.techModeActivations;
       totalSamplingChanges += u.security.samplingChanges24h;
    }

    // Governance Aggregation (Phase 12.1)
    const dayStart = now - (24 * 60 * 60 * 1000);
    const systemEvents = await coreDb.table('system_log')
      .where('timestamp')
      .aboveOrEqual(dayStart)
      .toArray();

    let operatorRoleChanges24h = 0;
    let operatorOverrideChanges24h = 0;
    let configChanges24h = 0;

    for (const r of systemEvents) {
      try {
        const details = JSON.parse(r.details || '{}');
        const ev = details.eventType as string;

        if (ev === 'OPERATOR_ROLE_CHANGE') operatorRoleChanges24h++;
        if (ev === 'OPERATOR_CAPABILITY_OVERRIDE') operatorOverrideChanges24h++;
        if (
          ev === 'TELEMETRY_CONFIG_UPDATE' ||
          ev === 'ETL_CONFIG_UPDATE' || 
          ev === 'LETTER_CONFIG_UPDATE' ||
          ev === 'CRYPT_CONFIG_UPDATE'
        ) {
          configChanges24h++;
        }
      } catch { /* skip malformed */ }
    }

    return {
      generatedAt: now,
      suiteVersion: 'ASEPTIC v6.0-IND ERA 6',
      units,
      globalTotals: totals,
      security: {
        totalFailedLogins: totalFailed,
        totalLocksTriggered: totalLocks,
        totalTechModeActivations: totalTech,
        samplingChanges24h: totalSamplingChanges
      },
      governance: {
        operatorRoleChanges24h,
        operatorOverrideChanges24h,
        configChanges24h
      }
    };
  }
}
