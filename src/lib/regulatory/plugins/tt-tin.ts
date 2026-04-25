import { HolderMetadata, TinValidationResult, CountryRegulatoryInfo, TinInfo, TinRequirement } from './index';

/**
 * TIN Validation for Trinidad and Tobago (TT)
 * BIR Number (7-10 digits)
 */

/**
 * TIN Requirements for Trinidad and Tobago
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
 * Country Metadata for Trinidad and Tobago
 */
export const COUNTRY_INFO: CountryRegulatoryInfo = {
    name: 'Trinidad y Tobago',
    authority: 'Inland Revenue Division (IRD)',
    compliance: {
        crsStatus: 'Non-Participating',
        crsDate: 'N/A',
        fatcaStatus: 'Model 1 (In Force)'
    },
    residency: {
        individual: 'Se considera residente si permanece en Trinidad y Tobago durante más de 183 días en el año fiscal.',
        entity: 'Se considera residente si está incorporada en Trinidad y Tobago o si su gestión y control se ejercen allí.',
        notes: 'Criterio de permanencia física o control de gestión.'
    }
};

/**
 * TIN Metadata for Trinidad and Tobago (Era 6.3)
 */
export const TIN_INFO: TinInfo = {
    name: 'BIR Number',
    description: 'Trinidadian BIR Number issued by the IRD.',
    placeholder: '12345678',
    officialLink: 'https://www.ird.gov.tt',
    isOfficial: true,
    lastUpdated: '2026-04-24',
    source: 'Local Authority / Trinidad IRD',
    entityDifferentiation: {
        logic: 'Structurally identical identifiers.',
        individualDescription: '7 to 10-digit BIR Number.',
        businessDescription: '7 to 10-digit BIR Number.'
    }
};

/**
 * Trinidad and Tobago TIN Validator - Era 6.3
 */
export const validateTTTIN = (
    value: string, 
    type: 'INDIVIDUAL' | 'ENTITY' | 'ANY' = 'ANY', 
    metadata?: HolderMetadata
): TinValidationResult => {
    const sanitized = value.trim().toUpperCase().replace(/[\s-]/g, '');

    if (sanitized.length >= 7 && sanitized.length <= 10 && /^[0-9]+$/.test(sanitized)) {
        return { 
            isValid: true, 
            status: 'VALID', 
            isOfficialMatch: true, 
            explanation: `Matches official Trinidadian BIR Number (${sanitized.length} digits) format.` 
        };
    }

    if (sanitized.length >= 4 && sanitized.length <= 15 && /^[A-Z0-9]+$/.test(sanitized)) {
        return { 
            isValid: true, 
            status: 'VALID', 
            isOfficialMatch: true, 
            explanation: 'Matches general Trinidadian BIR alphanumeric format.' 
        };
    }

    return { 
        isValid: false, 
        status: 'INVALID_FORMAT',
        explanation: 'Value does not match Trinidadian BIR Number format.'
    };
};

/**
 * APPENDIX: FORENSIC CRITERIA
 * Trinidad and Tobago uses the Board of Inland Revenue (BIR) Number for all taxpayers.
 * 1. Scope: Issued and managed by the Inland Revenue Division (IRD).
 * 2. Structure: Numeric sequence of variable length (typically 7 to 10 digits).
 * 3. Validation: Structural verification based on pattern and length. 
 * 4. Residency: Centered on the 183-day presence rule or management and control rule.
 */
