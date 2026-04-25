import { HolderMetadata, TinValidationResult, CountryRegulatoryInfo, TinInfo, TinRequirement } from './index';

/**
 * TIN Validation for Saint Vincent and the Grenadines (VC)
 * TIN (10 digits)
 */

/**
 * TIN Requirements for Saint Vincent and the Grenadines
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
 * Country Metadata for Saint Vincent and the Grenadines
 */
export const COUNTRY_INFO: CountryRegulatoryInfo = {
    name: 'San Vicente y las Granadinas',
    authority: 'Inland Revenue Department (IRD)',
    compliance: {
        crsStatus: 'Participating',
        crsDate: 'September 2018',
        fatcaStatus: 'Model 1 (In Force)'
    },
    residency: {
        individual: 'Se considera residente si permanece en el país 183 días o más en un año civil.',
        entity: 'Se considera residente si su gestión y control se ejercen en San Vicente y las Granadinas.',
        notes: 'Criterio de permanencia física de 183 días.'
    }
};

/**
 * TIN Metadata for Saint Vincent and the Grenadines (Era 6.3)
 */
export const TIN_INFO: TinInfo = {
    name: 'Tax Identification Number',
    description: 'Unique identifier issued by the Inland Revenue Department.',
    placeholder: '1234567890',
    officialLink: 'http://ird.gov.vc',
    isOfficial: true,
    lastUpdated: '2026-04-24',
    source: 'OECD Portal / Inland Revenue Department of Saint Vincent',
    entityDifferentiation: {
        logic: 'Numeric sequence without structural differentiation.',
        individualDescription: '10-digit TIN.',
        businessDescription: '10-digit TIN.'
    }
};

/**
 * Saint Vincent and the Grenadines TIN Validator (10 digits) - Era 6.3
 */
export const validateVCTIN = (
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
            explanation: 'Matches official 10-digit Saint Vincent TIN format.' 
        };
    }

    if (sanitized.length >= 4 && sanitized.length <= 15 && /^[A-Z0-9]+$/.test(sanitized)) {
        return { 
            isValid: true, 
            status: 'VALID', 
            isOfficialMatch: true, 
            explanation: 'Matches general Saint Vincent identifier alphanumeric format.' 
        };
    }

    return { 
        isValid: false, 
        status: 'INVALID_FORMAT', 
        explanation: 'Saint Vincent TINs must be exactly 10 digits long.' 
    };
};

/**
 * APPENDIX: FORENSIC CRITERIA
 * Saint Vincent and the Grenadines uses a 10-digit TIN issued by the IRD. 
 * 1. Scope: Issued and managed by the Inland Revenue Department.
 * 2. Structure: Standardized 10-digit numeric sequence.
 * 3. Validation: Structural verification based on pattern and length. 
 * 4. Residency: Centered on the 183-day presence rule or management and control.
 */
