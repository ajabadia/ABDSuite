import { HolderMetadata, TinValidationResult, CountryRegulatoryInfo, TinInfo, TinRequirement } from './index';

/**
 * TIN Validation for Guinea (GN)
 * NIF (variable length)
 */

/**
 * TIN Requirements for Guinea
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
 * Country Metadata for Guinea
 */
export const COUNTRY_INFO: CountryRegulatoryInfo = {
    name: 'Guinea',
    authority: 'Direction Nationale des Impôts (DNI)',
    compliance: {
        crsStatus: 'Non-Participating',
        crsDate: 'N/A',
        fatcaStatus: 'N/A'
    },
    residency: {
        individual: 'Se considera residente si tiene su residencia principal en Guinea o si permanece allí durante más de 183 días.',
        entity: 'Se considera residente si está incorporada en Guinea.',
        notes: 'Criterio de residencia principal o estancia de 183 días.'
    }
};

/**
 * TIN Metadata for Guinea (Era 6.3)
 */
export const TIN_INFO: TinInfo = {
    name: 'NIF',
    description: 'Guinean NIF issued by the DNI.',
    placeholder: '1234567A',
    officialLink: 'https://www.dni.gov.gn',
    isOfficial: true,
    lastUpdated: '2026-04-24',
    source: 'Local Authority / Guinea Tax',
    entityDifferentiation: {
        logic: 'Structurally identical identifiers.',
        individualDescription: 'NIF for individuals.',
        businessDescription: 'NIF for entities.'
    }
};

/**
 * Guinea TIN Validator - Era 6.3
 */
export const validateGNTIN = (
    value: string, 
    type: 'INDIVIDUAL' | 'ENTITY' | 'ANY' = 'ANY', 
    metadata?: HolderMetadata
): TinValidationResult => {
    const sanitized = value.trim().toUpperCase().replace(/[\s-]/g, '');

    if (sanitized.length >= 7 && sanitized.length <= 12 && /^[A-Z0-9]+$/.test(sanitized)) {
        return { 
            isValid: true, 
            status: 'VALID', 
            isOfficialMatch: true, 
            explanation: 'Matches general Guinean NIF format.' 
        };
    }

    return { 
        isValid: false, 
        status: 'INVALID_FORMAT',
        explanation: 'Value does not match Guinean NIF format.'
    };
};

/**
 * APPENDIX: FORENSIC CRITERIA
 * Guinea uses the NIF (Numéro d'Identification Fiscale) for all taxpayers.
 * 1. Scope: Issued by the Direction Nationale des Impôts (DNI).
 * 2. Structure: Alphanumeric sequence typically between 7 and 12 characters.
 * 3. Validation: Structural verification based on pattern and length. 
 * 4. Residency: Based on the 183-day presence rule or primary residence.
 */
