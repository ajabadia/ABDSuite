import { HolderMetadata, TinValidationResult, CountryRegulatoryInfo, TinInfo, TinRequirement } from './index';

/**
 * TIN Validation for Fiji (FJ)
 * TIN (9 or 10 digits)
 */

/**
 * TIN Requirements for Fiji
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
 * Country Metadata for Fiji
 */
export const COUNTRY_INFO: CountryRegulatoryInfo = {
    name: 'Fiyi',
    authority: 'Fiji Revenue and Customs Service (FRCS)',
    compliance: {
        crsStatus: 'Non-Participating',
        crsDate: 'N/A',
        fatcaStatus: 'N/A'
    },
    residency: {
        individual: 'Se considera residente si permanece en Fiyi durante más de 183 días en el año fiscal.',
        entity: 'Se considera residente si está incorporada en Fiyi.',
        notes: 'Criterio de permanencia física o constitución legal.'
    }
};

/**
 * TIN Metadata for Fiji (Era 6.3)
 */
export const TIN_INFO: TinInfo = {
    name: 'TIN',
    description: 'Fijian TIN issued by the FRCS.',
    placeholder: '123456789',
    officialLink: 'https://www.frcs.org.fj',
    isOfficial: true,
    lastUpdated: '2026-04-24',
    source: 'Local Authority / Fiji FRCS',
    entityDifferentiation: {
        logic: 'Structurally identical identifiers.',
        individualDescription: '9 or 10-digit TIN identifier.',
        businessDescription: '9 or 10-digit TIN identifier.'
    }
};

/**
 * Fiji TIN Validator - Era 6.3
 */
export const validateFJTIN = (
    value: string, 
    type: 'INDIVIDUAL' | 'ENTITY' | 'ANY' = 'ANY', 
    metadata?: HolderMetadata
): TinValidationResult => {
    const sanitized = value.replace(/[\s-]/g, '');

    if ((sanitized.length === 9 || sanitized.length === 10) && /^[0-9]+$/.test(sanitized)) {
        return { 
            isValid: true, 
            status: 'VALID', 
            isOfficialMatch: true, 
            explanation: `Matches official Fijian TIN (${sanitized.length} digits) format.` 
        };
    }

    return { 
        isValid: false, 
        status: 'INVALID_FORMAT',
        explanation: 'Value does not match Fijian TIN (9-10 digits) format.'
    };
};

/**
 * APPENDIX: FORENSIC CRITERIA
 * Fiji uses the 9 or 10-digit TIN (Tax Identification Number) for all taxpayers.
 * 1. Scope: Managed by the Fiji Revenue and Customs Service (FRCS).
 * 2. Structure: 9 or 10-digit numeric sequence.
 * 3. Validation: Structural verification based on length.
 * 4. Residency: Centered on the 183-day presence rule in a fiscal year.
 */
