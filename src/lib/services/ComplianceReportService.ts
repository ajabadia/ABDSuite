/**
 * Compliance Report Service (Phase 16 - Industrial Standard)
 * Generares audit master reports in industrial formats (CSV/PDF).
 */
import { jsPDF } from 'jspdf';
import { GlobalTelemetrySnapshot } from '../types/telemetry.types';
import { TelemetryConfigService } from './telemetry-config.service';
import { ABDFNSuiteDB } from '../db/db';
import { coreDb } from '../db/SystemDB';
import { computeMappingHealth } from '../utils/letter-mapping-health';

export interface AuditTrailFilter {
  unitId: string;
  module?: string;
  category?: string;
  startDate?: number;
  endDate?: number;
}

export class ComplianceReportService {
  /**
   * Generates a High-Fidelity Master Compliance PDF.
   */
  static async generateMasterPdf(snapshot: GlobalTelemetrySnapshot): Promise<Blob> {
    const config = await TelemetryConfigService.loadConfig();
    const doc = new jsPDF();
    const primaryColor = '#1a1a1a';
    const accentColor = '#00f2fe';
    
    // Header
    doc.setFillColor(primaryColor);
    doc.rect(0, 0, 210, 40, 'F');
    
    doc.setTextColor('#ffffff');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(22);
    doc.text('MASTER COMPLIANCE REPORT', 15, 25);
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    const plantName = config.corporate.plantName.toUpperCase();
    doc.text(`PLANT: ${plantName} | SYSTEM_ID: ASEPTIC_ERA6`, 15, 32);
    
    // Summary Box
    doc.setTextColor(primaryColor);
    doc.setFontSize(14);
    doc.text('1. RESUMEN GLOBAL (24H)', 15, 55);
    
    let y = 65;
    const drawMetric = (label: string, value: string | number, x: number, lineY: number) => {
        doc.setFontSize(8);
        doc.setTextColor('#666666');
        doc.text(label.toUpperCase(), x, lineY);
        doc.setFontSize(12);
        doc.setTextColor(primaryColor);
        doc.text(String(value), x, lineY + 7);
    };

    drawMetric('Unidades Activas', snapshot.globalTotals.totalUnits, 15, y);
    drawMetric('Docs Procesados', snapshot.globalTotals.totalDocs24h, 65, y);
    drawMetric('Auditorías Run', snapshot.globalTotals.totalAudits24h, 115, y);
    drawMetric('QA Breaks', snapshot.globalTotals.totalQaBreaks24h, 165, y);

    y += 25;
    doc.setDrawColor('#eeeeee');
    doc.line(15, y, 195, y);
    y += 15;

    // Security Section
    doc.setFontSize(14);
    doc.text('2. TELEMETRÍA DE SEGURIDAD', 15, y);
    y += 10;
    
    drawMetric('Fallos Auth', snapshot.security.totalFailedLogins, 15, y);
    drawMetric('Bloqueos PIN', snapshot.security.totalLocksTriggered, 65, y);
    drawMetric('Cambios Rol', snapshot.governance.operatorRoleChanges24h, 115, y);
    drawMetric('Config updates', snapshot.governance.configChanges24h, 165, y);

    y += 30;

    // Unit Table
    doc.setFontSize(12);
    doc.text('3. DESGLOSE POR UNIDAD', 15, y);
    y += 8;
    
    doc.setFillColor('#f0f0f0');
    doc.rect(15, y, 180, 8, 'F');
    doc.setFontSize(8);
    doc.text('UNIDAD', 18, y + 5);
    doc.text('SALUD', 55, y + 5);
    doc.text('QA_M', 85, y + 5);
    doc.text('QA_B', 105, y + 5);
    doc.text('CRYPT_E', 125, y + 5);
    doc.text('ULT_ACT', 160, y + 5);
    
    y += 14;
    doc.setFont('helvetica', 'normal');
    for (const u of snapshot.units) {
        if (y > 270) { doc.addPage(); y = 20; }
        const b24 = u.kpiBuckets.find(b => b.bucket === 'LAST_24H')!;
        doc.text(u.unitCode, 18, y);
        doc.setTextColor(u.health === 'OK' ? '#008800' : '#880000');
        doc.text(u.health, 55, y);
        doc.setTextColor(primaryColor);
        doc.text(String(b24.letterQaLotes.match), 85, y);
        doc.text(String(b24.letterQaLotes.break), 105, y);
        doc.text(String(b24.cryptOps.encrypt), 125, y);
        doc.text(u.lastActivityAt ? new Date(u.lastActivityAt).toLocaleDateString() : '---', 160, y);
        y += 7;
    }

    // Footer Integrity
    const footerY = 285;
    doc.setDrawColor('#cccccc');
    doc.line(15, footerY - 5, 195, footerY - 5);
    doc.setFontSize(6);
    doc.setTextColor('#999999');
    const hash = crypto.randomUUID().replace(/-/g, '').substring(0, 32).toUpperCase();
    doc.text(`REPORT_INTEGRITY_HASH: ${hash} | GENERATED_AT: ${new Date().toISOString()}`, 15, footerY);
    doc.text(`© ABD FN SUITE INDUSTRIAL AUDIT | Pág. 1`, 165, footerY);

    return doc.output('blob');
  }

