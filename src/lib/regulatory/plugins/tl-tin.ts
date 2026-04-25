
import { HolderMetadata, TinValidationResult, CountryRegulatoryInfo, TinInfo } from './index';

/**
 * TIN Validation for Timor-Leste (TL)
 * TIN (7 digits)
 */

/**
 * TIN Requirements for Timor-Leste
 */
export const TIN_REQUIREMENTS = [
    'Tax Identification Number (TIN) is the identifier for individuals and entities.',
    'Format: 7 digits.'
];

/**
 * Country Metadata for Timor-Leste
 */
export const COUNTRY_INFO: CountryRegulatoryInfo = {
    name: 'Timor-Leste',
    authority: 'Autoridade Tributária de Timor-Leste',
    compliance: {
        crsStatus: 'Non-Participating',
        crsDate: 'N/A',
        fatcaStatus: 'N/A'
    },
    residency: {
        individual: 'Se considera residente si permanece en Timor-Leste durante más de 183 días en el año fiscal.',
        entity: 'Se considera residente si está incorporada en Timor-Leste.',
        notes: 'Criterio de permanencia física o constitución legal.'
    }
};

/**
 * TIN Metadata for Timor-Leste (Era 6.3)
 */
export const TIN_INFO: TinInfo = {
    name: 'TIN',
    description: 'Timorese TIN issued by the Tax Authority.',
    placeholder: '1234567',
    officialLink: 'https://www.attl.gov.tl',
    isOfficial: true,
    lastUpdated: '2026-04-24',
    source: 'Local Authority / Timor-Leste Tax',
    entityDifferentiation: {
        logic: 'Structurally identical identifiers.',
        individualDescription: '7-digit TIN identifier.',
        businessDescription: '7-digit TIN identifier.'
    }
};

/**
 * Timor-Leste TIN Validator - Era 6.3
 */
export const validateTLTIN = (
    value: string, 
    type: 'INDIVIDUAL' | 'ENTITY' | 'ANY' = 'ANY', 
    metadata?: HolderMetadata
): TinValidationResult => {
    const sanitized = value.replace(/[\s-]/g, '');

    if (sanitized.length === 7 && /^[0-9]{7}$/.test(sanitized)) {
        return { 
            isValid: true, 
            status: 'VALID', 
            isOfficialMatch: true, 
            explanation: 'Matches official Timorese TIN (7 digits) format.' 
        };
    }

    return { 
        isValid: false, 
        status: 'INVALID_FORMAT',
        explanation: 'Value does not match Timorese TIN (7 digits) format.'
    };
};
