import { HolderMetadata, TinValidationResult, CountryRegulatoryInfo, TinInfo, TinRequirement } from './index';

/**
 * TIN Validation for Georgia (GE)
 * Individual: Personal Number (11 digits)
 * Entity: Identification Number (9 digits)
 */

/**
 * TIN Requirements for Georgia
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
 * Country Metadata for Georgia
 */
export const COUNTRY_INFO: CountryRegulatoryInfo = {
    name: 'Georgia',
    authority: 'Revenue Service ( შემოსავლების სამსახური)',
    compliance: {
        crsStatus: 'Participating',
        crsDate: 'September 2024',
        fatcaStatus: 'Model 1 (In Force)'
    },
    residency: {
        individual: 'Se considera residente si permanece en Georgia durante más de 183 días en cualquier periodo de 12 meses consecutivos.',
        entity: 'Se considera residente si está incorporada en Georgia o si su gestión central se encuentra allí.',
        notes: 'Criterio de permanencia física o gestión central.'
    }
};

/**
 * TIN Metadata for Georgia (Era 6.3)
 */
export const TIN_INFO: TinInfo = {
    name: 'Personal No. / Identification No.',
    description: 'Georgian Personal Number (Individuals) or Identification Number (Entities) issued by the Revenue Service.',
    placeholder: '12345678901 / 123456789',
    officialLink: 'https://www.rs.ge',
    isOfficial: true,
    lastUpdated: '2026-04-24',
    source: 'OECD Portal / Georgia RS',
    entityDifferentiation: {
        logic: 'Number length analysis.',
        individualDescription: '11-digit Personal Number.',
        businessDescription: '9-digit Identification Number.'
    }
};

/**
 * Georgia TIN Validator - Era 6.3
 */
export const validateGETIN = (
    value: string, 
    type: 'INDIVIDUAL' | 'ENTITY' | 'ANY' = 'ANY', 
    metadata?: HolderMetadata
): TinValidationResult => {
    const sanitized = value.replace(/[\s-]/g, '');

    // Individual: 11 digits
    if (sanitized.length === 11 && /^[0-9]{11}$/.test(sanitized)) {
        if (type === 'ENTITY') {
             return { isValid: false, status: 'MISMATCH', reasonCode: 'ENTITY_TYPE_MISMATCH' };
        }
        return { 
            isValid: true, 
            status: 'VALID', 
            isOfficialMatch: true, 
            explanation: decodeGeorgiaTIN(sanitized)
        };
    }

    // Business: 9 digits
    if (sanitized.length === 9 && /^[0-9]{9}$/.test(sanitized)) {
        if (type === 'INDIVIDUAL') {
             return { isValid: false, status: 'MISMATCH', reasonCode: 'ENTITY_TYPE_MISMATCH' };
        }
        return { 
            isValid: true, 
            status: 'VALID', 
            isOfficialMatch: true, 
            explanation: 'Matches official Georgian Identification Number (9 digits) format.' 
        };
    }

    return { 
        isValid: false, 
        status: 'INVALID_FORMAT',
        explanation: 'Value does not match Georgian Personal Number (11 digits) or Identification Number (9 digits) format.'
    };
};

function decodeGeorgiaTIN(tin: string): string {
    const centuryDigit = parseInt(tin[0]);
    // Note: The structure is complex and regional, but the length is fixed.
    return `Georgian Personal Number. Verified via 11-digit structure.`;
}

/**
 * APPENDIX: FORENSIC CRITERIA
 * Georgia uses the 11-digit Personal Number for individuals and the 9-digit 
 * Identification Number for businesses.
 * 1. Personal Number (11 digits): 
 *    - Permanent identifier for citizens and residents.
 *    - Validation: Structural verification based on fixed length.
 * 2. Identification Number (9 digits): 
 *    - Unique code assigned to legal entities by the Revenue Service.
 * 3. Residency: Based on the 183-day presence rule in any consecutive 12-month period.
 */
