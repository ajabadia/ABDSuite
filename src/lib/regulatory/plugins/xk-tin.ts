
import { HolderMetadata, TinValidationResult, CountryRegulatoryInfo, TinInfo } from './index';

/**
 * TIN Validation for Kosovo (XK)
 * Individual: National ID (10 digits)
 * Entity: Tax Identification Number (TIN) (9 digits)
 */

/**
 * TIN Requirements for Kosovo
 */
export const TIN_REQUIREMENTS = [
    'National ID for individuals (10 digits).',
    'Tax Identification Number (TIN) for entities (9 digits).'
];

/**
 * Country Metadata for Kosovo
 */
export const COUNTRY_INFO: CountryRegulatoryInfo = {
    name: 'Kosovo',
    authority: 'Tax Administration of Kosovo (TAK)',
    compliance: {
        crsStatus: 'Non-Participating',
        crsDate: 'N/A',
        fatcaStatus: 'Model 1 (In Force)'
    },
    residency: {
        individual: 'Se considera residente si permanece en Kosovo durante más de 183 días en el año fiscal.',
        entity: 'Se considera residente si está incorporada en Kosovo.',
        notes: 'Criterio de permanencia física o constitución legal.'
    }
};

/**
 * TIN Metadata for Kosovo (Era 6.3)
 */
export const TIN_INFO: TinInfo = {
    name: 'NID / TIN',
    description: 'Kosovon National ID (Individuals) or TIN (Entities) issued by the TAK.',
    placeholder: '1234567890 / 123456789',
    officialLink: 'https://www.atk-ks.org',
    isOfficial: true,
    lastUpdated: '2026-04-24',
    source: 'Local Authority / Kosovo TAK',
    entityDifferentiation: {
        logic: 'Number length analysis.',
        individualDescription: '10-digit National ID.',
        businessDescription: '9-digit TIN identifier.'
    }
};

/**
 * Kosovo TIN Validator - Era 6.3
 */
export const validateXKTIN = (
    value: string, 
    type: 'INDIVIDUAL' | 'ENTITY' | 'ANY' = 'ANY', 
    metadata?: HolderMetadata
): TinValidationResult => {
    const sanitized = value.replace(/[\s-]/g, '');

    // Individual (NID): 10 digits
    if (sanitized.length === 10 && /^[0-9]{10}$/.test(sanitized)) {
        if (type === 'ENTITY') {
             return { 
                 isValid: false, 
                 status: 'MISMATCH', 
                 reasonCode: 'ENTITY_TYPE_MISMATCH',
                 explanation: 'The detected format (10 digits) corresponds to a Kosovon National ID, which is exclusive to individuals.'
             };
        }
        return { 
            isValid: true, 
            status: 'VALID', 
            isOfficialMatch: true, 
            explanation: 'Matches official Kosovon National ID (10 digits) format.' 
        };
    }

    // Business (TIN): 9 digits
    if (sanitized.length === 9 && /^[0-9]{9}$/.test(sanitized)) {
        if (type === 'INDIVIDUAL') {
             return { 
                 isValid: false, 
                 status: 'MISMATCH', 
                 reasonCode: 'ENTITY_TYPE_MISMATCH',
                 explanation: 'The detected format (9 digits) corresponds to a Kosovon TIN, which applies only to entities.'
             };
        }
        return { 
            isValid: true, 
            status: 'VALID', 
            isOfficialMatch: true, 
            explanation: 'Matches official Kosovon TIN (9 digits) format.' 
        };
    }

    return { 
        isValid: false, 
        status: 'INVALID_FORMAT',
        explanation: 'Value does not match Kosovon National ID (10 digits) or TIN (9 digits) format.'
    };
};