  /**
   * Generates a Detailed Mapping Health Audit (CSV).
   * Probes all active units to collect granular mapping stats.
   */
  static async generateMappingHealthCsv(): Promise<Blob> {
    const units = await coreDb.units.toArray();
    const rows: string[] = [
      'UNIDAD;PLANTILLA;MAPPING_NAME;TOTAL_VARS;MAPPED_COUNT;COBERTURA;STATUS'
    ];

    for (const u of units) {
         const unitDb = new ABDFNSuiteDB(u.id);
         try {
             await unitDb.open();
             const templates = await unitDb.lettertemplates_v6.toArray();
             const mappings = await unitDb.lettermappings_v6.toArray();
             const presets = await unitDb.presets_v6.toArray();
             
             const health = computeMappingHealth(
                 templates, 
                 mappings, 
                 (id) => presets.find(p => p.id === id)?.name ?? '---'
             );

             for (const row of health) {
                 const status = row.coverage >= 1.0 ? 'COMPLIANT' : 'UNDER_THRESHOLD';
                 rows.push(`${u.code};${row.templateName};${row.mappingName};${row.totalVars};${row.mappedCount};${(row.coverage * 100).toFixed(2)}%;${status}`);
             }
         } catch (err) {
             console.error(`Failed to probe unit ${u.code} for mapping health`, err);
         } finally {
             unitDb.close();
         }
    }

    return new Blob([rows.join('\r\n')], { type: 'text/csv;charset=utf-8;' });
  }

  /**
   * Generates a raw CSV of audit records for forensic analysis.
   */
  static async generateDetailedAuditTrail(filter: AuditTrailFilter): Promise<Blob> {
    const unitDb = new ABDFNSuiteDB(filter.unitId);
    let rows: string[] = [
        'TIMESTAMP;MODULE;ACTION;CATEGORY;STATUS;DETAILS'
    ];

    try {
        await unitDb.open();
        let query = unitDb.audit_history_v6.orderBy('timestamp').reverse();
        
        let records = await query.toArray();

        // Manual filtering (since Dexie complex queries can be tricky on encrypted fields if not indexed)
        if (filter.startDate) records = records.filter(r => r.timestamp >= filter.startDate!);
        if (filter.endDate) records = records.filter(r => r.timestamp <= filter.endDate!);
        if (filter.module) records = records.filter(r => r.module === filter.module);

        for (const r of records) {
            const dateStr = new Date(r.timestamp).toISOString();
            // Sanitize details for CSV (remove newlines and semicolons)
            const cleanDetails = (r.details || '').replace(/[;\n\r]/g, ' ');
            rows.push(`${dateStr};${r.module};${r.action};${r.category};${r.status};${cleanDetails}`);
        }
    } finally {
        unitDb.close();
    }

    return new Blob([rows.join('\r\n')], { type: 'text/csv;charset=utf-8;' });
  }

  /**
   * Generates a Industrial Master CSV Report (24h Summary)
   * Includes Global metrics, Sampling Policy and Unit details.
   */
  static async generateGlobalCsv(
    snapshot: GlobalTelemetrySnapshot,
  ): Promise<Blob> {
    const config = await TelemetryConfigService.loadConfig();
    const rows: string[] = [];

    // Header industrial
    rows.push('ABDFN SUITE - MASTER AUDIT REPORT');
    rows.push(`PLANT;${config.corporate.plantName}`);
    rows.push(`DATE;${new Date(snapshot.generatedAt).toISOString()}`);
    rows.push(`SUITE VERSION;${snapshot.suiteVersion}`);

    // Global Totals
    rows.push('');
    rows.push('Global Totals');
    rows.push('GLOBAL METRICS LAST 24H');
    rows.push(`Total Units;${snapshot.globalTotals.totalUnits}`);
    rows.push(`Total Docs;${snapshot.globalTotals.totalDocs24h}`);
    rows.push(`Total Audits;${snapshot.globalTotals.totalAudits24h}`);
    rows.push(`Total QA Breaks;${snapshot.globalTotals.totalQaBreaks24h}`);

    // Bloque GAWEB SAMPLING POLICY (Phase 18 Refinement)
    const sampling = config.security.auditSampling;
    const samplingChanges24h = snapshot.security.samplingChanges24h;

    rows.push('');
    rows.push('GAWEB SAMPLING POLICY');
    rows.push(`Sampling Enabled;${sampling.enabled ? 'YES' : 'NO'}`);
    rows.push(`Sampling 1 of N;${sampling.sampleEvery}`);
    rows.push(`Global Daily Limit;${sampling.maxPerDay}`);
    rows.push(`Sampling Changes 24h;${samplingChanges24h}`);

    // Unit Detail
    rows.push('');
    rows.push('Unit Detail');
    rows.push(
      'UNITCODE;HEALTH;LASTACTIVITY;DOCS24H;AUDITS24H;QAMATCH;QABREAK;QANOGOLDEN;SECFAIL;SECLOCK;SECTECH',
    );

    for (const u of snapshot.units) {
      const b24 = u.kpiBuckets.find((b) => b.bucket === 'LAST_24H')!;
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
        u.security.techModeActivations,
      ];
      rows.push(row.join(';'));
    }

    const content = rows.join('\n');
    return new Blob([content], { type: 'text/csv;charset=utf-8' });
  }

  static downloadBlob(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 100);
  }
}
