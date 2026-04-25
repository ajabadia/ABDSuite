
import { HolderMetadata, TinValidationResult, CountryRegulatoryInfo, TinInfo, TinRequirement } from './index';

/**
 * TIN Validation for Barbados (BB)
 * TIN (13 digits: 1234-1234-12345)
 */

/**
 * TIN Requirements for Barbados
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
 * Country Metadata for Barbados
 */
export const COUNTRY_INFO: CountryRegulatoryInfo = {
    name: 'Barbados',
    authority: 'Barbados Revenue Authority (BRA)',
    compliance: {
        crsStatus: 'Participating',
        crsDate: 'September 2018',
        fatcaStatus: 'Model 1 (In Force)'
    },
    residency: {
        individual: 'Se considera residente si permanece en Barbados durante más de 182 días en el año civil.',
        entity: 'Se considera residente si su gestión y control se ejercen en Barbados.',
        notes: 'Criterio de permanencia física o control de gestión.'
    }
};

/**
 * TIN Metadata for Barbados (Era 6.3)
 */
export const TIN_INFO: TinInfo = {
    name: 'TIN',
    description: 'Barbadian TIN issued by the BRA via the TAMIS system.',
    placeholder: '1234-1234-12345',
    officialLink: 'https://bra.gov.bb',
    isOfficial: true,
    lastUpdated: '2026-04-24',
    source: 'OECD Portal / Barbados BRA',
    entityDifferentiation: {
        logic: 'Structurally identical identifiers.',
        individualDescription: '13-digit TIN identifier.',
        businessDescription: '13-digit TIN identifier.'
    }
};

/**
 * Barbados TIN Validator - Era 6.3
 */
export const validateBBTIN = (
    value: string, 
    type: 'INDIVIDUAL' | 'ENTITY' | 'ANY' = 'ANY', 
    metadata?: HolderMetadata
): TinValidationResult => {
    const sanitized = value.replace(/[\s-]/g, '');

    if (sanitized.length === 13 && /^[0-9]{13}$/.test(sanitized)) {
        return { 
            isValid: true, 
            status: 'VALID', 
            isOfficialMatch: true, 
            explanation: 'Matches official Barbadian TIN (13 digits) format.' 
        };
    }

    return { 
        isValid: false, 
        status: 'INVALID_FORMAT',
        explanation: 'Value does not match Barbadian TIN (13 digits) format.'
    };
};

/**
 * APPENDIX: FORENSIC CRITERIA
 * Barbados transitioned to the TAMIS (Tax Administration Management Information System).
 * 1. Scope: Mandatory for all tax activities. The 13-digit TIN replaces legacy SIN 
 *    or smaller numeric codes.
 * 2. Structure: 13-digit numeric sequence, typically formatted as XXXX-XXXX-XXXXX.
 * 3. Validation: Structural verification based on length.
 * 4. Residency: Based on 182+ days presence or management and control location.
 */

