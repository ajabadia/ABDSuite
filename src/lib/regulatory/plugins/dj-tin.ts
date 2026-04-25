
import { HolderMetadata, TinValidationResult, CountryRegulatoryInfo, TinInfo, TinRequirement } from './index';

/**
 * TIN Validation for Djibouti (DJ)
 * NIF (variable length)
 */

/**
 * TIN Requirements for Djibouti
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
 * Country Metadata for Djibouti
 */
export const COUNTRY_INFO: CountryRegulatoryInfo = {
    name: 'Yibuti',
    authority: 'Direction Générale des Impôts (DGI)',
    compliance: {
        crsStatus: 'Non-Participating',
        crsDate: 'N/A',
        fatcaStatus: 'N/A'
    },
    residency: {
        individual: 'Se considera residente si tiene su residencia principal en Yibuti o si permanece allí durante más de 183 días.',
        entity: 'Se considera residente si está incorporada en Yibuti.',
        notes: 'Criterio de residencia principal o estancia de 183 días.'
    }
};

/**
 * TIN Metadata for Djibouti (Era 6.3)
 */
export const TIN_INFO: TinInfo = {
    name: 'NIF',
    description: 'Djiboutian NIF issued by the DGI.',
    placeholder: '1234567A',
    officialLink: 'https://www.ministere-finances.dj',
    isOfficial: true,
    lastUpdated: '2026-04-24',
    source: 'Local Authority / Djibouti Tax',
    entityDifferentiation: {
        logic: 'Structurally identical identifiers.',
        individualDescription: 'NIF for individuals.',
        businessDescription: 'NIF for entities.'
    }
};

/**
 * Djibouti TIN Validator - Era 6.3
 */
export const validateDJTIN = (
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
            explanation: 'Matches general Djiboutian NIF format.' 
        };
    }

    return { 
        isValid: false, 
        status: 'INVALID_FORMAT',
        explanation: 'Value does not match Djiboutian NIF format.'
    };
};
