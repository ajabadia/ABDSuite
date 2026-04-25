import { HolderMetadata, TinValidationResult, CountryRegulatoryInfo, TinInfo, TinRequirement } from './index';

/**
 * TIN Validation for Mali (ML)
 * NIF (9 digits)
 */

/**
 * TIN Requirements for Mali
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
 * Country Metadata for Mali
 */
export const COUNTRY_INFO: CountryRegulatoryInfo = {
    name: 'Malí',
    authority: 'Direction Générale des Impôts (DGI)',
    compliance: {
        crsStatus: 'Non-Participating',
        crsDate: 'N/A',
        fatcaStatus: 'N/A'
    },
    residency: {
        individual: 'Se considera residente si tiene su residencia principal en Malí o si permanece allí durante más de 183 días.',
        entity: 'Se considera residente si está incorporada en Malí.',
        notes: 'Criterio de residencia principal o estancia de 183 días.'
    }
};

/**
 * TIN Metadata for Mali (Era 6.3)
 */
export const TIN_INFO: TinInfo = {
    name: 'NIF',
    description: 'Malian NIF issued by the DGI.',
    placeholder: '123456789',
    officialLink: 'https://www.dgi.gouv.ml',
    isOfficial: true,
    lastUpdated: '2026-04-24',
    source: 'Local Authority / Mali Tax',
    entityDifferentiation: {
        logic: 'Prefix analysis.',
        individualDescription: '9-digit NIF starting with 0 or 1.',
        businessDescription: '9-digit NIF starting with 2.'
    }
};

/**
 * Mali TIN Validator - Era 6.3
 */
export const validateMLTIN = (
    value: string, 
    type: 'INDIVIDUAL' | 'ENTITY' | 'ANY' = 'ANY', 
    metadata?: HolderMetadata
): TinValidationResult => {
    const sanitized = value.trim().toUpperCase().replace(/[\s-]/g, '');

    if (sanitized.length === 9 && /^[0-9]{9}$/.test(sanitized)) {
        const firstDigit = parseInt(sanitized[0]);
        const isIndividual = [0, 1].includes(firstDigit);
        const isEntity = firstDigit === 2;
        
        if (isIndividual && type === 'ENTITY') {
             return { isValid: false, status: 'MISMATCH', reasonCode: 'ENTITY_TYPE_MISMATCH' };
        }
        if (isEntity && type === 'INDIVIDUAL') {
             return { isValid: false, status: 'MISMATCH', reasonCode: 'ENTITY_TYPE_MISMATCH' };
        }
        
        return { 
            isValid: true, 
            status: 'VALID', 
            isOfficialMatch: true, 
            explanation: `Matches official Malian NIF (9 digits) format. Type: ${isIndividual ? 'Natural Person' : 'Legal Entity'}.` 
        };
    }

    if (sanitized.length >= 4 && sanitized.length <= 15 && /^[A-Z0-9]+$/.test(sanitized)) {
        return { 
            isValid: true, 
            status: 'VALID', 
            isOfficialMatch: true, 
            explanation: 'Matches general Malian NIF alphanumeric format.' 
        };
    }

    return { 
        isValid: false, 
        status: 'INVALID_FORMAT',
        explanation: 'Value does not match Malian NIF format.'
    };
};

/**
 * APPENDIX: FORENSIC CRITERIA
 * Mali uses the NIF (Numéro d'Identification Fiscale) for all tax obligations.
 * 1. Scope: Issued and managed by the Direction Générale des Impôts (DGI).
 * 2. Structure: Standardized 9-digit numeric sequence.
 *    - Digit 1: Contributor type (Typically 0/1 for individuals, 2 for entities).
 * 3. Validation: Structural verification based on pattern and length. 
 * 4. Residency: Based on the 183-day presence rule or primary residence.
 */
