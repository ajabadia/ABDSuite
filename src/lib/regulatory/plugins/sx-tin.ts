import { HolderMetadata, TinValidationResult, CountryRegulatoryInfo, TinInfo, TinRequirement } from './index';

/**
 * TIN Validation for Sint Maarten (SX)
 * CRIB Number (9 digits)
 */

/**
 * TIN Requirements for Sint Maarten
 */
export const TIN_REQUIREMENTS: TinRequirement[] = [];

/**
 * Country Metadata for Sint Maarten
 */
export const COUNTRY_INFO: CountryRegulatoryInfo = {
    name: 'San Martín (Países Bajos)',
    authority: 'Tax Administration of Sint Maarten',
    compliance: {
        crsStatus: 'Participating',
        crsDate: 'September 2018',
        fatcaStatus: 'Model 1 (In Force)'
    },
    residency: {
        individual: 'Se considera residente si permanece en Sint Maarten durante la mayor parte del año o tiene su hogar permanente allí.',
        entity: 'Se considera residente si se ha incorporado bajo las leyes de Sint Maarten.',
        notes: 'Criterio de hogar permanente o residencia principal.'
    }
};

/**
 * TIN Metadata for Sint Maarten (Era 6.3)
 */
export const TIN_INFO: TinInfo = {
    name: 'CRIB Number',
    description: 'Unique 9-digit identifier (Centraal Registratie Informatie Belastingplichtige).',
    placeholder: '123456789',
    officialLink: 'https://taxoffice.sx',
    isOfficial: true,
    lastUpdated: '2026-04-24',
    source: 'OECD Portal / Tax Administration of Sint Maarten',
    entityDifferentiation: {
        logic: 'Numeric sequence without structural differentiation.',
        individualDescription: '9-digit CRIB Number.',
        businessDescription: '9-digit CRIB Number.'
    }
};

/**
 * Sint Maarten TIN Validator (9 digits) - Era 6.3
 */
export const validateSXTIN = (
    value: string, 
    type: 'INDIVIDUAL' | 'ENTITY' | 'ANY' = 'ANY', 
    metadata?: HolderMetadata
): TinValidationResult => {
    const sanitized = value.trim().replace(/[\s-]/g, '');

    if (sanitized.length === 9 && /^[0-9]{9}$/.test(sanitized)) {
        const isOfficial = validateCRIBChecksum(sanitized);
        return { 
            isValid: true, 
            status: isOfficial ? 'VALID' : 'VALID_UNOFFICIAL', 
            isOfficialMatch: isOfficial, 
            explanation: `Matches official 9-digit Sint Maarten CRIB format. ${isOfficial ? 'Verified via Modulo 11.' : 'Pattern match.'}` 
        };
    }

    return { 
        isValid: false, 
        status: 'INVALID_FORMAT', 
        explanation: 'Sint Maarten CRIB numbers must be exactly 9 digits long.' 
    };
};

function validateCRIBChecksum(tin: string): boolean {
    let sum = 0;
    for (let i = 0; i < 8; i++) {
        sum += parseInt(tin[i]) * (9 - i);
    }
    const checkDigit = parseInt(tin[8]);
    const remainder = sum % 11;
    
    // Standard Dutch-style Modulo 11 (Rule of 11)
    if (remainder === 10) return false; // Common practice in former Netherlands Antilles
    return remainder === checkDigit;
}

/**
 * APPENDIX: FORENSIC CRITERIA
 * The CRIB Number (Centraal Registratie Informatie Belastingplichtige) is the 
 * standard tax identifier in Sint Maarten. 
 * 1. Scope: Issued and managed by the Tax Administration of Sint Maarten.
 * 2. Structure: 9-digit numeric code.
 * 3. Validation: Modulo 11 weighted sum (9*d1 + 8*d2 + ... + 2*d8).
 * 4. Residency: Based on the "center of vital interests" or permanent home rule.
 */
