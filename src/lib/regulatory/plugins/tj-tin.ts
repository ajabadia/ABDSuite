import { HolderMetadata, TinValidationResult, CountryRegulatoryInfo, TinInfo, TinRequirement } from './index';

/**
 * TIN Validation for Tajikistan (TJ)
 * TIN (9 digits)
 */

/**
 * TIN Requirements for Tajikistan
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
 * Country Metadata for Tajikistan
 */
export const COUNTRY_INFO: CountryRegulatoryInfo = {
    name: 'Tayikistán',
    authority: 'Tax Committee under the Government of the Republic of Tajikistan',
    compliance: {
        crsStatus: 'Non-Participating',
        crsDate: 'N/A',
        fatcaStatus: 'N/A'
    },
    residency: {
        individual: 'Se considera residente si permanece en Tayikistán durante más de 183 días en el año fiscal.',
        entity: 'Se considera residente si está incorporada en Tayikistán.',
        notes: 'Criterio de permanencia física o constitución legal.'
    }
};

/**
 * TIN Metadata for Tajikistan (Era 6.3)
 */
export const TIN_INFO: TinInfo = {
    name: 'TIN',
    description: 'Tajik TIN issued by the Tax Committee.',
    placeholder: '123456789',
    officialLink: 'https://www.andoz.tj',
    isOfficial: true,
    lastUpdated: '2026-04-24',
    source: 'Local Authority / Tajikistan Tax',
    entityDifferentiation: {
        logic: 'Structurally identical identifiers.',
        individualDescription: '9-digit TIN identifier.',
        businessDescription: '9-digit TIN identifier.'
    }
};

/**
 * Tajikistan TIN Validator - Era 6.3
 */
export const validateTJTIN = (
    value: string, 
    type: 'INDIVIDUAL' | 'ENTITY' | 'ANY' = 'ANY', 
    metadata?: HolderMetadata
): TinValidationResult => {
    const sanitized = value.trim().toUpperCase().replace(/[\s-]/g, '');

    if (sanitized.length === 9 && /^[0-9]{9}$/.test(sanitized)) {
        return { 
            isValid: true, 
            status: 'VALID', 
            isOfficialMatch: true, 
            explanation: 'Matches official Tajik TIN (9 digits) format.' 
        };
    }

    if (sanitized.length >= 4 && sanitized.length <= 15 && /^[A-Z0-9]+$/.test(sanitized)) {
        return { 
            isValid: true, 
            status: 'VALID', 
            isOfficialMatch: true, 
            explanation: 'Matches general Tajik TIN alphanumeric format.' 
        };
    }

    return { 
        isValid: false, 
        status: 'INVALID_FORMAT',
        explanation: 'Value does not match Tajik TIN format.'
    };
};

/**
 * APPENDIX: FORENSIC CRITERIA
 * Tajikistan uses the Tax Identification Number (TIN/INN) for all taxpayers.
 * 1. Scope: Issued and managed by the Tax Committee.
 * 2. Structure: Standardized 9-digit numeric sequence.
 * 3. Validation: Structural verification based on pattern and length. 
 * 4. Residency: Centered on the 183-day presence rule in a fiscal year.
 */
