import { HolderMetadata, TinValidationResult, CountryRegulatoryInfo, TinInfo, TinRequirement } from './index';

/**
 * TIN Validation for South Africa (ZA)
 * Tax Reference Number (10 digits)
 */

/**
 * TIN Requirements for South Africa
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
    { key: 'birthDate', label: 'birthDate', type: 'date', scope: 'INDIVIDUAL' },
    { key: 'gender', label: 'gender', type: 'select', scope: 'INDIVIDUAL', options: [
        { value: 'M', label: 'male' },
        { value: 'F', label: 'female' }
    ]}
];

/**
 * Country Metadata for South Africa
 */
export const COUNTRY_INFO: CountryRegulatoryInfo = {
    name: 'Sudáfrica',
    authority: 'South African Revenue Service (SARS)',
    compliance: {
        crsStatus: 'Participating',
        crsDate: 'September 2017',
        fatcaStatus: 'Model 1 (In Force)'
    },
    residency: {
        individual: 'Se considera residente si tiene su residencia habitual en Sudáfrica o si permanece físicamente en el país durante periodos específicos (prueba de presencia física).',
        entity: 'Se considera residente si está incorporada, establecida o formada en Sudáfrica, o si tiene su sede de dirección efectiva en Sudáfrica.',
        notes: 'Criterio de residencia habitual o sede de dirección efectiva.'
    }
};

/**
 * TIN Metadata for South Africa (Era 6.3)
 */
export const TIN_INFO: TinInfo = {
    name: 'Tax Reference / ID / Reg. No',
    description: 'South African Tax Reference (10 digits), ID Number (13 digits) or CIPC Reg. No (Entities).',
    placeholder: '1234567890 / 8001015000081 / 2024/123456/07',
    officialLink: 'https://www.sars.gov.za',
    isOfficial: true,
    lastUpdated: '2026-04-24',
    source: 'OECD Portal / SARS / CIPC',
    entityDifferentiation: {
        logic: 'Length and structure analysis.',
        individualDescription: '13-digit ID Number or 10-digit Tax Reference.',
        businessDescription: '10-digit Tax Reference or CIPC Registration Number (YYYY/NNNNNN/NN).'
    }
};

/**
 * South Africa TIN Validator - Era 6.3
 */
export const validateZATIN = (
    value: string, 
    type: 'INDIVIDUAL' | 'ENTITY' | 'ANY' = 'ANY', 
    metadata?: HolderMetadata
): TinValidationResult => {
    const sanitized = value.trim().replace(/[\s-]/g, '');

    // 1. CIPC Registration Number (Entities): YYYY/NNNNNN/NN
    if (/^[0-9]{4}\/[0-9]{6}\/[0-9]{2}$/.test(value) || (/^[0-9]{12}$/.test(sanitized) && sanitized.length === 12)) {
        if (type === 'INDIVIDUAL') {
             return { 
                 isValid: false, 
                 status: 'MISMATCH', 
                 reasonCode: 'ENTITY_TYPE_MISMATCH',
                 explanation: 'The detected format corresponds to a South African CIPC registration number, which applies only to entities.'
             };
        }
        return { 
            isValid: true, 
            status: 'VALID', 
            isOfficialMatch: true, 
            explanation: type === 'ANY'
                ? 'Format valid for Entities (CIPC Registration). Note: This identifier is not valid for Individuals.'
                : decodeSouthAfricaEntity(value.includes('/') ? value : sanitized)
        };
    }

    // 2. Tax Reference Number: 10 digits
    if (sanitized.length === 10 && /^[0-9]{10}$/.test(sanitized)) {
        const isOfficial = validateSARSChecksum(sanitized);
        return { 
            isValid: true, 
            status: isOfficial ? 'VALID' : 'VALID_UNOFFICIAL', 
            isOfficialMatch: isOfficial, 
            explanation: type === 'ANY'
                ? 'Format matches South African Tax Reference (10 digits). Valid for both Individuals and Entities.'
                : `Matches official South African 10-digit Tax Reference Number format. ${isOfficial ? 'Verified via Modulo 10.' : 'Pattern match.'}` 
        };
    }

    // 3. ID Number: 13 digits
    if (sanitized.length === 13 && /^[0-9]{13}$/.test(sanitized)) {
        if (type === 'ENTITY') {
             return { 
                 isValid: false, 
                 status: 'MISMATCH', 
                 reasonCode: 'ENTITY_TYPE_MISMATCH',
                 explanation: 'The detected format (13 digits) corresponds to a South African ID number, which is exclusive to individuals.'
             };
        }
        
        const isOfficial = validateLuhn(sanitized);
        if (isOfficial) {
            // Semantic Check for South African ID
            if (metadata) {
                const mismatchFields: string[] = [];
                
                // Birth Date Check (YYMMDD)
                if (metadata.birthDate) {
                    const dob = new Date(metadata.birthDate);
                    const expectedYYMMDD = dob.getFullYear().toString().slice(-2) + 
                                          (dob.getMonth() + 1).toString().padStart(2, '0') + 
                                          dob.getDate().toString().padStart(2, '0');
                    if (expectedYYMMDD !== sanitized.substring(0, 6)) mismatchFields.push('birthDate');
                }

                // Gender Check (0000-4999 = Female, 5000-9999 = Male)
                if (metadata.gender) {
                    const genderPart = parseInt(sanitized.substring(6, 10));
                    const isMale = genderPart >= 5000;
                    if ((metadata.gender === 'M' && !isMale) || (metadata.gender === 'F' && isMale)) {
                        mismatchFields.push('gender');
                    }
                }

                if (mismatchFields.length > 0) {
                    return {
                        isValid: false,
                        status: 'MISMATCH',
                        reasonCode: 'ID_DATA_INCONSISTENT',
                        mismatchFields,
                        explanation: `Inconsistency in ${mismatchFields.join(', ')} with South African ID structure.`
                    };
                }
            }

            return { 
                isValid: true, 
                status: 'VALID', 
                isOfficialMatch: true, 
                explanation: type === 'ANY'
                    ? 'Format valid for Individuals (SA ID). Note: This identifier is not valid for legal Entities.'
                    : decodeSouthAfricaID(sanitized)
            };
        } else {
            return { isValid: false, status: 'INVALID_CHECKSUM', explanation: 'Failed South African ID Number checksum validation.' };
        }
    }

    return { 
        isValid: false, 
        status: 'INVALID_FORMAT',
        explanation: 'Value does not match South African ID (13), Tax Ref (10) or CIPC format.'
    };
};

