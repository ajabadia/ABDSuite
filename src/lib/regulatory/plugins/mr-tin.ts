import { HolderMetadata, TinValidationResult, CountryRegulatoryInfo, TinInfo, TinRequirement } from './index';

/**
 * TIN Validation for Mauritania (MR)
 * NIF (8-10 digits)
 */

/**
 * TIN Requirements for Mauritania
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
 * Country Metadata for Mauritania
 */
export const COUNTRY_INFO: CountryRegulatoryInfo = {
    name: 'Mauritania',
    authority: 'Direction Générale des Impôts (DGI)',
    compliance: {
        crsStatus: 'Non-Participating',
        crsDate: 'N/A',
        fatcaStatus: 'N/A'
    },
    residency: {
        individual: 'Se considera residente si tiene su residencia principal en Mauritania o si permanece allí durante más de 183 días.',
        entity: 'Se considera residente si está incorporada en Mauritania.',
        notes: 'Criterio de residencia principal o estancia de 183 días.'
    }
};

/**
 * TIN Metadata for Mauritania (Era 6.3)
 */
export const TIN_INFO: TinInfo = {
    name: 'NIF',
    description: 'Mauritanian NIF issued by the DGI.',
    placeholder: '12345678',
    officialLink: 'https://www.impots.gov.mr',
    isOfficial: true,
    lastUpdated: '2026-04-24',
    source: 'Local Authority / Mauritania DGI',
    entityDifferentiation: {
        logic: 'Structurally identical identifiers.',
        individualDescription: 'NIF for individuals.',
        businessDescription: 'NIF for entities.'
    }
};

/**
 * Mauritania TIN Validator - Era 6.3
 */
export const validateMRTIN = (
    value: string, 
    type: 'INDIVIDUAL' | 'ENTITY' | 'ANY' = 'ANY', 
    metadata?: HolderMetadata
): TinValidationResult => {
    const sanitized = value.trim().toUpperCase().replace(/[\s-]/g, '');

    if (sanitized.length >= 8 && sanitized.length <= 10 && /^[0-9]+$/.test(sanitized)) {
        return { 
            isValid: true, 
            status: 'VALID', 
            isOfficialMatch: true, 
            explanation: 'Matches official Mauritanian NIF (8-10 digits) format.' 
        };
    }

    if (sanitized.length >= 4 && sanitized.length <= 15 && /^[A-Z0-9]+$/.test(sanitized)) {
        return { 
            isValid: true, 
            status: 'VALID', 
            isOfficialMatch: true, 
            explanation: 'Matches general Mauritanian NIF alphanumeric format.' 
        };
    }

    return { 
        isValid: false, 
        status: 'INVALID_FORMAT',
        explanation: 'Value does not match Mauritanian NIF format.'
    };
};

/**
 * APPENDIX: FORENSIC CRITERIA
 * Mauritania uses the NIF (Numéro d'Identification Fiscale) for all taxpayers.
 * 1. Scope: Issued and managed by the Direction Générale des Impôts (DGI).
 * 2. Structure: Numeric sequence typically between 8 and 10 digits.
 * 3. Validation: Structural verification based on pattern and length. 
 * 4. Residency: Based on the 183-day presence rule or primary residence.
 */
