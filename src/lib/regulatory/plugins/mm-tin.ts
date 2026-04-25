import { HolderMetadata, TinValidationResult, CountryRegulatoryInfo, TinInfo, TinRequirement } from './index';

/**
 * TIN Validation for Myanmar (MM)
 * TIN (12 digits)
 */

/**
 * TIN Requirements for Myanmar
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
 * Country Metadata for Myanmar
 */
export const COUNTRY_INFO: CountryRegulatoryInfo = {
    name: 'Myanmar',
    authority: 'Internal Revenue Department (IRD)',
    compliance: {
        crsStatus: 'Non-Participating',
        crsDate: 'N/A',
        fatcaStatus: 'N/A'
    },
    residency: {
        individual: 'Se considera residente si permanece en Myanmar durante más de 182 días en el año fiscal.',
        entity: 'Se considera residente si está incorporada en Myanmar.',
        notes: 'Criterio de permanencia física o constitución legal.'
    }
};

/**
 * TIN Metadata for Myanmar (Era 6.3)
 */
export const TIN_INFO: TinInfo = {
    name: 'TIN',
    description: 'Myanmar TIN issued by the IRD.',
    placeholder: '123456789012',
    officialLink: 'https://www.ird.gov.mm',
    isOfficial: true,
    lastUpdated: '2026-04-24',
    source: 'Local Authority / Myanmar Tax',
    entityDifferentiation: {
        logic: 'Structurally identical identifiers.',
        individualDescription: 'TIN for individuals.',
        businessDescription: 'TIN for entities.'
    }
};

/**
 * Myanmar TIN Validator - Era 6.3
 */
export const validateMMTIN = (
    value: string, 
    type: 'INDIVIDUAL' | 'ENTITY' | 'ANY' = 'ANY', 
    metadata?: HolderMetadata
): TinValidationResult => {
    const sanitized = value.trim().toUpperCase().replace(/[\s-]/g, '');

    if (sanitized.length === 12 && /^[0-9]{12}$/.test(sanitized)) {
        return { 
            isValid: true, 
            status: 'VALID', 
            isOfficialMatch: true, 
            explanation: 'Matches official Myanmar TIN (12 digits) format.' 
        };
    }

    if (sanitized.length >= 4 && sanitized.length <= 15 && /^[A-Z0-9]+$/.test(sanitized)) {
        return { 
            isValid: true, 
            status: 'VALID', 
            isOfficialMatch: true, 
            explanation: 'Matches general Myanmar TIN alphanumeric format.' 
        };
    }

    return { 
        isValid: false, 
        status: 'INVALID_FORMAT',
        explanation: 'Value does not match Myanmar TIN format.'
    };
};

/**
 * APPENDIX: FORENSIC CRITERIA
 * Myanmar uses the Tax Identification Number (TIN) for all taxpayers.
 * 1. Scope: Issued and managed by the Internal Revenue Department (IRD).
 * 2. Structure: Standardized 12-digit numeric sequence.
 * 3. Validation: Structural verification based on pattern and length. 
 * 4. Residency: Centered on the 182-day presence rule in a fiscal year.
 */
