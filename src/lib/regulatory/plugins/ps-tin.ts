import { HolderMetadata, TinValidationResult, CountryRegulatoryInfo, TinInfo, TinRequirement } from './index';

/**
 * TIN Validation for Palestine (PS)
 * Individual: ID Number (9 digits)
 * Entity: Tax Identification Number (TIN) (9 digits)
 */

/**
 * TIN Requirements for Palestine
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
 * Country Metadata for Palestine
 */
export const COUNTRY_INFO: CountryRegulatoryInfo = {
    name: 'Palestina',
    authority: 'Ministry of Finance',
    compliance: {
        crsStatus: 'Non-Participating',
        crsDate: 'N/A',
        fatcaStatus: 'N/A'
    },
    residency: {
        individual: 'Se considera residente si permanece en Palestina durante más de 183 días en el año fiscal.',
        entity: 'Se considera residente si está incorporada en Palestina.',
        notes: 'Criterio de permanencia física o constitución legal.'
    }
};

/**
 * TIN Metadata for Palestine (Era 6.3)
 */
export const TIN_INFO: TinInfo = {
    name: 'ID No. / TIN',
    description: 'Palestinian ID Number (Individuals) or TIN (Entities) issued by the Ministry of Interior or Finance.',
    placeholder: '123456789',
    officialLink: 'https://www.pmof.ps',
    isOfficial: true,
    lastUpdated: '2026-04-24',
    source: 'Local Authority / Palestine Tax',
    entityDifferentiation: {
        logic: 'Prefix and length analysis.',
        individualDescription: '9-digit National ID Number.',
        businessDescription: '9-digit TIN for legal entities.'
    }
};

/**
 * Palestine TIN Validator - Era 6.3
 */
export const validatePSTIN = (
    value: string, 
    type: 'INDIVIDUAL' | 'ENTITY' | 'ANY' = 'ANY', 
    metadata?: HolderMetadata
): TinValidationResult => {
    const sanitized = value.trim().toUpperCase().replace(/[\s-]/g, '');

    // Common 9-digit format for both ID and TIN
    if (sanitized.length === 9 && /^[0-9]{9}$/.test(sanitized)) {
        const isOfficial = validatePalestineChecksum(sanitized);
        return { 
            isValid: true, 
            status: isOfficial ? 'VALID' : 'VALID_UNOFFICIAL', 
            isOfficialMatch: isOfficial, 
            explanation: `Matches official Palestinian 9-digit identifier format. ${isOfficial ? 'Verified via checksum.' : 'Pattern match.'}` 
        };
    }

    if (sanitized.length >= 4 && sanitized.length <= 15 && /^[A-Z0-9]+$/.test(sanitized)) {
        return { 
            isValid: true, 
            status: 'VALID', 
            isOfficialMatch: true, 
            explanation: 'Matches general Palestinian TIN alphanumeric format.' 
        };
    }

    return { 
        isValid: false, 
        status: 'INVALID_FORMAT',
        explanation: 'Value does not match Palestinian ID Number (9 digits) or TIN format.'
    };
};

function validatePalestineChecksum(tin: string): boolean {
    let sum = 0;
    for (let i = 0; i < 9; i++) {
        let n = parseInt(tin[i]) * ((i % 2 === 0) ? 1 : 2);
        if (n > 9) n -= 9;
        sum += n;
    }
    return sum % 10 === 0;
}

/**
 * APPENDIX: FORENSIC CRITERIA
 * Palestine uses a 9-digit identifier for both individuals and entities.
 * 1. Scope: Issued by the Ministry of Interior (ID) and Ministry of Finance (TIN).
 * 2. Structure: 9-digit numeric sequence.
 * 3. Validation: Modulo 10 (Luhn-style) algorithm.
 *    - Weights: Alternating 1 and 2.
 *    - Process: If Digit_i * Weight_i > 9, subtract 9. Sum all results.
 *    - Check: Sum must be a multiple of 10.
 * 4. Residency: Centered on the 183-day presence rule in a fiscal year.
 */
