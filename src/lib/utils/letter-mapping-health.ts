import type { LetterTemplate, LetterMapping } from '@/lib/types/letter.types';

export interface MappingHealthRow {
  id?: string;
  presetId?: string | null;
  presetName: string;
  templateId?: string | null;
  templateName: string;
  mappingName: string;
  coverage: number;     // 0..1
  totalVars: number;
  mappedCount: number;
}

/**
 * Calcula la salud de los mapeos basándose en la configuración de la base de datos.
 * Esta función evita el re-parsing de binarios y usa m.mappings.length como proxy industrial.
 */
export function computeMappingHealth(
  templates: LetterTemplate[],
  mappings: LetterMapping[],
  presetNameById: (id: string | null | undefined) => string = () => '---'
): MappingHealthRow[] {
  if (!mappings || !templates) return [];

  return mappings.map(m => {
    const totalVars = m.mappings?.length || 0;
    const mappedCount = m.mappings?.filter(x => !!x.sourceField).length || 0;
    const coverage = totalVars > 0 ? mappedCount / totalVars : 0;

    const templateName =
      templates.find(t => t.id === m.templateId)?.name ?? '---';

    return {
      id: m.id,
      presetId: m.etlPresetId,
      presetName: presetNameById(m.etlPresetId),
      templateId: m.templateId,
      templateName,
      mappingName: m.name,
      coverage,
      totalVars,
      mappedCount,
    };
  });
}
