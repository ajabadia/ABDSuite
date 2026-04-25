import { HolderMetadata, TinValidationResult, CountryRegulatoryInfo, TinInfo, TinRequirement } from './index';

/**
 * TIN Validation for Comoros (KM)
 * NIF (7-10 digits)
 */

/**
 * TIN Requirements for Comoros
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
 * Country Metadata for Comoros
 */
export const COUNTRY_INFO: CountryRegulatoryInfo = {
    name: 'Comoras',
    authority: 'Administration Générale des Impôts et des Domaines (AGID)',
    compliance: {
        crsStatus: 'Non-Participating',
        crsDate: 'N/A',
        fatcaStatus: 'N/A'
    },
    residency: {
        individual: 'Se considera residente si tiene su residencia principal en Comoras o si permanece allí durante más de 183 días.',
        entity: 'Se considera residente si está incorporada en Comoras.',
        notes: 'Criterio de residencia principal o estancia de 183 días.'
    }
};

/**
 * TIN Metadata for Comoros (Era 6.3)
 */
export const TIN_INFO: TinInfo = {
    name: 'NIF',
    description: 'Comorian NIF issued by the AGID.',
    placeholder: '12345678',
    officialLink: 'https://www.agid.km',
    isOfficial: true,
    lastUpdated: '2026-04-24',
    source: 'Local Authority / Comoros AGID',
    entityDifferentiation: {
        logic: 'Structurally identical identifiers.',
        individualDescription: 'NIF for individuals.',
        businessDescription: 'NIF for entities.'
    }
};

/**
 * Comoros TIN Validator - Era 6.3
 */
export const validateKMTIN = (
    value: string, 
    type: 'INDIVIDUAL' | 'ENTITY' | 'ANY' = 'ANY', 
    metadata?: HolderMetadata
): TinValidationResult => {
    const sanitized = value.trim().toUpperCase().replace(/[\s-]/g, '');

    if (sanitized.length >= 7 && sanitized.length <= 10 && /^[0-9]+$/.test(sanitized)) {
        return { 
            isValid: true, 
            status: 'VALID', 
            isOfficialMatch: true, 
            explanation: 'Matches official Comorian NIF format.' 
        };
    }

    if (sanitized.length >= 4 && sanitized.length <= 15 && /^[A-Z0-9]+$/.test(sanitized)) {
        return { 
            isValid: true, 
            status: 'VALID', 
            isOfficialMatch: true, 
            explanation: 'Matches general Comorian NIF alphanumeric format.' 
        };
    }

    return { 
        isValid: false, 
        status: 'INVALID_FORMAT',
        explanation: 'Value does not match Comorian NIF format.'
    };
};

/**
 * APPENDIX: FORENSIC CRITERIA
 * Comoros uses the NIF (Numéro d'Identification Fiscale) for all taxpayers.
 * 1. Scope: Managed by the Administration Générale des Impôts et des Domaines (AGID).
 * 2. Structure: Numeric sequence typically between 7 and 10 digits.
 * 3. Validation: Structural verification based on pattern and length. 
 * 4. Residency: Centered on the 183-day presence rule or primary residence.
 */
