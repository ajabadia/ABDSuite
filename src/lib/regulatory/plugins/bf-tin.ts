
import { HolderMetadata, TinValidationResult, CountryRegulatoryInfo, TinInfo, TinRequirement } from './index';

/**
 * TIN Validation for Burkina Faso (BF)
 * IFU (variable length)
 */

/**
 * TIN Requirements for Burkina Faso
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
 * Country Metadata for Burkina Faso
 */
export const COUNTRY_INFO: CountryRegulatoryInfo = {
    name: 'Burkina Faso',
    authority: 'Direction Générale des Impôts (DGI)',
    compliance: {
        crsStatus: 'Non-Participating',
        crsDate: 'N/A',
        fatcaStatus: 'N/A'
    },
    residency: {
        individual: 'Se considera residente si tiene su residencia principal en Burkina Faso o si permanece allí durante más de 183 días.',
        entity: 'Se considera residente si está incorporada en Burkina Faso.',
        notes: 'Criterio de residencia principal o estancia de 183 días.'
    }
};

/**
 * TIN Metadata for Burkina Faso (Era 6.3)
 */
export const TIN_INFO: TinInfo = {
    name: 'IFU',
    description: 'Burkinabe IFU issued by the DGI.',
    placeholder: '12345678A',
    officialLink: 'https://www.impots.gov.bf',
    isOfficial: true,
    lastUpdated: '2026-04-24',
    source: 'Local Authority / Burkina DGI',
    entityDifferentiation: {
        logic: 'Structurally identical identifiers.',
        individualDescription: 'IFU for individuals.',
        businessDescription: 'IFU for entities.'
    }
};

/**
 * Burkina Faso TIN Validator - Era 6.3
 */
export const validateBFTIN = (
    value: string, 
    type: 'INDIVIDUAL' | 'ENTITY' | 'ANY' = 'ANY', 
    metadata?: HolderMetadata
): TinValidationResult => {
    const sanitized = value.trim().toUpperCase();

    if (sanitized.length >= 4 && sanitized.length <= 15 && /^[A-Z0-9]+$/.test(sanitized)) {
        return { 
            isValid: true, 
            status: 'VALID', 
            isOfficialMatch: true, 
            explanation: 'Matches general Burkinabe IFU format.' 
        };
    }

    return { 
        isValid: false, 
        status: 'INVALID_FORMAT',
        explanation: 'Value does not match Burkinabe IFU format.'
    };
};

/**
 * APPENDIX: FORENSIC CRITERIA
 * Burkina Faso uses the IFU (Identifiant Fiscal Unique) for tax purposes.
 * 1. Scope: Issued by the Direction Générale des Impôts (DGI) to all taxpayers.
 * 2. Structure: Alphanumeric or numeric code of variable length (typically 8-10 characters).
 * 3. Validation: Structural verification against the alphanumeric pattern.
 * 4. Residency: Centered on the 183-day presence rule or principal residence location.
 */

