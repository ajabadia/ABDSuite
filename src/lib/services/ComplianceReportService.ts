/**
 * Compliance Report Service (Phase 10)
 * Generates audit master reports in industrial formats (CSV/PDF).
 */
import { GlobalTelemetrySnapshot, TelemetryConfig } from '../types/telemetry.types';
import { TelemetryConfigService } from './telemetry-config.service';

export class ComplianceReportService {
  /**
   * Generates a Master Audit CSV report containing all unit KPIs.
   */
  static async generateGlobalCsv(snapshot: GlobalTelemetrySnapshot): Promise<Blob> {
    const config = await TelemetryConfigService.loadConfig();
    const rows: string[] = [];

    // Header Industrial
    rows.push(`ABDFN SUITE - MASTER AUDIT REPORT`);
    rows.push(`PLANT:;${config.corporate.plantName}`);
    rows.push(`DATE:;${new Date(snapshot.generatedAt).toISOString()}`);
    rows.push(`SUITE_VERSION:;${snapshot.suiteVersion}`);
    rows.push(``);

    // Global Totals
    rows.push(`GLOBAL METRICS (LAST 24H)`);
    rows.push(`Total Units:;${snapshot.globalTotals.totalUnits}`);
    rows.push(`Total Docs:;${snapshot.globalTotals.totalDocs24h}`);
    rows.push(`Total Audits:;${snapshot.globalTotals.totalAudits24h}`);
    rows.push(`Total QA Breaks:;${snapshot.globalTotals.totalQaBreaks24h}`);
    rows.push(``);

    // Unit Detail
    rows.push(`UNIT DETAIL`);
    rows.push(`UNIT_CODE;HEALTH;LAST_ACTIVITY;DOCS_24H;AUDITS_24H;QA_MATCH;QA_BREAK;QA_NOGOLDEN;SEC_FAIL;SEC_LOCK;SEC_TECH`);

    for (const u of snapshot.units) {
      const b24 = u.kpiBuckets.find(b => b.bucket === 'LAST_24H')!;
      const row = [
        u.unitCode,
        u.health,
        u.lastActivityAt ? new Date(u.lastActivityAt).toISOString() : '---',
        b24.docsProcessed,
        b24.auditsRun,
        b24.letterQaLotes.match,
        b24.letterQaLotes.break,
        b24.letterQaLotes.noGolden,
        u.security.failedLogins,
        u.security.locksTriggered,
        u.security.techModeActivations
      ];
      rows.push(row.join(';'));
    }

    const content = rows.join('\n');
    return new Blob([content], { type: 'text/csv;charset=utf-8;' });
  }

  /**
   * Triggers the download of the CSV report.
   */
  static downloadBlob(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 100);
  }
}
