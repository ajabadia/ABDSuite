import { HolderMetadata, TinValidationResult, CountryRegulatoryInfo, TinInfo, TinRequirement } from './index';

/**
 * TIN Validation for Japan (JP)
 * Individual: My Number (12 digits)
 * Entity: Corporate Number (13 digits)
 */

/**
 * TIN Requirements for Japan
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
 * Country Metadata for Japan
 */
export const COUNTRY_INFO: CountryRegulatoryInfo = {
    name: 'Japón',
    authority: 'National Tax Agency (NTA)',
    compliance: {
        crsStatus: 'Participating',
        crsDate: 'September 2018',
        fatcaStatus: 'Model 2 (In Force)'
    },
    residency: {
        individual: 'Se considera residente si tiene su domicilio en Japón o ha tenido su residencia habitual en Japón durante un año o más.',
        entity: 'Se considera residente si tiene su oficina principal o sede social en Japón.',
        notes: 'Criterio de domicilio o residencia de 1 año.'
    }
};

/**
 * TIN Metadata for Japan (Era 6.3)
 */
export const TIN_INFO: TinInfo = {
    name: 'My Number / Corporate Number',
    description: 'Japanese Individual Number (My Number) or Corporate Number issued by the NTA.',
    placeholder: '1234 5678 9012 / 1234567890123',
    officialLink: 'https://www.nta.go.jp',
    isOfficial: true,
    lastUpdated: '2026-04-24',
    source: 'OECD Portal / NTA',
    entityDifferentiation: {
        logic: 'Number length analysis.',
        individualDescription: 'My Number of 12 digits for individuals.',
        businessDescription: 'Corporate Number of 13 digits for entities.'
    }
};

/**
 * Japan TIN Validator - Era 6.3
 */
export const validateJPTIN = (
    value: string, 
    type: 'INDIVIDUAL' | 'ENTITY' | 'ANY' = 'ANY', 
    metadata?: HolderMetadata
): TinValidationResult => {
    const sanitized = value.replace(/[\s-]/g, '');

    // Individual (My Number): 12 digits
    if (sanitized.length === 12 && /^[0-9]{12}$/.test(sanitized)) {
        if (type === 'ENTITY') {
            return { 
                isValid: false, 
                status: 'MISMATCH', 
                reasonCode: 'ENTITY_TYPE_MISMATCH',
                explanation: 'The detected format (12 digits) corresponds to a Japanese My Number, which is exclusive to individuals.'
            };
        }
        const isOfficial = validateMyNumberChecksum(sanitized);
        return { 
            isValid: true, 
            status: isOfficial ? 'VALID' : 'VALID_UNOFFICIAL', 
            isOfficialMatch: isOfficial, 
            explanation: type === 'ANY'
                ? 'Format valid for Individuals (My Number). Note: This identifier is not valid for legal Entities.'
                : `Matches official Japanese My Number (12 digits) format. ${isOfficial ? 'Verified via official checksum.' : 'Pattern match.'}` 
        };
    }

    // Business (Corporate Number): 13 digits
    if (sanitized.length === 13 && /^[0-9]{13}$/.test(sanitized)) {
        if (type === 'INDIVIDUAL') {
            return { 
                isValid: false, 
                status: 'MISMATCH', 
                reasonCode: 'ENTITY_TYPE_MISMATCH',
                explanation: 'The detected format (13 digits) corresponds to a Japanese Corporate Number, which applies only to entities.'
            };
        }
        const isOfficial = validateCorporateNumberChecksum(sanitized);
        return { 
            isValid: true, 
            status: isOfficial ? 'VALID' : 'VALID_UNOFFICIAL', 
            isOfficialMatch: isOfficial, 
            explanation: type === 'ANY'
                ? 'Format valid for Entities (Corporate Number). Note: This format is invalid if the holder is an Individual.'
                : `Matches official Japanese Corporate Number (13 digits) format. ${isOfficial ? 'Verified via official checksum.' : 'Pattern match.'}` 
        };
    }

    return { 
        isValid: false, 
        status: 'INVALID_FORMAT',
        explanation: 'Value does not match Japanese My Number (12 digits) or Corporate Number (13 digits) format.'
    };
};

function validateMyNumberChecksum(tin: string): boolean {
    const body = tin.substring(0, 11);
    const last = parseInt(tin[11]);
    
    let sum = 0;
    for (let i = 1; i <= 11; i++) {
        const p = parseInt(body[11 - i]);
        const q = i <= 6 ? i + 1 : i - 5;
        sum += p * q;
    }
    
    const remainder = sum % 11;
    const checkDigit = remainder <= 1 ? 0 : 11 - remainder;
    return checkDigit === last;
}

function validateCorporateNumberChecksum(tin: string): boolean {
    const body = tin.substring(1, 13);
    const first = parseInt(tin[0]);
    
    let sum = 0;
    for (let i = 1; i <= 12; i++) {
        const p = parseInt(body[12 - i]);
        const q = (i % 2 === 0) ? 2 : 1;
        sum += p * q;
    }
    
    const checkDigit = 9 - (sum % 9);
    return checkDigit === first;
}

/**
 * APPENDIX: FORENSIC CRITERIA
 * Japan uses separate identifiers for individuals and legal entities.
 * 1. My Number (Individuals): 
 *    - 12-digit numeric sequence.
 *    - Validation: Weighted sum algorithm Modulo 11. 
 *      - Formula: (Sum(P_i * Q_i) % 11). If Remainder <= 1, Check=0. Else, Check=11-Remainder.
 * 2. Corporate Number (Entities): 
 *    - 13-digit numeric sequence.
 *    - Validation: Check digit is the 1st digit, calculated from the following 12.
 *      - Logic: 9 - (WeightedSum % 9). Weights are 1 and 2 alternately.
 * 3. Residency: Based on domicile or habitual residence for 1 year or more.
 * 4. Scope: Issued and managed by the National Tax Agency (NTA).
 */
