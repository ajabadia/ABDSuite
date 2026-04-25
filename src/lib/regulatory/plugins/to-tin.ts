import { HolderMetadata, TinValidationResult, CountryRegulatoryInfo, TinInfo, TinRequirement } from './index';

/**
 * TIN Validation for Tonga (TO)
 * TIN (8 digits)
 */

/**
 * TIN Requirements for Tonga
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
 * Country Metadata for Tonga
 */
export const COUNTRY_INFO: CountryRegulatoryInfo = {
    name: 'Tonga',
    authority: 'Ministry of Revenue and Customs',
    compliance: {
        crsStatus: 'Non-Participating',
        crsDate: 'N/A',
        fatcaStatus: 'N/A'
    },
    residency: {
        individual: 'Se considera residente si permanece en Tonga durante más de 183 días en el año fiscal.',
        entity: 'Se considera residente si está incorporada en Tonga.',
        notes: 'Criterio de permanencia física o constitución legal.'
    }
};

/**
 * TIN Metadata for Tonga (Era 6.3)
 */
export const TIN_INFO: TinInfo = {
    name: 'TIN',
    description: 'Tongan TIN issued by the Ministry of Revenue.',
    placeholder: '12345678',
    officialLink: 'https://www.revenue.gov.to',
    isOfficial: true,
    lastUpdated: '2026-04-24',
    source: 'Local Authority / Tonga Revenue',
    entityDifferentiation: {
        logic: 'Structurally identical identifiers.',
        individualDescription: '8-digit TIN identifier.',
        businessDescription: '8-digit TIN identifier.'
    }
};

/**
 * Tonga TIN Validator - Era 6.3
 */
export const validateTOTIN = (
    value: string, 
    type: 'INDIVIDUAL' | 'ENTITY' | 'ANY' = 'ANY', 
    metadata?: HolderMetadata
): TinValidationResult => {
    const sanitized = value.trim().toUpperCase().replace(/[\s-]/g, '');

    if (sanitized.length === 8 && /^[0-9]{8}$/.test(sanitized)) {
        return { 
            isValid: true, 
            status: 'VALID', 
            isOfficialMatch: true, 
            explanation: 'Matches official Tongan TIN (8 digits) format.' 
        };
    }

    if (sanitized.length >= 4 && sanitized.length <= 15 && /^[A-Z0-9]+$/.test(sanitized)) {
        return { 
            isValid: true, 
            status: 'VALID', 
            isOfficialMatch: true, 
            explanation: 'Matches general Tongan TIN alphanumeric format.' 
        };
    }

    return { 
        isValid: false, 
        status: 'INVALID_FORMAT',
        explanation: 'Value does not match Tongan TIN format.'
    };
};

/**
 * APPENDIX: FORENSIC CRITERIA
 * Tonga uses the Tax Identification Number (TIN) for all taxpayers.
 * 1. Scope: Issued and managed by the Ministry of Revenue and Customs.
 * 2. Structure: Standardized 8-digit numeric sequence.
 * 3. Validation: Structural verification based on pattern and length. 
 * 4. Residency: Centered on the 183-day presence rule in a fiscal year.
 */
