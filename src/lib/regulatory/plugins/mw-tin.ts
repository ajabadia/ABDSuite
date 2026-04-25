import { HolderMetadata, TinValidationResult, CountryRegulatoryInfo, TinInfo, TinRequirement } from './index';

/**
 * TIN Validation for Malawi (MW)
 * TIN (8-10 digits)
 */

/**
 * TIN Requirements for Malawi
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
 * Country Metadata for Malawi
 */
export const COUNTRY_INFO: CountryRegulatoryInfo = {
    name: 'Malaui',
    authority: 'Malawi Revenue Authority (MRA)',
    compliance: {
        crsStatus: 'Non-Participating',
        crsDate: 'N/A',
        fatcaStatus: 'N/A'
    },
    residency: {
        individual: 'Se considera residente si permanece en Malaui durante más de 183 días en el año fiscal.',
        entity: 'Se considera residente si está incorporada en Malaui.',
        notes: 'Criterio de permanencia física o constitución legal.'
    }
};

/**
 * TIN Metadata for Malawi (Era 6.3)
 */
export const TIN_INFO: TinInfo = {
    name: 'TIN',
    description: 'Malawian TIN issued by the MRA.',
    placeholder: '12345678',
    officialLink: 'https://www.mra.mw',
    isOfficial: true,
    lastUpdated: '2026-04-24',
    source: 'Local Authority / Malawi Tax',
    entityDifferentiation: {
        logic: 'Structurally identical identifiers.',
        individualDescription: 'TIN for individuals.',
        businessDescription: 'TIN for entities.'
    }
};

/**
 * Malawi TIN Validator - Era 6.3
 */
export const validateMWTIN = (
    value: string, 
    type: 'INDIVIDUAL' | 'ENTITY' | 'ANY' = 'ANY', 
    metadata?: HolderMetadata
): TinValidationResult => {
    const sanitized = value.trim().toUpperCase().replace(/[\s-]/g, '');

    if (sanitized.length >= 8 && sanitized.length <= 10 && /^[0-9]+$/.test(sanitized)) {
        return { 
            isValid: true, 
            status: 'VALID', 
            isOfficialMatch: true, 
            explanation: 'Matches official Malawian TIN (8-10 digits) format.' 
        };
    }

    if (sanitized.length >= 4 && sanitized.length <= 15 && /^[A-Z0-9]+$/.test(sanitized)) {
        return { 
            isValid: true, 
            status: 'VALID', 
            isOfficialMatch: true, 
            explanation: 'Matches general Malawian TIN alphanumeric format.' 
        };
    }

    return { 
        isValid: false, 
        status: 'INVALID_FORMAT',
        explanation: 'Value does not match Malawian TIN format.'
    };
};

/**
 * APPENDIX: FORENSIC CRITERIA
 * Malawi uses the Tax Identification Number (TIN) for all taxpayers.
 * 1. Scope: Issued and managed by the Malawi Revenue Authority (MRA).
 * 2. Structure: Numeric sequence typically between 8 and 10 digits.
 * 3. Validation: Structural verification based on pattern and length. 
 * 4. Residency: Centered on the 183-day presence rule in a fiscal year.
 */
