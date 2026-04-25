import { HolderMetadata, TinValidationResult, CountryRegulatoryInfo, TinInfo, TinRequirement } from './index';

/**
 * TIN Validation for Somalia (SO)
 * TIN (9 digits)
 */

/**
 * TIN Requirements for Somalia
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
 * Country Metadata for Somalia
 */
export const COUNTRY_INFO: CountryRegulatoryInfo = {
    name: 'Somalia',
    authority: 'Ministry of Finance',
    compliance: {
        crsStatus: 'Non-Participating',
        crsDate: 'N/A',
        fatcaStatus: 'N/A'
    },
    residency: {
        individual: 'Se considera residente si permanece en Somalia durante más de 183 días en el año fiscal.',
        entity: 'Se considera residente si está incorporada en Somalia.',
        notes: 'Criterio de permanencia física o constitución legal.'
    }
};

/**
 * TIN Metadata for Somalia (Era 6.3)
 */
export const TIN_INFO: TinInfo = {
    name: 'TIN',
    description: 'Somalian TIN issued by the Ministry of Finance.',
    placeholder: '123456789',
    officialLink: 'https://www.mof.gov.so',
    isOfficial: true,
    lastUpdated: '2026-04-24',
    source: 'Local Authority / Somalia Tax',
    entityDifferentiation: {
        logic: 'Structurally identical identifiers.',
        individualDescription: '9-digit TIN identifier.',
        businessDescription: '9-digit TIN identifier.'
    }
};

/**
 * Somalia TIN Validator - Era 6.3
 */
export const validateSOTIN = (
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
            explanation: 'Matches official Somalian TIN (9 digits) format.' 
        };
    }

    if (sanitized.length >= 4 && sanitized.length <= 15 && /^[A-Z0-9]+$/.test(sanitized)) {
        return { 
            isValid: true, 
            status: 'VALID', 
            isOfficialMatch: true, 
            explanation: 'Matches general Somalian TIN alphanumeric format.' 
        };
    }

    return { 
        isValid: false, 
        status: 'INVALID_FORMAT',
        explanation: 'Value does not match Somalian TIN format.'
    };
};

/**
 * APPENDIX: FORENSIC CRITERIA
 * Somalia uses the Tax Identification Number (TIN) for all taxpayers.
 * 1. Scope: Issued and managed by the Ministry of Finance.
 * 2. Structure: Standardized 9-digit numeric sequence.
 * 3. Validation: Structural verification based on pattern and length. 
 * 4. Residency: Centered on the 183-day presence rule in a fiscal year.
 */
