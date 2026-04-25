
import { HolderMetadata, TinValidationResult, CountryRegulatoryInfo, TinInfo } from './index';

/**
 * TIN Validation for Brunei (BN)
 * TIN (variable length)
 */

/**
 * TIN Requirements for Brunei
 */
export const TIN_REQUIREMENTS = [
    'Tax Identification Number (TIN) is the identifier.',
    'Format: Alphanumeric or numeric of variable length.'
];

/**
 * Country Metadata for Brunei
 */
export const COUNTRY_INFO: CountryRegulatoryInfo = {
    name: 'Brunéi',
    authority: 'Revenue Division, Ministry of Finance and Economy',
    compliance: {
        crsStatus: 'Participating',
        crsDate: 'September 2024',
        fatcaStatus: 'Model 1 (In Force)'
    },
    residency: {
        individual: 'Se considera residente si permanece en Brunéi durante más de 183 días en el año civil.',
        entity: 'Se considera residente si el control y la gestión se ejercen en Brunéi.',
        notes: 'Criterio de permanencia física o control y gestión.'
    }
};

/**
 * TIN Metadata for Brunei (Era 6.3)
 */
export const TIN_INFO: TinInfo = {
    name: 'TIN',
    description: 'Bruneian TIN issued by the Revenue Division.',
    placeholder: '12345678',
    officialLink: 'https://www.mofe.gov.bn',
    isOfficial: true,
    lastUpdated: '2026-04-24',
    source: 'Local Authority / Brunei Tax',
    entityDifferentiation: {
        logic: 'Structurally identical identifiers.',
        individualDescription: 'TIN for individuals.',
        businessDescription: 'TIN for entities.'
    }
};

/**
 * Brunei TIN Validator - Era 6.3
 */
export const validateBNTIN = (
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
            explanation: 'Matches general Bruneian TIN format.' 
        };
    }

    return { 
        isValid: false, 
        status: 'INVALID_FORMAT',
        explanation: 'Value does not match Bruneian TIN format.'
    };
};
