import { HolderMetadata, TinValidationResult, CountryRegulatoryInfo, TinInfo, TinRequirement } from './index';

/**
 * TIN Validation for Uzbekistan (UZ)
 * TIN / INN (9 digits)
 */

/**
 * TIN Requirements for Uzbekistan
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
 * Country Metadata for Uzbekistan
 */
export const COUNTRY_INFO: CountryRegulatoryInfo = {
    name: 'Uzbekistán',
    authority: 'State Tax Committee',
    compliance: {
        crsStatus: 'Non-Participating',
        crsDate: 'N/A',
        fatcaStatus: 'Model 1 (In Force)'
    },
    residency: {
        individual: 'Se considera residente si permanece en Uzbekistán durante más de 183 días en cualquier periodo de 12 meses.',
        entity: 'Se considera residente si está incorporada en Uzbekistán.',
        notes: 'Criterio de permanencia física o constitución legal.'
    }
};

/**
 * TIN Metadata for Uzbekistan (Era 6.3)
 */
export const TIN_INFO: TinInfo = {
    name: 'INN',
    description: 'Uzbek INN issued by the State Tax Committee.',
    placeholder: '123456789',
    officialLink: 'https://www.soliq.uz',
    isOfficial: true,
    lastUpdated: '2026-04-24',
    source: 'Local Authority / Uzbekistan Tax',
    entityDifferentiation: {
        logic: 'Structurally identical identifiers.',
        individualDescription: '9-digit INN identifier.',
        businessDescription: '9-digit INN identifier.'
    }
};

/**
 * Uzbekistan TIN Validator - Era 6.3
 */
export const validateUZTIN = (
    value: string, 
    type: 'INDIVIDUAL' | 'ENTITY' | 'ANY' = 'ANY', 
    metadata?: HolderMetadata
): TinValidationResult => {
    const sanitized = value.trim().toUpperCase().replace(/[\s-]/g, '');

    if (sanitized.length === 9 && /^[0-9]{9}$/.test(sanitized)) {
        const isOfficial = validateUZChecksum(sanitized);
        return { 
            isValid: true, 
            status: isOfficial ? 'VALID' : 'VALID_UNOFFICIAL', 
            isOfficialMatch: isOfficial, 
            explanation: `Matches official Uzbek INN (9 digits) format. ${isOfficial ? 'Verified via Modulo 11.' : 'Pattern match.'}` 
        };
    }

    if (sanitized.length >= 4 && sanitized.length <= 15 && /^[A-Z0-9]+$/.test(sanitized)) {
        return { 
            isValid: true, 
            status: 'VALID', 
            isOfficialMatch: true, 
            explanation: 'Matches general Uzbek identifier alphanumeric format.' 
        };
    }

    return { 
        isValid: false, 
        status: 'INVALID_FORMAT',
        explanation: 'Value does not match Uzbek INN format.'
    };
};

function validateUZChecksum(tin: string): boolean {
    const weights = [3, 7, 2, 4, 10, 3, 5, 9];
    let sum = 0;
    for (let i = 0; i < 8; i++) {
        sum += parseInt(tin[i]) * weights[i];
    }
    const remainder = sum % 11;
    const checkDigit = (remainder === 10) ? 0 : remainder;
    return checkDigit === parseInt(tin[8]);
}

/**
 * APPENDIX: FORENSIC CRITERIA
 * Uzbekistan uses the INN (Individual Identification Number) for all taxpayers.
 * 1. Scope: Issued and managed by the State Tax Committee.
 * 2. Structure: Standardized 9-digit numeric sequence.
 * 3. Validation: Weighted sum algorithm Modulo 11.
 * 4. Residency: Based on the 183-day presence rule in any 12-month period.
 */
