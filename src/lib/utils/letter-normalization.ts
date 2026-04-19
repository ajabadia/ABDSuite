/**
 * ABDFN Unified Suite - Letter Normalization Utility (Era 6)
 * Handles legacy naming aliases and ensures canonical data flow.
 */

import { LetterGenerationOptions } from '../types/letter.types';
import { GawebConfig, EtlPreset } from '../types/etl.types';

/**
 * Normaliza las opciones de generación desde cualquier objeto de entrada (Legacy compat)
 */
export function normalizeLetterOptions(input: any): LetterGenerationOptions {
  return {
    lote: input.lote || input.Batch || '0000',
    oficina: input.oficina || input.OfficeCode || '00000',
    // EL NUCLEO DEL SMART LOADER: Prioridad al canónico, fallback a aliases
    codDocumento: input.codDocumento || input.codDocto || input.codigoDocumento || input.DocCode || 'x00000',
    fechaGeneracion: input.fechaGeneracion || input.GenerationDate || new Date().toISOString().split('T')[0].replace(/-/g, ''),
    fechaCarta: input.fechaCarta || input.LetterDate || '',
    rangeFrom: input.rangeFrom || 0,
    rangeTo: input.rangeTo || 0,
    outputType: input.outputType || 'PDF_GAWEB'
  };
}

/**
 * Normaliza la configuración GAWEB de un Preset
 */
export function normalizeGawebConfig(config: any): GawebConfig {
  if (!config) return {} as GawebConfig;
  
  return {
    ...config,
    // Asegurar que codigoDocumento (UI) esté sincronizado con codDocumento
    codigoDocumento: config.codigoDocumento || config.codDocumento || config.codDocto || 'X00000',
    oficina: config.oficina || config.OfficeCode || '00000',
    fechaGeneracion: config.fechaGeneracion || config.GenerationDate || '',
    fechaCarta: config.fechaCarta || config.LetterDate || ''
  };
}

/**
 * Normaliza un Preset completo antes de guardarlo o exportarlo
 */
export function normalizeEtlPreset(preset: EtlPreset): EtlPreset {
  return {
    ...preset,
    gawebConfig: preset.gawebConfig ? normalizeGawebConfig(preset.gawebConfig) : undefined,
    updatedAt: Date.now()
  };
}
