import { HolderMetadata, TinValidationResult, CountryRegulatoryInfo, TinInfo, TinRequirement } from './index';

/**
 * TIN Validation for Iraq (IQ)
 * TIN (10-12 digits)
 */

/**
 * TIN Requirements for Iraq
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
 * Country Metadata for Iraq
 */
export const COUNTRY_INFO: CountryRegulatoryInfo = {
    name: 'Irak',
    authority: 'General Commission for Taxes (GCT)',
    compliance: {
        crsStatus: 'Non-Participating',
        crsDate: 'N/A',
        fatcaStatus: 'Model 2 (In Force)'
    },
    residency: {
        individual: 'Se considera residente si permanece en Irak durante más de 183 días en el año fiscal.',
        entity: 'Se considera residente si está incorporada en Irak.',
        notes: 'Criterio de permanencia física o constitución legal.'
    }
};

/**
 * TIN Metadata for Iraq (Era 6.3)
 */
export const TIN_INFO: TinInfo = {
    name: 'TIN',
    description: 'Iraqi TIN issued by the GCT.',
    placeholder: '1234567890',
    officialLink: 'https://tax.mof.gov.iq',
    isOfficial: true,
    lastUpdated: '2026-04-24',
    source: 'Local Authority / Iraq Tax',
    entityDifferentiation: {
        logic: 'Structurally identical identifiers.',
        individualDescription: 'TIN for individuals.',
        businessDescription: 'TIN for entities.'
    }
};

/**
 * Iraq TIN Validator - Era 6.3
 */
export const validateIQTIN = (
    value: string, 
    type: 'INDIVIDUAL' | 'ENTITY' | 'ANY' = 'ANY', 
    metadata?: HolderMetadata
): TinValidationResult => {
    const sanitized = value.trim().toUpperCase().replace(/[\s-]/g, '');

    if (sanitized.length >= 10 && sanitized.length <= 12 && /^[0-9]+$/.test(sanitized)) {
        return { 
            isValid: true, 
            status: 'VALID', 
            isOfficialMatch: true, 
            explanation: 'Matches official Iraqi TIN (10-12 digits) format.' 
        };
    }

    if (sanitized.length >= 4 && sanitized.length <= 15 && /^[A-Z0-9]+$/.test(sanitized)) {
        return { 
            isValid: true, 
            status: 'VALID', 
            isOfficialMatch: true, 
            explanation: 'Matches general Iraqi TIN alphanumeric format.' 
        };
    }

    return { 
        isValid: false, 
        status: 'INVALID_FORMAT',
        explanation: 'Value does not match Iraqi TIN format.'
    };
};

/**
 * APPENDIX: FORENSIC CRITERIA
 * Iraq uses the Tax Identification Number (TIN) for all tax-related purposes.
 * 1. Scope: Issued and managed by the General Commission for Taxes (GCT).
 * 2. Structure: Numeric sequence typically between 10 and 12 digits.
 * 3. Validation: Structural verification based on pattern and length. 
 * 4. Residency: Centered on the 183-day presence rule in a fiscal year.
 */
