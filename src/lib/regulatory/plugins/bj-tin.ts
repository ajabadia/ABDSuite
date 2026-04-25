
import { HolderMetadata, TinValidationResult, CountryRegulatoryInfo, TinInfo, TinRequirement } from './index';

/**
 * TIN Validation for Benin (BJ)
 * IFU (13 digits)
 */

/**
 * TIN Requirements for Benin
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
 * Country Metadata for Benin
 */
export const COUNTRY_INFO: CountryRegulatoryInfo = {
    name: 'Benín',
    authority: 'Direction Générale des Impôts (DGI)',
    compliance: {
        crsStatus: 'Non-Participating',
        crsDate: 'N/A',
        fatcaStatus: 'N/A'
    },
    residency: {
        individual: 'Se considera residente si tiene su residencia principal en Benín o si permanece allí durante más de 183 días.',
        entity: 'Se considera residente si está incorporada en Benín.',
        notes: 'Criterio de residencia principal o estancia de 183 días.'
    }
};

/**
 * TIN Metadata for Benin (Era 6.3)
 */
export const TIN_INFO: TinInfo = {
    name: 'IFU',
    description: 'Beninese IFU issued by the DGI.',
    placeholder: '1234567890123',
    officialLink: 'https://www.impots.bj',
    isOfficial: true,
    lastUpdated: '2026-04-24',
    source: 'Local Authority / Benin DGI',
    entityDifferentiation: {
        logic: 'Structurally identical identifiers.',
        individualDescription: '13-digit IFU identifier.',
        businessDescription: '13-digit IFU identifier.'
    }
};

/**
 * Benin TIN Validator - Era 6.3
 */
export const validateBJTIN = (
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
            explanation: 'Matches official Beninese IFU (13 digits) format.' 
        };
    }

    return { 
        isValid: false, 
        status: 'INVALID_FORMAT',
        explanation: 'Value does not match Beninese IFU (13 digits) format.'
    };
};

/**
 * APPENDIX: FORENSIC CRITERIA
 * Benin utilizes the IFU (Identifiant Fiscal Unique) for all taxpayers.
 * 1. Scope: Issued by the Direction Générale des Impôts (DGI).
 * 2. Structure: 13-digit numeric sequence.
 * 3. Validation: Structural verification based on length.
 * 4. Residency: Centered on the 183-day presence rule or principal residence location.
 */

