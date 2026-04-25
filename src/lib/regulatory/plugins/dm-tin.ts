
import { TinValidationResult, TinInfo, CountryRegulatoryInfo, TinRequirement, HolderMetadata } from './index';

/**
 * TIN Requirements for Dominica
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
 * Country Metadata for Dominica
 */
export const COUNTRY_INFO: CountryRegulatoryInfo = {
    name: 'Dominica',
    authority: 'Inland Revenue Division (IRD)',
    compliance: {
        crsStatus: 'Participating',
        crsDate: 'September 2018',
        fatcaStatus: 'Model 1 (In Force)'
    },
    residency: {
        individual: 'Se considera residente si permanece en Dominica 183 días o más en un año natural.',
        entity: 'Se considera residente si su gestión y control se ejercen en Dominica.',
        notes: 'Criterio de permanencia física de 183 días.'
    }
};

/**
 * TIN Metadata for Dominica (Era 6.3)
 */
export const TIN_INFO: TinInfo = {
    name: 'Tax Identification Number',
    description: 'Unique 9-digit number issued by the Inland Revenue Division.',
    placeholder: '123456789',
    isOfficial: true,
    lastUpdated: '2026-04-24',
    source: 'OECD Portal / Inland Revenue Division of Dominica',
    entityDifferentiation: {
        logic: 'Numeric sequence without structural differentiation.',
        individualDescription: '9-digit TIN.',
        businessDescription: '9-digit TIN.'
    }
};

/**
 * Dominica TIN Validator (9 digits) - Era 6.3
 */
export const validateDMTIN = (
    value: string,
    type: 'INDIVIDUAL' | 'ENTITY' | 'ANY' = 'ANY',
    metadata?: HolderMetadata
): TinValidationResult => {
    const cleanValue = value.trim().replace(/-/g, '');
    
    if (/^\d{9}$/.test(cleanValue)) {
        return {
            isValid: true,
            status: 'VALID',
            isOfficialMatch: true,
            explanation: 'Matches official 9-digit Dominica TIN format.'
        };
    }

    return {
        isValid: false,
        status: 'INVALID_FORMAT',
        explanation: 'Dominica TINs must be exactly 9 digits long.'
    };
};

/**
 * APPENDIX: FORENSIC CRITERIA
 * Dominica uses the SIGTAS system for tax administration. 
 * Since the number is purely numeric and sequential, the CRS standard 
 * places high importance on the Date of Birth (DOB) and Place of Birth 
 * to ensure high-fidelity matching with foreign jurisdictions.
 */

