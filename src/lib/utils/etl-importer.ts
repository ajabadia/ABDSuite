import { EtlPreset, EtlRecordType, EtlField, EtlRecordBehavior } from '../types/etl.types';

/**
 * Robust Normalizer for ETL Presets.
 * Handles Legacy (flat), Modern C# (object-based Spanish), and Suite (array-based English) formats.
 */
export function normalizeEtlPreset(data: any): EtlPreset {
  const result: EtlPreset = {
    name: data.name || data.nombre_mostrar || data.nombre || 'IMPORTED_PRESET',
    version: data.version || '1.0',
    description: data.description || '',
    chunkSize: data.chunkSize || data.max_filas_por_csv || 900000,
    encoding: (data.encoding || data.codificacion || 'utf-8').toLowerCase() === 'latin1' ? 'windows-1252' : (data.encoding || data.codificacion || 'utf-8'),
    
    recordTypeStart: data.recordTypeStart ?? data.inicio_tipo_registro ?? 0,
    recordTypeLen: data.recordTypeLen ?? data.longitud_tipo_registro ?? 0,
    defaultRecordType: data.defaultRecordType ?? data.tipo_registro_por_defecto ?? '',
    headerTypeId: data.headerTypeId ?? data.id_tipo_cabecera ?? '',

    recordTypes: [],
    isActive: true,
    createdAt: data.createdAt || Date.now(),
    updatedAt: Date.now()
  };

  // Case 1: Suite Format (Current)
  if (Array.isArray(data.recordTypes)) {
    result.recordTypes = data.recordTypes;
    return result;
  }

  // Case 2: Modern C# Format (Spanish object-based record types)
  if (data.tipos_registro && typeof data.tipos_registro === 'object') {
    const triggerStart = data.inicio_tipo_registro || 0;
    const headerId = data.id_tipo_cabecera || '';

    result.recordTypes = Object.entries(data.tipos_registro).map(([trigger, fields]: [string, any]) => {
      const isHeader = trigger === headerId;
      return {
        name: isHeader ? 'HEADER' : `DATA_${trigger}`,
        trigger: trigger === 'default' ? '' : trigger,
        triggerStart: triggerStart,
        behavior: (isHeader ? 'HEADER' : 'DATA') as EtlRecordBehavior,
        range: isHeader ? '1' : '',
        fields: fields.map((f: any) => ({
          name: f.nombre || f.name,
          start: f.inicio ?? f.start ?? 0,
          length: f.longitud || f.length || 0
        }))
      };
    });
    return result;
  }

  // Case 3: Legacy Format (Spanish flat field list, sequential)
  if (Array.isArray(data.campos)) {
    let currentPos = 0;
    const fields: EtlField[] = data.campos.map((f: any) => {
      const field = {
        name: f.nombre || f.name,
        start: f.inicio ?? f.start ?? currentPos, // Use start if exists, else sequence
        length: f.longitud || f.length || 0
      };
      // If start wasn't provided, move the cursor
      if (f.inicio === undefined && f.start === undefined) {
        currentPos += field.length;
      }
      return field;
    });

    result.recordTypes = [{
      name: 'UNIVERSAL',
      trigger: '',
      triggerStart: 0,
      behavior: 'DATA',
      range: '',
      fields: fields
    }];
    return result;
  }

  return result;
}
