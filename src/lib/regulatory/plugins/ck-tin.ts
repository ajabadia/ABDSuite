import { HolderMetadata, TinValidationResult, CountryRegulatoryInfo, TinInfo, TinRequirement } from './index';

/**
 * TIN Validation for Cook Islands (CK)
 * RMD Number (5 to 6 digits)
 */

/**
 * TIN Requirements for Cook Islands
 */
export const TIN_REQUIREMENTS: TinRequirement[] = [];

/**
 * Country Metadata for Cook Islands
 */
export const COUNTRY_INFO: CountryRegulatoryInfo = {
    name: 'Islas Cook',
    authority: 'Revenue Management Division',
    compliance: {
        crsStatus: 'Participating',
        crsDate: 'September 2018',
        fatcaStatus: 'N/A'
    },
    residency: {
        individual: 'Se considera residente si permanece en las Islas Cook durante más de 183 días en el año civil.',
        entity: 'Se considera residente si está incorporada en las Islas Cook o si su gestión y control se ejercen allí.',
        notes: 'Criterio de permanencia física o control de gestión.'
    }
};

/**
 * TIN Metadata for Cook Islands (Era 6.3)
 */
export const TIN_INFO: TinInfo = {
    name: 'RMD Number',
    description: 'Cook Islands RMD Number issued by the Revenue Management Division.',
    placeholder: '12345',
    officialLink: 'https://www.mfem.gov.ck',
    isOfficial: true,
    lastUpdated: '2026-04-24',
    source: 'OECD Portal / Cook Islands RMD',
    entityDifferentiation: {
        logic: 'Structurally identical identifiers.',
        individualDescription: '5 or 6-digit RMD Number.',
        businessDescription: '5 or 6-digit RMD Number.'
    }
};

/**
 * Cook Islands TIN Validator - Era 6.3
 */
export const validateCKTIN = (
    value: string, 
    type: 'INDIVIDUAL' | 'ENTITY' | 'ANY' = 'ANY', 
    metadata?: HolderMetadata
): TinValidationResult => {
    const sanitized = value.replace(/[\s-]/g, '');

    if ((sanitized.length === 5 || sanitized.length === 6) && /^[0-9]+$/.test(sanitized)) {
        return { 
            isValid: true, 
            status: 'VALID', 
            isOfficialMatch: true, 
            explanation: `Matches official Cook Islands RMD Number (${sanitized.length} digits) format.` 
        };
    }

    return { 
        isValid: false, 
        status: 'INVALID_FORMAT',
        explanation: 'Value does not match Cook Islands RMD Number (5-6 digits) format.'
    };
};
