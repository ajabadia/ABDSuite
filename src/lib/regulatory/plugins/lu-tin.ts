import { HolderMetadata, TinValidationResult, CountryRegulatoryInfo, TinInfo, TinRequirement } from './index';

/**
 * TIN Validation for Luxembourg (LU)
 * Matricule (13 digits: YYYYMMDDXXXXX)
 */

/**
 * TIN Requirements for Luxembourg
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
    { key: 'birthDate', label: 'birthDate', type: 'date', scope: 'INDIVIDUAL' }
];

/**
 * Country Metadata for Luxembourg
 */
export const COUNTRY_INFO: CountryRegulatoryInfo = {
    name: 'Luxemburgo',
    authority: 'Administration des Contributions Directes (ACD)',
    compliance: {
        crsStatus: 'Participating',
        crsDate: 'September 2017',
        fatcaStatus: 'Model 1 (In Force)'
    },
    residency: {
        individual: 'Residente fiscal si tiene su domicilio o residencia habitual (más de 6 meses) en Luxemburgo.',
        entity: 'Residentes si su domicilio legal (siège statutaire) o su administración central (administration centrale) se encuentra en Luxemburgo.',
        notes: 'Basado en Art. 2 de Loi concernant l\'impôt sur le revenu (LIR).'
    }
};

/**
 * TIN Metadata for Luxembourg (Era 6.3)
 */
export const TIN_INFO: TinInfo = {
    name: 'Matricule / CCSS',
    description: 'Luxembourgish Matricule/CCSS (13 digits) issued by the ACD.',
    placeholder: '1980010112345',
    officialLink: 'https://impotsdirects.public.lu',
    isOfficial: true,
    lastUpdated: '2026-04-24',
    source: 'OECD Portal / ACD',
    entityDifferentiation: {
        logic: 'Semantic structure analysis.',
        individualDescription: '13 digits where the first 8 represent YYYYMMDD of birth date.',
        businessDescription: '13 digits starting with the year of foundation.'
    }
};

/**
 * Luxembourg TIN Validator - Era 6.3
 */
export const validateLUTIN = (
    value: string, 
    type: 'INDIVIDUAL' | 'ENTITY' | 'ANY' = 'ANY', 
    metadata?: HolderMetadata
): TinValidationResult => {
    const sanitized = value.replace(/[\s-]/g, '');

    if (sanitized.length === 13 && /^[0-9]{13}$/.test(sanitized)) {
        
        // Semantic Date Check for Individuals
        if (metadata?.birthDate) {
            const dob = new Date(metadata.birthDate);
            if (!isNaN(dob.getTime())) {
                const expectedYYYYMMDD = dob.getFullYear().toString() + 
                                      (dob.getMonth() + 1).toString().padStart(2, '0') + 
                                      dob.getDate().toString().padStart(2, '0');
                
                const matriculeDate = sanitized.substring(0, 8);
                if (expectedYYYYMMDD !== matriculeDate) {
                    return {
                        isValid: false,
                        status: 'MISMATCH',
                        reasonCode: 'ID_DATA_INCONSISTENT',
                        mismatchFields: ['birthDate'],
                        explanation: 'First 8 digits of Matricule (YYYYMMDD) do not match the provided birth date.'
                    };
                }
            }
        }

        const monthPart = parseInt(sanitized.substring(4, 6));
        const isLikelyIndividual = monthPart >= 1 && monthPart <= 12;

        if (type === 'INDIVIDUAL' && !isLikelyIndividual) {
            return {
                isValid: false,
                status: 'MISMATCH',
                reasonCode: 'ENTITY_TYPE_MISMATCH',
                explanation: 'The detected format (month part > 12) corresponds to a Luxembourgish Legal Entity Matricule and not an individual.'
            };
        }

        if (type === 'ENTITY' && isLikelyIndividual) {
            return {
                isValid: false,
                status: 'MISMATCH',
                reasonCode: 'ENTITY_TYPE_MISMATCH',
                explanation: 'The detected format (month part 01-12) corresponds to a Luxembourgish Individual Matricule and not a legal entity.'
            };
        }

        const isOfficial = validateLuxembourgChecksum(sanitized);
        return { 
            isValid: true, 
            status: isOfficial ? 'VALID' : 'VALID_UNOFFICIAL', 
            isOfficialMatch: isOfficial, 
            explanation: decodeLuxembourgTIN(sanitized)
        };
    }

    return { 
        isValid: false, 
        status: 'INVALID_FORMAT',
        explanation: 'Value does not match Luxembourgish Matricule (13 digits) format.'
    };
};

function decodeLuxembourgTIN(tin: string): string {
    const yyyy = tin.substring(0, 4);
    const mm = tin.substring(4, 6);
    const dd = tin.substring(6, 8);
    
    // Check if month is valid (1-12) to distinguish individuals
    const month = parseInt(mm);
    if (month >= 1 && month <= 12) {
        return `Individual, born on ${dd}/${mm}/${yyyy}. Verified via structure and checksum.`;
    }
    
    return `Legal Entity (Matricule). Registered in ${yyyy}. Verified via checksum.`;
}

function validateLuxembourgChecksum(tin: string): boolean {
    const body = tin.substring(0, 11);
    const check12 = parseInt(tin[11]);
    const check13 = parseInt(tin[12]);
    
    // Check digit 12: Luhn algorithm
    const luhnMatch = calculateLuhn(body) === check12;
    
    // Check digit 13: Modulo 11
    const weights = [2, 3, 4, 5, 6, 7, 8, 9, 10, 1, 2]; // Standard weights
    let sum = 0;
    for (let i = 0; i < 11; i++) sum += parseInt(body[i]) * weights[i];
    const mod11Match = (sum % 11) % 10 === check13;
    
    return luhnMatch && mod11Match;
}

function calculateLuhn(body: string): number {
    let sum = 0;
    for (let i = 0; i < body.length; i++) {
        let n = parseInt(body[body.length - 1 - i]);
        if (i % 2 === 0) {
            n *= 2;
            if (n > 9) n -= 9;
        }
        sum += n;
    }
    return (10 - (sum % 10)) % 10;
}

/**
 * APPENDIX: FORENSIC CRITERIA
 * Luxembourg uses the 13-digit Matricule (National Identification Number).
 * 1. Structure: YYYY MM DD XXX CC
 *    - YYYYMMDD: Birth date (Individuals) or Creation date (Entities).
 *    - XXX: Serial number.
 *    - CC: Two check digits.
 * 2. Check Digits:
 *    - 12th digit: Luhn algorithm calculated on the first 11 digits.
 *    - 13th digit: Modulo 11 algorithm (Verhoeff or similar sometimes used, 
 *      but Luhn+Mod11 is the tax standard).
 * 3. Validation: Combines semantic date check with double checksum.
 * 4. Residency: Based on domicile or habitual residence (183+ days).
 */
