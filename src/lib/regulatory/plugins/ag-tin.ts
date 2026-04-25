
import { TinValidationResult, TinInfo, CountryRegulatoryInfo, TinRequirement, HolderMetadata } from './index';

/**
 * TIN Requirements for Antigua and Barbuda
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
 * Country Metadata for Antigua and Barbuda
 */
export const COUNTRY_INFO: CountryRegulatoryInfo = {
    name: 'Antigua y Barbuda',
    authority: 'Inland Revenue Department (IRD)',
    compliance: {
        crsStatus: 'Participating',
        crsDate: 'September 2018',
        fatcaStatus: 'Model 1 (In Force)'
    },
    residency: {
        individual: 'Se considera residente si permanece físicamente 183 días o más en el año fiscal.',
        entity: 'Se considera residente si está incorporada en el país o si su gestión central se encuentra allí.',
        notes: 'Criterio de presencia física de 183 días.'
    }
};

/**
 * TIN Metadata for Antigua and Barbuda (Era 6.3)
 */
export const TIN_INFO: TinInfo = {
    name: 'TIN / Tax Account Number',
    description: 'Antiguan 6-digit TIN or 8-digit Tax Account Number issued by the IRD.',
    placeholder: '123456 / 12345678',
    isOfficial: true,
    lastUpdated: '2026-04-24',
    source: 'OECD Portal / Inland Revenue Department',
    entityDifferentiation: {
        logic: 'Length-based. 6 digits (TIN) vs 8 digits (Tax Account).',
        individualDescription: 'Typically uses 6-digit TIN.',
        businessDescription: 'Typically uses 8-digit Tax Account.'
    }
};

/**
 * Antigua and Barbuda TIN Validator (6 or 8 digits) - Era 6.3
 */
export const validateAGTIN = (
    value: string,
    type: 'INDIVIDUAL' | 'ENTITY' | 'ANY' = 'ANY',
    metadata?: HolderMetadata
): TinValidationResult => {
    const cleanValue = value.trim().replace(/-/g, '');
    
    if (/^\d{6}$/.test(cleanValue)) {
        return {
            isValid: true,
            status: 'VALID',
            isOfficialMatch: true,
            explanation: 'Matches official 6-digit Antigua & Barbuda TIN format.'
        };
    }

    if (/^\d{8}$/.test(cleanValue)) {
        return {
            isValid: true,
            status: 'VALID',
            isOfficialMatch: true,
            explanation: 'Matches official 8-digit Antigua & Barbuda Tax Account Number format.'
        };
    }

    return {
        isValid: false,
        status: 'INVALID_FORMAT',
        explanation: 'Antigua & Barbuda identifiers must be either 6 digits (TIN) or 8 digits (Tax Account).'
    };
};

/**
 * APPENDIX: FORENSIC CRITERIA
 * Antigua & Barbuda follows a numeric sequence. The 8-digit version (Tax Account) 
 * usually includes a suffix for tax type identification.
 * CRS standard requires DOB for these numeric systems to ensure identity matching.
 */

