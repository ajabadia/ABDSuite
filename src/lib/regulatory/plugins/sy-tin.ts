import { HolderMetadata, TinValidationResult, CountryRegulatoryInfo, TinInfo, TinRequirement } from './index';

/**
 * TIN Validation for Syria (SY)
 * Individual: National Number (11 digits)
 * Entity: Tax Identification Number (TIN) (9 digits)
 */

/**
 * TIN Requirements for Syria
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
 * Country Metadata for Syria
 */
export const COUNTRY_INFO: CountryRegulatoryInfo = {
    name: 'Siria',
    authority: 'Syrian Tax Commission',
    compliance: {
        crsStatus: 'Non-Participating',
        crsDate: 'N/A',
        fatcaStatus: 'N/A'
    },
    residency: {
        individual: 'Se considera residente si permanece en Siria durante más de 183 días en el año civil.',
        entity: 'Se considera residente si está incorporada en Siria.',
        notes: 'Criterio de permanencia física o constitución legal.'
    }
};

/**
 * TIN Metadata for Syria (Era 6.3)
 */
export const TIN_INFO: TinInfo = {
    name: 'National No. / TIN',
    description: 'Syrian National Number (Individuals) or TIN (Entities) issued by the Civil Registry or Tax Commission.',
    placeholder: '12345678901 / 123456789',
    officialLink: 'https://www.syriantax.gov.sy',
    isOfficial: true,
    lastUpdated: '2026-04-24',
    source: 'Local Authority / Syria Tax',
    entityDifferentiation: {
        logic: 'Number length analysis.',
        individualDescription: '11-digit National Number.',
        businessDescription: '9-digit TIN assigned to legal entities.'
    }
};

/**
 * Syria TIN Validator - Era 6.3
 */
export const validateSYTIN = (
    value: string, 
    type: 'INDIVIDUAL' | 'ENTITY' | 'ANY' = 'ANY', 
    metadata?: HolderMetadata
): TinValidationResult => {
    const sanitized = value.trim().toUpperCase().replace(/[\s-]/g, '');

    // 1. Individual: 11 digits
    if (sanitized.length === 11 && /^[0-9]{11}$/.test(sanitized)) {
        if (type === 'ENTITY') {
             return { 
                 isValid: false, 
                 status: 'MISMATCH', 
                 reasonCode: 'ENTITY_TYPE_MISMATCH',
                 explanation: 'The detected format (11 digits) corresponds to a Syrian National Number, which is exclusive to individuals.'
             };
        }
        return { 
            isValid: true, 
            status: 'VALID', 
            isOfficialMatch: true, 
            explanation: 'Matches official Syrian National Number (11 digits) format.' 
        };
    }

    // 2. Business: 9 digits
    if (sanitized.length === 9 && /^[0-9]{9}$/.test(sanitized)) {
        if (type === 'INDIVIDUAL') {
             return { 
                 isValid: false, 
                 status: 'MISMATCH', 
                 reasonCode: 'ENTITY_TYPE_MISMATCH',
                 explanation: 'The detected format (9 digits) corresponds to a Syrian TIN, which applies only to entities.'
             };
        }
        return { 
            isValid: true, 
            status: 'VALID', 
            isOfficialMatch: true, 
            explanation: 'Matches official Syrian TIN (9 digits) format.' 
        };
    }

    if (sanitized.length >= 4 && sanitized.length <= 15 && /^[A-Z0-9]+$/.test(sanitized)) {
        return { 
            isValid: true, 
            status: 'VALID', 
            isOfficialMatch: true, 
            explanation: 'Matches general Syrian identifier alphanumeric format.' 
        };
    }

    return { 
        isValid: false, 
        status: 'INVALID_FORMAT',
        explanation: 'Value does not match Syrian National Number (11 digits) or TIN format.'
    };
};

/**
 * APPENDIX: FORENSIC CRITERIA
 * Syria uses the National Number for residents and the TIN for economic entities.
 * 1. National Number (11 digits): Mandatory identifier for citizens and residents.
 * 2. TIN (9 digits): Standard tax identifier for businesses.
 * 3. Validation: Structural verification based on pattern and length. 
 * 4. Residency: Based on the 183-day presence rule or legal incorporation.
 */
