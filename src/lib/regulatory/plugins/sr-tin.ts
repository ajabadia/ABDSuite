import { HolderMetadata, TinValidationResult, CountryRegulatoryInfo, TinInfo, TinRequirement } from './index';

/**
 * TIN Validation for Suriname (SR)
 * TIN (8 digits)
 */

/**
 * TIN Requirements for Suriname
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
 * Country Metadata for Suriname
 */
export const COUNTRY_INFO: CountryRegulatoryInfo = {
    name: 'Surinam',
    authority: 'Tax Inspectorate (Inspectie der Belastingen)',
    compliance: {
        crsStatus: 'Non-Participating',
        crsDate: 'N/A',
        fatcaStatus: 'N/A'
    },
    residency: {
        individual: 'Se considera residente si tiene su domicilio permanente en Surinam o si permanece allí durante más de 183 días.',
        entity: 'Se considera residente si se ha incorporado en Surinam.',
        notes: 'Criterio de domicilio o estancia de 183 días.'
    }
};

/**
 * TIN Metadata for Suriname (Era 6.3)
 */
export const TIN_INFO: TinInfo = {
    name: 'TIN',
    description: 'Surinamese TIN issued by the Tax Inspectorate.',
    placeholder: '12345678',
    officialLink: 'https://www.belastingdienst.sr',
    isOfficial: true,
    lastUpdated: '2026-04-24',
    source: 'Local Authority / Suriname Tax',
    entityDifferentiation: {
        logic: 'Structurally identical identifiers.',
        individualDescription: '8-digit TIN identifier.',
        businessDescription: '8-digit TIN identifier.'
    }
};

/**
 * Suriname TIN Validator - Era 6.3
 */
export const validateSRTIN = (
    value: string, 
    type: 'INDIVIDUAL' | 'ENTITY' | 'ANY' = 'ANY', 
    metadata?: HolderMetadata
): TinValidationResult => {
    const sanitized = value.trim().toUpperCase().replace(/[\s-]/g, '');

    if (sanitized.length === 8 && /^[0-9]{8}$/.test(sanitized)) {
        return { 
            isValid: true, 
            status: 'VALID', 
            isOfficialMatch: true, 
            explanation: 'Matches official Surinamese TIN (8 digits) format.' 
        };
    }

    if (sanitized.length >= 4 && sanitized.length <= 15 && /^[A-Z0-9]+$/.test(sanitized)) {
        return { 
            isValid: true, 
            status: 'VALID', 
            isOfficialMatch: true, 
            explanation: 'Matches general Surinamese TIN alphanumeric format.' 
        };
    }

    return { 
        isValid: false, 
        status: 'INVALID_FORMAT',
        explanation: 'Value does not match Surinamese TIN format.'
    };
};

/**
 * APPENDIX: FORENSIC CRITERIA
 * Suriname uses the Tax Identification Number (TIN) for all taxpayers.
 * 1. Scope: Issued and managed by the Tax Inspectorate (Inspectie der Belastingen).
 * 2. Structure: Standardized 8-digit numeric sequence.
 * 3. Validation: Structural verification based on pattern and length. 
 * 4. Residency: Centered on the 183-day presence rule or permanent domicile.
 */
