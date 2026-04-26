import { TinValidatorPlugin, TinValidationResult, HolderMetadata, TinValidationType } from '../types/regulatory.types';
import { TinInputSchema } from '../schemas/regulatory.schema';

/**
 * Regulatory Orchestrator (ERA 6.1)
 * Industrial engine for dynamic TIN validation plugins.
 * Now with Zod-Hardened Input Gate.
 */
class RegulatoryOrchestrator {
    private plugins: Map<string, TinValidatorPlugin> = new Map();

    /**
     * Registers a new jurisdictional validator.
     */
    registerPlugin(plugin: TinValidatorPlugin) {
        this.plugins.set(plugin.countryCode.toUpperCase(), plugin);
    }

    /**
     * Performs a dual-mode validation.
     * - Structural: Always performed.
     * - Semantic: Performed if metadata is present.
     */
    validateTin(country: string, value: string, type: TinValidationType = 'ANY', metadata?: HolderMetadata): TinValidationResult {
        // 1. Technical Hardening: Zod Input Validation
        const validation = TinInputSchema.safeParse({ country, value, type, metadata });
        
        if (!validation.success) {
            return {
                isValid: false,
                status: 'INVALID_FORMAT',
                country: (country || '??').toUpperCase(),
                severity: 'ERROR',
                message: 'regtech.errors.invalid_input_schema',
                errorDetails: validation.error.message
            };
        }

        const { country: iso, value: tinValue, type: tinType, metadata: tinMetadata } = validation.data;
        const plugin = this.plugins.get(iso);

        if (!plugin) {
            // Fallback: basic alphanumeric check if no plugin exists
            const isValid = tinValue.length >= 2 && /^[A-Z0-9-]{2,25}$/i.test(tinValue.trim());
            return {
                isValid,
                status: isValid ? 'VALID' : 'INVALID',
                country: iso,
                severity: 'WARNING',
                message: isValid ? undefined : 'audit.errors.unsupported_country_format'
            };
        }

        const result = plugin.validate(tinValue, tinType, tinMetadata);

        // Standardize result if plugin returns boolean
        if (typeof result === 'boolean') {
            return {
                isValid: result,
                status: result ? 'VALID' : 'INVALID',
                country: iso,
                severity: 'ERROR',
                message: result ? undefined : `audit.errors.invalid_tin_${iso.toLowerCase()}`
            };
        }

        return {
            isValid: result.isValid,
            status: result.status as any,
            country: iso,
            reasonCode: result.reasonCode,
            rawMismatchFields: result.mismatchFields,
            message: result.message,
            severity: result.isValid ? 'INFO' : 'ERROR'
        };
    }

    /**
     * Returns true if a country has a specific industrial validator.
     */
    hasPlugin(country: string): boolean {
        return this.plugins.has(country.toUpperCase().trim());
    }

    /**
     * Gets jurisdictional info (Name, Placeholder, etc.)
     */
    getInfo(country: string) {
        return this.plugins.get(country.toUpperCase().trim())?.info;
    }

    /**
     * Gets country-level regulatory info (Authority, Residency, Compliance)
     */
    getCountryInfo(country: string) {
        return this.plugins.get(country.toUpperCase().trim())?.countryInfo;
    }

    /**
     * Returns the raw plugin instance for a country.
     */
    getPlugin(country: string): TinValidatorPlugin | undefined {
        return this.plugins.get(country.toUpperCase().trim());
    }

    /**
     * Gets requirements for a specific country.
     */
    getRequirements(country: string) {
        return this.plugins.get(country.toUpperCase().trim())?.requirements || [];
    }
}

export const regulatoryOrchestrator = new RegulatoryOrchestrator();
