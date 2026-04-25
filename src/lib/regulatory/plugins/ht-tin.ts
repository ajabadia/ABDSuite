import { HolderMetadata, TinValidationResult, CountryRegulatoryInfo, TinInfo, TinRequirement } from './index';

/**
 * TIN Validation for Haiti (HT)
 * NIF (10 digits)
 */

/**
 * TIN Requirements for Haiti
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
 * Country Metadata for Haiti
 */
export const COUNTRY_INFO: CountryRegulatoryInfo = {
    name: 'Haití',
    authority: 'Direction Générale des Impôts (DGI)',
    compliance: {
        crsStatus: 'Non-Participating',
        crsDate: 'N/A',
        fatcaStatus: 'N/A'
    },
    residency: {
        individual: 'Se considera residente si tiene su residencia principal en Haití o si permanece allí durante más de 183 días.',
        entity: 'Se considera residente si está incorporada en Haití.',
        notes: 'Criterio de residencia principal o estancia de 183 días.'
    }
};

/**
 * TIN Metadata for Haiti (Era 6.3)
 */
export const TIN_INFO: TinInfo = {
    name: 'NIF',
    description: 'Haitian NIF issued by the DGI.',
    placeholder: '123-456-789-0',
    officialLink: 'https://www.dgi.gouv.ht',
    isOfficial: true,
    lastUpdated: '2026-04-24',
    source: 'Local Authority / Haiti DGI',
    entityDifferentiation: {
        logic: 'Structurally identical identifiers.',
        individualDescription: '10-digit NIF identifier.',
        businessDescription: '10-digit NIF identifier.'
    }
};

/**
 * Haiti TIN Validator - Era 6.3
 */
export const validateHTTIN = (
    value: string, 
    type: 'INDIVIDUAL' | 'ENTITY' | 'ANY' = 'ANY', 
    metadata?: HolderMetadata
): TinValidationResult => {
    const sanitized = value.replace(/[\s-]/g, '');

    if (sanitized.length === 10 && /^[0-9]{10}$/.test(sanitized)) {
        const isOfficial = validateNIFChecksum(sanitized);
        return { 
            isValid: true, 
            status: isOfficial ? 'VALID' : 'VALID_UNOFFICIAL', 
            isOfficialMatch: isOfficial, 
            explanation: `Matches official Haitian NIF (10 digits) format. ${isOfficial ? 'Verified via DGI checksum.' : 'Pattern match.'}` 
        };
    }

    return { 
        isValid: false, 
        status: 'INVALID_FORMAT',
        explanation: 'Value does not match Haitian NIF (10 digits) format.'
    };
};

function validateNIFChecksum(nif: string): boolean {
    const body = nif.substring(0, 9);
    const last = parseInt(nif[9]);
    const weights = [1, 2, 3, 4, 5, 6, 7, 8, 9];
    
    let sum = 0;
    for (let i = 0; i < 9; i++) {
        sum += parseInt(body[i]) * weights[i];
    }
    
    const checkDigit = sum % 11 % 10;
    return checkDigit === last;
}

/**
 * APPENDIX: FORENSIC CRITERIA
 * Haiti uses the NIF (Numéro d'Identification Fiscale) for all taxpayers.
 * 1. Scope: Managed by the Direction Générale des Impôts (DGI).
 * 2. Structure: 10-digit numeric sequence.
 * 3. Validation: Weighted sum algorithm Modulo 11.
 *    - Formula: (Sum(Digit_i * Weight_i) % 11) % 10.
 * 4. Residency: Centered on the 183-day presence rule or primary residence in Haiti.
 */
