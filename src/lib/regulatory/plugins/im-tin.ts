import { HolderMetadata, TinValidationResult, CountryRegulatoryInfo, TinInfo, TinRequirement } from './index';

/**
 * TIN Validation for Isle of Man (IM)
 * Tax Reference Number (10 digits)
 */

/**
 * TIN Requirements for Isle of Man
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
 * Country Metadata for Isle of Man
 */
export const COUNTRY_INFO: CountryRegulatoryInfo = {
    name: 'Isla de Man',
    authority: 'Income Tax Division',
    compliance: {
        crsStatus: 'Participating',
        crsDate: 'September 2017',
        fatcaStatus: 'Model 1 (In Force)'
    },
    residency: {
        individual: 'Se considera residente si tiene su residencia principal en la Isla de Man o si permanece allí durante más de 183 días en el año fiscal.',
        entity: 'Se considera residente si se ha incorporado en la Isla de Man o si su gestión y control se ejercen allí.',
        notes: 'Criterio de residencia principal o estancia de 183 días.'
    }
};

/**
 * TIN Metadata for Isle of Man (Era 6.3)
 */
export const TIN_INFO: TinInfo = {
    name: 'Tax Reference Number',
    description: 'Manx Tax Reference Number issued by the Income Tax Division.',
    placeholder: '1234567890',
    officialLink: 'https://www.gov.im/tax',
    isOfficial: true,
    lastUpdated: '2026-04-24',
    source: 'OECD Portal / IOM Tax',
    entityDifferentiation: {
        logic: 'Structurally identical identifiers.',
        individualDescription: '10-digit Tax Reference Number.',
        businessDescription: '10-digit Tax Reference Number.'
    }
};

/**
 * Isle of Man TIN Validator - Era 6.3
 */
export const validateIMTIN = (
    value: string, 
    type: 'INDIVIDUAL' | 'ENTITY' | 'ANY' = 'ANY', 
    metadata?: HolderMetadata
): TinValidationResult => {
    const sanitized = value.replace(/[\s-]/g, '');

    if (sanitized.length === 10 && /^[0-9]{10}$/.test(sanitized)) {
        return { 
            isValid: true, 
            status: 'VALID', 
            isOfficialMatch: true, 
            explanation: 'Matches official Manx Tax Reference Number (10 digits) format.' 
        };
    }

    return { 
        isValid: false, 
        status: 'INVALID_FORMAT',
        explanation: 'Value does not match Isle of Man Tax Reference Number (10 digits) format.'
    };
};
