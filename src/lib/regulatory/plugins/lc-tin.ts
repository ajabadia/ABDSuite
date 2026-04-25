import { HolderMetadata, TinValidationResult, CountryRegulatoryInfo, TinInfo, TinRequirement } from './index';

/**
 * TIN Requirements for Saint Lucia
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
 * Country Metadata for Saint Lucia
 */
export const COUNTRY_INFO: CountryRegulatoryInfo = {
    name: 'Santa Lucía',
    authority: 'Inland Revenue Department (IRD)',
    compliance: {
        crsStatus: 'Participating',
        crsDate: 'September 2018',
        fatcaStatus: 'Model 1 (In Force)'
    },
    residency: {
        individual: 'Se considera residente si permanece en Santa Lucía 183 días o más en un año civil.',
        entity: 'Se considera residente si su gestión y control se ejercen en Santa Lucía.',
        notes: 'Criterio de permanencia física de 183 días.'
    }
};

/**
 * TIN Metadata for Saint Lucia (Era 6.3)
 */
export const TIN_INFO: TinInfo = {
    name: 'Tax Identification Number',
    description: 'Unique identifier issued by the Inland Revenue Department.',
    placeholder: '1234567',
    officialLink: 'https://irdstlucia.gov.lc',
    isOfficial: true,
    lastUpdated: '2026-04-24',
    source: 'OECD Portal / Inland Revenue Department of Saint Lucia',
    entityDifferentiation: {
        logic: 'Numeric sequence without structural differentiation.',
        individualDescription: 'TIN of up to 10 digits.',
        businessDescription: 'TIN of up to 10 digits.'
    }
};

/**
 * Saint Lucia TIN Validator (up to 10 digits) - Era 6.3
 */
export const validateLCTIN = (
    value: string, 
    type: 'INDIVIDUAL' | 'ENTITY' | 'ANY' = 'ANY', 
    metadata?: HolderMetadata
): TinValidationResult => {
    const sanitized = value.replace(/[\s-]/g, '');

    if (!/^[0-9]{1,10}$/.test(sanitized)) {
        return { isValid: false, status: 'INVALID_FORMAT', explanation: 'Saint Lucia TINs consist of numeric digits (up to 10).' };
    }

    return { isValid: true, status: 'VALID', isOfficialMatch: true, explanation: 'Matches official Saint Lucia TIN format.' };
};

/**
 * APPENDIX: FORENSIC CRITERIA
 * Saint Lucia's TIN is issued by the Inland Revenue Department. 
 * While the database supports up to 10 digits, legacy numbers are often shorter (e.g., 7 digits).
 * For CRS reporting, the IRD emphasizes the importance of capturing the 
 * complete legal name of the taxpayer.
 */

