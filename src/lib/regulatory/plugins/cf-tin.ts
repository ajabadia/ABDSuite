
import { HolderMetadata, TinValidationResult, CountryRegulatoryInfo, TinInfo, TinRequirement } from './index';

/**
 * TIN Validation for Central African Republic (CF)
 * NIF (variable length)
 */

/**
 * TIN Requirements for Central African Republic
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
 * Country Metadata for Central African Republic
 */
export const COUNTRY_INFO: CountryRegulatoryInfo = {
    name: 'República Centroafricana',
    authority: 'Direction Générale des Impôts (DGI)',
    compliance: {
        crsStatus: 'Non-Participating',
        crsDate: 'N/A',
        fatcaStatus: 'N/A'
    },
    residency: {
        individual: 'Se considera residente si tiene su residencia principal en la República Centroafricana o si permanece allí durante más de 183 días.',
        entity: 'Se considera residente si está incorporada en la República Centroafricana.',
        notes: 'Criterio de residencia principal o estancia de 183 días.'
    }
};

/**
 * TIN Metadata for Central African Republic (Era 6.3)
 */
export const TIN_INFO: TinInfo = {
    name: 'NIF',
    description: 'Central African NIF issued by the DGI.',
    placeholder: '1234567A',
    officialLink: 'https://www.finances.gouv.cf',
    isOfficial: true,
    lastUpdated: '2026-04-24',
    source: 'Local Authority / CAR Tax',
    entityDifferentiation: {
        logic: 'Structurally identical identifiers.',
        individualDescription: 'NIF for individuals.',
        businessDescription: 'NIF for entities.'
    }
};

/**
 * Central African Republic TIN Validator - Era 6.3
 */
export const validateCFTIN = (
    value: string, 
    type: 'INDIVIDUAL' | 'ENTITY' | 'ANY' = 'ANY', 
    metadata?: HolderMetadata
): TinValidationResult => {
    const sanitized = value.trim().toUpperCase();

    if (sanitized.length >= 4 && sanitized.length <= 15 && /^[A-Z0-9]+$/.test(sanitized)) {
        return { 
            isValid: true, 
            status: 'VALID', 
            isOfficialMatch: true, 
            explanation: 'Matches general Central African NIF format.' 
        };
    }

    return { 
        isValid: false, 
        status: 'INVALID_FORMAT',
        explanation: 'Value does not match Central African NIF format.'
    };
};
