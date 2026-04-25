import { HolderMetadata, TinValidationResult, CountryRegulatoryInfo, TinInfo, TinRequirement } from './index';

/**
 * TIN Validation for Gambia (GM)
 * TIN (7-12 digits)
 */

/**
 * TIN Requirements for Gambia
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
 * Country Metadata for Gambia
 */
export const COUNTRY_INFO: CountryRegulatoryInfo = {
    name: 'Gambia',
    authority: 'Gambia Revenue Authority (GRA)',
    compliance: {
        crsStatus: 'Non-Participating',
        crsDate: 'N/A',
        fatcaStatus: 'N/A'
    },
    residency: {
        individual: 'Se considera residente si permanece en Gambia durante más de 183 días en el año fiscal.',
        entity: 'Se considera residente si está incorporada en Gambia.',
        notes: 'Criterio de permanencia física o constitución legal.'
    }
};

/**
 * TIN Metadata for Gambia (Era 6.3)
 */
export const TIN_INFO: TinInfo = {
    name: 'TIN',
    description: 'Gambian TIN issued by the GRA.',
    placeholder: '12345678',
    officialLink: 'https://www.gra.gm',
    isOfficial: true,
    lastUpdated: '2026-04-24',
    source: 'Local Authority / Gambia GRA',
    entityDifferentiation: {
        logic: 'Structurally identical identifiers.',
        individualDescription: 'TIN for individuals.',
        businessDescription: 'TIN for entities.'
    }
};

/**
 * Gambia TIN Validator - Era 6.3
 */
export const validateGMTIN = (
    value: string, 
    type: 'INDIVIDUAL' | 'ENTITY' | 'ANY' = 'ANY', 
    metadata?: HolderMetadata
): TinValidationResult => {
    const sanitized = value.trim().toUpperCase().replace(/[\s-]/g, '');

    if (sanitized.length >= 7 && sanitized.length <= 12 && /^[0-9]+$/.test(sanitized)) {
        return { 
            isValid: true, 
            status: 'VALID', 
            isOfficialMatch: true, 
            explanation: 'Matches official Gambian TIN format.' 
        };
    }

    if (sanitized.length >= 4 && sanitized.length <= 15 && /^[A-Z0-9]+$/.test(sanitized)) {
        return { 
            isValid: true, 
            status: 'VALID', 
            isOfficialMatch: true, 
            explanation: 'Matches general Gambian TIN alphanumeric format.' 
        };
    }

    return { 
        isValid: false, 
        status: 'INVALID_FORMAT',
        explanation: 'Value does not match Gambian TIN format.'
    };
};

/**
 * APPENDIX: FORENSIC CRITERIA
 * Gambia uses the Tax Identification Number (TIN) for all taxpayers.
 * 1. Scope: Issued and managed by the Gambia Revenue Authority (GRA).
 * 2. Structure: Numeric sequence typically between 7 and 12 digits.
 * 3. Validation: Structural verification based on pattern and length. 
 * 4. Residency: Centered on the 183-day presence rule in a fiscal year.
 */
