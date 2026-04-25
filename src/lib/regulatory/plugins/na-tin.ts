import { HolderMetadata, TinValidationResult, CountryRegulatoryInfo, TinInfo, TinRequirement } from './index';

/**
 * TIN Validation for Namibia (NA)
 * TIN (7-9 digits)
 */

/**
 * TIN Requirements for Namibia
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
 * Country Metadata for Namibia
 */
export const COUNTRY_INFO: CountryRegulatoryInfo = {
    name: 'Namibia',
    authority: 'Namibia Revenue Agency (NamRA)',
    compliance: {
        crsStatus: 'Non-Participating',
        crsDate: 'N/A',
        fatcaStatus: 'N/A'
    },
    residency: {
        individual: 'Se considera residente si permanece en Namibia durante más de 183 días en el año fiscal.',
        entity: 'Se considera residente si está incorporada en Namibia.',
        notes: 'Criterio de permanencia física o constitución legal.'
    }
};

/**
 * TIN Metadata for Namibia (Era 6.3)
 */
export const TIN_INFO: TinInfo = {
    name: 'TIN',
    description: 'Namibian TIN issued by NamRA.',
    placeholder: '1234567',
    officialLink: 'https://www.namra.org.na',
    isOfficial: true,
    lastUpdated: '2026-04-24',
    source: 'Local Authority / Namibia Tax',
    entityDifferentiation: {
        logic: 'Structurally identical identifiers.',
        individualDescription: 'TIN for individuals.',
        businessDescription: 'TIN for entities.'
    }
};

/**
 * Namibia TIN Validator - Era 6.3
 */
export const validateNATIN = (
    value: string, 
    type: 'INDIVIDUAL' | 'ENTITY' | 'ANY' = 'ANY', 
    metadata?: HolderMetadata
): TinValidationResult => {
    const sanitized = value.trim().toUpperCase().replace(/[\s-]/g, '');

    if (sanitized.length >= 7 && sanitized.length <= 9 && /^[0-9]+$/.test(sanitized)) {
        return { 
            isValid: true, 
            status: 'VALID', 
            isOfficialMatch: true, 
            explanation: 'Matches official Namibian TIN (7-9 digits) format.' 
        };
    }

    if (sanitized.length >= 4 && sanitized.length <= 15 && /^[A-Z0-9]+$/.test(sanitized)) {
        return { 
            isValid: true, 
            status: 'VALID', 
            isOfficialMatch: true, 
            explanation: 'Matches general Namibian TIN alphanumeric format.' 
        };
    }

    return { 
        isValid: false, 
        status: 'INVALID_FORMAT',
        explanation: 'Value does not match Namibian TIN format.'
    };
};

/**
 * APPENDIX: FORENSIC CRITERIA
 * Namibia uses the Tax Identification Number (TIN) for all taxpayers.
 * 1. Scope: Issued and managed by the Namibia Revenue Agency (NamRA).
 * 2. Structure: Numeric sequence typically between 7 and 9 digits.
 * 3. Validation: Structural verification based on pattern and length. 
 * 4. Residency: Centered on the 183-day presence rule in a fiscal year.
 */
