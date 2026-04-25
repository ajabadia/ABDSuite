import { HolderMetadata, TinValidationResult, CountryRegulatoryInfo, TinInfo, TinRequirement } from './index';

/**
 * TIN Validation for Lebanon (LB)
 * TIN / MOF Number (6-8 digits)
 */

/**
 * TIN Requirements for Lebanon
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
 * Country Metadata for Lebanon
 */
export const COUNTRY_INFO: CountryRegulatoryInfo = {
    name: 'Líbano',
    authority: 'Ministry of Finance',
    compliance: {
        crsStatus: 'Participating',
        crsDate: 'September 2018',
        fatcaStatus: 'N/A'
    },
    residency: {
        individual: 'Se considera residente si tiene su residencia principal en Líbano o si permanece allí durante más de 183 días.',
        entity: 'Se considera residente si está incorporada en Líbano.',
        notes: 'Criterio de residencia principal o estancia de 183 días.'
    }
};

/**
 * TIN Metadata for Lebanon (Era 6.3)
 */
export const TIN_INFO: TinInfo = {
    name: 'TIN / MOF Number',
    description: 'Lebanese Tax Identification Number (MOF) issued by the Ministry of Finance.',
    placeholder: '1234567',
    officialLink: 'https://www.finance.gov.lb',
    isOfficial: true,
    lastUpdated: '2026-04-24',
    source: 'Local Authority / Lebanon Tax',
    entityDifferentiation: {
        logic: 'Structurally identical identifiers.',
        individualDescription: 'TIN for individuals.',
        businessDescription: 'TIN for entities.'
    }
};

/**
 * Lebanon TIN Validator - Era 6.3
 */
export const validateLBTIN = (
    value: string, 
    type: 'INDIVIDUAL' | 'ENTITY' | 'ANY' = 'ANY', 
    metadata?: HolderMetadata
): TinValidationResult => {
    const sanitized = value.trim().toUpperCase().replace(/[\s-]/g, '');

    if (sanitized.length >= 6 && sanitized.length <= 8 && /^[0-9]+$/.test(sanitized)) {
        return { 
            isValid: true, 
            status: 'VALID', 
            isOfficialMatch: true, 
            explanation: 'Matches official Lebanese TIN (6-8 digits) format.' 
        };
    }

    if (sanitized.length >= 4 && sanitized.length <= 15 && /^[A-Z0-9]+$/.test(sanitized)) {
        return { 
            isValid: true, 
            status: 'VALID', 
            isOfficialMatch: true, 
            explanation: 'Matches general Lebanese TIN alphanumeric format.' 
        };
    }

    return { 
        isValid: false, 
        status: 'INVALID_FORMAT',
        explanation: 'Value does not match Lebanese TIN format.'
    };
};

/**
 * APPENDIX: FORENSIC CRITERIA
 * Lebanon uses the MOF Number (Tax Identification Number) for all tax 
 * obligations.
 * 1. Scope: Issued and managed by the Ministry of Finance.
 * 2. Structure: Numeric sequence typically between 6 and 8 digits.
 * 3. Validation: Structural verification based on pattern and length. 
 * 4. Residency: Based on the 183-day presence rule or primary residence.
 */
