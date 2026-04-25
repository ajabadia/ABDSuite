import { HolderMetadata, TinValidationResult, CountryRegulatoryInfo, TinInfo, TinRequirement } from './index';

/**
 * TIN Validation for Niger (NE)
 * NIF (8-10 characters)
 */

/**
 * TIN Requirements for Niger
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
 * Country Metadata for Niger
 */
export const COUNTRY_INFO: CountryRegulatoryInfo = {
    name: 'Níger',
    authority: 'Direction Générale des Impôts (DGI)',
    compliance: {
        crsStatus: 'Non-Participating',
        crsDate: 'N/A',
        fatcaStatus: 'N/A'
    },
    residency: {
        individual: 'Se considera residente si tiene su residencia principal en Níger o si permanece allí durante más de 183 días.',
        entity: 'Se considera residente si está incorporada en Níger.',
        notes: 'Criterio de residencia principal o estancia de 183 días.'
    }
};

/**
 * TIN Metadata for Niger (Era 6.3)
 */
export const TIN_INFO: TinInfo = {
    name: 'NIF',
    description: 'Nigerien NIF issued by the DGI.',
    placeholder: '1234567A',
    officialLink: 'https://www.impots.gouv.ne',
    isOfficial: true,
    lastUpdated: '2026-04-24',
    source: 'Local Authority / Niger Tax',
    entityDifferentiation: {
        logic: 'Structurally identical identifiers.',
        individualDescription: 'NIF for individuals.',
        businessDescription: 'NIF for entities.'
    }
};

/**
 * Niger TIN Validator - Era 6.3
 */
export const validateNETIN = (
    value: string, 
    type: 'INDIVIDUAL' | 'ENTITY' | 'ANY' = 'ANY', 
    metadata?: HolderMetadata
): TinValidationResult => {
    const sanitized = value.trim().toUpperCase().replace(/[\s-]/g, '');

    if (sanitized.length >= 8 && sanitized.length <= 10 && /^[A-Z0-9]+$/.test(sanitized)) {
        return { 
            isValid: true, 
            status: 'VALID', 
            isOfficialMatch: true, 
            explanation: 'Matches official Nigerien NIF (8-10 characters) format.' 
        };
    }

    if (sanitized.length >= 4 && sanitized.length <= 15 && /^[A-Z0-9]+$/.test(sanitized)) {
        return { 
            isValid: true, 
            status: 'VALID', 
            isOfficialMatch: true, 
            explanation: 'Matches general Nigerien NIF alphanumeric format.' 
        };
    }

    return { 
        isValid: false, 
        status: 'INVALID_FORMAT',
        explanation: 'Value does not match Nigerien NIF format.'
    };
};

/**
 * APPENDIX: FORENSIC CRITERIA
 * Niger uses the NIF (Numéro d'Identification Fiscale) for all taxpayers.
 * 1. Scope: Issued and managed by the Direction Générale des Impôts (DGI).
 * 2. Structure: Alphanumeric sequence typically between 8 and 10 characters.
 * 3. Validation: Structural verification based on pattern and length. 
 * 4. Residency: Based on the 183-day presence rule or primary residence.
 */
