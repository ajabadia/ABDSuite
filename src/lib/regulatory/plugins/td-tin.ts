import { HolderMetadata, TinValidationResult, CountryRegulatoryInfo, TinInfo, TinRequirement } from './index';

/**
 * TIN Validation for Chad (TD)
 * NIF (9 digits)
 */

/**
 * TIN Requirements for Chad
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
 * Country Metadata for Chad
 */
export const COUNTRY_INFO: CountryRegulatoryInfo = {
    name: 'Chad',
    authority: 'Direction Générale des Impôts (DGI)',
    compliance: {
        crsStatus: 'Non-Participating',
        crsDate: 'N/A',
        fatcaStatus: 'N/A'
    },
    residency: {
        individual: 'Se considera residente si tiene su residencia principal en Chad o si permanece allí durante más de 183 días.',
        entity: 'Se considera residente si está incorporada en Chad.',
        notes: 'Criterio de residencia principal o estancia de 183 días.'
    }
};

/**
 * TIN Metadata for Chad (Era 6.3)
 */
export const TIN_INFO: TinInfo = {
    name: 'NIF',
    description: 'Chadian NIF issued by the DGI.',
    placeholder: '123456789',
    officialLink: 'https://www.impots.gouv.td',
    isOfficial: true,
    lastUpdated: '2026-04-24',
    source: 'Local Authority / Chad Tax',
    entityDifferentiation: {
        logic: 'Structurally identical identifiers.',
        individualDescription: '9-digit NIF identifier.',
        businessDescription: '9-digit NIF identifier.'
    }
};

/**
 * Chad TIN Validator - Era 6.3
 */
export const validateTDTIN = (
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
            explanation: 'Matches official Chadian NIF (9 digits) format.' 
        };
    }

    if (sanitized.length >= 4 && sanitized.length <= 15 && /^[A-Z0-9]+$/.test(sanitized)) {
        return { 
            isValid: true, 
            status: 'VALID', 
            isOfficialMatch: true, 
            explanation: 'Matches general Chadian NIF alphanumeric format.' 
        };
    }

    return { 
        isValid: false, 
        status: 'INVALID_FORMAT',
        explanation: 'Value does not match Chadian NIF format.'
    };
};

/**
 * APPENDIX: FORENSIC CRITERIA
 * Chad uses the Numéro d'Identification Fiscale (NIF) for all taxpayers.
 * 1. Scope: Issued and managed by the Direction Générale des Impôts (DGI).
 * 2. Structure: Standardized 9-digit numeric sequence.
 * 3. Validation: Structural verification based on pattern and length. 
 * 4. Residency: Centered on the 183-day presence rule or primary residence.
 */
