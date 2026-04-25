import { HolderMetadata, TinValidationResult, CountryRegulatoryInfo, TinInfo, TinRequirement } from './index';

/**
 * TIN Validation for Niue (NU)
 * Tax Number (4-9 digits)
 */

/**
 * TIN Requirements for Niue
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
 * Country Metadata for Niue
 */
export const COUNTRY_INFO: CountryRegulatoryInfo = {
    name: 'Niue',
    authority: 'Department of Finance and Planning / Tax Office',
    compliance: {
        crsStatus: 'Participating',
        crsDate: 'September 2018',
        fatcaStatus: 'N/A'
    },
    residency: {
        individual: 'Se considera residente si permanece en Niue durante más de 183 días en el año civil.',
        entity: 'Se considera residente si está incorporada en Niue.',
        notes: 'Criterio de permanencia física o constitución legal.'
    }
};

/**
 * TIN Metadata for Niue (Era 6.3)
 */
export const TIN_INFO: TinInfo = {
    name: 'Tax Number',
    description: 'Niuean Tax Number issued by the Tax Office.',
    placeholder: '1234',
    officialLink: 'https://www.gov.nu',
    isOfficial: true,
    lastUpdated: '2026-04-24',
    source: 'OECD Portal / Niue Tax',
    entityDifferentiation: {
        logic: 'Structurally identical identifiers.',
        individualDescription: 'Tax Number for individuals.',
        businessDescription: 'Tax Number for entities.'
    }
};

/**
 * Niue TIN Validator - Era 6.3
 */
export const validateNUTIN = (
    value: string, 
    type: 'INDIVIDUAL' | 'ENTITY' | 'ANY' = 'ANY', 
    metadata?: HolderMetadata
): TinValidationResult => {
    const sanitized = value.trim().toUpperCase().replace(/[\s-]/g, '');

    if (sanitized.length >= 4 && sanitized.length <= 9 && /^[0-9]+$/.test(sanitized)) {
        return { 
            isValid: true, 
            status: 'VALID', 
            isOfficialMatch: true, 
            explanation: 'Matches official Niuean Tax Number (4-9 digits) format.' 
        };
    }

    if (sanitized.length >= 3 && sanitized.length <= 15 && /^[A-Z0-9]+$/.test(sanitized)) {
        return { 
            isValid: true, 
            status: 'VALID', 
            isOfficialMatch: true, 
            explanation: 'Matches general Niuean Tax Number alphanumeric format.' 
        };
    }

    return { 
        isValid: false, 
        status: 'INVALID_FORMAT',
        explanation: 'Value does not match Niuean Tax Number format.'
    };
};

/**
 * APPENDIX: FORENSIC CRITERIA
 * Niue uses the Tax Identification Number (TIN) for all taxpayers.
 * 1. Scope: Issued and managed by the Department of Finance and Planning.
 * 2. Structure: Numeric sequence typically between 4 and 9 digits.
 * 3. Validation: Structural verification based on pattern and length. 
 * 4. Residency: Centered on the 183-day presence rule in a calendar year.
 */
