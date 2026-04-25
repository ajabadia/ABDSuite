import { HolderMetadata, TinValidationResult, CountryRegulatoryInfo, TinInfo, TinRequirement } from './index';

/**
 * TIN Validation for Guatemala (GT)
 * Individual: NIT or CUI/DPI (13 digits)
 * Entity: NIT (variable length)
 */

/**
 * TIN Requirements for Guatemala
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
 * Country Metadata for Guatemala
 */
export const COUNTRY_INFO: CountryRegulatoryInfo = {
    name: 'Guatemala',
    authority: 'Superintendencia de Administración Tributaria (SAT)',
    compliance: {
        crsStatus: 'Non-Participating',
        crsDate: 'N/A',
        fatcaStatus: 'Model 1 (In Force)'
    },
    residency: {
        individual: 'Se considera residente si permanece en Guatemala durante más de 183 días en el año civil.',
        entity: 'Se considera residente si está constituida en Guatemala.',
        notes: 'Criterio de permanencia física o constitución legal.'
    }
};

/**
 * TIN Metadata for Guatemala (Era 6.3)
 */
export const TIN_INFO: TinInfo = {
    name: 'NIT / CUI',
    description: 'Guatemalan NIT (Tax) or CUI (Personal ID) issued by the SAT or RENAP.',
    placeholder: '1234567-8 / 1234 56789 0101',
    officialLink: 'https://sat.gob.gt',
    isOfficial: true,
    lastUpdated: '2026-04-24',
    source: 'Local Authority / Guatemala SAT',
    entityDifferentiation: {
        logic: 'Number length and structure.',
        individualDescription: 'NIT or 13-digit CUI (Personal ID).',
        businessDescription: 'NIT (typically 7-10 characters).'
    }
};

/**
 * Guatemala TIN Validator - Era 6.3
 */
export const validateGTTIN = (
    value: string, 
    type: 'INDIVIDUAL' | 'ENTITY' | 'ANY' = 'ANY', 
    metadata?: HolderMetadata
): TinValidationResult => {
    const sanitized = value.replace(/[\s-]/g, '').toUpperCase();

    // 1. CUI (DPI): 13 digits
    if (sanitized.length === 13 && /^[0-9]{13}$/.test(sanitized)) {
        if (type === 'ENTITY') {
             return { isValid: false, status: 'MISMATCH', reasonCode: 'ENTITY_TYPE_MISMATCH' };
        }
        const isOfficial = validateCUIChecksum(sanitized);
        return { 
            isValid: true, 
            status: isOfficial ? 'VALID' : 'VALID_UNOFFICIAL', 
            isOfficialMatch: isOfficial, 
            explanation: type === 'ANY'
                ? 'Format valid for Individuals (CUI/DPI). Note: This identifier is not valid for legal Entities.'
                : `Matches official Guatemalan CUI (13 digits) format. ${isOfficial ? 'Verified via RENAP checksum.' : 'Pattern match.'}` 
        };
    }

    // 2. NIT: Variable length (typically 7-10 chars)
    if (sanitized.length >= 7 && sanitized.length <= 10 && /^[A-Z0-9]+$/.test(sanitized)) {
        const isOfficial = validateNITChecksum(sanitized);
        return { 
            isValid: true, 
            status: isOfficial ? 'VALID' : 'VALID_UNOFFICIAL', 
            isOfficialMatch: isOfficial, 
            explanation: type === 'ANY'
                ? 'Format valid for NIT. Note: Please verify if the holder is an Individual or an Entity.'
                : `Matches official Guatemalan NIT format. ${isOfficial ? 'Verified via SAT checksum.' : 'Pattern match.'}` 
        };
    }

    return { 
        isValid: false, 
        status: 'INVALID_FORMAT',
        explanation: 'Value does not match Guatemalan NIT or CUI format.'
    };
};

function validateNITChecksum(nit: string): boolean {
    const body = nit.substring(0, nit.length - 1);
    const last = nit[nit.length - 1];
    
    let sum = 0;
    for (let i = 0; i < body.length; i++) {
        sum += parseInt(body[i]) * (nit.length - i);
    }
    const remainder = sum % 11;
    const checkDigit = (11 - remainder) % 11;
    
    const expected = checkDigit === 10 ? 'K' : checkDigit.toString();
    return expected === last;
}

function validateCUIChecksum(cui: string): boolean {
    const weights = [2, 3, 4, 5, 6, 7, 8, 9];
    let sum = 0;
    for (let i = 0; i < 8; i++) sum += parseInt(cui[i]) * weights[i];
    const check = sum % 11;
    return check === parseInt(cui[8]);
}

/**
 * APPENDIX: FORENSIC CRITERIA
 * Guatemala uses the NIT for tax purposes and the CUI (Código Único de 
 * Identificación) for personal identification.
 * 1. NIT: 
 *    - Format: XXXXXXX-K. 
 *    - Validation: Weighted sum algorithm Modulo 11. The last digit can be 'K' (representing 10).
 * 2. CUI/DPI: 
 *    - 13 digits. 
 *    - Structure: 8 digits + 1 check digit + 2 digits (Department) + 2 digits (Municipality).
 * 3. Residency: Based on the 183-day presence rule in a calendar year.
 * 4. Validation: Comprehensive support for both NIT and CUI identifiers.
 */
