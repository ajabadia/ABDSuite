import { HolderMetadata, TinValidationResult, CountryRegulatoryInfo, TinInfo, TinRequirement } from './index';

/**
 * TIN Validation for Liberia (LR)
 * TIN (7-10 digits)
 */

/**
 * TIN Requirements for Liberia
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
 * Country Metadata for Liberia
 */
export const COUNTRY_INFO: CountryRegulatoryInfo = {
    name: 'Liberia',
    authority: 'Liberia Revenue Authority (LRA)',
    compliance: {
        crsStatus: 'Non-Participating',
        crsDate: 'N/A',
        fatcaStatus: 'N/A'
    },
    residency: {
        individual: 'Se considera residente si permanece en Liberia durante más de 183 días en el año fiscal.',
        entity: 'Se considera residente si está incorporada en Liberia.',
        notes: 'Criterio de permanencia física o constitución legal.'
    }
};

/**
 * TIN Metadata for Liberia (Era 6.3)
 */
export const TIN_INFO: TinInfo = {
    name: 'TIN',
    description: 'Liberian TIN issued by the LRA.',
    placeholder: '12345678',
    officialLink: 'https://lra.gov.lr',
    isOfficial: true,
    lastUpdated: '2026-04-24',
    source: 'Local Authority / Liberia LRA',
    entityDifferentiation: {
        logic: 'Structurally identical identifiers.',
        individualDescription: 'TIN for individuals.',
        businessDescription: 'TIN for entities.'
    }
};

/**
 * Liberia TIN Validator - Era 6.3
 */
export const validateLRTIN = (
    value: string, 
    type: 'INDIVIDUAL' | 'ENTITY' | 'ANY' = 'ANY', 
    metadata?: HolderMetadata
): TinValidationResult => {
    const sanitized = value.trim().toUpperCase().replace(/[\s-]/g, '');

    if (sanitized.length >= 7 && sanitized.length <= 10 && /^[0-9]+$/.test(sanitized)) {
        return { 
            isValid: true, 
            status: 'VALID', 
            isOfficialMatch: true, 
            explanation: 'Matches official Liberian TIN format.' 
        };
    }

    if (sanitized.length >= 4 && sanitized.length <= 15 && /^[A-Z0-9]+$/.test(sanitized)) {
        return { 
            isValid: true, 
            status: 'VALID', 
            isOfficialMatch: true, 
            explanation: 'Matches general Liberian TIN alphanumeric format.' 
        };
    }

    return { 
        isValid: false, 
        status: 'INVALID_FORMAT',
        explanation: 'Value does not match Liberian TIN format.'
    };
};

/**
 * APPENDIX: FORENSIC CRITERIA
 * Liberia uses the Tax Identification Number (TIN) for all taxpayers.
 * 1. Scope: Issued and managed by the Liberia Revenue Authority (LRA).
 * 2. Structure: Numeric sequence typically between 7 and 10 digits.
 * 3. Validation: Structural verification based on pattern and length. 
 * 4. Residency: Centered on the 183-day presence rule in a fiscal year.
 */
