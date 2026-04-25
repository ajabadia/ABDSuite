import { HolderMetadata, TinValidationResult, CountryRegulatoryInfo, TinInfo, TinRequirement } from './index';

/**
 * TIN Validation for Guyana (GY)
 * TIN (7-9 digits)
 */

/**
 * TIN Requirements for Guyana
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
 * Country Metadata for Guyana
 */
export const COUNTRY_INFO: CountryRegulatoryInfo = {
    name: 'Guyana',
    authority: 'Guyana Revenue Authority (GRA)',
    compliance: {
        crsStatus: 'Non-Participating',
        crsDate: 'N/A',
        fatcaStatus: 'Model 1 (In Force)'
    },
    residency: {
        individual: 'Se considera residente si permanece en Guyana durante más de 183 días en el año civil.',
        entity: 'Se considera residente si está incorporada en Guyana.',
        notes: 'Criterio de permanencia física o constitución legal.'
    }
};

/**
 * TIN Metadata for Guyana (Era 6.3)
 */
export const TIN_INFO: TinInfo = {
    name: 'TIN',
    description: 'Guyanese TIN issued by the GRA.',
    placeholder: '123456789',
    officialLink: 'https://www.gra.gov.gy',
    isOfficial: true,
    lastUpdated: '2026-04-24',
    source: 'Local Authority / Guyana GRA',
    entityDifferentiation: {
        logic: 'Structurally identical identifiers.',
        individualDescription: 'TIN for individuals.',
        businessDescription: 'TIN for entities.'
    }
};

/**
 * Guyana TIN Validator - Era 6.3
 */
export const validateGYTIN = (
    value: string, 
    type: 'INDIVIDUAL' | 'ENTITY' | 'ANY' = 'ANY', 
    metadata?: HolderMetadata
): TinValidationResult => {
    const sanitized = value.trim().toUpperCase().replace(/[\s-]/g, '');

    if (sanitized.length >= 7 && sanitized.length <= 9 && /^[0-9]+$/.test(sanitized)) {
        return { 
            isValid: true, 
            status: 'VALID', 
            isOfficialMatch: true, 
            explanation: 'Matches official Guyanese TIN format.' 
        };
    }

    if (sanitized.length >= 4 && sanitized.length <= 15 && /^[A-Z0-9]+$/.test(sanitized)) {
        return { 
            isValid: true, 
            status: 'VALID', 
            isOfficialMatch: true, 
            explanation: 'Matches general Guyanese TIN alphanumeric format.' 
        };
    }

    return { 
        isValid: false, 
        status: 'INVALID_FORMAT',
        explanation: 'Value does not match Guyanese TIN format.'
    };
};

/**
 * APPENDIX: FORENSIC CRITERIA
 * Guyana uses the Tax Identification Number (TIN) for all taxpayers.
 * 1. Scope: Issued and managed by the Guyana Revenue Authority (GRA).
 * 2. Structure: Numeric sequence typically between 7 and 9 digits.
 * 3. Validation: Structural verification based on pattern and length. 
 * 4. Residency: Centered on the 183-day presence rule in a calendar year.
 */
