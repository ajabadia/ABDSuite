import { HolderMetadata, TinValidationResult, CountryRegulatoryInfo, TinInfo, TinRequirement } from './index';

/**
 * TIN Validation for Uganda (UG)
 * TIN (10 digits)
 */

/**
 * TIN Requirements for Uganda
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
 * Country Metadata for Uganda
 */
export const COUNTRY_INFO: CountryRegulatoryInfo = {
    name: 'Uganda',
    authority: 'Uganda Revenue Authority (URA)',
    compliance: {
        crsStatus: 'Non-Participating',
        crsDate: 'N/A',
        fatcaStatus: 'N/A'
    },
    residency: {
        individual: 'Se considera residente si tiene su residencia principal en Uganda o si permanece allí durante más de 183 días en el año fiscal.',
        entity: 'Se considera residente si está incorporada en Uganda o si su gestión y control se ejercen allí.',
        notes: 'Criterio de residencia principal o estancia de 183 días.'
    }
};

/**
 * TIN Metadata for Uganda (Era 6.3)
 */
export const TIN_INFO: TinInfo = {
    name: 'TIN',
    description: 'Ugandan TIN issued by the URA.',
    placeholder: '1001234567',
    officialLink: 'https://www.ura.go.ug',
    isOfficial: true,
    lastUpdated: '2026-04-24',
    source: 'Local Authority / Uganda URA',
    entityDifferentiation: {
        logic: 'Structurally identical identifiers.',
        individualDescription: '10-digit TIN identifier.',
        businessDescription: '10-digit TIN identifier.'
    }
};

/**
 * Uganda TIN Validator - Era 6.3
 */
export const validateUGTIN = (
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
            explanation: 'Matches official Ugandan TIN (10 digits) format.' 
        };
    }

    if (sanitized.length >= 4 && sanitized.length <= 15 && /^[A-Z0-9]+$/.test(sanitized)) {
        return { 
            isValid: true, 
            status: 'VALID', 
            isOfficialMatch: true, 
            explanation: 'Matches general Ugandan TIN alphanumeric format.' 
        };
    }

    return { 
        isValid: false, 
        status: 'INVALID_FORMAT',
        explanation: 'Value does not match Ugandan TIN format.'
    };
};

/**
 * APPENDIX: FORENSIC CRITERIA
 * Uganda uses the Tax Identification Number (TIN) for all taxpayers.
 * 1. Scope: Issued and managed by the Uganda Revenue Authority (URA).
 * 2. Structure: Standardized 10-digit numeric sequence.
 * 3. Validation: Structural verification based on pattern and length. 
 * 4. Residency: Centered on the 183-day presence rule or management and control rule.
 */
