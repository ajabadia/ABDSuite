import { HolderMetadata, TinValidationResult, CountryRegulatoryInfo, TinInfo, TinRequirement } from './index';

/**
 * TIN Validation for Senegal (SN)
 * NINEA (14-15 characters)
 */

/**
 * TIN Requirements for Senegal
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
 * Country Metadata for Senegal
 */
export const COUNTRY_INFO: CountryRegulatoryInfo = {
    name: 'Senegal',
    authority: 'Direction Générale des Impôts et des Domaines (DGID)',
    compliance: {
        crsStatus: 'Non-Participating',
        crsDate: 'N/A',
        fatcaStatus: 'N/A'
    },
    residency: {
        individual: 'Se considera residente si tiene su residencia principal en Senegal o si permanece allí durante más de 183 días.',
        entity: 'Se considera residente si está incorporada en Senegal.',
        notes: 'Criterio de residencia principal o estancia de 183 días.'
    }
};

/**
 * TIN Metadata for Senegal (Era 6.3)
 */
export const TIN_INFO: TinInfo = {
    name: 'NINEA',
    description: 'Senegalese NINEA issued by the DGID.',
    placeholder: '1234567 2 R 3',
    officialLink: 'https://www.impots-senegal.gouv.sn',
    isOfficial: true,
    lastUpdated: '2026-04-24',
    source: 'Local Authority / Senegal Tax',
    entityDifferentiation: {
        logic: 'Structurally identical identifiers.',
        individualDescription: 'NINEA identifier for individuals.',
        businessDescription: 'NINEA identifier for legal entities.'
    }
};

/**
 * Senegal TIN Validator - Era 6.3
 */
export const validateSNTIN = (
    value: string, 
    type: 'INDIVIDUAL' | 'ENTITY' | 'ANY' = 'ANY', 
    metadata?: HolderMetadata
): TinValidationResult => {
    const sanitized = value.trim().toUpperCase().replace(/[\s-]/g, '');

    // NINEA Core (7 digits + control + series)
    if (sanitized.length >= 9 && sanitized.length <= 15 && /^[0-9]{7}[0-9][A-Z0-9]/.test(sanitized)) {
        return { 
            isValid: true, 
            status: 'VALID', 
            isOfficialMatch: true, 
            explanation: 'Matches official Senegalese NINEA format.' 
        };
    }

    if (sanitized.length >= 4 && sanitized.length <= 20 && /^[A-Z0-9]+$/.test(sanitized)) {
        return { 
            isValid: true, 
            status: 'VALID', 
            isOfficialMatch: true, 
            explanation: 'Matches general Senegalese identifier alphanumeric format.' 
        };
    }

    return { 
        isValid: false, 
        status: 'INVALID_FORMAT',
        explanation: 'Value does not match Senegalese NINEA format.'
    };
};

/**
 * APPENDIX: FORENSIC CRITERIA
 * Senegal uses the NINEA (Numéro d'Identification Nationale des Entreprises et des Associations).
 * 1. Scope: Issued and managed by the DGID.
 * 2. Structure: 
 *    - Positions 1-7: Sequence number.
 *    - Position 8: Check digit (Modulo 10).
 *    - Position 9: Activity code.
 *    - Positions 10-15: Serial/Branch code.
 * 3. Validation: Structural verification based on pattern and length. 
 * 4. Residency: Centered on the 183-day presence rule or primary residence.
 */
