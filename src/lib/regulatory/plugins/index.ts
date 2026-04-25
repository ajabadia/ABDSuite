
import { 
    TinValidationParams, TinValidationResult 
} from './types';

import { 
    NO_TIN_JURISDICTIONS, 
    VALIDATORS, 
    REQUIREMENTS_MAP, 
    COUNTRY_INFO_MAP, 
    TIN_INFO_MAP 
} from './jurisdictions-registry';

// Re-export all plugins and maps for the suite
export * from './jurisdictions-registry';
export * from './types';
export * from './i18n';

/**
 * Checks if a birth date implies minority (< 18 years)
 */
export function isMinor(birthDate: Date | string): boolean {
    const d = new Date(birthDate);
    if (isNaN(d.getTime())) return false;
    
    const today = new Date();
    let age = today.getFullYear() - d.getFullYear();
    const m = today.getMonth() - d.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < d.getDate())) {
        age--;
    }
    return age < 18;
}

/**
 * High-Fidelity Global TIN Validation Orchestrator (Era 6)
 * Central entry point for all jurisdictional validation requests.
 */
export const validateJurisdictionalTIN = ({ country, value, type = 'ANY', metadata }: TinValidationParams): TinValidationResult => {
    const iso2 = country.toUpperCase();

    // 1. Jurisdictions with no TIN requirement or restricted issuance
    const exemption = NO_TIN_JURISDICTIONS[iso2];
    if (exemption) {
        if (exemption.status === 'NO_TIN' && (!value || value.length === 0)) {
            return { 
                isValid: true, 
                status: 'VALID', 
                isOfficialMatch: true,
                explanation: exemption.details
            };
        }
        // If it's CONDITIONAL or value is provided, we might still want to validate it if a plugin exists
        if (exemption.status === 'NO_TIN' && value) {
            // Some "No TIN" countries might use functional equivalents (handled by plugins or fallback)
        }
    }

    // 2. Specialized Algorithmic Plugins (Hybrid Support)
    const validator = VALIDATORS[iso2];
    if (validator && typeof validator === 'function') {
        const result = validator(value, type, metadata);
        
        // Add jurisdictional context if missing
        if (!result.explanation && result.status === 'VALID_UNOFFICIAL') {
            result.explanation = `Value matches an unofficial pattern for ${iso2} but failed official checksum/verification.`;
        }
        
        return result;
    }

    // 3. Fallback: Generic RegTech Pattern (Min length 4, Max length 25)
    const sanitizedValue = value.replace(/[\s-]/g, '');
    if (sanitizedValue.length >= 4 && sanitizedValue.length <= 25) {
        return { 
            isValid: true, 
            status: 'VALID_UNOFFICIAL',
            isOfficialMatch: false,
            isUnofficialMatch: true,
            explanation: 'Jurisdiction not specifically supported. Matched generic RegTech format (4-25 alphanumeric chars).'
        };
    }

    return { 
        isValid: false, 
        status: 'INVALID_FORMAT', 
        message: 'Invalid length or format for unknown jurisdiction.',
        explanation: 'The value does not meet the minimum length requirements (4-25) for a generic TIN.'
    };
};
