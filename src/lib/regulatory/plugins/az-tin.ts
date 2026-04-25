
import { HolderMetadata, TinValidationResult, CountryRegulatoryInfo, TinInfo, TinRequirement } from './index';

/**
 * TIN Validation for Azerbaijan (AZ)
 * TIN (10 digits)
 */

/**
 * TIN Requirements for Azerbaijan
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
 * Country Metadata for Azerbaijan
 */
export const COUNTRY_INFO: CountryRegulatoryInfo = {
    name: 'Azerbaiyán',
    authority: 'Ministry of Taxes (Vergilər Nazirliyi)',
    compliance: {
        crsStatus: 'Participating',
        crsDate: 'September 2018',
        fatcaStatus: 'Model 1 (In Force)'
    },
    residency: {
        individual: 'Se considera residente si permanece en Azerbaiyán durante más de 182 días en el año natural.',
        entity: 'Se considera residente si está incorporada en Azerbaiyán o si su gestión y control se ejercen allí.',
        notes: 'Criterio de permanencia física o control de gestión.'
    }
};

/**
 * TIN Metadata for Azerbaijan (Era 6.3)
 */
export const TIN_INFO: TinInfo = {
    name: 'VÖEN',
    description: 'Azerbaijani VÖEN issued by the Ministry of Taxes.',
    placeholder: '1234567890',
    officialLink: 'https://www.taxes.gov.az',
    isOfficial: true,
    lastUpdated: '2026-04-24',
    source: 'OECD Portal / Azerbaijan Taxes',
    entityDifferentiation: {
        logic: 'Prefix analysis.',
        individualDescription: '10-digit VÖEN (often starts with birth-related digits).',
        businessDescription: '10-digit VÖEN.'
    }
};

/**
 * Azerbaijan TIN Validator - Era 6.3
 */
export const validateAZTIN = (
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
            explanation: 'Matches official Azerbaijani VÖEN (10 digits) format.' 
        };
    }

    return { 
        isValid: false, 
        status: 'INVALID_FORMAT',
        explanation: 'Value does not match Azerbaijani VÖEN (10 digits) format.'
    };
};

/**
 * APPENDIX: FORENSIC CRITERIA
 * Azerbaijan's VÖEN (Vergi Ödəyicisinin Eyniləşdirmə Nömrəsi) is a 10-digit numeric code.
 * 1. Scope: Mandatory for all tax-paying individuals, self-employed persons, and entities.
 * 2. Structure: 10-digit numeric sequence. 
 * 3. Validation: Structural check against the 10-digit length requirement.
 * 4. Residency: Primarily based on the 182-day presence rule in a calendar year.
 */

