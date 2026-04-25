
import { HolderMetadata, TinValidationResult, CountryRegulatoryInfo, TinInfo } from './index';

/**
 * TIN Validation for Bhutan (BT)
 * Taxpayer Number (TPN) (variable length)
 */

/**
 * TIN Requirements for Bhutan
 */
export const TIN_REQUIREMENTS = [
    'Taxpayer Number (TPN) is the identifier.',
    'Format: Alphanumeric or numeric of variable length.'
];

/**
 * Country Metadata for Bhutan
 */
export const COUNTRY_INFO: CountryRegulatoryInfo = {
    name: 'Bután',
    authority: 'Department of Revenue and Customs (DRC)',
    compliance: {
        crsStatus: 'Non-Participating',
        crsDate: 'N/A',
        fatcaStatus: 'N/A'
    },
    residency: {
        individual: 'Se considera residente si permanece en Bután durante más de 183 días en el año fiscal.',
        entity: 'Se considera residente si está incorporada en Bután.',
        notes: 'Criterio de permanencia física o constitución legal.'
    }
};

/**
 * TIN Metadata for Bhutan (Era 6.3)
 */
export const TIN_INFO: TinInfo = {
    name: 'TPN',
    description: 'Bhutanese TPN issued by the DRC.',
    placeholder: '1234567',
    officialLink: 'https://www.drc.gov.bt',
    isOfficial: true,
    lastUpdated: '2026-04-24',
    source: 'Local Authority / Bhutan DRC',
    entityDifferentiation: {
        logic: 'Structurally identical identifiers.',
        individualDescription: 'TPN for individuals.',
        businessDescription: 'TPN for entities.'
    }
};

/**
 * Bhutan TIN Validator - Era 6.3
 */
export const validateBTTIN = (
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
            explanation: 'Matches general Bhutanese TPN format.' 
        };
    }

    return { 
        isValid: false, 
        status: 'INVALID_FORMAT',
        explanation: 'Value does not match Bhutanese TPN format.'
    };
};
