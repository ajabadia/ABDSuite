
import { HolderMetadata, TinValidationResult, CountryRegulatoryInfo, TinInfo } from './index';

/**
 * TIN Validation for Guernsey (GG)
 * Tax Reference Number (variable length)
 */

/**
 * TIN Requirements for Guernsey
 */
export const TIN_REQUIREMENTS = [
    'Tax Reference Number is the identifier for individuals and entities.',
    'Format: Alphanumeric of variable length (often starts with letters).'
];

/**
 * Country Metadata for Guernsey
 */
export const COUNTRY_INFO: CountryRegulatoryInfo = {
    name: 'Guernsey',
    authority: 'Revenue Service',
    compliance: {
        crsStatus: 'Participating',
        crsDate: 'September 2017',
        fatcaStatus: 'Model 1 (In Force)'
    },
    residency: {
        individual: 'Se considera residente si tiene su residencia principal en Guernsey o si permanece allí durante más de 182 días en el año civil.',
        entity: 'Se considera residente si se ha incorporado en Guernsey o si su gestión y control se ejercen allí.',
        notes: 'Criterio de residencia principal o estancia de 182 días.'
    }
};

/**
 * TIN Metadata for Guernsey (Era 6.3)
 */
export const TIN_INFO: TinInfo = {
    name: 'Tax Reference Number',
    description: 'Guernsey Tax Reference Number issued by the Revenue Service.',
    placeholder: '12345A',
    officialLink: 'https://www.gov.gg/tax',
    isOfficial: true,
    lastUpdated: '2026-04-24',
    source: 'OECD Portal / Guernsey Tax',
    entityDifferentiation: {
        logic: 'Structurally identical identifiers.',
        individualDescription: 'Tax Reference Number for individuals.',
        businessDescription: 'Tax Reference Number for entities.'
    }
};

/**
 * Guernsey TIN Validator - Era 6.3
 */
export const validateGGTIN = (
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
            explanation: 'Matches general Guernsey Tax Reference Number format.' 
        };
    }

    return { 
        isValid: false, 
        status: 'INVALID_FORMAT',
        explanation: 'Value does not match Guernsey Tax Reference Number format.'
    };
};
