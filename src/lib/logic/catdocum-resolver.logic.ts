import { db } from '@/lib/db/db';
import { EtlPreset } from '@/lib/types/etl.types';
import { CatDocumRecord } from '@/lib/types/catdocum.types';
import { LetterTemplate, LetterMapping } from '@/lib/types/letter.types';

export interface CatDocScoreDebug {
  channelWeight: number;
  presetWeight: number;
  defaultWeight: number;
  resourcesWeight: number;
  total: number;
}

export interface ResolvedCatDoc {
  catDoc: CatDocumRecord;
  template: LetterTemplate | null;
  mapping: LetterMapping | null;
  reason: 'EXACT_MATCH' | 'MULTIPLE_CHOICES' | 'NO_ACTIVE_CATDOC';
  debug?: CatDocScoreDebug;
}

/**
 * Calculates the industrial score for a CATDOC choice.
 */
function scoreCatDocForGaweb(
  rec: CatDocumRecord,
  preset: EtlPreset,
): CatDocScoreDebug {
  const channelWeight = rec.channel === 'GAWEB' ? 16 : 0;
  const presetWeight = rec.presetId === preset.id ? 8 : 0;
  const defaultWeight = rec.isDefaultForCode ? 4 : 0;
  const resourcesWeight = (rec.templateId ? 2 : 0) + (rec.mappingId ? 2 : 0);

  const total = channelWeight + presetWeight + defaultWeight + resourcesWeight;

  return {
    channelWeight,
    presetWeight,
    defaultWeight,
    resourcesWeight,
    total,
  };
}

/**
 * Resolves the best CATDOC entry for a given preset and document code.
 */
export async function resolveCatDocForPreset(
  preset: EtlPreset,
  codDocumento: string,
): Promise<ResolvedCatDoc | null> {
  const code = codDocumento.trim();
  if (!code) return null;

  const candidates = await db.catdocumv6
    .where('codDocumento')
    .equals(code)
    .and((c) => c.isActive)
    .toArray();

  if (candidates.length === 0) {
    return null;
  }

  const scored = candidates.map((rec) => {
    const debug = scoreCatDocForGaweb(rec, preset);
    return { rec, debug };
  });

  // Industrial Determinism: Sort by Score then by Update Date
  scored.sort((a, b) => {
    if (b.debug.total !== a.debug.total) {
      return b.debug.total - a.debug.total;
    }
    return (b.rec.updatedAt || 0) - (a.rec.updatedAt || 0);
  });

  const best = scored[0];
  
  // Decide reason
  let reason: ResolvedCatDoc['reason'];
  if (candidates.length === 1) {
    reason = 'EXACT_MATCH';
  } else {
    const topScore = best.debug.total;
    const nWithTopScore = scored.filter((s) => s.debug.total === topScore).length;
    reason = nWithTopScore === 1 ? 'EXACT_MATCH' : 'MULTIPLE_CHOICES';
  }

  const [template, mapping] = await Promise.all([
    best.rec.templateId
      ? db.lettertemplates_v6.get(best.rec.templateId)
      : Promise.resolve(null),
    best.rec.mappingId
      ? db.lettermappings_v6.get(best.rec.mappingId)
      : Promise.resolve(null),
  ]);

  return {
    catDoc: best.rec,
    template: template || null,
    mapping: mapping || null,
    reason,
    debug: best.debug,
  };
}

export function isCatDocOperational(resolved: ResolvedCatDoc): boolean {
  return !!(resolved.template && resolved.mapping);
}
