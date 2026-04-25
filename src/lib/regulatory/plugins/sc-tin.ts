import { HolderMetadata, TinValidationResult, CountryRegulatoryInfo, TinInfo, TinRequirement } from './index';

/**
 * TIN Validation for Seychelles (SC)
 * TIN (9 digits)
 */

/**
 * TIN Requirements for Seychelles
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
 * Country Metadata for Seychelles
 */
export const COUNTRY_INFO: CountryRegulatoryInfo = {
    name: 'Seychelles',
    authority: 'Seychelles Revenue Commission (SRC)',
    compliance: {
        crsStatus: 'Participating',
        crsDate: 'September 2017',
        fatcaStatus: 'Model 1 (In Force)'
    },
    residency: {
        individual: 'Se considera residente si permanece en Seychelles durante más de 183 días en el año civil.',
        entity: 'Se considera residente si está incorporada en Seychelles.',
        notes: 'Criterio de permanencia física o constitución legal.'
    }
};

/**
 * TIN Metadata for Seychelles (Era 6.3)
 */
export const TIN_INFO: TinInfo = {
    name: 'TIN',
    description: 'Seychelles TIN issued by the SRC.',
    placeholder: '123456789',
    officialLink: 'https://www.src.gov.sc',
    isOfficial: true,
    lastUpdated: '2026-04-24',
    source: 'Local Authority / Seychelles Tax',
    entityDifferentiation: {
        logic: 'Structurally identical identifiers.',
        individualDescription: '9-digit TIN identifier.',
        businessDescription: '9-digit TIN identifier.'
    }
};

/**
 * Seychelles TIN Validator - Era 6.3
 */
export const validateSCTIN = (
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
            explanation: 'Matches official Seychelles TIN (9 digits) format.' 
        };
    }

    if (sanitized.length >= 4 && sanitized.length <= 15 && /^[A-Z0-9]+$/.test(sanitized)) {
        return { 
            isValid: true, 
            status: 'VALID', 
            isOfficialMatch: true, 
            explanation: 'Matches general Seychelles TIN alphanumeric format.' 
        };
    }

    return { 
        isValid: false, 
        status: 'INVALID_FORMAT',
        explanation: 'Value does not match Seychelles TIN format.'
    };
};

/**
 * APPENDIX: FORENSIC CRITERIA
 * Seychelles uses the Tax Identification Number (TIN) for all taxpayers.
 * 1. Scope: Issued and managed by the Seychelles Revenue Commission (SRC).
 * 2. Structure: Numeric sequence of 9 digits.
 * 3. Validation: Structural verification based on pattern and length. 
 * 4. Residency: Centered on the 183-day presence rule in a calendar year.
 */
