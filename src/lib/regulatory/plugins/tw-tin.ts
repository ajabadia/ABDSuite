import { HolderMetadata, TinValidationResult, CountryRegulatoryInfo, TinInfo, TinRequirement } from './index';

/**
 * TIN Validation for Taiwan (TW)
 * Individual: ID Number (10 characters: A123456789)
 * Entity: Business Accounting Number (BAN) (8 digits)
 */

/**
 * TIN Requirements for Taiwan
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
    },
    { 
        key: 'gender', 
        label: 'gender', 
        type: 'select', 
        scope: 'INDIVIDUAL',
        options: [
            { value: 'M', label: 'male' },
            { value: 'F', label: 'female' }
        ]
    }
];

/**
 * Country Metadata for Taiwan
 */
export const COUNTRY_INFO: CountryRegulatoryInfo = {
    name: 'Taiwán',
    authority: 'Ministry of Finance',
    compliance: {
        crsStatus: 'Non-Participating',
        crsDate: 'N/A',
        fatcaStatus: 'Model 2 (In Force)'
    },
    residency: {
        individual: 'Se considera residente si tiene domicilio en Taiwán y reside allí habitualmente, o si permanece en Taiwán durante 183 días o más.',
        entity: 'Se considera residente si se ha incorporado en Taiwán.',
        notes: 'Criterio de domicilio o estancia de 183 días.'
    }
};

/**
 * TIN Metadata for Taiwan (Era 6.3)
 */
export const TIN_INFO: TinInfo = {
    name: 'ID No. / BAN',
    description: 'Taiwanese ID Number (Individuals) or BAN (Entities) issued by the Ministry of Interior or Ministry of Finance.',
    placeholder: 'A123456789 / 12345678',
    officialLink: 'https://www.mof.gov.tw',
    isOfficial: true,
    lastUpdated: '2026-04-24',
    source: 'Local Authority / Taiwan MOF',
    entityDifferentiation: {
        logic: 'Number length and character analysis.',
        individualDescription: '10-character ID starting with a letter.',
        businessDescription: '8-digit Business Accounting Number (BAN).'
    }
};

/**
 * Taiwan TIN Validator - Era 6.3
 */
export const validateTWTIN = (
    value: string, 
    type: 'INDIVIDUAL' | 'ENTITY' | 'ANY' = 'ANY', 
    metadata?: HolderMetadata
): TinValidationResult => {
    const sanitized = value.trim().toUpperCase().replace(/[\s-]/g, '');

    // 1. Individual (ID No): 10 characters, starts with letter
    if (sanitized.length === 10 && /^[A-Z][1289][0-9]{8}$/.test(sanitized)) {
        if (type === 'ENTITY') {
             return { 
                 isValid: false, 
                 status: 'MISMATCH', 
                 reasonCode: 'ENTITY_TYPE_MISMATCH',
                 explanation: 'The detected format corresponds to a Taiwanese National ID, which is exclusive to individuals.'
             };
        }
        if (metadata) {
            const semantic = validateTaiwanSemantic(sanitized, metadata);
            if (!semantic.isValid) {
                return semantic;
            }
        }

        const isOfficial = validateTaiwanIDChecksum(sanitized);
        return { 
            isValid: true, 
            status: isOfficial ? 'VALID' : 'VALID_UNOFFICIAL', 
            isOfficialMatch: isOfficial, 
            explanation: decodeTaiwanID(sanitized) + (isOfficial ? ' Verified via checksum.' : ' Pattern match.')
        };
    }

    // 2. Business (BAN): 8 digits
    if (sanitized.length === 8 && /^[0-9]{8}$/.test(sanitized)) {
        if (type === 'INDIVIDUAL') {
             return { 
                 isValid: false, 
                 status: 'MISMATCH', 
                 reasonCode: 'ENTITY_TYPE_MISMATCH',
                 explanation: 'The detected format (8 digits) corresponds to a Taiwanese BAN, which applies only to entities.'
             };
        }
        const isOfficial = validateBANChecksum(sanitized);
        return { 
            isValid: true, 
            status: isOfficial ? 'VALID' : 'VALID_UNOFFICIAL', 
            isOfficialMatch: isOfficial, 
            explanation: `Matches official Taiwanese BAN (8 digits) format. ${isOfficial ? 'Verified via checksum.' : 'Pattern match.'}` 
        };
    }

    return { 
        isValid: false, 
        status: 'INVALID_FORMAT',
        explanation: 'Value does not match Taiwanese ID No (10 chars) or BAN (8 digits) format.'
    };
};

