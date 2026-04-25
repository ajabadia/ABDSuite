import { HolderMetadata, TinValidationResult, CountryRegulatoryInfo, TinInfo, TinRequirement } from './index';

/**
 * TIN Validation for Turkey (TR)
 * Individual: T.C. Kimlik No (TCKN) (11 digits)
 * Entity: Vergi Kimlik No (VKN) (10 digits)
 */

/**
 * TIN Requirements for Turkey
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
 * Country Metadata for Turkey
 */
export const COUNTRY_INFO: CountryRegulatoryInfo = {
    name: 'Turquía',
    authority: 'Revenue Administration (Gelir İdaresi Başkanlığı)',
    compliance: {
        crsStatus: 'Participating',
        crsDate: 'September 2018',
        fatcaStatus: 'Model 1 (In Force)'
    },
    residency: {
        individual: 'Se considera residente si tiene su domicilio en Turquía o si permanece en Turquía durante más de 6 meses en un año natural.',
        entity: 'Se considera residente si tiene su sede legal o su centro de negocios en Turquía.',
        notes: 'Criterio de domicilio o estancia de 6 meses.'
    }
};

/**
 * TIN Metadata for Turkey (Era 6.3)
 */
export const TIN_INFO: TinInfo = {
    name: 'TCKN / VKN',
    description: 'Turkish TCKN (Individuals) or VKN (Entities) issued by the Revenue Administration.',
    placeholder: '12345678901 / 1234567890',
    officialLink: 'https://www.gib.gov.tr',
    isOfficial: true,
    lastUpdated: '2026-04-24',
    source: 'OECD Portal / GIB',
    entityDifferentiation: {
        logic: 'Number length analysis.',
        individualDescription: 'TCKN of 11 digits for citizens.',
        businessDescription: 'VKN of 10 digits for entities and foreigners.'
    }
};

/**
 * Turkey TIN Validator - Era 6.3
 */
export const validateTRTIN = (
    value: string, 
    type: 'INDIVIDUAL' | 'ENTITY' | 'ANY' = 'ANY', 
    metadata?: HolderMetadata
): TinValidationResult => {
    const sanitized = value.trim().replace(/[\s-]/g, '');

    // 1. Individual (TCKN): 11 digits
    if (sanitized.length === 11 && /^[0-9]{11}$/.test(sanitized)) {
        if (type === 'ENTITY') {
            return { 
                isValid: false, 
                status: 'MISMATCH', 
                reasonCode: 'ENTITY_TYPE_MISMATCH',
                explanation: 'The detected format (11 digits) corresponds to a Turkish TCKN, which is exclusive to individuals.'
            };
        }
        
        const isOfficial = validateTCKNChecksum(sanitized);
        return { 
            isValid: true, 
            status: isOfficial ? 'VALID' : 'VALID_UNOFFICIAL', 
            isOfficialMatch: isOfficial, 
            explanation: type === 'ANY'
                ? 'Format valid for Individuals (TCKN). Note: This TIN is invalid if the holder is an Entity.'
                : `Matches official Turkish TCKN (11 digits) format. ${isOfficial ? 'Verified via double checksum.' : 'Pattern match.'}` 
        };
    }

    // 2. Tax ID (VKN): 10 digits
    if (sanitized.length === 10 && /^[0-9]{10}$/.test(sanitized)) {
        if (type === 'INDIVIDUAL' && sanitized[0] !== '0') {
             // Heuristic: TCKN never starts with 0, VKN can.
        }
        const isOfficial = validateVKNChecksum(sanitized);
        return { 
            isValid: true, 
            status: isOfficial ? 'VALID' : 'VALID_UNOFFICIAL', 
            isOfficialMatch: isOfficial, 
            explanation: type === 'ANY'
                ? 'Format valid for Entities (VKN). Note: This TIN is invalid if the holder is an Individual.'
                : `Matches official Turkish VKN (10 digits) format. ${isOfficial ? 'Verified via checksum.' : 'Pattern match.'}` 
        };
    }

    return { 
        isValid: false, 
        status: 'INVALID_FORMAT',
        explanation: 'Value does not match Turkish TCKN (11 digits) or VKN (10 digits) format.'
    };
};

function validateTCKNChecksum(tin: string): boolean {
    if (tin[0] === '0') return false;
    const digits = tin.split('').map(Number);
    
    // 10th digit check
    const sumOdd = digits[0] + digits[2] + digits[4] + digits[6] + digits[8];
    const sumEven = digits[1] + digits[3] + digits[5] + digits[7];
    const check10 = ((sumOdd * 7) - sumEven) % 10;
    if (check10 !== digits[9]) return false;
    
    // 11th digit check
    const sumFirst10 = digits.slice(0, 10).reduce((a, b) => a + b, 0);
    const check11 = sumFirst10 % 10;
    return check11 === digits[10];
}

function validateVKNChecksum(tin: string): boolean {
    let sum = 0;
    for (let i = 0; i < 9; i++) {
        let v1 = (parseInt(tin[i]) + (9 - i)) % 10;
        if (v1 === 0) {
            sum += 0;
        } else {
            let v2 = (v1 * Math.pow(2, (9 - i))) % 9;
            if (v2 === 0) v2 = 9;
            sum += v2;
        }
    }
    const checkDigit = (10 - (sum % 10)) % 10;
    return checkDigit === parseInt(tin[9]);
}

/**
 * APPENDIX: FORENSIC CRITERIA
 * Turkey uses TCKN (Individuals) and VKN (Entities) systems.
 * 1. TCKN (11 digits): 
 *    - Mandatory for Turkish citizens.
 *    - Structure: 11 digits, cannot start with 0.
 *    - Validation: Dual-layer weighted sum Modulo 10.
 * 2. VKN (10 digits): 
 *    - Used for companies and foreign individuals.
 *    - Validation: Recursive algorithm Modulo 9.
 * 3. Residency: Domicile or 6-month presence in a calendar year.
 */
