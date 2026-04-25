
import { HolderMetadata, TinValidationResult, CountryRegulatoryInfo, TinInfo, TinRequirement } from './index';

/**
 * TIN Validation for Ivory Coast (CI)
 * NCC (7 to 10 characters)
 */

/**
 * TIN Requirements for Ivory Coast
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
 * Country Metadata for Ivory Coast
 */
export const COUNTRY_INFO: CountryRegulatoryInfo = {
    name: 'Costa de Marfil',
    authority: 'Direction Générale des Impôts (DGI)',
    compliance: {
        crsStatus: 'Non-Participating',
        crsDate: 'N/A',
        fatcaStatus: 'N/A'
    },
    residency: {
        individual: 'Se considera residente si tiene su residencia principal en Costa de Marfil o si permanece allí durante más de 183 días.',
        entity: 'Se considera residente si está incorporada en Costa de Marfil.',
        notes: 'Criterio de residencia principal o estancia de 183 días.'
    }
};

/**
 * TIN Metadata for Ivory Coast (Era 6.3)
 */
export const TIN_INFO: TinInfo = {
    name: 'NCC',
    description: 'Ivorian NCC issued by the DGI.',
    placeholder: '1234567A',
    officialLink: 'https://www.dgi.gouv.ci',
    isOfficial: true,
    lastUpdated: '2026-04-24',
    source: 'Local Authority / CI DGI',
    entityDifferentiation: {
        logic: 'Structurally identical identifiers.',
        individualDescription: 'NCC for individuals.',
        businessDescription: 'NCC for entities.'
    }
};

/**
 * Ivory Coast TIN Validator - Era 6.3
 */
export const validateCITIN = (
    value: string, 
    type: 'INDIVIDUAL' | 'ENTITY' | 'ANY' = 'ANY', 
    metadata?: HolderMetadata
): TinValidationResult => {
    const sanitized = value.trim().toUpperCase();

    if (sanitized.length >= 7 && sanitized.length <= 10 && /^[A-Z0-9]+$/.test(sanitized)) {
        return { 
            isValid: true, 
            status: 'VALID', 
            isOfficialMatch: true, 
            explanation: 'Matches official Ivorian NCC format.' 
        };
    }

    return { 
        isValid: false, 
        status: 'INVALID_FORMAT',
        explanation: 'Value does not match Ivorian NCC format.'
    };
};
