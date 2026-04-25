
import { HolderMetadata, TinValidationResult, CountryRegulatoryInfo, TinInfo, TinRequirement } from './index';

/**
 * TIN Validation for Botswana (BW)
 * TIN (variable length)
 */

/**
 * TIN Requirements for Botswana
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
 * Country Metadata for Botswana
 */
export const COUNTRY_INFO: CountryRegulatoryInfo = {
    name: 'Botsuana',
    authority: 'Botswana Revenue Service (BURS)',
    compliance: {
        crsStatus: 'Non-Participating',
        crsDate: 'N/A',
        fatcaStatus: 'N/A'
    },
    residency: {
        individual: 'Se considera residente si permanece en Botsuana durante más de 183 días en el año fiscal.',
        entity: 'Se considera residente si está incorporada en Botsuana.',
        notes: 'Criterio de permanencia física o constitución legal.'
    }
};

/**
 * TIN Metadata for Botswana (Era 6.3)
 */
export const TIN_INFO: TinInfo = {
    name: 'TIN',
    description: 'Botswana TIN issued by the BURS.',
    placeholder: '12345678',
    officialLink: 'https://www.burs.org.bw',
    isOfficial: true,
    lastUpdated: '2026-04-24',
    source: 'Local Authority / Botswana BURS',
    entityDifferentiation: {
        logic: 'Structurally identical identifiers.',
        individualDescription: 'TIN for individuals.',
        businessDescription: 'TIN for entities.'
    }
};

/**
 * Botswana TIN Validator - Era 6.3
 */
export const validateBWTIN = (
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
            explanation: 'Matches general Botswana TIN format.' 
        };
    }

    return { 
        isValid: false, 
        status: 'INVALID_FORMAT',
        explanation: 'Value does not match Botswana TIN format.'
    };
};

/**
 * APPENDIX: FORENSIC CRITERIA
 * Botswana's TIN (Tax Identification Number) is the primary tax code.
 * 1. Scope: Issued by the Botswana Unified Revenue Service (BURS) to all taxpayers.
 * 2. Structure: Alphanumeric or numeric code of variable length (typically numeric).
 * 3. Validation: Structural verification against length and alphanumeric pattern.
 * 4. Residency: Centered on the 183-day presence rule in a fiscal year.
 */

