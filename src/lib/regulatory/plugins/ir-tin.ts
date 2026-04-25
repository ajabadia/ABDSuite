import { HolderMetadata, TinValidationResult, CountryRegulatoryInfo, TinInfo, TinRequirement } from './index';

/**
 * TIN Validation for Iran (IR)
 * Individual: National Code (10 digits)
 * Entity: Economic Code (12 digits)
 */

/**
 * TIN Requirements for Iran
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
 * Country Metadata for Iran
 */
export const COUNTRY_INFO: CountryRegulatoryInfo = {
    name: 'Irán',
    authority: 'Iranian National Tax Administration (INTA)',
    compliance: {
        crsStatus: 'Non-Participating',
        crsDate: 'N/A',
        fatcaStatus: 'N/A'
    },
    residency: {
        individual: 'Se considera residente si permanece en Irán durante más de 183 días en el año solar.',
        entity: 'Se considera residente si está incorporada en Irán.',
        notes: 'Criterio de permanencia física o constitución legal.'
    }
};

/**
 * TIN Metadata for Iran (Era 6.3)
 */
export const TIN_INFO: TinInfo = {
    name: 'National Code / Economic Code',
    description: 'Iranian National Code (Individuals) or Economic Code (Entities) issued by the Civil Registry or INTA.',
    placeholder: '1234567890 / 123456789012',
    officialLink: 'https://www.intamedia.ir',
    isOfficial: true,
    lastUpdated: '2026-04-24',
    source: 'Local Authority / Iran INTA',
    entityDifferentiation: {
        logic: 'Number length analysis.',
        individualDescription: '10-digit National Code.',
        businessDescription: '12-digit Economic Code.'
    }
};

/**
 * Iran TIN Validator - Era 6.3
 */
export const validateIRTIN = (
    value: string, 
    type: 'INDIVIDUAL' | 'ENTITY' | 'ANY' = 'ANY', 
    metadata?: HolderMetadata
): TinValidationResult => {
    const sanitized = value.replace(/[\s-]/g, '');

    // Individual: 10 digits
    if (sanitized.length === 10 && /^[0-9]{10}$/.test(sanitized)) {
        if (type === 'ENTITY') {
             return { isValid: false, status: 'MISMATCH', reasonCode: 'ENTITY_TYPE_MISMATCH' };
        }
        
        const isOfficial = validateNationalCodeChecksum(sanitized);
        return { 
            isValid: true, 
            status: isOfficial ? 'VALID' : 'VALID_UNOFFICIAL', 
            isOfficialMatch: isOfficial, 
            explanation: `Matches official Iranian National Code (10 digits) format. ${isOfficial ? 'Verified via official checksum.' : 'Pattern match.'}` 
        };
    }

    // Business: 12 digits
    if (sanitized.length === 12 && /^[0-9]{12}$/.test(sanitized)) {
        if (type === 'INDIVIDUAL') {
             return { isValid: false, status: 'MISMATCH', reasonCode: 'ENTITY_TYPE_MISMATCH' };
        }
        return { 
            isValid: true, 
            status: 'VALID', 
            isOfficialMatch: true, 
            explanation: 'Matches official Iranian Economic Code (12 digits) format.' 
        };
    }

    return { 
        isValid: false, 
        status: 'INVALID_FORMAT',
        explanation: 'Value does not match Iranian National Code (10 digits) or Economic Code (12 digits) format.'
    };
};

function validateNationalCodeChecksum(code: string): boolean {
    const body = code.substring(0, 9);
    const last = parseInt(code[9]);
    
    let sum = 0;
    for (let i = 0; i < 9; i++) {
        sum += parseInt(body[i]) * (10 - i);
    }
    
    const remainder = sum % 11;
    if (remainder < 2) return last === remainder;
    return last === (11 - remainder);
}

/**
 * APPENDIX: FORENSIC CRITERIA
 * Iran uses the National Code for individuals and the Economic Code for entities.
 * 1. National Code (10 digits): 
 *    - Permanent identifier for Iranian citizens.
 *    - Validation: Weighted sum algorithm Modulo 11.
 *      - Weights: 10 to 2 for digits 1-9.
 *      - Logic: Remainder < 2 ? Remainder : 11 - Remainder.
 * 2. Economic Code (12 digits): 
 *    - Issued to legal entities by the INTA.
 * 3. Residency: Based on the 183-day presence rule in a solar year.
 */
