import { HolderMetadata, TinValidationResult, CountryRegulatoryInfo, TinInfo, TinRequirement } from './index';

/**
 * TIN Validation for Jamaica (JM)
 * Taxpayer Registration Number (TRN) (9 digits)
 */

/**
 * TIN Requirements for Jamaica
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
 * Country Metadata for Jamaica
 */
export const COUNTRY_INFO: CountryRegulatoryInfo = {
    name: 'Jamaica',
    authority: 'Tax Administration Jamaica (TAJ)',
    compliance: {
        crsStatus: 'Non-Participating',
        crsDate: 'N/A',
        fatcaStatus: 'Model 1 (In Force)'
    },
    residency: {
        individual: 'Se considera residente si permanece en Jamaica durante más de 183 días en el año fiscal.',
        entity: 'Se considera residente si su gestión y control se ejercen en Jamaica.',
        notes: 'Criterio de permanencia física o control de gestión.'
    }
};

/**
 * TIN Metadata for Jamaica (Era 6.3)
 */
export const TIN_INFO: TinInfo = {
    name: 'TRN',
    description: 'Jamaican TRN issued by the TAJ.',
    placeholder: '123-456-789',
    officialLink: 'https://www.taj.gov.jm',
    isOfficial: true,
    lastUpdated: '2026-04-24',
    source: 'Local Authority / Jamaica TAJ',
    entityDifferentiation: {
        logic: 'Structurally identical identifiers.',
        individualDescription: '9-digit TRN identifier.',
        businessDescription: '9-digit TRN identifier.'
    }
};

/**
 * Jamaica TIN Validator - Era 6.3
 */
export const validateJMTIN = (
    value: string, 
    type: 'INDIVIDUAL' | 'ENTITY' | 'ANY' = 'ANY', 
    metadata?: HolderMetadata
): TinValidationResult => {
    const sanitized = value.replace(/[\s-]/g, '');

    if (sanitized.length === 9 && /^[0-9]{9}$/.test(sanitized)) {
        const isOfficial = validateTRNChecksum(sanitized);
        return { 
            isValid: true, 
            status: isOfficial ? 'VALID' : 'VALID_UNOFFICIAL', 
            isOfficialMatch: isOfficial, 
            explanation: `Matches official Jamaican TRN (9 digits) format. ${isOfficial ? 'Verified via TAJ checksum.' : 'Pattern match.'}` 
        };
    }

    return { 
        isValid: false, 
        status: 'INVALID_FORMAT',
        explanation: 'Value does not match Jamaican TRN (9 digits) format.'
    };
};

function validateTRNChecksum(trn: string): boolean {
    const body = trn.substring(0, 8);
    const last = parseInt(trn[8]);
    const weights = [1, 2, 3, 4, 5, 6, 7, 8];
    
    let sum = 0;
    for (let i = 0; i < 8; i++) {
        sum += parseInt(body[i]) * weights[i];
    }
    
    const checkDigit = sum % 11 % 10;
    return checkDigit === last;
}

/**
 * APPENDIX: FORENSIC CRITERIA
 * Jamaica uses the TRN (Taxpayer Registration Number) for all tax-related 
 * activities.
 * 1. Scope: Managed by Tax Administration Jamaica (TAJ).
 * 2. Structure: 9-digit numeric sequence.
 * 3. Validation: Weighted sum algorithm Modulo 11.
 *    - Formula: (Sum(Digit_i * Weight_i) % 11) % 10.
 * 4. Residency: Centered on the 183-day presence rule or management and control 
 *    in Jamaica.
 */
