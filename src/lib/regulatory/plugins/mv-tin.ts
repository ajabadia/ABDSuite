import { HolderMetadata, TinValidationResult, CountryRegulatoryInfo, TinInfo, TinRequirement } from './index';

/**
 * TIN Validation for Maldives (MV)
 * Individual: National ID Card (7 digits)
 * Entity: Tax Identification Number (TIN) (10 digits)
 */

/**
 * TIN Requirements for Maldives
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
 * Country Metadata for Maldives
 */
export const COUNTRY_INFO: CountryRegulatoryInfo = {
    name: 'Maldivas',
    authority: 'Maldives Inland Revenue Authority (MIRA)',
    compliance: {
        crsStatus: 'Non-Participating',
        crsDate: 'N/A',
        fatcaStatus: 'N/A'
    },
    residency: {
        individual: 'Se considera residente si permanece en las Maldivas durante más de 183 días en el año fiscal.',
        entity: 'Se considera residente si está incorporada en las Maldivas.',
        notes: 'Criterio de permanencia física o constitución legal.'
    }
};

/**
 * TIN Metadata for Maldives (Era 6.3)
 */
export const TIN_INFO: TinInfo = {
    name: 'ID Card / TIN',
    description: 'Maldivian ID Card (Individuals) or TIN (Entities) issued by the MIRA or Department of National Registration.',
    placeholder: '1234567 / 1001234567',
    officialLink: 'https://www.mira.gov.mv',
    isOfficial: true,
    lastUpdated: '2026-04-24',
    source: 'Local Authority / Maldives MIRA',
    entityDifferentiation: {
        logic: 'Number length analysis.',
        individualDescription: '7-digit National ID Card.',
        businessDescription: '10-digit TIN assigned to legal entities.'
    }
};

/**
 * Maldives TIN Validator - Era 6.3
 */
export const validateMVTIN = (
    value: string, 
    type: 'INDIVIDUAL' | 'ENTITY' | 'ANY' = 'ANY', 
    metadata?: HolderMetadata
): TinValidationResult => {
    const sanitized = value.trim().toUpperCase().replace(/[\s-]/g, '');

    // Individual: 7 digits
    if (sanitized.length === 7 && /^[0-9]{7}$/.test(sanitized)) {
        if (type === 'ENTITY') {
             return { isValid: false, status: 'MISMATCH', reasonCode: 'ENTITY_TYPE_MISMATCH' };
        }
        return { 
            isValid: true, 
            status: 'VALID', 
            isOfficialMatch: true, 
            explanation: 'Matches official Maldivian ID Card (7 digits) format.' 
        };
    }

    // Entity: 10 digits
    if (sanitized.length === 10 && /^[0-9]{10}$/.test(sanitized)) {
        if (type === 'INDIVIDUAL') {
             return { isValid: false, status: 'MISMATCH', reasonCode: 'ENTITY_TYPE_MISMATCH' };
        }
        return { 
            isValid: true, 
            status: 'VALID', 
            isOfficialMatch: true, 
            explanation: 'Matches official Maldivian TIN (10 digits) format.' 
        };
    }

    // Business/Other: variable length
    if (sanitized.length >= 4 && sanitized.length <= 15 && /^[A-Z0-9]+$/.test(sanitized)) {
        return { 
            isValid: true, 
            status: 'VALID', 
            isOfficialMatch: true, 
            explanation: 'Matches general Maldivian TIN alphanumeric format.' 
        };
    }

    return { 
        isValid: false, 
        status: 'INVALID_FORMAT',
        explanation: 'Value does not match Maldivian ID Card (7 digits) or TIN format.'
    };
};

/**
 * APPENDIX: FORENSIC CRITERIA
 * Maldives uses the National ID Card for individuals and the TIN for entities.
 * 1. Scope: Managed by the Department of National Registration (DNR) and MIRA.
 * 2. Structure: 
 *    - Individuals: Standard 7-digit numeric sequence.
 *    - Entities: 10-digit numeric sequence (TIN).
 * 3. Validation: Structural verification based on pattern and length. 
 * 4. Residency: Centered on the 183-day presence rule in a fiscal year.
 */