function decodeSouthAfricaID(tin: string): string {
    const dobPart = tin.substring(0, 6);
    const genderPart = parseInt(tin.substring(6, 10));
    const citizenshipPart = parseInt(tin[10]);
    
    const gender = genderPart < 5000 ? 'Female' : 'Male';
    const citizenship = citizenshipPart === 0 ? 'SA Citizen' : 'Permanent Resident';
    
    return `ID: ${citizenship} (${gender}), born on YYMMDD: ${dobPart}. Verified via Luhn.`;
}

function decodeSouthAfricaEntity(value: string): string {
    const parts = value.includes('/') ? value.split('/') : [value.substring(0, 4), value.substring(4, 10), value.substring(10, 12)];
    const year = parts[0];
    const typeCode = parts[2];
    
    const typeMap: Record<string, string> = {
        '06': 'Public Company (Ltd)',
        '07': 'Private Company (Pty Ltd)',
        '08': 'Non-Profit Company (NPC)',
        '09': 'Statutory Body',
        '10': 'External Company (Foreign)',
        '11': 'External NPC',
        '21': 'Incorporated (Inc)',
        '23': 'Close Corporation (CC)'
    };
    
    const type = typeMap[typeCode] || `Entity Type ${typeCode}`;
    return `CIPC Registration: ${type}, incorporated in ${year}.`;
}

function validateLuhn(value: string): boolean {
    let sum = 0;
    let shouldDouble = false;
    for (let i = value.length - 1; i >= 0; i--) {
        let digit = parseInt(value.charAt(i));
        if (shouldDouble) {
            if ((digit *= 2) > 9) digit -= 9;
        }
        sum += digit;
        shouldDouble = !shouldDouble;
    }
    return (sum % 10) === 0;
}

function validateSARSChecksum(tin: string): boolean {
    // SARS Tax Reference Number (10 digits) uses a weighted sum Modulo 10
    // Starting digit is often 0, 1, 2, 3, or 9
    const weights = [1, 2, 1, 2, 1, 2, 1, 2, 1];
    let sum = 0;
    for (let i = 0; i < 9; i++) {
        let n = parseInt(tin[i]) * weights[i];
        sum += Math.floor(n / 10) + (n % 10);
    }
    const checkDigit = (10 - (sum % 10)) % 10;
    return checkDigit === parseInt(tin[9]);
}

/**
 * APPENDIX: FORENSIC CRITERIA
 * South Africa uses a multi-layered identification system.
 * 1. ID Number (Individuals): 13 digits. 
 *    - Structure: YYMMDD (Birth) + SSSS (Gender) + C (Citizenship) + A (Status) + Z (Checksum).
 *    - Validation: Luhn algorithm.
 * 2. Tax Reference Number: 10 digits numeric, issued by SARS.
 *    - Validation: Weighted sum algorithm Modulo 10.
 * 3. CIPC Number: For corporate entities (YYYY/NNNNNN/NN).
 *    - Decodes incorporation year and legal type.
 * 4. Residency: Based on 'Physical Presence Test' (91/915 days) or citizenship.
 * 5. Scope: Managed by SARS and CIPC.
 */
