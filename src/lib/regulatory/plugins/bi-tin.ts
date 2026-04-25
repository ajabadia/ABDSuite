
import { HolderMetadata, TinValidationResult, CountryRegulatoryInfo, TinInfo, TinRequirement } from './index';

/**
 * TIN Validation for Burundi (BI)
 * NIF (10 digits)
 */

/**
 * TIN Requirements for Burundi
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
 * Country Metadata for Burundi
 */
export const COUNTRY_INFO: CountryRegulatoryInfo = {
    name: 'Burundi',
    authority: 'Office Burundais des Recettes (OBR)',
    compliance: {
        crsStatus: 'Non-Participating',
        crsDate: 'N/A',
        fatcaStatus: 'N/A'
    },
    residency: {
        individual: 'Se considera residente si permanece en Burundi durante más de 183 días en el año fiscal.',
        entity: 'Se considera residente si está incorporada en Burundi.',
        notes: 'Criterio de permanencia física o constitución legal.'
    }
};

/**
 * TIN Metadata for Burundi (Era 6.3)
 */
export const TIN_INFO: TinInfo = {
    name: 'NIF',
    description: 'Burundian NIF issued by the OBR.',
    placeholder: '1234567890',
    officialLink: 'https://www.obr.bi',
    isOfficial: true,
    lastUpdated: '2026-04-24',
    source: 'Local Authority / Burundi OBR',
    entityDifferentiation: {
        logic: 'Structurally identical identifiers.',
        individualDescription: '10-digit NIF identifier.',
        businessDescription: '10-digit NIF identifier.'
    }
};

/**
 * Burundi TIN Validator - Era 6.3
 */
export const validateBITIN = (
    value: string, 
    type: 'INDIVIDUAL' | 'ENTITY' | 'ANY' = 'ANY', 
    metadata?: HolderMetadata
): TinValidationResult => {
    const sanitized = value.replace(/[\s-]/g, '');

    if (sanitized.length === 10 && /^[0-9]{10}$/.test(sanitized)) {
        return { 
            isValid: true, 
            status: 'VALID', 
            isOfficialMatch: true, 
            explanation: 'Matches official Burundian NIF (10 digits) format.' 
        };
    }

    return { 
        isValid: false, 
        status: 'INVALID_FORMAT',
        explanation: 'Value does not match Burundian NIF (10 digits) format.'
    };
};
