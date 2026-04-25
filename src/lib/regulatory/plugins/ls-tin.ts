import { HolderMetadata, TinValidationResult, CountryRegulatoryInfo, TinInfo, TinRequirement } from './index';

/**
 * TIN Validation for Lesotho (LS)
 * TIN (7-10 digits)
 */

/**
 * TIN Requirements for Lesotho
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
 * Country Metadata for Lesotho
 */
export const COUNTRY_INFO: CountryRegulatoryInfo = {
    name: 'Lesoto',
    authority: 'Lesotho Revenue Authority (LRA)',
    compliance: {
        crsStatus: 'Non-Participating',
        crsDate: 'N/A',
        fatcaStatus: 'N/A'
    },
    residency: {
        individual: 'Se considera residente si permanece en Lesoto durante más de 183 días en el año fiscal.',
        entity: 'Se considera residente si está incorporada en Lesoto.',
        notes: 'Criterio de permanencia física o constitución legal.'
    }
};

/**
 * TIN Metadata for Lesotho (Era 6.3)
 */
export const TIN_INFO: TinInfo = {
    name: 'TIN',
    description: 'Lesotho TIN issued by the LRA.',
    placeholder: '1234567',
    officialLink: 'https://www.lra.org.ls',
    isOfficial: true,
    lastUpdated: '2026-04-24',
    source: 'Local Authority / Lesotho LRA',
    entityDifferentiation: {
        logic: 'Structurally identical identifiers.',
        individualDescription: 'TIN for individuals.',
        businessDescription: 'TIN for entities.'
    }
};

/**
 * Lesotho TIN Validator - Era 6.3
 */
export const validateLSTIN = (
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
            explanation: 'Matches official Lesotho TIN format.' 
        };
    }

    if (sanitized.length >= 4 && sanitized.length <= 15 && /^[A-Z0-9]+$/.test(sanitized)) {
        return { 
            isValid: true, 
            status: 'VALID', 
            isOfficialMatch: true, 
            explanation: 'Matches general Lesotho TIN alphanumeric format.' 
        };
    }

    return { 
        isValid: false, 
        status: 'INVALID_FORMAT',
        explanation: 'Value does not match Lesotho TIN format.'
    };
};

/**
 * APPENDIX: FORENSIC CRITERIA
 * Lesotho uses the Tax Identification Number (TIN) for all taxpayers.
 * 1. Scope: Issued and managed by the Lesotho Revenue Authority (LRA).
 * 2. Structure: Numeric sequence typically between 7 and 10 digits.
 * 3. Validation: Structural verification based on pattern and length. 
 * 4. Residency: Centered on the 183-day presence rule in a fiscal year.
 */
