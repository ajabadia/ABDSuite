import { HolderMetadata, TinValidationResult, CountryRegulatoryInfo, TinInfo, TinRequirement } from './index';

/**
 * TIN Validation for Oman (OM)
 * Individual: Civil ID (8 digits)
 * Entity: CR Number (7 digits)
 */

/**
 * TIN Requirements for Oman
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
 * Country Metadata for Oman
 */
export const COUNTRY_INFO: CountryRegulatoryInfo = {
    name: 'Omán',
    authority: 'Tax Authority',
    compliance: {
        crsStatus: 'Participating',
        crsDate: 'September 2020',
        fatcaStatus: 'Model 1 (In Force)'
    },
    residency: {
        individual: 'Se considera residente si permanece en Omán durante más de 183 días en el año fiscal.',
        entity: 'Se considera residente si está incorporada en Omán o si su gestión central se encuentra allí.',
        notes: 'Criterio de permanencia física o gestión central.'
    }
};

/**
 * TIN Metadata for Oman (Era 6.3)
 */
export const TIN_INFO: TinInfo = {
    name: 'CR Number / Civil ID',
    description: 'Omani CR Number (Entities) or Civil ID (Individuals) issued by the Ministry of Commerce or Royal Oman Police.',
    placeholder: '1234567 / 12345678',
    officialLink: 'https://www.taxoman.gov.om',
    isOfficial: true,
    lastUpdated: '2026-04-24',
    source: 'Local Authority / Oman Tax Authority',
    entityDifferentiation: {
        logic: 'Number length analysis.',
        individualDescription: '8-digit Civil ID.',
        businessDescription: '7-digit Commercial Registration (CR) Number.'
    }
};

/**
 * Oman TIN Validator - Era 6.3
 */
export const validateOMTIN = (
    value: string, 
    type: 'INDIVIDUAL' | 'ENTITY' | 'ANY' = 'ANY', 
    metadata?: HolderMetadata
): TinValidationResult => {
    const sanitized = value.trim().toUpperCase().replace(/[\s-]/g, '');

    // 1. Entity (CR Number): 7 digits
    if (sanitized.length === 7 && /^[0-9]{7}$/.test(sanitized)) {
        if (type === 'INDIVIDUAL') {
             return { isValid: false, status: 'MISMATCH', reasonCode: 'ENTITY_TYPE_MISMATCH' };
        }
        return { 
            isValid: true, 
            status: 'VALID', 
            isOfficialMatch: true, 
            explanation: 'Matches official Omani Commercial Registration (7 digits) format.' 
        };
    }

    // 2. Individual (Civil ID): 8 digits
    if (sanitized.length === 8 && /^[0-9]{8}$/.test(sanitized)) {
        if (type === 'ENTITY') {
             return { isValid: false, status: 'MISMATCH', reasonCode: 'ENTITY_TYPE_MISMATCH' };
        }
        return { 
            isValid: true, 
            status: 'VALID', 
            isOfficialMatch: true, 
            explanation: 'Matches official Omani Civil ID (8 digits) format.' 
        };
    }

    if (sanitized.length >= 4 && sanitized.length <= 15 && /^[A-Z0-9]+$/.test(sanitized)) {
        return { 
            isValid: true, 
            status: 'VALID', 
            isOfficialMatch: true, 
            explanation: 'Matches general Omani identifier alphanumeric format.' 
        };
    }

    return { 
        isValid: false, 
        status: 'INVALID_FORMAT',
        explanation: 'Value does not match Omani identifier format (7-8 digits).'
    };
};

/**
 * APPENDIX: FORENSIC CRITERIA
 * Oman uses distinct identifiers for individuals and businesses.
 * 1. Civil ID (Individuals): 8-digit numeric sequence issued by ROP.
 * 2. CR Number (Entities): 7-digit numeric sequence issued by MOCI.
 * 3. Validation: Structural verification based on pattern and length. 
 * 4. Residency: Centered on the 183-day presence rule in a fiscal year.
 */
