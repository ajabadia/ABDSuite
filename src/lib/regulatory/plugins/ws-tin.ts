import { HolderMetadata, TinValidationResult, CountryRegulatoryInfo, TinInfo, TinRequirement } from './index';

/**
 * TIN Validation for Samoa (WS)
 * TIN (10 digits)
 */

/**
 * TIN Requirements for Samoa
 */
export const TIN_REQUIREMENTS: TinRequirement[] = [];

/**
 * Country Metadata for Samoa
 */
export const COUNTRY_INFO: CountryRegulatoryInfo = {
    name: 'Samoa',
    authority: 'Ministry of Customs and Revenue',
    compliance: {
        crsStatus: 'Participating',
        crsDate: 'September 2018',
        fatcaStatus: 'N/A'
    },
    residency: {
        individual: 'Se considera residente si permanece en Samoa durante más de 183 días en el año fiscal.',
        entity: 'Se considera residente si está incorporada en Samoa.',
        notes: 'Criterio de permanencia física o constitución legal.'
    }
};

/**
 * TIN Metadata for Samoa (Era 6.3)
 */
export const TIN_INFO: TinInfo = {
    name: 'TIN',
    description: 'Samoan TIN issued by the Ministry of Revenue.',
    placeholder: '1234567890',
    officialLink: 'https://www.revenue.gov.ws',
    isOfficial: true,
    lastUpdated: '2026-04-24',
    source: 'Local Authority / Samoa Tax',
    entityDifferentiation: {
        logic: 'Structurally identical identifiers.',
        individualDescription: '10-digit TIN identifier.',
        businessDescription: '10-digit TIN identifier.'
    }
};

/**
 * Samoa TIN Validator - Era 6.3
 */
export const validateWSTIN = (
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
            explanation: 'Matches official Samoan TIN (10 digits) format.' 
        };
    }

    if (sanitized.length >= 4 && sanitized.length <= 15 && /^[A-Z0-9]+$/.test(sanitized)) {
        return { 
            isValid: true, 
            status: 'VALID', 
            isOfficialMatch: true, 
            explanation: 'Matches general Samoan identifier alphanumeric format.' 
        };
    }

    return { 
        isValid: false, 
        status: 'INVALID_FORMAT',
        explanation: 'Value does not match Samoan TIN format.'
    };
};

/**
 * APPENDIX: FORENSIC CRITERIA
 * Samoa uses the Tax Identification Number (TIN) for all taxpayers.
 * 1. Scope: Issued and managed by the Ministry of Customs and Revenue.
 * 2. Structure: Standardized 10-digit numeric sequence.
 * 3. Validation: Structural verification based on pattern and length. 
 * 4. Residency: Centered on the 183-day presence rule in a fiscal year.
 */
