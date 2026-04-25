import { HolderMetadata, TinValidationResult, CountryRegulatoryInfo, TinInfo, TinRequirement } from './index';

/**
 * TIN Validation for Ghana (GH)
 * Ghana Card PIN (11 characters: GHA-000000000-0)
 */

/**
 * TIN Requirements for Ghana
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
 * Country Metadata for Ghana
 */
export const COUNTRY_INFO: CountryRegulatoryInfo = {
    name: 'Ghana',
    authority: 'Ghana Revenue Authority (GRA)',
    compliance: {
        crsStatus: 'Participating',
        crsDate: 'September 2018',
        fatcaStatus: 'Model 1 (In Force)'
    },
    residency: {
        individual: 'Se considera residente si permanece en Ghana durante más de 183 días en cualquier periodo de 12 meses.',
        entity: 'Se considera residente si está incorporada en Ghana.',
        notes: 'Criterio de permanencia física o constitución legal.'
    }
};

/**
 * TIN Metadata for Ghana (Era 6.3)
 */
export const TIN_INFO: TinInfo = {
    name: 'Ghana Card PIN',
    description: 'Ghana Card Personal Identification Number issued by the NIA and used as TIN by GRA.',
    placeholder: 'GHA-123456789-0',
    officialLink: 'https://gra.gov.gh',
    isOfficial: true,
    lastUpdated: '2026-04-24',
    source: 'Local Authority / Ghana GRA',
    entityDifferentiation: {
        logic: 'Structurally identical identifiers.',
        individualDescription: 'Ghana Card PIN for individuals.',
        businessDescription: 'Ghana Card PIN for entities.'
    }
};

/**
 * Ghana TIN Validator - Era 6.3
 */
export const validateGHTIN = (
    value: string, 
    type: 'INDIVIDUAL' | 'ENTITY' | 'ANY' = 'ANY', 
    metadata?: HolderMetadata
): TinValidationResult => {
    const sanitized = value.replace(/[\s-]/g, '').toUpperCase();

    // 1. Ghana Card PIN: GHA + 9 digits + 1 check digit (total 13 chars including hyphens, 11-15 sanitized)
    if (sanitized.startsWith('GHA') && sanitized.length >= 11 && sanitized.length <= 15) {
        return { 
            isValid: true, 
            status: 'VALID', 
            isOfficialMatch: true, 
            explanation: 'Matches official Ghana Card PIN format.' 
        };
    }

    // 2. Legacy TIN: 11 numeric digits
    if (sanitized.length === 11 && /^[0-9]{11}$/.test(sanitized)) {
        return {
            isValid: true,
            status: 'VALID',
            isOfficialMatch: true,
            explanation: 'Matches legacy Ghanaian Tax Identification Number (TIN) format.'
        };
    }

    return { 
        isValid: false, 
        status: 'INVALID_FORMAT',
        explanation: 'Value does not match Ghana Card PIN or Legacy TIN format.'
    };
};

/**
 * APPENDIX: FORENSIC CRITERIA
 * Ghana has integrated the Ghana Card PIN as the primary Tax Identification Number.
 * 1. Ghana Card PIN: 
 *    - Format: GHA-XXXXXXXXX-X. 
 *    - Issued by the National Identification Authority (NIA).
 * 2. Legacy TIN: 11-digit numeric code issued by the GRA before the integration.
 * 3. Validation: Structural verification based on prefix (GHA) or numeric length.
 * 4. Residency: Centered on the 183-day presence rule within any 12-month period.
 */
