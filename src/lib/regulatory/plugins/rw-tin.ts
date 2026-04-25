import { HolderMetadata, TinValidationResult, CountryRegulatoryInfo, TinInfo, TinRequirement } from './index';

/**
 * TIN Validation for Rwanda (RW)
 * TIN (9 digits)
 */

/**
 * TIN Requirements for Rwanda
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
 * Country Metadata for Rwanda
 */
export const COUNTRY_INFO: CountryRegulatoryInfo = {
    name: 'Ruanda',
    authority: 'Rwanda Revenue Authority (RRA)',
    compliance: {
        crsStatus: 'Non-Participating',
        crsDate: 'N/A',
        fatcaStatus: 'N/A'
    },
    residency: {
        individual: 'Se considera residente si permanece en Ruanda durante más de 183 días en el año fiscal.',
        entity: 'Se considera residente si está incorporada en Ruanda.',
        notes: 'Criterio de permanencia física o constitución legal.'
    }
};

/**
 * TIN Metadata for Rwanda (Era 6.3)
 */
export const TIN_INFO: TinInfo = {
    name: 'TIN',
    description: 'Rwandan TIN issued by the RRA.',
    placeholder: '123456789',
    officialLink: 'https://www.rra.gov.rw',
    isOfficial: true,
    lastUpdated: '2026-04-24',
    source: 'Local Authority / Rwanda RRA',
    entityDifferentiation: {
        logic: 'Structurally identical identifiers.',
        individualDescription: '9-digit TIN identifier.',
        businessDescription: '9-digit TIN identifier.'
    }
};

/**
 * Rwanda TIN Validator - Era 6.3
 */
export const validateRWTIN = (
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
            explanation: 'Matches official Rwandan TIN (9 digits) format.' 
        };
    }

    if (sanitized.length >= 4 && sanitized.length <= 15 && /^[A-Z0-9]+$/.test(sanitized)) {
        return { 
            isValid: true, 
            status: 'VALID', 
            isOfficialMatch: true, 
            explanation: 'Matches general Rwandan TIN alphanumeric format.' 
        };
    }

    return { 
        isValid: false, 
        status: 'INVALID_FORMAT',
        explanation: 'Value does not match Rwandan TIN format.'
    };
};

/**
 * APPENDIX: FORENSIC CRITERIA
 * Rwanda uses the Tax Identification Number (TIN) for all taxpayers.
 * 1. Scope: Issued and managed by the Rwanda Revenue Authority (RRA).
 * 2. Structure: Standardized 9-digit numeric sequence.
 * 3. Validation: Structural verification based on pattern and length. 
 * 4. Residency: Centered on the 183-day presence rule in a fiscal year.
 */
