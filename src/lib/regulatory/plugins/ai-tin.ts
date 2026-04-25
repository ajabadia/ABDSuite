
import { TinValidationResult, TinInfo, CountryRegulatoryInfo, TinRequirement, HolderMetadata } from './index';

/**
 * TIN Requirements for Anguilla
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
 * Country Metadata for Anguilla
 */
export const COUNTRY_INFO: CountryRegulatoryInfo = {
    name: 'Anguila',
    authority: 'Inland Revenue Department (IRD)',
    compliance: {
        crsStatus: 'Participating',
        crsDate: 'September 2017',
        fatcaStatus: 'Model 1 (In Force)'
    },
    residency: {
        individual: 'Se considera residente si permanece en Anguila 183 días o más en un año natural.',
        entity: 'Se considera residente si se ha incorporado bajo las leyes de Anguila.',
        notes: 'Criterio de permanencia física de 183 días.'
    }
};

/**
 * TIN Metadata for Anguilla (Era 6.3)
 */
export const TIN_INFO: TinInfo = {
    name: 'Tax Identification Number',
    description: 'Unique 10-digit number issued by the Inland Revenue Department.',
    placeholder: '1000000000 / 2000000000',
    isOfficial: true,
    lastUpdated: '2026-04-24',
    source: 'OECD Portal / Inland Revenue Department',
    entityDifferentiation: {
        logic: 'First digit analysis. 1 for Individuals, 2 for Entities.',
        individualDescription: '10-digit TIN starting with 1.',
        businessDescription: '10-digit TIN starting with 2.'
    }
};

/**
 * Anguilla TIN Validator (10 digits) - Era 6.3
 */
export const validateAITIN = (
    value: string, 
    type: 'INDIVIDUAL' | 'ENTITY' | 'ANY' = 'ANY',
    metadata?: HolderMetadata
): TinValidationResult => {
    const cleanValue = value.trim().replace(/-/g, '');
    
    if (!/^\d{10}$/.test(cleanValue)) {
        return {
            isValid: false,
            status: 'INVALID_FORMAT',
            explanation: 'Anguilla TINs must be exactly 10 digits.'
        };
    }

    const firstDigit = cleanValue[0];

    if (type === 'INDIVIDUAL' && firstDigit !== '1') {
        return {
            isValid: false,
            status: 'MISMATCH',
            reasonCode: 'ENTITY_TYPE_MISMATCH',
            explanation: `TIN starts with ${firstDigit}, but individuals in Anguilla must have TINs starting with 1.`
        };
    }

    if (type === 'ENTITY' && firstDigit !== '2') {
        return {
            isValid: false,
            status: 'MISMATCH',
            reasonCode: 'ENTITY_TYPE_MISMATCH',
            explanation: `TIN starts with ${firstDigit}, but entities in Anguilla must have TINs starting with 2.`
        };
    }

    return {
        isValid: true,
        status: 'VALID',
        isOfficialMatch: true,
        explanation: `Matches official 10-digit Anguilla TIN format for ${firstDigit === '1' ? 'Individual' : 'Entity'}.`
    };
};

/**
 * APPENDIX: FORENSIC CRITERIA
 * Anguilla differentiates clearly between natural persons (Prefix 1) and legal entities (Prefix 2).
 * This structural differentiation is mandatory for Era 6.3 and allows the Suite to 
 * auto-detect the subject type during intake.
 */

