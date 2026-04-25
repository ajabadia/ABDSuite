import { HolderMetadata, TinValidationResult, CountryRegulatoryInfo, TinInfo, TinRequirement } from './index';

/**
 * TIN Requirements for Grenada
 */
export const TIN_REQUIREMENTS: TinRequirement[] = [];

/**
 * Country Metadata for Grenada
 */
export const COUNTRY_INFO: CountryRegulatoryInfo = {
    name: 'Granada',
    authority: 'Inland Revenue Division (IRD)',
    compliance: {
        crsStatus: 'Participating',
        crsDate: 'September 2018',
        fatcaStatus: 'Model 1 (In Force)'
    },
    residency: {
        individual: 'Se considera residente si permanece en Granada 183 días o más en un año civil.',
        entity: 'Se considera residente si se ha incorporado bajo las leyes de Granada.',
        notes: 'Criterio de permanencia física de 183 días.'
    }
};

/**
 * TIN Metadata for Grenada (Era 6.3)
 */
export const TIN_INFO: TinInfo = {
    name: 'Tax Identification Number',
    description: 'Unique identifier issued by the Inland Revenue Division.',
    placeholder: '1234567890',
    officialLink: 'https://irl.gov.gd',
    isOfficial: true,
    lastUpdated: '2026-04-24',
    source: 'OECD Portal / Inland Revenue Division of Grenada',
    entityDifferentiation: {
        logic: 'Numeric sequence without structural differentiation.',
        individualDescription: '10-digit TIN.',
        businessDescription: '10-digit TIN.'
    }
};

/**
 * Grenada TIN Validator (10 digits) - Era 6.3
 */
export const validateGDTIN = (
    value: string, 
    type: 'INDIVIDUAL' | 'ENTITY' | 'ANY' = 'ANY', 
    metadata?: HolderMetadata
): TinValidationResult => {
    const sanitized = value.replace(/[\s-]/g, '');

    if (sanitized.length !== 10 || !/^[0-9]{10}$/.test(sanitized)) {
        return { isValid: false, status: 'INVALID_FORMAT', explanation: 'Grenada TINs must be exactly 10 digits long.' };
    }

    return { isValid: true, status: 'VALID', isOfficialMatch: true, explanation: 'Matches official 10-digit Grenada TIN format.' };
};

/**
 * APPENDIX: FORENSIC CRITERIA
 * Grenada uses a 10-digit TIN for all tax-related activities. 
 * While the number is primarily numeric and sequential, capturing the Place of Birth 
 * is highly recommended for CRS purposes to distinguish between holders of similar 
 * numeric identifiers.
 */

