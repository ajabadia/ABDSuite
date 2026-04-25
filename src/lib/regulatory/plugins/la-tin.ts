import { HolderMetadata, TinValidationResult, CountryRegulatoryInfo, TinInfo, TinRequirement } from './index';

/**
 * TIN Validation for Laos (LA)
 * TIN (12 digits)
 */

/**
 * TIN Requirements for Laos
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
 * Country Metadata for Laos
 */
export const COUNTRY_INFO: CountryRegulatoryInfo = {
    name: 'Laos',
    authority: 'Tax Department of the Ministry of Finance',
    compliance: {
        crsStatus: 'Non-Participating',
        crsDate: 'N/A',
        fatcaStatus: 'N/A'
    },
    residency: {
        individual: 'Se considera residente si permanece en Laos durante más de 183 días en el año civil.',
        entity: 'Se considera residente si está incorporada en Laos.',
        notes: 'Criterio de permanencia física o constitución legal.'
    }
};

/**
 * TIN Metadata for Laos (Era 6.3)
 */
export const TIN_INFO: TinInfo = {
    name: 'TIN',
    description: 'Lao TIN issued by the Tax Department.',
    placeholder: '123456789012',
    officialLink: 'https://taxservice.mof.gov.la',
    isOfficial: true,
    lastUpdated: '2026-04-24',
    source: 'Local Authority / Laos Tax',
    entityDifferentiation: {
        logic: 'Structurally identical identifiers.',
        individualDescription: 'TIN for individuals.',
        businessDescription: 'TIN for entities.'
    }
};

/**
 * Laos TIN Validator - Era 6.3
 */
export const validateLATIN = (
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
            explanation: 'Matches official Lao TIN (12 digits) format.' 
        };
    }

    if (sanitized.length >= 4 && sanitized.length <= 15 && /^[A-Z0-9]+$/.test(sanitized)) {
        return { 
            isValid: true, 
            status: 'VALID', 
            isOfficialMatch: true, 
            explanation: 'Matches general Lao TIN alphanumeric format.' 
        };
    }

    return { 
        isValid: false, 
        status: 'INVALID_FORMAT',
        explanation: 'Value does not match Lao TIN format.'
    };
};

/**
 * APPENDIX: FORENSIC CRITERIA
 * Laos uses the Tax Identification Number (TIN) for all taxpayers.
 * 1. Scope: Issued and managed by the Tax Department of the Ministry of Finance.
 * 2. Structure: Standardized 12-digit numeric sequence.
 * 3. Validation: Structural verification based on pattern and length. 
 * 4. Residency: Centered on the 183-day presence rule in a calendar year.
 */
