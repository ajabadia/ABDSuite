import { HolderMetadata, TinValidationResult, CountryRegulatoryInfo, TinInfo, TinRequirement } from './index';

/**
 * TIN Validation for Mozambique (MZ)
 * NUIT (9 digits)
 */

/**
 * TIN Requirements for Mozambique
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
 * Country Metadata for Mozambique
 */
export const COUNTRY_INFO: CountryRegulatoryInfo = {
    name: 'Mozambique',
    authority: 'Autoridade Tributária de Moçambique',
    compliance: {
        crsStatus: 'Non-Participating',
        crsDate: 'N/A',
        fatcaStatus: 'N/A'
    },
    residency: {
        individual: 'Se considera residente si permanece en Mozambique durante más de 180 días en el año civil.',
        entity: 'Se considera residente si está incorporada en Mozambique.',
        notes: 'Criterio de permanencia física o constitución legal.'
    }
};

/**
 * TIN Metadata for Mozambique (Era 6.3)
 */
export const TIN_INFO: TinInfo = {
    name: 'NUIT',
    description: 'Mozambican NUIT issued by the Tax Authority.',
    placeholder: '123456789',
    officialLink: 'https://www.at.gov.mz',
    isOfficial: true,
    lastUpdated: '2026-04-24',
    source: 'Local Authority / Mozambique Tax',
    entityDifferentiation: {
        logic: 'Structurally identical identifiers.',
        individualDescription: '9-digit NUIT identifier.',
        businessDescription: '9-digit NUIT identifier.'
    }
};

/**
 * Mozambique TIN Validator - Era 6.3
 */
export const validateMZTIN = (
    value: string, 
    type: 'INDIVIDUAL' | 'ENTITY' | 'ANY' = 'ANY', 
    metadata?: HolderMetadata
): TinValidationResult => {
    const sanitized = value.replace(/[\s-]/g, '');

    if (sanitized.length === 9 && /^[0-9]{9}$/.test(sanitized)) {
        const isOfficial = validateNUITChecksum(sanitized);
        return { 
            isValid: true, 
            status: isOfficial ? 'VALID' : 'VALID_UNOFFICIAL', 
            isOfficialMatch: isOfficial, 
            explanation: `Matches official Mozambican NUIT (9 digits) format. ${isOfficial ? 'Verified via official checksum.' : 'Pattern match.'}` 
        };
    }

    return { 
        isValid: false, 
        status: 'INVALID_FORMAT',
        explanation: 'Value does not match Mozambican NUIT (9 digits) format.'
    };
};

function validateNUITChecksum(tin: string): boolean {
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
 * Mozambique uses the NUIT (Número Único de Identificação Tributária) for all 
 * taxpayers.
 * 1. Scope: Issued and managed by the Autoridade Tributária (AT).
 * 2. Structure: Standardized 9-digit numeric sequence.
 * 3. Validation: Weighted sum algorithm Modulo 11.
 *    - Formula: (11 - (Sum(Digit_i * Weight_i) % 11)). If result > 9, use 0.
 * 4. Residency: Centered on the 180-day presence rule in a calendar year.
 */
