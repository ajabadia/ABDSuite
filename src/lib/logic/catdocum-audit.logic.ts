import { db } from '@/lib/db/db';
import { EtlPreset } from '@/lib/types/etl.types';
import { ResolvedCatDoc } from './catdocum-resolver.logic';

interface CatDocResolutionContext {
  loteId: string;
  codDocumento: string;
  gawebFileName?: string;
}

/**
 * Persists the result of a CATDOC resolution into the Forensic Audit History.
 */
export async function logCatDocResolution(
  preset: EtlPreset,
  resolved: ResolvedCatDoc | null,
  ctx: CatDocResolutionContext,
) {
  const base = {
    id: crypto.randomUUID(),
    timestamp: Date.now(),
    module: 'LETTERQA' as const,
    category: 'QA', // En línea con el esquema de auditoría
  };

  if (!resolved) {
    // No matching active CATDOC found
    await db.audit_history_v6.add({
      ...base,
      action: 'CATDOC_RESOLUTION_MISSING',
      status: 'WARNING',
      details: JSON.stringify({
        severity: 'WARN',
        type: 'LETTERQA',
        data: {
          lote: ctx.loteId,
          codDocumento: ctx.codDocumento,
          presetId: preset.id,
          presetName: preset.name,
          gawebFileName: ctx.gawebFileName ?? null,
          resolution: null,
          messageKey: 'audit.letterqa.catdoc_missing'
        }
      })
    });
    return;
  }

  const { catDoc, template, mapping, reason } = resolved;
  const operational = !!(template && mapping);

  await db.audit_history_v6.add({
    ...base,
    action: 'CATDOC_RESOLUTION_USED',
    status: operational ? 'SUCCESS' : 'WARNING',
    details: JSON.stringify({
      severity: operational ? 'INFO' : 'WARN',
      type: 'LETTERQA',
      data: {
        lote: ctx.loteId,
        codDocumento: ctx.codDocumento,
        presetId: preset.id,
        presetName: preset.name,
        gawebFileName: ctx.gawebFileName ?? null,
        reason,
        catDocId: catDoc.id,
        catDocName: catDoc.businessName,
        catDocVersion: catDoc.version,
        templateId: catDoc.templateId ?? null,
        templateName: template?.name ?? null,
        mappingId: catDoc.mappingId ?? null,
        mappingName: mapping?.name ?? null,
        isOperational: operational,
        scoringDebug: resolved.debug,
        messageKey: operational ? 'audit.letterqa.catdoc_ok' : 'audit.letterqa.catdoc_incomplete'
      }
    })
  });
}
