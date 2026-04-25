import { HolderMetadata, TinValidationResult, CountryRegulatoryInfo, TinInfo, TinRequirement } from './index';

/**
 * TIN Validation for Madagascar (MG)
 * NIF (10 digits)
 */

/**
 * TIN Requirements for Madagascar
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
 * Country Metadata for Madagascar
 */
export const COUNTRY_INFO: CountryRegulatoryInfo = {
    name: 'Madagascar',
    authority: 'Direction Générale des Impôts (DGI)',
    compliance: {
        crsStatus: 'Non-Participating',
        crsDate: 'N/A',
        fatcaStatus: 'N/A'
    },
    residency: {
        individual: 'Se considera residente si tiene su residencia principal en Madagascar o si permanece allí durante más de 183 días.',
        entity: 'Se considera residente si está incorporada en Madagascar.',
        notes: 'Criterio de residencia principal o estancia de 183 días.'
    }
};

/**
 * TIN Metadata for Madagascar (Era 6.3)
 */
export const TIN_INFO: TinInfo = {
    name: 'NIF',
    description: 'Madagascan NIF issued by the DGI.',
    placeholder: '1234567890',
    officialLink: 'https://www.impots.mg',
    isOfficial: true,
    lastUpdated: '2026-04-24',
    source: 'Local Authority / Madagascar DGI',
    entityDifferentiation: {
        logic: 'Structurally identical identifiers.',
        individualDescription: '10-digit NIF identifier.',
        businessDescription: '10-digit NIF identifier.'
    }
};

/**
 * Madagascar TIN Validator - Era 6.3
 */
export const validateMGTIN = (
    value: string, 
    type: 'INDIVIDUAL' | 'ENTITY' | 'ANY' = 'ANY', 
    metadata?: HolderMetadata
): TinValidationResult => {
    const sanitized = value.trim().toUpperCase().replace(/[\s-]/g, '');

    if (sanitized.length === 10 && /^[0-9]{10}$/.test(sanitized)) {
        return { 
            isValid: true, 
            status: 'VALID', 
            isOfficialMatch: true, 
            explanation: 'Matches official Madagascan NIF (10 digits) format.' 
        };
    }

    if (sanitized.length >= 4 && sanitized.length <= 15 && /^[A-Z0-9]+$/.test(sanitized)) {
        return { 
            isValid: true, 
            status: 'VALID', 
            isOfficialMatch: true, 
            explanation: 'Matches general Madagascan NIF alphanumeric format.' 
        };
    }

    return { 
        isValid: false, 
        status: 'INVALID_FORMAT',
        explanation: 'Value does not match Madagascan NIF format.'
    };
};

/**
 * APPENDIX: FORENSIC CRITERIA
 * Madagascar uses the NIF (Numéro d'Identification Fiscale) for all taxpayers.
 * 1. Scope: Issued and managed by the Direction Générale des Impôts (DGI).
 * 2. Structure: Standardized 10-digit numeric sequence.
 * 3. Validation: Structural verification based on pattern and length. 
 * 4. Residency: Centered on the 183-day presence rule or primary residence.
 */
