import { HolderMetadata, TinValidationResult, CountryRegulatoryInfo, TinInfo, TinRequirement } from './index';

/**
 * TIN Validation for Cape Verde (CV)
 * NIF (9 digits)
 */

/**
 * TIN Requirements for Cape Verde
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
 * Country Metadata for Cape Verde
 */
export const COUNTRY_INFO: CountryRegulatoryInfo = {
    name: 'Cabo Verde',
    authority: 'Direcção Nacional de Receitas do Estado (DNRE)',
    compliance: {
        crsStatus: 'Non-Participating',
        crsDate: 'N/A',
        fatcaStatus: 'N/A'
    },
    residency: {
        individual: 'Se considera residente si permanece en Cabo Verde durante más de 183 días en el año civil.',
        entity: 'Se considera residente si está incorporada en Cabo Verde.',
        notes: 'Criterio de permanencia física o constitución legal.'
    }
};

/**
 * TIN Metadata for Cape Verde (Era 6.3)
 */
export const TIN_INFO: TinInfo = {
    name: 'NIF',
    description: 'Cape Verdean NIF issued by the DNRE.',
    placeholder: '123456789',
    officialLink: 'https://www.mf.gov.cv',
    isOfficial: true,
    lastUpdated: '2026-04-24',
    source: 'Local Authority / Cape Verde DNRE',
    entityDifferentiation: {
        logic: 'Structurally identical identifiers.',
        individualDescription: '9-digit NIF identifier.',
        businessDescription: '9-digit NIF identifier.'
    }
};

/**
 * Cape Verde TIN Validator - Era 6.3
 */
export const validateCVTIN = (
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
            explanation: 'Matches official Cape Verdean NIF (9 digits) format.' 
        };
    }

    return { 
        isValid: false, 
        status: 'INVALID_FORMAT',
        explanation: 'Value does not match Cape Verdean NIF (9 digits) format.'
    };
};

/**
 * APPENDIX: FORENSIC CRITERIA
 * Cape Verde uses the NIF (Número de Identificação Fiscal) for all tax purposes.
 * 1. Scope: Issued by the Direcção Nacional de Receitas do Estado (DNRE).
 * 2. Structure: 9-digit numeric sequence.
 * 3. Validation: Structural verification based on length.
 * 4. Residency: Centered on the 183-day presence rule in a calendar year.
 */
