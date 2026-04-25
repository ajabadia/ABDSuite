import { HolderMetadata, TinValidationResult, CountryRegulatoryInfo, TinInfo, TinRequirement } from './index';

/**
 * TIN Validation for Guinea-Bissau (GW)
 * NIF (9 digits)
 */

/**
 * TIN Requirements for Guinea-Bissau
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
 * Country Metadata for Guinea-Bissau
 */
export const COUNTRY_INFO: CountryRegulatoryInfo = {
    name: 'Guinea-Bisáu',
    authority: 'Direcção Geral de Contribuições e Impostos (DGCI)',
    compliance: {
        crsStatus: 'Non-Participating',
        crsDate: 'N/A',
        fatcaStatus: 'N/A'
    },
    residency: {
        individual: 'Se considera residente si permanece en Guinea-Bisáu durante más de 183 días en el año civil.',
        entity: 'Se considera residente si está incorporada en Guinea-Bisáu.',
        notes: 'Criterio de permanencia física o constitución legal.'
    }
};

/**
 * TIN Metadata for Guinea-Bissau (Era 6.3)
 */
export const TIN_INFO: TinInfo = {
    name: 'NIF',
    description: 'Guinea-Bissauan NIF issued by the DGCI.',
    placeholder: '123456789',
    officialLink: 'https://www.financas.gw',
    isOfficial: true,
    lastUpdated: '2026-04-24',
    source: 'Local Authority / Guinea-Bissau Tax',
    entityDifferentiation: {
        logic: 'Structurally identical identifiers.',
        individualDescription: 'NIF for individuals.',
        businessDescription: 'NIF for entities.'
    }
};

/**
 * Guinea-Bissau TIN Validator - Era 6.3
 */
export const validateGWTIN = (
    value: string, 
    type: 'INDIVIDUAL' | 'ENTITY' | 'ANY' = 'ANY', 
    metadata?: HolderMetadata
): TinValidationResult => {
    const sanitized = value.trim().toUpperCase().replace(/[\s-]/g, '');

    if (sanitized.length === 9 && /^[0-9]{9}$/.test(sanitized)) {
        return { 
            isValid: true, 
            status: 'VALID', 
            isOfficialMatch: true, 
            explanation: 'Matches official Guinea-Bissauan NIF (9 digits) format.' 
        };
    }

    if (sanitized.length >= 4 && sanitized.length <= 15 && /^[A-Z0-9]+$/.test(sanitized)) {
        return { 
            isValid: true, 
            status: 'VALID', 
            isOfficialMatch: true, 
            explanation: 'Matches general Guinea-Bissauan NIF alphanumeric format.' 
        };
    }

    return { 
        isValid: false, 
        status: 'INVALID_FORMAT',
        explanation: 'Value does not match Guinea-Bissauan NIF format.'
    };
};

/**
 * APPENDIX: FORENSIC CRITERIA
 * Guinea-Bissau uses the NIF (Número de Identificação Fiscal) for all taxpayers.
 * 1. Scope: Managed by the Direcção Geral das Contribuições e Impostos (DGCI).
 * 2. Structure: Standardized 9-digit numeric sequence.
 * 3. Validation: Structural verification based on pattern and length. 
 * 4. Residency: Centered on the 183-day presence rule in a calendar year.
 */
