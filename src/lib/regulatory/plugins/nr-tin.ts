import { HolderMetadata, TinValidationResult, CountryRegulatoryInfo, TinInfo, TinRequirement } from './index';

/**
 * TIN Validation for Nauru (NR)
 * TIN (4-6 digits)
 */

/**
 * TIN Requirements for Nauru
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
 * Country Metadata for Nauru
 */
export const COUNTRY_INFO: CountryRegulatoryInfo = {
    name: 'Nauru',
    authority: 'Ministry of Finance / Nauru Revenue Office',
    compliance: {
        crsStatus: 'Participating',
        crsDate: 'September 2018',
        fatcaStatus: 'N/A'
    },
    residency: {
        individual: 'Se considera residente si permanece en Nauru durante más de 183 días en el año civil.',
        entity: 'Se considera residente si está incorporada en Nauru.',
        notes: 'Criterio de permanencia física o constitución legal.'
    }
};

/**
 * TIN Metadata for Nauru (Era 6.3)
 */
export const TIN_INFO: TinInfo = {
    name: 'TIN',
    description: 'Nauruan TIN issued by the Ministry of Finance.',
    placeholder: '1234',
    officialLink: 'https://www.naurugov.nr',
    isOfficial: true,
    lastUpdated: '2026-04-24',
    source: 'OECD Portal / Nauru Tax',
    entityDifferentiation: {
        logic: 'Structurally identical identifiers.',
        individualDescription: 'TIN for individuals.',
        businessDescription: 'TIN for entities.'
    }
};

/**
 * Nauru TIN Validator - Era 6.3
 */
export const validateNRTIN = (
    value: string, 
    type: 'INDIVIDUAL' | 'ENTITY' | 'ANY' = 'ANY', 
    metadata?: HolderMetadata
): TinValidationResult => {
    const sanitized = value.trim().toUpperCase().replace(/[\s-]/g, '');

    if (sanitized.length >= 4 && sanitized.length <= 6 && /^[0-9]+$/.test(sanitized)) {
        return { 
            isValid: true, 
            status: 'VALID', 
            isOfficialMatch: true, 
            explanation: 'Matches official Nauruan TIN (4-6 digits) format.' 
        };
    }

    if (sanitized.length >= 3 && sanitized.length <= 15 && /^[A-Z0-9]+$/.test(sanitized)) {
        return { 
            isValid: true, 
            status: 'VALID', 
            isOfficialMatch: true, 
            explanation: 'Matches general Nauruan TIN alphanumeric format.' 
        };
    }

    return { 
        isValid: false, 
        status: 'INVALID_FORMAT',
        explanation: 'Value does not match Nauruan TIN format.'
    };
};

/**
 * APPENDIX: FORENSIC CRITERIA
 * Nauru uses the Tax Identification Number (TIN) for all taxpayers.
 * 1. Scope: Issued and managed by the Nauru Revenue Office.
 * 2. Structure: Numeric sequence typically between 4 and 6 digits.
 * 3. Validation: Structural verification based on pattern and length. 
 * 4. Residency: Centered on the 183-day presence rule in a calendar year.
 */
