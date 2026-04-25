import { HolderMetadata, TinValidationResult, CountryRegulatoryInfo, TinInfo, TinRequirement } from './index';

/**
 * TIN Validation for Wallis and Futuna (WF)
 * TIN (9 digits - SIREN)
 */

/**
 * TIN Requirements for Wallis and Futuna
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
 * Country Metadata for Wallis and Futuna
 */
export const COUNTRY_INFO: CountryRegulatoryInfo = {
    name: 'Wallis y Futuna',
    authority: 'Direction des Services Fiscaux (DSF)',
    compliance: {
        crsStatus: 'Non-Participating',
        crsDate: 'N/A',
        fatcaStatus: 'Model 1 (In Force)'
    },
    residency: {
        individual: 'Se considera residente si tiene su residencia principal en Wallis y Futuna.',
        entity: 'Se considera residente si tiene su sede legal en Wallis y Futuna.',
        notes: 'Criterio de residencia principal o sede legal.'
    }
};

/**
 * TIN Metadata for Wallis and Futuna (Era 6.3)
 */
export const TIN_INFO: TinInfo = {
    name: 'SIREN / TIN',
    description: 'Wallis and Futuna identifier, aligning with the French SIREN system.',
    placeholder: '123456789',
    officialLink: 'https://www.wallis-et-futuna.gouv.fr',
    isOfficial: true,
    lastUpdated: '2026-04-24',
    source: 'Local Authority / French Overseas Tax',
    entityDifferentiation: {
        logic: 'Structurally identical to French SIREN.',
        individualDescription: '9-digit identifier.',
        businessDescription: '9-digit SIREN identifier.'
    }
};

/**
 * Wallis and Futuna TIN Validator - Era 6.3
 */
export const validateWFTIN = (
    value: string, 
    type: 'INDIVIDUAL' | 'ENTITY' | 'ANY' = 'ANY', 
    metadata?: HolderMetadata
): TinValidationResult => {
    const sanitized = value.trim().toUpperCase().replace(/[\s-]/g, '');

    if (sanitized.length === 9 && /^[0-9]{9}$/.test(sanitized)) {
        const isOfficial = validateLuhn(sanitized);
        return { 
            isValid: true, 
            status: isOfficial ? 'VALID' : 'VALID_UNOFFICIAL', 
            isOfficialMatch: isOfficial, 
            explanation: `Matches official 9-digit SIREN format. ${isOfficial ? 'Verified via Luhn.' : 'Pattern match.'}` 
        };
    }

    if (sanitized.length >= 4 && sanitized.length <= 15 && /^[A-Z0-9]+$/.test(sanitized)) {
        return { 
            isValid: true, 
            status: 'VALID', 
            isOfficialMatch: true, 
            explanation: 'Matches general Wallis and Futuna identifier alphanumeric format.' 
        };
    }

    return { 
        isValid: false, 
        status: 'INVALID_FORMAT',
        explanation: 'Value does not match Wallis and Futuna identifier format.'
    };
};

function validateLuhn(tin: string): boolean {
    let sum = 0;
    for (let i = 0; i < tin.length; i++) {
        let n = parseInt(tin[tin.length - 1 - i]);
        if (i % 2 === 1) {
            n *= 2;
            if (n > 9) n -= 9;
        }
        sum += n;
    }
    return sum % 10 === 0;
}

/**
 * APPENDIX: FORENSIC CRITERIA
 * Wallis and Futuna uses a system aligned with the French SIREN (9 digits).
 * 1. Scope: Managed locally by the Direction des Services Fiscaux (DSF).
 * 2. Structure: 9-digit numeric sequence.
 * 3. Validation: Modulo 10 (Luhn algorithm).
 * 4. Residency: Based on primary residence or legal seat.
 */
