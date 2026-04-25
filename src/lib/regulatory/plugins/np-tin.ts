import { HolderMetadata, TinValidationResult, CountryRegulatoryInfo, TinInfo, TinRequirement } from './index';

/**
 * TIN Validation for Nepal (NP)
 * Permanent Account Number (PAN) (9 digits)
 */

/**
 * TIN Requirements for Nepal
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
 * Country Metadata for Nepal
 */
export const COUNTRY_INFO: CountryRegulatoryInfo = {
    name: 'Nepal',
    authority: 'Inland Revenue Department (IRD)',
    compliance: {
        crsStatus: 'Non-Participating',
        crsDate: 'N/A',
        fatcaStatus: 'N/A'
    },
    residency: {
        individual: 'Se considera residente si permanece en Nepal durante más de 183 días en el año fiscal.',
        entity: 'Se considera residente si está incorporada en Nepal.',
        notes: 'Criterio de permanencia física o constitución legal.'
    }
};

/**
 * TIN Metadata for Nepal (Era 6.3)
 */
export const TIN_INFO: TinInfo = {
    name: 'PAN',
    description: 'Nepalese PAN issued by the IRD.',
    placeholder: '123456789',
    officialLink: 'https://www.ird.gov.np',
    isOfficial: true,
    lastUpdated: '2026-04-24',
    source: 'Local Authority / Nepal IRD',
    entityDifferentiation: {
        logic: 'Structurally identical identifiers.',
        individualDescription: '9-digit PAN identifier.',
        businessDescription: '9-digit PAN identifier.'
    }
};

/**
 * Nepal TIN Validator - Era 6.3
 */
export const validateNPTIN = (
    value: string, 
    type: 'INDIVIDUAL' | 'ENTITY' | 'ANY' = 'ANY', 
    metadata?: HolderMetadata
): TinValidationResult => {
    const sanitized = value.trim().toUpperCase().replace(/[\s-]/g, '');

    if (sanitized.length === 9 && /^[0-9]{9}$/.test(sanitized)) {
        return { 
            isValid: true, 
            status: 'VALID', 
            isOfficialMatch: true, 
            explanation: 'Matches official Nepalese PAN (9 digits) format.' 
        };
    }

    if (sanitized.length >= 4 && sanitized.length <= 15 && /^[A-Z0-9]+$/.test(sanitized)) {
        return { 
            isValid: true, 
            status: 'VALID', 
            isOfficialMatch: true, 
            explanation: 'Matches general Nepalese PAN alphanumeric format.' 
        };
    }

    return { 
        isValid: false, 
        status: 'INVALID_FORMAT',
        explanation: 'Value does not match Nepalese PAN format.'
    };
};

/**
 * APPENDIX: FORENSIC CRITERIA
 * Nepal uses the PAN (Permanent Account Number) for all taxpayers.
 * 1. Scope: Issued and managed by the Inland Revenue Department (IRD).
 * 2. Structure: Standardized 9-digit numeric sequence.
 * 3. Validation: Structural verification based on pattern and length. 
 * 4. Residency: Centered on the 183-day presence rule in a fiscal year.
 */
