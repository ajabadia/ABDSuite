
import { HolderMetadata, TinValidationResult, CountryRegulatoryInfo, TinInfo } from './index';

/**
 * TIN Validation for Bonaire, Sint Eustatius and Saba (BQ)
 * BSN (8 or 9 digits)
 */

/**
 * TIN Requirements for Bonaire, Sint Eustatius and Saba
 */
export const TIN_REQUIREMENTS = [
    'Burgerservicenummer (BSN) is the identifier.',
    'Format: 8 or 9 digits.'
];

/**
 * Country Metadata for Bonaire, Sint Eustatius and Saba
 */
export const COUNTRY_INFO: CountryRegulatoryInfo = {
    name: 'Bonaire, San Eustaquio y Saba',
    authority: 'Belastingdienst Caribisch Nederland',
    compliance: {
        crsStatus: 'Non-Participating',
        crsDate: 'N/A',
        fatcaStatus: 'N/A'
    },
    residency: {
        individual: 'Se considera residente si tiene su residencia principal en las islas.',
        entity: 'Se considera residente si se ha incorporado en las islas.',
        notes: 'Criterio de residencia principal.'
    }
};

/**
 * TIN Metadata for Bonaire, Sint Eustatius and Saba (Era 6.3)
 */
export const TIN_INFO: TinInfo = {
    name: 'BSN',
    description: 'Caribbean Dutch BSN issued by Belastingdienst Caribisch Nederland.',
    placeholder: '123456789',
    officialLink: 'https://www.belastingdienst-cn.nl',
    isOfficial: true,
    lastUpdated: '2026-04-24',
    source: 'Local Authority / BCN Tax',
    entityDifferentiation: {
        logic: 'Structurally identical identifiers.',
        individualDescription: '8 or 9-digit BSN.',
        businessDescription: '8 or 9-digit BSN.'
    }
};

/**
 * Bonaire, Sint Eustatius and Saba TIN Validator - Era 6.3
 */
export const validateBQTIN = (
    value: string, 
    type: 'INDIVIDUAL' | 'ENTITY' | 'ANY' = 'ANY', 
    metadata?: HolderMetadata
): TinValidationResult => {
    const sanitized = value.replace(/[\s-]/g, '');

    if ((sanitized.length === 8 || sanitized.length === 9) && /^[0-9]+$/.test(sanitized)) {
        return { 
            isValid: true, 
            status: 'VALID', 
            isOfficialMatch: true, 
            explanation: `Matches official Caribbean Dutch BSN (${sanitized.length} digits) format.` 
        };
    }

    return { 
        isValid: false, 
        status: 'INVALID_FORMAT',
        explanation: 'Value does not match Caribbean Dutch BSN (8-9 digits) format.'
    };
};
