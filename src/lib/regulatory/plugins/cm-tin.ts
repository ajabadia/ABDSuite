
import { HolderMetadata, TinValidationResult, CountryRegulatoryInfo, TinInfo, TinRequirement } from './index';

/**
 * TIN Validation for Cameroon (CM)
 * NIU (variable length)
 */

/**
 * TIN Requirements for Cameroon
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
 * Country Metadata for Cameroon
 */
export const COUNTRY_INFO: CountryRegulatoryInfo = {
    name: 'Camerún',
    authority: 'Direction Générale des Impôts (DGI)',
    compliance: {
        crsStatus: 'Non-Participating',
        crsDate: 'N/A',
        fatcaStatus: 'N/A'
    },
    residency: {
        individual: 'Se considera residente si tiene su residencia principal en Camerún o si permanece allí durante más de 183 días.',
        entity: 'Se considera residente si está incorporada en Camerún.',
        notes: 'Criterio de residencia principal o estancia de 183 días.'
    }
};

/**
 * TIN Metadata for Cameroon (Era 6.3)
 */
export const TIN_INFO: TinInfo = {
    name: 'NIU',
    description: 'Cameroonian NIU issued by the DGI.',
    placeholder: '12345678901A',
    officialLink: 'https://www.impots.cm',
    isOfficial: true,
    lastUpdated: '2026-04-24',
    source: 'Local Authority / Cameroon Tax',
    entityDifferentiation: {
        logic: 'Structurally identical identifiers.',
        individualDescription: 'NIU for individuals.',
        businessDescription: 'NIU for entities.'
    }
};

/**
 * Cameroon TIN Validator - Era 6.3
 */
export const validateCMTIN = (
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
            explanation: 'Matches general Cameroonian NIU format.' 
        };
    }

    return { 
        isValid: false, 
        status: 'INVALID_FORMAT',
        explanation: 'Value does not match Cameroonian NIU format.'
    };
};
