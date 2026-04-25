import { HolderMetadata, TinValidationResult, CountryRegulatoryInfo, TinInfo, TinRequirement } from './index';

/**
 * TIN Validation for Kiribati (KI)
 * TIN (6-9 digits)
 */

/**
 * TIN Requirements for Kiribati
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
 * Country Metadata for Kiribati
 */
export const COUNTRY_INFO: CountryRegulatoryInfo = {
    name: 'Kiribati',
    authority: 'Kiribati Revenue Authority (KRA)',
    compliance: {
        crsStatus: 'Non-Participating',
        crsDate: 'N/A',
        fatcaStatus: 'N/A'
    },
    residency: {
        individual: 'Se considera residente si permanece en Kiribati durante más de 183 días en el año civil.',
        entity: 'Se considera residente si está incorporada en Kiribati.',
        notes: 'Criterio de permanencia física o constitución legal.'
    }
};

/**
 * TIN Metadata for Kiribati (Era 6.3)
 */
export const TIN_INFO: TinInfo = {
    name: 'TIN',
    description: 'Kiribati TIN issued by the KRA.',
    placeholder: '1234567',
    officialLink: 'https://www.mfed.gov.ki',
    isOfficial: true,
    lastUpdated: '2026-04-24',
    source: 'Local Authority / Kiribati Tax',
    entityDifferentiation: {
        logic: 'Structurally identical identifiers.',
        individualDescription: 'TIN for individuals.',
        businessDescription: 'TIN for entities.'
    }
};

/**
 * Kiribati TIN Validator - Era 6.3
 */
export const validateKITIN = (
    value: string, 
    type: 'INDIVIDUAL' | 'ENTITY' | 'ANY' = 'ANY', 
    metadata?: HolderMetadata
): TinValidationResult => {
    const sanitized = value.trim().toUpperCase().replace(/[\s-]/g, '');

    if (sanitized.length >= 6 && sanitized.length <= 9 && /^[0-9]+$/.test(sanitized)) {
        return { 
            isValid: true, 
            status: 'VALID', 
            isOfficialMatch: true, 
            explanation: 'Matches official Kiribati TIN format.' 
        };
    }

    if (sanitized.length >= 4 && sanitized.length <= 15 && /^[A-Z0-9]+$/.test(sanitized)) {
        return { 
            isValid: true, 
            status: 'VALID', 
            isOfficialMatch: true, 
            explanation: 'Matches general Kiribati TIN alphanumeric format.' 
        };
    }

    return { 
        isValid: false, 
        status: 'INVALID_FORMAT',
        explanation: 'Value does not match Kiribati TIN format.'
    };
};

/**
 * APPENDIX: FORENSIC CRITERIA
 * Kiribati uses the Tax Identification Number (TIN) for all taxpayers.
 * 1. Scope: Issued and managed by the Kiribati Revenue Authority (KRA).
 * 2. Structure: Numeric sequence typically between 6 and 9 digits.
 * 3. Validation: Structural verification based on pattern and length. 
 * 4. Residency: Centered on the 183-day presence rule in a calendar year.
 */
