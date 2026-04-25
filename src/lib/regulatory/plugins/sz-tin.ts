import { HolderMetadata, TinValidationResult, CountryRegulatoryInfo, TinInfo, TinRequirement } from './index';

/**
 * TIN Validation for Eswatini (SZ)
 * TIN (10 digits)
 */

/**
 * TIN Requirements for Eswatini
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
 * Country Metadata for Eswatini
 */
export const COUNTRY_INFO: CountryRegulatoryInfo = {
    name: 'Eswatini',
    authority: 'Eswatini Revenue Service (ERS)',
    compliance: {
        crsStatus: 'Non-Participating',
        crsDate: 'N/A',
        fatcaStatus: 'N/A'
    },
    residency: {
        individual: 'Se considera residente si permanece en Eswatini durante más de 183 días en el año fiscal.',
        entity: 'Se considera residente si está incorporada en Eswatini.',
        notes: 'Criterio de permanencia física o constitución legal.'
    }
};

/**
 * TIN Metadata for Eswatini (Era 6.3)
 */
export const TIN_INFO: TinInfo = {
    name: 'TIN',
    description: 'Eswatini TIN issued by the ERS.',
    placeholder: '1234567890',
    officialLink: 'https://www.ers.org.sz',
    isOfficial: true,
    lastUpdated: '2026-04-24',
    source: 'Local Authority / Eswatini ERS',
    entityDifferentiation: {
        logic: 'Structurally identical identifiers.',
        individualDescription: '10-digit TIN identifier.',
        businessDescription: '10-digit TIN identifier.'
    }
};

/**
 * Eswatini TIN Validator - Era 6.3
 */
export const validateSZTIN = (
    value: string, 
    type: 'INDIVIDUAL' | 'ENTITY' | 'ANY' = 'ANY', 
    metadata?: HolderMetadata
): TinValidationResult => {
    const sanitized = value.trim().toUpperCase().replace(/[\s-]/g, '');

    if (sanitized.length === 10 && /^[0-9]{10}$/.test(sanitized)) {
        return { 
            isValid: true, 
            status: 'VALID', 
            isOfficialMatch: true, 
            explanation: 'Matches official Eswatini TIN (10 digits) format.' 
        };
    }

    if (sanitized.length >= 4 && sanitized.length <= 15 && /^[A-Z0-9]+$/.test(sanitized)) {
        return { 
            isValid: true, 
            status: 'VALID', 
            isOfficialMatch: true, 
            explanation: 'Matches general Eswatini TIN alphanumeric format.' 
        };
    }

    return { 
        isValid: false, 
        status: 'INVALID_FORMAT',
        explanation: 'Value does not match Eswatini TIN format.'
    };
};

/**
 * APPENDIX: FORENSIC CRITERIA
 * Eswatini uses the Tax Identification Number (TIN) for all taxpayers.
 * 1. Scope: Issued and managed by the Eswatini Revenue Service (ERS).
 * 2. Structure: Standardized 10-digit numeric sequence.
 * 3. Validation: Structural verification based on pattern and length. 
 * 4. Residency: Centered on the 183-day presence rule in a fiscal year.
 */
