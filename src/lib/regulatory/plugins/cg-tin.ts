
import { HolderMetadata, TinValidationResult, CountryRegulatoryInfo, TinInfo, TinRequirement } from './index';

/**
 * TIN Validation for Congo (CG)
 * NIU (variable length)
 */

/**
 * TIN Requirements for Congo
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
 * Country Metadata for Congo
 */
export const COUNTRY_INFO: CountryRegulatoryInfo = {
    name: 'Congo',
    authority: 'Direction Générale des Impôts (DGI)',
    compliance: {
        crsStatus: 'Non-Participating',
        crsDate: 'N/A',
        fatcaStatus: 'N/A'
    },
    residency: {
        individual: 'Se considera residente si tiene su residencia principal en el Congo o si permanece allí durante más de 183 días.',
        entity: 'Se considera residente si está incorporada en el Congo.',
        notes: 'Criterio de residencia principal o estancia de 183 días.'
    }
};

/**
 * TIN Metadata for Congo (Era 6.3)
 */
export const TIN_INFO: TinInfo = {
    name: 'NIU',
    description: 'Congolese NIU issued by the DGI.',
    placeholder: '1234567A',
    officialLink: 'https://www.impots.gouv.cg',
    isOfficial: true,
    lastUpdated: '2026-04-24',
    source: 'Local Authority / Congo DGI',
    entityDifferentiation: {
        logic: 'Structurally identical identifiers.',
        individualDescription: 'NIU for individuals.',
        businessDescription: 'NIU for entities.'
    }
};

/**
 * Congo TIN Validator - Era 6.3
 */
export const validateCGTIN = (
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
            explanation: 'Matches general Congolese NIU format.' 
        };
    }

    return { 
        isValid: false, 
        status: 'INVALID_FORMAT',
        explanation: 'Value does not match Congolese NIU format.'
    };
};
