import { TinValidatorPlugin, TinValidationResult, HolderMetadata, TinValidationType } from '../types/regulatory.types';

/**
 * Regulatory Orchestrator (ERA 5)
 * Industrial engine for dynamic TIN validation plugins.
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
        const iso = country.toUpperCase().trim();
        const plugin = this.plugins.get(iso);

        if (!plugin) {
            // Fallback: basic alphanumeric check if no plugin exists
            const isValid = value.length >= 2 && /^[A-Z0-9-]{2,25}$/i.test(value.trim());
            return {
                isValid,
                status: isValid ? 'VALID' : 'INVALID',
                country: iso,
                severity: 'WARNING',
                message: isValid ? undefined : 'audit.errors.unsupported_country_format'
            };
        }

        const result = plugin.validate(value, type, metadata);

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
