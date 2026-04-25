
import { HolderMetadata, TinValidationResult, CountryRegulatoryInfo, TinInfo, TinRequirement } from './index';

/**
 * TIN Validation for Bangladesh (BD)
 * e-TIN (12 digits)
 */

/**
 * TIN Requirements for Bangladesh
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
 * Country Metadata for Bangladesh
 */
export const COUNTRY_INFO: CountryRegulatoryInfo = {
    name: 'Bangladesh',
    authority: 'National Board of Revenue (NBR)',
    compliance: {
        crsStatus: 'Non-Participating',
        crsDate: 'N/A',
        fatcaStatus: 'N/A'
    },
    residency: {
        individual: 'Se considera residente si permanece en Bangladesh durante más de 182 días en el año fiscal.',
        entity: 'Se considera residente si está incorporada en Bangladesh.',
        notes: 'Criterio de permanencia física o constitución legal.'
    }
};

/**
 * TIN Metadata for Bangladesh (Era 6.3)
 */
export const TIN_INFO: TinInfo = {
    name: 'e-TIN',
    description: 'Bangladeshi e-TIN issued by the NBR.',
    placeholder: '123456789012',
    officialLink: 'https://nbr.gov.bd',
    isOfficial: true,
    lastUpdated: '2026-04-24',
    source: 'Local Authority / Bangladesh NBR',
    entityDifferentiation: {
        logic: 'Structurally identical identifiers.',
        individualDescription: '12-digit e-TIN identifier.',
        businessDescription: '12-digit e-TIN identifier.'
    }
};

/**
 * Bangladesh TIN Validator - Era 6.3
 */
export const validateBDTIN = (
    value: string, 
    type: 'INDIVIDUAL' | 'ENTITY' | 'ANY' = 'ANY', 
    metadata?: HolderMetadata
): TinValidationResult => {
    const sanitized = value.replace(/[\s-]/g, '');

    if (sanitized.length === 12 && /^[0-9]{12}$/.test(sanitized)) {
        return { 
            isValid: true, 
            status: 'VALID', 
            isOfficialMatch: true, 
            explanation: 'Matches official Bangladeshi e-TIN (12 digits) format.' 
        };
    }

    return { 
        isValid: false, 
        status: 'INVALID_FORMAT',
        explanation: 'Value does not match Bangladeshi e-TIN (12 digits) format.'
    };
};

/**
 * APPENDIX: FORENSIC CRITERIA
 * Bangladesh uses the e-TIN (Electronic Tax Identification Number) system.
 * 1. Scope: Mandatory for all taxpayers (individuals and entities) in Bangladesh.
 * 2. Structure: 12-digit numeric sequence.
 * 3. Validation: Structural verification based on length.
 * 4. Residency: Based on physical presence of 182+ days in a fiscal year.
 */

