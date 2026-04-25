import { HolderMetadata, TinValidationResult, CountryRegulatoryInfo, TinInfo, TinRequirement } from './index';

/**
 * TIN Validation for Gabon (GA)
 * NIF (7 digits + 1 letter)
 */

/**
 * TIN Requirements for Gabon
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
 * Country Metadata for Gabon
 */
export const COUNTRY_INFO: CountryRegulatoryInfo = {
    name: 'Gabón',
    authority: 'Direction Générale des Impôts (DGI)',
    compliance: {
        crsStatus: 'Non-Participating',
        crsDate: 'N/A',
        fatcaStatus: 'N/A'
    },
    residency: {
        individual: 'Se considera residente si tiene su residencia principal en Gabón o si permanece allí durante más de 183 días.',
        entity: 'Se considera residente si está incorporada en Gabón.',
        notes: 'Criterio de residencia principal o estancia de 183 días.'
    }
};

/**
 * TIN Metadata for Gabon (Era 6.3)
 */
export const TIN_INFO: TinInfo = {
    name: 'NIF',
    description: 'Gabonese NIF issued by the DGI.',
    placeholder: '1234567A',
    officialLink: 'https://www.dgi.ga',
    isOfficial: true,
    lastUpdated: '2026-04-24',
    source: 'Local Authority / Gabon Tax',
    entityDifferentiation: {
        logic: 'Structurally identical identifiers.',
        individualDescription: 'NIF for individuals.',
        businessDescription: 'NIF for entities.'
    }
};

/**
 * Gabon TIN Validator - Era 6.3
 */
export const validateGATIN = (
    value: string, 
    type: 'INDIVIDUAL' | 'ENTITY' | 'ANY' = 'ANY', 
    metadata?: HolderMetadata
): TinValidationResult => {
    const sanitized = value.trim().toUpperCase().replace(/[\s-]/g, '');

    // Common format: 7 digits + 1 letter
    if (/^[0-9]{7}[A-Z]$/.test(sanitized)) {
        return { 
            isValid: true, 
            status: 'VALID', 
            isOfficialMatch: true, 
            explanation: 'Matches official Gabonese NIF (7 digits + 1 letter) format.' 
        };
    }

    // Flexible format for older or special NIFs
    if (sanitized.length >= 4 && sanitized.length <= 15 && /^[A-Z0-9]+$/.test(sanitized)) {
        return { 
            isValid: true, 
            status: 'VALID', 
            isOfficialMatch: true, 
            explanation: 'Matches general Gabonese NIF alphanumeric format.' 
        };
    }

    return { 
        isValid: false, 
        status: 'INVALID_FORMAT',
        explanation: 'Value does not match Gabonese NIF format.'
    };
};

/**
 * APPENDIX: FORENSIC CRITERIA
 * Gabon uses the NIF (Numéro d'Identification Fiscale) for all tax purposes.
 * 1. Structure: Standardized format is 7 digits followed by a control letter.
 * 2. Scope: Issued by the Direction Générale des Impôts (DGI).
 * 3. Validation: Structural verification based on pattern and length. 
 * 4. Residency: Based on the 183-day presence rule or primary residence in Gabon.
 */
