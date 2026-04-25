import { HolderMetadata, TinValidationResult, CountryRegulatoryInfo, TinInfo, TinRequirement } from './index';

/**
 * TIN Validation for Philippines (PH)
 * TIN (9 or 12 digits)
 */

/**
 * TIN Requirements for Philippines
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
 * Country Metadata for Philippines
 */
export const COUNTRY_INFO: CountryRegulatoryInfo = {
    name: 'Filipinas',
    authority: 'Bureau of Internal Revenue (BIR)',
    compliance: {
        crsStatus: 'Participating',
        crsDate: 'September 2023',
        fatcaStatus: 'Model 1 (In Force)'
    },
    residency: {
        individual: 'Se considera residente si es ciudadano residente en Filipinas o extranjero presente más de 180 días (extranjero residente).',
        entity: 'Se considera residente si se ha incorporado bajo las leyes de Filipinas.',
        notes: 'Criterio de ciudadanía o presencia física de 180 días.'
    }
};

/**
 * TIN Metadata for Philippines (Era 6.3)
 */
export const TIN_INFO: TinInfo = {
    name: 'Taxpayer Identification Number (TIN)',
    description: 'Unique identifier issued by the Bureau of Internal Revenue (BIR).',
    placeholder: '123-456-789-000',
    officialLink: 'https://www.bir.gov.ph/',
    isOfficial: true,
    lastUpdated: '2026-04-24',
    source: 'OECD Portal / Bureau of Internal Revenue (BIR)',
    entityDifferentiation: {
        logic: 'Numeric sequence. Branch code (last 3-5 digits) identifies units.',
        individualDescription: '9 or 12-digit TIN.',
        businessDescription: '9 or 12-digit TIN with branch suffix (main office is usually 000).'
    }
};

/**
 * Philippines TIN Validator - Era 6.3
 */
export const validatePHTIN = (
    value: string, 
    type: 'INDIVIDUAL' | 'ENTITY' | 'ANY' = 'ANY', 
    metadata?: HolderMetadata
): TinValidationResult => {
    const sanitized = value.trim().replace(/[\s-]/g, '');

    if (/^\d{9}$/.test(sanitized) || /^\d{12}$/.test(sanitized)) {
        const basePart = sanitized.substring(0, 9);
        const isOfficial = validatePHChecksum(basePart);
        const branchCode = sanitized.length === 12 ? sanitized.substring(9, 12) : '000';
        
        return {
            isValid: true,
            status: isOfficial ? 'VALID' : 'VALID_UNOFFICIAL',
            isOfficialMatch: isOfficial,
            explanation: `Matches official Philippines TIN format. Branch: ${branchCode}. ${isOfficial ? 'Base verified via checksum.' : 'Pattern match.'}`
        };
    }

    return {
        isValid: false,
        status: 'INVALID_FORMAT',
        explanation: 'Philippines TINs are numeric codes of 9 or 12 digits.'
    };
};

function validatePHChecksum(tin: string): boolean {
    const weights = [9, 8, 7, 6, 5, 4, 3, 2];
    let sum = 0;
    for (let i = 0; i < 8; i++) sum += parseInt(tin[i]) * weights[i];
    const remainder = sum % 11;
    let checkDigit = 11 - remainder;
    if (checkDigit > 9) checkDigit = 0;
    return checkDigit === parseInt(tin[8]);
}

/**
 * APPENDIX: FORENSIC CRITERIA
 * The Philippines TIN is issued by the Bureau of Internal Revenue (BIR). 
 * 1. Structure: 
 *    - Base: 9 digits.
 *    - Branch Code: Optional 3 digits (e.g., '000' for main head office).
 * 2. Validation: Weighted sum algorithm Modulo 11 for the 9th digit of the base.
 *    - Weights: [9, 8, 7, 6, 5, 4, 3, 2].
 *    - If result > 9, the check digit is 0.
 * 3. Residency: 180-day rule for foreigners or citizenship for locals.
 */
