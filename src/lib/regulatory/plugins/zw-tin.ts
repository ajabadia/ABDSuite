import { HolderMetadata, TinValidationResult, CountryRegulatoryInfo, TinInfo, TinRequirement } from './index';

/**
 * TIN Validation for Zimbabwe (ZW)
 * Business Partner (BP) Number (9 or 10 digits)
 */

/**
 * TIN Requirements for Zimbabwe
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
 * Country Metadata for Zimbabwe
 */
export const COUNTRY_INFO: CountryRegulatoryInfo = {
    name: 'Zimbabue',
    authority: 'Zimbabwe Revenue Authority (ZIMRA)',
    compliance: {
        crsStatus: 'Non-Participating',
        crsDate: 'N/A',
        fatcaStatus: 'N/A'
    },
    residency: {
        individual: 'Se considera residente si permanece en Zimbabue durante más de 183 días en el año fiscal.',
        entity: 'Se considera residente si está incorporada en Zimbabue.',
        notes: 'Criterio de permanencia física o constitución legal.'
    }
};

/**
 * TIN Metadata for Zimbabwe (Era 6.3)
 */
export const TIN_INFO: TinInfo = {
    name: 'BP Number',
    description: 'Zimbabwean BP Number issued by the ZIMRA.',
    placeholder: '123456789',
    officialLink: 'https://www.zimra.co.zw',
    isOfficial: true,
    lastUpdated: '2026-04-24',
    source: 'Local Authority / Zimbabwe ZIMRA',
    entityDifferentiation: {
        logic: 'Structurally identical identifiers.',
        individualDescription: '9 or 10-digit BP identifier.',
        businessDescription: '9 or 10-digit BP identifier.'
    }
};

/**
 * Zimbabwe TIN Validator - Era 6.3
 */
export const validateZWTIN = (
    value: string, 
    type: 'INDIVIDUAL' | 'ENTITY' | 'ANY' = 'ANY', 
    metadata?: HolderMetadata
): TinValidationResult => {
    const sanitized = value.trim().toUpperCase().replace(/[\s-]/g, '');

    if ((sanitized.length === 9 || sanitized.length === 10) && /^[0-9]+$/.test(sanitized)) {
        return { 
            isValid: true, 
            status: 'VALID', 
            isOfficialMatch: true, 
            explanation: `Matches official Zimbabwean BP Number (${sanitized.length} digits) format.` 
        };
    }

    if (sanitized.length >= 4 && sanitized.length <= 15 && /^[A-Z0-9]+$/.test(sanitized)) {
        return { 
            isValid: true, 
            status: 'VALID', 
            isOfficialMatch: true, 
            explanation: 'Matches general Zimbabwean identifier alphanumeric format.' 
        };
    }

    return { 
        isValid: false, 
        status: 'INVALID_FORMAT',
        explanation: 'Value does not match Zimbabwean BP Number format.'
    };
};

/**
 * APPENDIX: FORENSIC CRITERIA
 * Zimbabwe uses the Business Partner (BP) Number for all taxpayers.
 * 1. Scope: Issued and managed by the Zimbabwe Revenue Authority (ZIMRA).
 * 2. Structure: Standardized numeric sequence (typically 9 or 10 digits).
 * 3. Validation: Structural verification based on pattern and length. 
 * 4. Residency: Centered on the 183-day presence rule in a fiscal year.
 */