function decodeTaiwanID(tin: string): string {
    const genderDigit = tin[1];
    const gender = (genderDigit === '1' || genderDigit === '8') ? 'Male' : 'Female';
    const isForeigner = (genderDigit === '8' || genderDigit === '9');
    
    return `Taiwanese ${isForeigner ? 'Foreign Resident' : 'Citizen'} (${gender}).`;
}

function validateTaiwanSemantic(tin: string, metadata: HolderMetadata): TinValidationResult {
    const genderDigit = tin[1];

    if (metadata.gender) {
        const isMale = genderDigit === '1' || genderDigit === '8';
        if ((metadata.gender === 'M' && !isMale) || (metadata.gender === 'F' && isMale)) {
            return {
                isValid: false,
                status: 'MISMATCH',
                reasonCode: 'ID_DATA_INCONSISTENT',
                mismatchFields: ['gender'],
                explanation: `Taiwanese ID gender digit (${genderDigit}) implies ${isMale ? 'Male' : 'Female'}, but metadata specifies ${metadata.gender === 'F' ? 'Female' : 'Male'}.`
            };
        }
    }

    return { isValid: true, status: 'VALID' };
}

function validateTaiwanIDChecksum(tin: string): boolean {
    const letterMap: Record<string, number> = {
        'A': 10, 'B': 11, 'C': 12, 'D': 13, 'E': 14, 'F': 15, 'G': 16, 'H': 17, 'J': 18, 'K': 19,
        'L': 20, 'M': 21, 'N': 22, 'P': 23, 'Q': 24, 'R': 25, 'S': 26, 'T': 27, 'U': 28, 'V': 29,
        'X': 30, 'Y': 31, 'W': 32, 'Z': 33, 'I': 34, 'O': 35
    };
    
    const val = letterMap[tin[0]];
    if (val === undefined) return false;
    
    const d0 = Math.floor(val / 10);
    const d1 = val % 10;
    
    const weights = [1, 9, 8, 7, 6, 5, 4, 3, 2, 1];
    const digits = [d0, d1, ...tin.substring(1, 9).split('').map(Number)];
    
    let sum = 0;
    for (let i = 0; i < 10; i++) sum += digits[i] * weights[i];
    
    const checkDigit = (10 - (sum % 10)) % 10;
    return checkDigit === parseInt(tin[9]);
}

function validateBANChecksum(tin: string): boolean {
    const weights = [1, 2, 1, 2, 1, 2, 4, 1];
    let sum = 0;
    
    for (let i = 0; i < 8; i++) {
        let n = parseInt(tin[i]) * weights[i];
        sum += Math.floor(n / 10) + (n % 10);
    }
    
    if (sum % 10 === 0) return true;
    
    // Special rule for the 7th digit being 7
    if (tin[6] === '7' && (sum + 1) % 10 === 0) return true;
    
    return false;
}

/**
 * APPENDIX: FORENSIC CRITERIA
 * Taiwan uses the National ID (Individuals) and BAN (Entities) systems.
 * 1. National ID (10 characters): 
 *    - Structure: 1 Letter (Region) + 1 Digit (Gender/Type) + 8 Digits.
 *    - Gender/Type: 1 (Male Citizen), 2 (Female Citizen), 8 (Male Foreigner), 9 (Female Foreigner).
 *    - Validation: Mapping letter to number + weighted sum Modulo 10.
 * 2. BAN (8 digits): 
 *    - Validation: Weighted sum algorithm with special handling for the 7th digit (if 7).
 * 3. Residency: Domicile or 183-day presence rule.
 * 4. Scope: Managed by the Ministry of Interior and Ministry of Finance.
 */
