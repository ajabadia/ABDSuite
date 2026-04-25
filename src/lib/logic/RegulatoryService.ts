import { 
    TinValidationResult, 
    TinValidationStatus, 
    TinValidationType, 
    HolderMetadata,
    TinMismatchReason,
    TinValidationPluginResponse,
    TinValidationPluginResult
} from '../types/regulatory.types';
import { EXEMPTION_MAP } from '../regulatory/exemption-map';
import '../regulatory/index'; // Trigger side-effect: Register plugins
import { regulatoryOrchestrator } from './RegulatoryOrchestrator';

/**
 * Transversal Regulatory Service (Era 6 - Standardized Architecture)
 * High-precision jurisdictional validation engine.
 * Supports legacy boolean plugins and new rich-object plugins.
 */
export class RegulatoryService {
    
    /**
     * Final validation orifice for all modules.
     */
    public validateTin(
        country: string, 
        tin: string | null, 
        type: TinValidationType = 'ANY', 
        metadata?: HolderMetadata
    ): TinValidationResult {
        const iso = country.toUpperCase().trim();
        const value = tin?.trim() || '';

        // 1) Exemption Layer (OECD/IRS List bypass)
        const exemption = EXEMPTION_MAP[iso];
        if (exemption) {
            return {
                isValid: true,
                status: 'EXEMPTED',
                country: iso,
                reasonCode: exemption.reason,
                message: exemption.comment,
                severity: 'INFO'
            };
        }

        // 2) Basic Fallback for empty TIN
        if (!value) {
            return {
                isValid: false,
                status: 'INVALID',
                country: iso,
                reasonCode: 'MISSING_TIN',
                message: 'TIN is required for this jurisdiction.',
                severity: 'ERROR'
            };
        }

        // 3) Plugin Execution (Polyglot Layer)
        const plugin = regulatoryOrchestrator.getPlugin(iso);
        if (!plugin) {
            return { 
                isValid: true, 
                status: 'NOT_APPLICABLE', 
                country: iso, 
                message: 'No validation logic registered for this country.',
                severity: 'INFO'
            };
        }

        const rawResponse = plugin.validate(value, type, metadata);
        
        // Handle New Rich Object Response (Era 6)
        if (typeof rawResponse === 'object' && rawResponse !== null) {
            return this.processRichPluginResponse(iso, rawResponse, plugin.info?.name);
        }

        // Handle Legacy Boolean Response (Dual-Pass Strategy)
        return this.processLegacyBooleanResponse(iso, value, type, metadata, plugin);
    }

    /**
     * Translates the plugin's internal result to the Suite's standard result.
     */
    private processRichPluginResponse(
        iso: string, 
        res: TinValidationPluginResult, 
        tinName?: string
    ): TinValidationResult {
        // Step 1: Priority to the plugin's word
        const pluginMessage = res.message || res.explanation;
        
        // Step 2: Use default message ONLY if the plugin is silent
        const finalMessage = pluginMessage || this.getDefaultMessage(res.status, tinName);
        
        return {
            isValid: res.isValid,
            status: res.status as TinValidationStatus,
            country: iso,
            tinType: tinName,
            reasonCode: res.reasonCode,
            rawMismatchFields: res.mismatchFields,
            message: finalMessage,
            explanation: res.explanation,
            errorDetails: res.errorDetails,
            severity: res.status === 'VALID' ? 'INFO' : (res.status === 'MISMATCH' ? 'WARNING' : 'ERROR')
        };
    }

    /**
     * Retro-compatibility logic: Inferred Mismatch detection via double-pass.
     */
    private processLegacyBooleanResponse(
        iso: string, 
        value: string, 
        type: TinValidationType, 
        metadata: HolderMetadata | undefined,
        plugin: any
    ): TinValidationResult {
        // Step A: Check physical structure (without metadata)
        const structuralOk = plugin.validate(value, type);

        if (!structuralOk) {
            return {
                isValid: false,
                status: 'INVALID',
                country: iso,
                tinType: plugin.info?.name,
                reasonCode: 'INVALID_FORMAT',
                message: `TIN does not match ${plugin.info?.name || 'national'} format requirements.`,
                severity: 'ERROR'
            };
        }

        // Step B: Check semantics (with metadata)
        if (metadata) {
            const semanticOk = plugin.validate(value, type, metadata);
            if (!semanticOk) {
                return {
                    isValid: false,
                    status: 'MISMATCH',
                    country: iso,
                    tinType: plugin.info?.name,
                    reasonCode: 'SEMANTIC_INCONSISTENCY',
                    rawMismatchFields: ['identity_cross_check'],
                    message: 'Información inconsistente con los datos de identidad capturados.',
                    severity: 'WARNING'
                };
            }
        }

        return {
            isValid: true,
            status: 'VALID',
            country: iso,
            tinType: plugin.info?.name,
            message: 'TIN is structurally valid.',
            severity: 'INFO'
        };
    }

    private getDefaultMessage(status: string, tinName?: string): string {
        switch (status) {
            case 'VALID': return 'TIN validado con éxito.';
            case 'INVALID': 
            case 'INVALID_FORMAT': return `Formato de ${tinName || 'TIN'} incorrecto o desconocido.`;
            case 'INVALID_CHECKSUM': return `Dígito de control de ${tinName || 'TIN'} no coincide.`;
            case 'MISMATCH': return 'Discrepancia detectada entre identidad y documento.';
            case 'VALID_UNOFFICIAL': return 'Estructura válida, pero fuera del registro oficial.';
            default: return 'Validación completada con observaciones.';
        }
    }
}

export const regulatoryService = new RegulatoryService();
