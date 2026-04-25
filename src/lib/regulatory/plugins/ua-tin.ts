import { HolderMetadata, TinValidationResult, CountryRegulatoryInfo, TinInfo, TinRequirement } from './index';

/**
 * TIN Validation for Ukraine (UA)
 * Individual: RNOKPP (10 digits)
 * Entity: EDRPOU (8 digits)
 */

/**
 * TIN Requirements for Ukraine
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
        key: 'birthDate', 
        label: 'birthDate', 
        type: 'date', 
        scope: 'INDIVIDUAL' 
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
 * Country Metadata for Ukraine
 */
export const COUNTRY_INFO: CountryRegulatoryInfo = {
    name: 'Ucrania',
    authority: 'State Tax Service',
    compliance: {
        crsStatus: 'Participating',
        crsDate: 'September 2024',
        fatcaStatus: 'Model 1 (In Force)'
    },
    residency: {
        individual: 'Se considera residente si tiene domicilio en Ucrania, si tiene el centro de sus intereses vitales en Ucrania o si permanece 183 días en el año natural.',
        entity: 'Se considera residente si se ha incorporado bajo las leyes de Ucrania.',
        notes: 'Criterio de domicilio, intereses vitales o permanencia.'
    }
};

/**
 * TIN Metadata for Ukraine (Era 6.3)
 */
export const TIN_INFO: TinInfo = {
    name: 'RNOKPP / EDRPOU',
    description: 'Ukrainian RNOKPP (Individuals) or EDRPOU (Entities) issued by the State Tax Service.',
    placeholder: '1234567890 / 12345678',
    officialLink: 'https://tax.gov.ua',
    isOfficial: true,
    lastUpdated: '2026-04-24',
    source: 'OECD Portal / State Tax Service',
    entityDifferentiation: {
        logic: 'Number length analysis.',
        individualDescription: '10-digit RNOKPP for individuals.',
        businessDescription: '8-digit EDRPOU for companies.'
    }
};

/**
 * Ukraine TIN Validator - Era 6.3
 */
export const validateUATIN = (
    value: string, 
    type: 'INDIVIDUAL' | 'ENTITY' | 'ANY' = 'ANY', 
    metadata?: HolderMetadata
): TinValidationResult => {
    const sanitized = value.trim().replace(/[\s-]/g, '');

    // 1. Individual (RNOKPP): 10 digits
    if (sanitized.length === 10 && /^[0-9]{10}$/.test(sanitized)) {
        if (type === 'ENTITY') {
            return { 
                isValid: false, 
                status: 'MISMATCH', 
                reasonCode: 'ENTITY_TYPE_MISMATCH',
                explanation: 'The detected format (10 digits) corresponds to a Ukrainian RNOKPP, which is exclusive to individuals.'
            };
        }
        if (metadata) {
            const semantic = validateUkraineSemantic(sanitized, metadata);
            if (!semantic.isValid) {
                return semantic;
            }
        }

        const isOfficial = validateRNOKPPChecksum(sanitized);
        return { 
            isValid: true, 
            status: isOfficial ? 'VALID' : 'VALID_UNOFFICIAL', 
            isOfficialMatch: isOfficial, 
            explanation: decodeRNOKPP(sanitized) + (isOfficial ? ' Verified via Modulo 11.' : ' Pattern match.')
        };
    }

    // 2. Business (EDRPOU): 8 digits
    if (sanitized.length === 8 && /^[0-9]{8}$/.test(sanitized)) {
        if (type === 'INDIVIDUAL') {
            return { 
                isValid: false, 
                status: 'MISMATCH', 
                reasonCode: 'ENTITY_TYPE_MISMATCH',
                explanation: 'The detected format (8 digits) corresponds to a Ukrainian EDRPOU, which applies only to entities.'
            };
        }
        const isOfficial = validateEDRPOUChecksum(sanitized);
        return { 
            isValid: true, 
            status: isOfficial ? 'VALID' : 'VALID_UNOFFICIAL', 
            isOfficialMatch: isOfficial, 
            explanation: `Matches official Ukrainian EDRPOU (8 digits) format. ${isOfficial ? 'Verified via specialized Modulo 11.' : 'Pattern match.'}` 
        };
    }

    return { 
        isValid: false, 
        status: 'INVALID_FORMAT',
        explanation: 'Value does not match Ukrainian RNOKPP (10 digits) or EDRPOU (8 digits) format.'
    };
};

