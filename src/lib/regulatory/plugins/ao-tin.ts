
import { HolderMetadata, TinValidationResult, CountryRegulatoryInfo, TinInfo, TinRequirement } from './index';

/**
 * TIN Validation for Angola (AO)
 * NIF (10 to 14 digits)
 */

/**
 * TIN Requirements for Angola
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
 * Country Metadata for Angola
 */
export const COUNTRY_INFO: CountryRegulatoryInfo = {
    name: 'Angola',
    authority: 'Administração Geral Tributária (AGT)',
    compliance: {
        crsStatus: 'Non-Participating',
        crsDate: 'N/A',
        fatcaStatus: 'Model 1 (In Force)'
    },
    residency: {
        individual: 'Se considera residente si permanece en Angola durante más de 183 días en el año fiscal.',
        entity: 'Se considera residente si está incorporada en Angola.',
        notes: 'Criterio de permanencia física o constitución legal.'
    }
};

/**
 * TIN Metadata for Angola (Era 6.3)
 */
export const TIN_INFO: TinInfo = {
    name: 'NIF',
    description: 'Angolan NIF issued by the AGT.',
    placeholder: '1234567890',
    officialLink: 'https://agt.minfin.gv.ao',
    isOfficial: true,
    lastUpdated: '2026-04-24',
    source: 'Local Authority / Angola AGT',
    entityDifferentiation: {
        logic: 'Structurally identical identifiers.',
        individualDescription: '10 to 14-digit NIF identifier.',
        businessDescription: '10 to 14-digit NIF identifier.'
    }
};

/**
 * Angola TIN Validator - Era 6.3
 */
export const validateAOTIN = (
    value: string, 
    type: 'INDIVIDUAL' | 'ENTITY' | 'ANY' = 'ANY', 
    metadata?: HolderMetadata
): TinValidationResult => {
    const sanitized = value.replace(/[\s-]/g, '');

    if (sanitized.length >= 10 && sanitized.length <= 14 && /^[0-9]+$/.test(sanitized)) {
        return { 
            isValid: true, 
            status: 'VALID', 
            isOfficialMatch: true, 
            explanation: `Matches official Angolan NIF (${sanitized.length} digits) format.` 
        };
    }

    return { 
        isValid: false, 
        status: 'INVALID_FORMAT',
        explanation: 'Value does not match Angolan NIF (10-14 digits) format.'
    };
};

/**
 * APPENDIX: FORENSIC CRITERIA
 * Angola's NIF (Número de Identificação Fiscal) is the primary tax identifier.
 * 1. Scope: Issued by the Administração Geral Tributária (AGT) to individuals and 
 *    entities.
 * 2. Structure: Numeric sequence ranging from 10 to 14 digits.
 * 3. Validation: Structural verification based on digit count and numeric pattern.
 * 4. Residency: Based on physical presence of 183+ days in a fiscal year.
 */

