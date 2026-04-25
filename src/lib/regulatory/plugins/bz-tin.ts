
import { HolderMetadata, TinValidationResult, CountryRegulatoryInfo, TinInfo, TinRequirement } from './index';

/**
 * TIN Validation for Belize (BZ)
 * TIN (6 to 8 digits)
 */

/**
 * TIN Requirements for Belize
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
 * Country Metadata for Belize
 */
export const COUNTRY_INFO: CountryRegulatoryInfo = {
    name: 'Belice',
    authority: 'Belize Tax Service (BTS)',
    compliance: {
        crsStatus: 'Participating',
        crsDate: 'September 2018',
        fatcaStatus: 'N/A'
    },
    residency: {
        individual: 'Se considera residente si permanece en Belice durante más de 182 días en el año civil.',
        entity: 'Se considera residente si está incorporada en Belice o si su gestión y control se ejercen allí.',
        notes: 'Criterio de permanencia física o control de gestión.'
    }
};

/**
 * TIN Metadata for Belize (Era 6.3)
 */
export const TIN_INFO: TinInfo = {
    name: 'TIN',
    description: 'Belizean TIN issued by the BTS.',
    placeholder: '123456',
    officialLink: 'https://www.bts.gov.bz',
    isOfficial: true,
    lastUpdated: '2026-04-24',
    source: 'OECD Portal / Belize BTS',
    entityDifferentiation: {
        logic: 'Structurally identical identifiers.',
        individualDescription: '6 to 8-digit TIN identifier.',
        businessDescription: '6 to 8-digit TIN identifier.'
    }
};

/**
 * Belize TIN Validator - Era 6.3
 */
export const validateBZTIN = (
    value: string, 
    type: 'INDIVIDUAL' | 'ENTITY' | 'ANY' = 'ANY', 
    metadata?: HolderMetadata
): TinValidationResult => {
    const sanitized = value.replace(/[\s-]/g, '');

    if (sanitized.length >= 6 && sanitized.length <= 8 && /^[0-9]+$/.test(sanitized)) {
        return { 
            isValid: true, 
            status: 'VALID', 
            isOfficialMatch: true, 
            explanation: `Matches official Belizean TIN (${sanitized.length} digits) format.` 
        };
    }

    return { 
        isValid: false, 
        status: 'INVALID_FORMAT',
        explanation: 'Value does not match Belizean TIN (6-8 digits) format.'
    };
};

/**
 * APPENDIX: FORENSIC CRITERIA
 * Belize uses the TIN (Tax Identification Number) for both individuals and entities.
 * 1. Scope: Issued by the Belize Tax Service (BTS).
 * 2. Structure: Numeric sequence of 6 to 8 digits.
 * 3. Validation: Structural verification based on length and numeric pattern.
 * 4. Residency: Centered on the 182-day presence rule in a calendar year.
 */