function decodeRNOKPP(tin: string): string {
    const daysSinceStart = parseInt(tin.substring(0, 5));
    const birthDate = new Date(1899, 11, 31);
    birthDate.setDate(birthDate.getDate() + daysSinceStart);
    
    const genderDigit = parseInt(tin[8]);
    const gender = (genderDigit % 2 === 0) ? 'Female' : 'Male';
    
    return `Ukrainian RNOKPP, Born: ${birthDate.toISOString().split('T')[0]}, Gender: ${gender}. Verified via structure.`;
}

function validateUkraineSemantic(tin: string, metadata: HolderMetadata): TinValidationResult {
    const mismatchFields: string[] = [];
    const daysPart = parseInt(tin.substring(0, 5));
    const genderDigit = parseInt(tin[8]);

    // Gender check (Odd=Male, Even=Female)
    if (metadata.gender) {
        const isMale = genderDigit % 2 !== 0;
        if ((metadata.gender === 'M' && !isMale) || (metadata.gender === 'F' && isMale)) {
            mismatchFields.push('gender');
        }
    }

    // Birth Date check
    if (metadata.birthDate) {
        const dob = new Date(metadata.birthDate);
        const startDate = new Date(1899, 11, 31);
        const diffTime = dob.getTime() - startDate.getTime();
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
        
        if (Math.abs(diffDays - daysPart) > 1) { // Allowance for timezone/leap second edge cases if any
             mismatchFields.push('birthDate');
        }
    }

    if (mismatchFields.length > 0) {
        return {
            isValid: false,
            status: 'MISMATCH',
            reasonCode: 'ID_DATA_INCONSISTENT',
            mismatchFields,
            explanation: `Inconsistency in ${mismatchFields.join(', ')} with Ukrainian RNOKPP structure.`
        };
    }

    return { isValid: true, status: 'VALID' };
}

function validateRNOKPPChecksum(tin: string): boolean {
    const weights = [-1, 5, 7, 9, 4, 6, 10, 5, 7];
    let sum = 0;
    for (let i = 0; i < 9; i++) {
        sum += parseInt(tin[i]) * weights[i];
    }
    const remainder = sum % 11;
    const checkDigit = (remainder === 10) ? 0 : remainder;
    return checkDigit === parseInt(tin[9]);
}

function validateEDRPOUChecksum(tin: string): boolean {
    const n = parseInt(tin);
    let weights = (n < 30000000 || n > 60000000) ? [1, 2, 3, 4, 5, 6, 7] : [7, 1, 2, 3, 4, 5, 6];
    let sum = 0;
    for (let i = 0; i < 7; i++) sum += parseInt(tin[i]) * weights[i];
    
    let remainder = sum % 11;
    if (remainder < 10) return remainder === parseInt(tin[7]);
    
    // Second pass if remainder is 10
    weights = (n < 30000000 || n > 60000000) ? [3, 4, 5, 6, 7, 8, 9] : [9, 3, 4, 5, 6, 7, 8];
    sum = 0;
    for (let i = 0; i < 7; i++) sum += parseInt(tin[i]) * weights[i];
    remainder = sum % 11;
    if (remainder < 10) return remainder === parseInt(tin[7]);
    
    return parseInt(tin[7]) === 0;
}

/**
 * APPENDIX: FORENSIC CRITERIA
 * Ukraine uses the RNOKPP (Individuals) and EDRPOU (Entities) systems.
 * 1. RNOKPP (10 digits): 
 *    - Positions 1-5: Days since Dec 31, 1899 (Birth Date).
 *    - Position 9: Gender indicator (Odd for Male, Even for Female).
 *    - Position 10: Check digit (Weighted sum Modulo 11).
 * 2. EDRPOU (8 digits): 
 *    - Validation: Specialized Modulo 11 with two-pass logic based on range.
 * 3. Residency: Center of vital interests, domicile, or 183-day presence.
 * 4. Scope: Managed by the State Tax Service of Ukraine.
 */
