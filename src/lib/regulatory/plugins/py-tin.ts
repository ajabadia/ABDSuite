import { HolderMetadata, TinValidationResult, CountryRegulatoryInfo, TinInfo, TinRequirement } from './index';

/**
 * TIN Validation for Paraguay (PY)
 * RUC (6 to 10 digits + DV: 1234567-8)
 */

/**
 * TIN Requirements for Paraguay
 */
export const TIN_REQUIREMENTS: TinRequirement[] = [
    { 
        key: 'holderType', 
        label: 'holderType', 
        type: 'select', 
        options: [
            { value: 'INDIVIDUAL', label: 'individual' },
            { value: 'ENTITY', label: 'entity' }
        ]
    }
];

/**
 * Country Metadata for Paraguay
 */
export const COUNTRY_INFO: CountryRegulatoryInfo = {
    name: 'Paraguay',
    authority: 'Subsecretaría de Estado de Tributación (SET)',
    compliance: {
        crsStatus: 'Non-Participating',
        crsDate: 'N/A',
        fatcaStatus: 'N/A'
    },
    residency: {
        individual: 'Se considera residente si permanece en Paraguay durante más de 120 días en el año civil.',
        entity: 'Se considera residente si está constituida en Paraguay.',
        notes: 'Criterio de permanencia física o constitución legal.'
    }
};

/**
 * TIN Metadata for Paraguay (Era 6.3)
 */
export const TIN_INFO: TinInfo = {
    name: 'RUC',
    description: 'Paraguayan RUC issued by the SET.',
    placeholder: '1234567-8',
    officialLink: 'https://www.set.gov.py',
    isOfficial: true,
    lastUpdated: '2026-04-24',
    source: 'Local Authority / Paraguay SET',
    entityDifferentiation: {
        logic: 'Prefix analysis.',
        individualDescription: 'RUC based on Identity Card (Cédula).',
        businessDescription: 'RUC starting with 800-series (Legal Entities).'
    }
};

/**
 * Paraguay TIN Validator - Era 6.3
 */
export const validatePYTIN = (
    value: string, 
    type: 'INDIVIDUAL' | 'ENTITY' | 'ANY' = 'ANY', 
    metadata?: HolderMetadata
): TinValidationResult => {
    const sanitized = value.trim().toUpperCase().replace(/[\s-]/g, '');

    if (sanitized.length >= 6 && sanitized.length <= 12 && /^[A-Z0-9]+$/.test(sanitized)) {
        const isOfficial = validatePYRUCChecksum(sanitized);
        const prefix = sanitized.substring(0, 3);
        
        if (prefix === '800' && type === 'INDIVIDUAL') {
             return { 
                 isValid: false, 
                 status: 'MISMATCH', 
                 reasonCode: 'ENTITY_TYPE_MISMATCH',
                 explanation: 'The RUC prefix 800 is reserved for Legal Entities and not for individuals.'
             };
        }

        const isEntityPrefix = prefix === '800';

        return { 
            isValid: true, 
            status: isOfficial ? 'VALID' : 'VALID_UNOFFICIAL', 
            isOfficialMatch: isOfficial, 
            explanation: type === 'ANY'
                ? (isEntityPrefix 
                    ? 'Format valid for Entities (RUC starts with 800). Note: This identifier is not valid for Individuals.'
                    : 'Format valid for Individuals (RUC). Note: This identifier is not valid for legal Entities.')
                : `Matches official Paraguayan RUC format. ${isOfficial ? 'Verified via Modulo 11.' : 'Pattern match.'}` 
        };
    }

    return { 
        isValid: false, 
        status: 'INVALID_FORMAT',
        explanation: 'Value does not match Paraguayan RUC format.'
    };
};

function validatePYRUCChecksum(tin: string): boolean {
    const pbase = 11;
    const ruc = tin.substring(0, tin.length - 1);
    const providedDv = parseInt(tin[tin.length - 1]);
    
    // Mapping for alpha characters in RUC (Entities)
    let rucNumeric = "";
    for (let char of ruc) {
        if (/[A-Z]/.test(char)) {
            rucNumeric += char.charCodeAt(0).toString();
        } else {
            rucNumeric += char;
        }
    }

    let sum = 0;
    let weight = 2;
    for (let i = ruc.length - 1; i >= 0; i--) {
        const digit = ruc[i].charCodeAt(0) - 48; // Simple ASCII offset for numbers
        // In reality, SET uses a specific mapping for letters, but most RUCs are numeric
        sum += (/[0-9]/.test(ruc[i]) ? parseInt(ruc[i]) : (ruc[i].charCodeAt(0))) * weight;
        weight++;
    }

    const remainder = sum % pbase;
    const expectedDv = remainder > 1 ? pbase - remainder : 0;
    
    return expectedDv === providedDv;
}

/**
 * APPENDIX: FORENSIC CRITERIA
 * Paraguay uses the RUC (Registro Único de Contribuyentes) for all taxpayers.
 * 1. Scope: Issued and managed by the SET.
 * 2. Structure: 
 *    - Individuals: Cédula number + Check Digit (DV).
 *    - Entities: 800-series prefix + sequence + Check Digit (DV).
 * 3. Validation: Modulo 11 (Base 11) algorithm.
 *    - Formula: (11 - (Sum(Digit_i * Weight_i) % 11)). If result > 9, use 0.
 *    - Weights: Increasing from 2 from right to left.
 * 4. Residency: 120-day rule in a calendar year.
 */
