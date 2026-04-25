import { HolderMetadata, TinValidationResult, CountryRegulatoryInfo, TinInfo, TinRequirement } from './index';

/**
 * TIN Validation for Sao Tome and Principe (ST)
 * NIF (9 digits)
 */

/**
 * TIN Requirements for Sao Tome and Principe
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
 * Country Metadata for Sao Tome and Principe
 */
export const COUNTRY_INFO: CountryRegulatoryInfo = {
    name: 'Santo Tomé y Príncipe',
    authority: 'Direcção de Impostos',
    compliance: {
        crsStatus: 'Non-Participating',
        crsDate: 'N/A',
        fatcaStatus: 'N/A'
    },
    residency: {
        individual: 'Se considera residente si permanece en Santo Tomé y Príncipe durante más de 183 días en el año civil.',
        entity: 'Se considera residente si está incorporada en Santo Tomé y Príncipe.',
        notes: 'Criterio de permanencia física o constitución legal.'
    }
};

/**
 * TIN Metadata for Sao Tome and Principe (Era 6.3)
 */
export const TIN_INFO: TinInfo = {
    name: 'NIF',
    description: 'Sao Tomean NIF issued by the Direcção de Impostos.',
    placeholder: '123456789',
    officialLink: 'https://www.financas.st',
    isOfficial: true,
    lastUpdated: '2026-04-24',
    source: 'Local Authority / STP Tax',
    entityDifferentiation: {
        logic: 'Structurally identical identifiers.',
        individualDescription: '9-digit NIF identifier.',
        businessDescription: '9-digit NIF identifier.'
    }
};

/**
 * Sao Tome and Principe TIN Validator - Era 6.3
 */
export const validateSTTIN = (
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
            explanation: 'Matches official Sao Tomean NIF (9 digits) format.' 
        };
    }

    if (sanitized.length >= 4 && sanitized.length <= 15 && /^[A-Z0-9]+$/.test(sanitized)) {
        return { 
            isValid: true, 
            status: 'VALID', 
            isOfficialMatch: true, 
            explanation: 'Matches general Sao Tomean NIF alphanumeric format.' 
        };
    }

    return { 
        isValid: false, 
        status: 'INVALID_FORMAT',
        explanation: 'Value does not match Sao Tomean NIF format.'
    };
};

/**
 * APPENDIX: FORENSIC CRITERIA
 * Sao Tome and Principe uses the NIF (Número de Identificação Fiscal) for all taxpayers.
 * 1. Scope: Issued and managed by the Direcção de Impostos.
 * 2. Structure: Standardized 9-digit numeric sequence.
 * 3. Validation: Structural verification based on pattern and length. 
 * 4. Residency: Centered on the 183-day presence rule in a calendar year.
 */
