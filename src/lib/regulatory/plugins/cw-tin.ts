import { HolderMetadata, TinValidationResult, CountryRegulatoryInfo, TinInfo, TinRequirement } from './index';

/**
 * TIN Validation for Curaçao (CW)
 * Crib Number (10 digits)
 */

/**
 * TIN Requirements for Curaçao
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
 * Country Metadata for Curaçao
 */
export const COUNTRY_INFO: CountryRegulatoryInfo = {
    name: 'Curazao',
    authority: 'Tax Inspectorate (Inspectie der Belastingen)',
    compliance: {
        crsStatus: 'Participating',
        crsDate: 'September 2018',
        fatcaStatus: 'Model 1 (In Force)'
    },
    residency: {
        individual: 'Se considera residente si tiene domicilio permanente en Curazao o si permanece allí durante más de 183 días.',
        entity: 'Se considera residente si se ha incorporada en Curazao.',
        notes: 'Criterio de domicilio o estancia de 183 días.'
    }
};

/**
 * TIN Metadata for Curaçao (Era 6.3)
 */
export const TIN_INFO: TinInfo = {
    name: 'Crib Number',
    description: 'Curaçao Crib Number issued by the Tax Inspectorate.',
    placeholder: '1234567890',
    officialLink: 'https://www.belastingdienst.cw',
    isOfficial: true,
    lastUpdated: '2026-04-24',
    source: 'OECD Portal / Curaçao Tax',
    entityDifferentiation: {
        logic: 'Structurally identical identifiers.',
        individualDescription: '10-digit Crib Number.',
        businessDescription: '10-digit Crib Number.'
    }
};

/**
 * Curaçao TIN Validator - Era 6.3
 */
export const validateCWTIN = (
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
            explanation: 'Matches official Curaçao Crib Number (10 digits) format.' 
        };
    }

    return { 
        isValid: false, 
        status: 'INVALID_FORMAT',
        explanation: 'Value does not match Curaçao Crib Number (10 digits) format.'
    };
};

/**
 * APPENDIX: FORENSIC CRITERIA
 * Curaçao uses the Crib-nummer as the unique identifier for tax purposes.
 * 1. Scope: Mandatory for all individuals and entities.
 * 2. Structure: 10-digit numeric sequence. 
 * 3. Validation: Structural verification based on length.
 * 4. Residency: Centered on the 183-day presence rule or permanent domicile location.
 */
