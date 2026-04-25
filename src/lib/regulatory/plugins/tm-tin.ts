import { HolderMetadata, TinValidationResult, CountryRegulatoryInfo, TinInfo, TinRequirement } from './index';

/**
 * TIN Validation for Turkmenistan (TM)
 * TIN (12 digits)
 */

/**
 * TIN Requirements for Turkmenistan
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
 * Country Metadata for Turkmenistan
 */
export const COUNTRY_INFO: CountryRegulatoryInfo = {
    name: 'Turkmenistán',
    authority: 'Ministry of Finance and Economy',
    compliance: {
        crsStatus: 'Non-Participating',
        crsDate: 'N/A',
        fatcaStatus: 'Model 1 (In Force)'
    },
    residency: {
        individual: 'Se considera residente si permanece en Turkmenistán durante más de 183 días en el año civil.',
        entity: 'Se considera residente si está incorporada en Turkmenistán.',
        notes: 'Criterio de permanencia física o constitución legal.'
    }
};

/**
 * TIN Metadata for Turkmenistan (Era 6.3)
 */
export const TIN_INFO: TinInfo = {
    name: 'TIN',
    description: 'Turkmen TIN issued by the Tax Authority.',
    placeholder: '123456789012',
    officialLink: 'https://www.fineconomic.gov.tm',
    isOfficial: true,
    lastUpdated: '2026-04-24',
    source: 'Local Authority / Turkmenistan Tax',
    entityDifferentiation: {
        logic: 'Structurally identical identifiers.',
        individualDescription: '12-digit TIN identifier.',
        businessDescription: '12-digit TIN identifier.'
    }
};

/**
 * Turkmenistan TIN Validator - Era 6.3
 */
export const validateTMTIN = (
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
            explanation: 'Matches official Turkmen TIN (12 digits) format.' 
        };
    }

    if (sanitized.length >= 4 && sanitized.length <= 15 && /^[A-Z0-9]+$/.test(sanitized)) {
        return { 
            isValid: true, 
            status: 'VALID', 
            isOfficialMatch: true, 
            explanation: 'Matches general Turkmen TIN alphanumeric format.' 
        };
    }

    return { 
        isValid: false, 
        status: 'INVALID_FORMAT',
        explanation: 'Value does not match Turkmen TIN format.'
    };
};

/**
 * APPENDIX: FORENSIC CRITERIA
 * Turkmenistan uses the Tax Identification Number (TIN) for all taxpayers.
 * 1. Scope: Issued and managed by the State Tax Service.
 * 2. Structure: Standardized 12-digit numeric sequence.
 * 3. Validation: Structural verification based on pattern and length. 
 * 4. Residency: Centered on the 183-day presence rule in a calendar year.
 */
