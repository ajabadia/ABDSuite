
import { HolderMetadata, TinValidationResult, CountryRegulatoryInfo, TinInfo, TinRequirement } from './index';

/**
 * TIN Validation for Bahrain (BH)
 * CPR (9 digits)
 */

/**
 * TIN Requirements for Bahrain
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
 * Country Metadata for Bahrain
 */
export const COUNTRY_INFO: CountryRegulatoryInfo = {
    name: 'Bahrein',
    authority: 'National Bureau for Revenue (NBR)',
    compliance: {
        crsStatus: 'Participating',
        crsDate: 'September 2018',
        fatcaStatus: 'Model 1 (In Force)'
    },
    residency: {
        individual: 'Se considera residente si tiene su residencia principal en Bahrein o si permanece allí 183 días en el año fiscal.',
        entity: 'Se considera residente si está incorporada en Bahrein o si su gestión y control se ejercen allí.',
        notes: 'Criterio de residencia principal o estancia de 183 días.'
    }
};

/**
 * TIN Metadata for Bahrain (Era 6.3)
 */
export const TIN_INFO: TinInfo = {
    name: 'CPR Number',
    description: 'Bahraini CPR number issued by the IGA.',
    placeholder: '123456789',
    officialLink: 'https://www.nbr.gov.bh',
    isOfficial: true,
    lastUpdated: '2026-04-24',
    source: 'OECD Portal / IGA',
    entityDifferentiation: {
        logic: 'Structurally identical identifiers.',
        individualDescription: '9-digit CPR number.',
        businessDescription: '9-digit CPR number (used for tax purposes).'
    }
};

/**
 * Bahrain TIN Validator - Era 6.3
 */
export const validateBHTIN = (
    value: string, 
    type: 'INDIVIDUAL' | 'ENTITY' | 'ANY' = 'ANY', 
    metadata?: HolderMetadata
): TinValidationResult => {
    const sanitized = value.replace(/[\s-]/g, '');

    if (sanitized.length === 9 && /^[0-9]{9}$/.test(sanitized)) {
        return { 
            isValid: true, 
            status: 'VALID', 
            isOfficialMatch: true, 
            explanation: 'Matches official Bahraini 9-digit CPR number format.' 
        };
    }

    return { 
        isValid: false, 
        status: 'INVALID_FORMAT',
        explanation: 'Value does not match Bahraini 9-digit format.'
    };
};

/**
 * APPENDIX: FORENSIC CRITERIA
 * Bahrain uses the CPR (Central Population Registry) number as the primary tax identifier.
 * 1. Scope: Issued by the Information & eGovernment Authority (IGA) to citizens, 
 *    residents, and registered entities.
 * 2. Structure: 9-digit numeric sequence.
 * 3. Validation: Structural verification based on length.
 * 4. Residency: Based on the 183-day presence rule in a fiscal year.
 */

