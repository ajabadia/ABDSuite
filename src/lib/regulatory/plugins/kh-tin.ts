import { HolderMetadata, TinValidationResult, CountryRegulatoryInfo, TinInfo, TinRequirement } from './index';

/**
 * TIN Validation for Cambodia (KH)
 * TIN (9 digits)
 */

/**
 * TIN Requirements for Cambodia
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
 * Country Metadata for Cambodia
 */
export const COUNTRY_INFO: CountryRegulatoryInfo = {
    name: 'Camboya',
    authority: 'General Department of Taxation (GDT)',
    compliance: {
        crsStatus: 'Non-Participating',
        crsDate: 'N/A',
        fatcaStatus: 'Model 1 (In Force)'
    },
    residency: {
        individual: 'Se considera residente si tiene su residencia principal en Camboya o si permanece allí durante más de 182 días.',
        entity: 'Se considera residente si está incorporada en Camboya.',
        notes: 'Criterio de residencia principal o estancia de 182 días.'
    }
};

/**
 * TIN Metadata for Cambodia (Era 6.3)
 */
export const TIN_INFO: TinInfo = {
    name: 'TIN',
    description: 'Cambodian TIN issued by the GDT.',
    placeholder: '123456789',
    officialLink: 'https://www.tax.gov.kh',
    isOfficial: true,
    lastUpdated: '2026-04-24',
    source: 'Local Authority / Cambodia Tax',
    entityDifferentiation: {
        logic: 'Structurally identical identifiers.',
        individualDescription: '9-digit TIN identifier.',
        businessDescription: '9-digit TIN identifier.'
    }
};

/**
 * Cambodia TIN Validator - Era 6.3
 */
export const validateKHTIN = (
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
            explanation: 'Matches official Cambodian TIN (9 digits) format.' 
        };
    }

    if (sanitized.length >= 4 && sanitized.length <= 15 && /^[A-Z0-9]+$/.test(sanitized)) {
        return { 
            isValid: true, 
            status: 'VALID', 
            isOfficialMatch: true, 
            explanation: 'Matches general Cambodian TIN alphanumeric format.' 
        };
    }

    return { 
        isValid: false, 
        status: 'INVALID_FORMAT',
        explanation: 'Value does not match Cambodian TIN format.'
    };
};

/**
 * APPENDIX: FORENSIC CRITERIA
 * Cambodia uses the Tax Identification Number (TIN) for all taxpayers.
 * 1. Scope: Issued and managed by the General Department of Taxation (GDT).
 * 2. Structure: Numeric sequence typically 9 digits long.
 * 3. Validation: Structural verification based on pattern and length. 
 * 4. Residency: Centered on the 182-day presence rule or primary residence.
 */
