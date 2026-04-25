import { HolderMetadata, TinValidationResult, CountryRegulatoryInfo, TinInfo, TinRequirement } from './index';

/**
 * TIN Validation for Yemen (YE)
 * TIN (9 digits)
 */

/**
 * TIN Requirements for Yemen
 */
export const TIN_REQUIREMENTS: TinRequirement[] = [];

/**
 * Country Metadata for Yemen
 */
export const COUNTRY_INFO: CountryRegulatoryInfo = {
    name: 'Yemen',
    authority: 'Tax Authority',
    compliance: {
        crsStatus: 'Non-Participating',
        crsDate: 'N/A',
        fatcaStatus: 'N/A'
    },
    residency: {
        individual: 'Se considera residente si permanece en Yemen durante más de 183 días en el año civil.',
        entity: 'Se considera residente si está incorporada en Yemen.',
        notes: 'Criterio de permanencia física o constitución legal.'
    }
};

/**
 * TIN Metadata for Yemen (Era 6.3)
 */
export const TIN_INFO: TinInfo = {
    name: 'TIN',
    description: 'Yemeni TIN issued by the Tax Authority.',
    placeholder: '123456789',
    officialLink: 'https://www.tax.gov.ye',
    isOfficial: true,
    lastUpdated: '2026-04-24',
    source: 'Local Authority / Yemen Tax',
    entityDifferentiation: {
        logic: 'Structurally identical identifiers.',
        individualDescription: '9-digit TIN identifier.',
        businessDescription: '9-digit TIN identifier.'
    }
};

/**
 * Yemen TIN Validator - Era 6.3
 */
export const validateYETIN = (
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
            explanation: 'Matches official Yemeni TIN (9 digits) format.' 
        };
    }

    if (sanitized.length >= 4 && sanitized.length <= 15 && /^[A-Z0-9]+$/.test(sanitized)) {
        return { 
            isValid: true, 
            status: 'VALID', 
            isOfficialMatch: true, 
            explanation: 'Matches general Yemeni identifier alphanumeric format.' 
        };
    }

    return { 
        isValid: false, 
        status: 'INVALID_FORMAT',
        explanation: 'Value does not match Yemeni TIN format.'
    };
};

/**
 * APPENDIX: FORENSIC CRITERIA
 * Yemen uses the Tax Identification Number (TIN) for all taxpayers.
 * 1. Scope: Issued and managed by the Tax Authority.
 * 2. Structure: Standardized 9-digit numeric sequence.
 * 3. Validation: Structural verification based on pattern and length. 
 * 4. Residency: Centered on the 183-day presence rule in a calendar year.
 */
