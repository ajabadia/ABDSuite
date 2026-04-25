import { HolderMetadata, TinValidationResult, CountryRegulatoryInfo, TinInfo, TinRequirement } from './index';

/**
 * TIN Validation for Vanuatu (VU)
 * TIN (11 digits)
 */

/**
 * TIN Requirements for Vanuatu
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
 * Country Metadata for Vanuatu
 */
export const COUNTRY_INFO: CountryRegulatoryInfo = {
    name: 'Vanuatu',
    authority: 'Customs and Inland Revenue (CIR)',
    compliance: {
        crsStatus: 'Participating',
        crsDate: 'September 2018',
        fatcaStatus: 'N/A'
    },
    residency: {
        individual: 'Se considera residente si permanece en Vanuatu durante más de 183 días en el año fiscal.',
        entity: 'Se considera residente si está incorporada en Vanuatu.',
        notes: 'Criterio de permanencia física o constitución legal.'
    }
};

/**
 * TIN Metadata for Vanuatu (Era 6.3)
 */
export const TIN_INFO: TinInfo = {
    name: 'TIN',
    description: 'Vanuatu TIN issued by the CIR.',
    placeholder: '12345678901',
    officialLink: 'https://customsinlandrevenue.gov.vu',
    isOfficial: true,
    lastUpdated: '2026-04-24',
    source: 'OECD Portal / Vanuatu CIR',
    entityDifferentiation: {
        logic: 'Structurally identical identifiers.',
        individualDescription: '11-digit TIN identifier.',
        businessDescription: '11-digit TIN identifier.'
    }
};

/**
 * Vanuatu TIN Validator - Era 6.3
 */
export const validateVUTIN = (
    value: string, 
    type: 'INDIVIDUAL' | 'ENTITY' | 'ANY' = 'ANY', 
    metadata?: HolderMetadata
): TinValidationResult => {
    const sanitized = value.trim().toUpperCase().replace(/[\s-]/g, '');

    if (sanitized.length === 11 && /^[0-9]{11}$/.test(sanitized)) {
        return { 
            isValid: true, 
            status: 'VALID', 
            isOfficialMatch: true, 
            explanation: 'Matches official Vanuatu TIN (11 digits) format.' 
        };
    }

    if (sanitized.length >= 4 && sanitized.length <= 15 && /^[A-Z0-9]+$/.test(sanitized)) {
        return { 
            isValid: true, 
            status: 'VALID', 
            isOfficialMatch: true, 
            explanation: 'Matches general Vanuatu identifier alphanumeric format.' 
        };
    }

    return { 
        isValid: false, 
        status: 'INVALID_FORMAT',
        explanation: 'Value does not match Vanuatu TIN format.'
    };
};

/**
 * APPENDIX: FORENSIC CRITERIA
 * Vanuatu uses the Tax Identification Number (TIN) for all taxpayers.
 * 1. Scope: Issued and managed by the Department of Customs and Inland Revenue (CIR).
 * 2. Structure: Standardized 11-digit numeric sequence.
 * 3. Validation: Structural verification based on pattern and length. 
 * 4. Residency: Centered on the 183-day presence rule in a fiscal year.
 */
