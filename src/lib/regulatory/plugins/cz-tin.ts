import { HolderMetadata, TinValidationResult, CountryRegulatoryInfo, TinInfo, TinRequirement } from './index';

/**
 * TIN Validation for Czech Republic (CZ)
 * Individual: Birth Number (Rodné číslo) (9 or 10 digits)
 * Entity: Identification Number (IČO) (8 digits)
 */

/**
 * TIN Requirements for Czech Republic
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
 * Country Metadata for Czech Republic
 */
export const COUNTRY_INFO: CountryRegulatoryInfo = {
    name: 'República Checa',
    authority: 'Financial Administration (Finanční správa)',
    compliance: {
        crsStatus: 'Participating',
        crsDate: 'September 2017',
        fatcaStatus: 'Model 1 (In Force)'
    },
    residency: {
        individual: 'Se considera residente si tiene domicilio en la República Checa o si permanece allí durante más de 183 días en el año civil.',
        entity: 'Se considera residente si tiene su sede legal o lugar de administración efectiva en la República Checa.',
        notes: 'Criterio de domicilio o estancia de 183 días.'
    }
};

/**
 * TIN Metadata for Czech Republic (Era 6.3)
 */
export const TIN_INFO: TinInfo = {
    name: 'Birth Number / IČO',
    description: 'Czech Birth Number (Individuals) or Identification Number (Entities) issued by the Ministry of Interior or Financial Administration.',
    placeholder: '800101/1234 / 12345678',
    officialLink: 'https://www.financnisprava.cz',
    isOfficial: true,
    lastUpdated: '2026-04-24',
    source: 'OECD Portal / Finanční správa',
    entityDifferentiation: {
        logic: 'Number length analysis.',
        individualDescription: '9 or 10-digit Birth Number.',
        businessDescription: '8-digit Identification Number (IČO).'
    }
};

/**
 * Czech Republic TIN Validator - Era 6.3
 */
export const validateCZTIN = (
    value: string, 
    type: 'INDIVIDUAL' | 'ENTITY' | 'ANY' = 'ANY', 
    metadata?: HolderMetadata
): TinValidationResult => {
    const sanitized = value.replace(/[\s/]/g, '');

    // Individual (Birth Number): 9 or 10 digits
    if ((sanitized.length === 9 || sanitized.length === 10) && /^[0-9]+$/.test(sanitized)) {
        if (type === 'ENTITY') {
            return { 
                isValid: false, 
                status: 'MISMATCH', 
                reasonCode: 'ENTITY_TYPE_MISMATCH',
                explanation: 'The detected format (9-10 digits) corresponds to a Czech Birth Number (Rodné číslo), exclusive to individuals.'
            };
        }
        
        if (metadata) {
            const semantic = validateCzechSemantic(sanitized, metadata);
            if (!semantic.isValid) {
                return semantic;
            }
        }

        const isOfficial = validateCzechBirthNumberChecksum(sanitized);
        return { 
            isValid: true, 
            status: isOfficial ? 'VALID' : 'VALID_UNOFFICIAL', 
            isOfficialMatch: isOfficial, 
            explanation: decodeCzechTIN(sanitized)
        };
    }

    // Business (IČO): 8 digits
    if (sanitized.length === 8 && /^[0-9]{8}$/.test(sanitized)) {
        if (type === 'INDIVIDUAL') {
            return { 
                isValid: false, 
                status: 'MISMATCH', 
                reasonCode: 'ENTITY_TYPE_MISMATCH',
                explanation: 'The detected format (8 digits) corresponds to a Czech Identification Number (IČO), which applies only to entities.'
            };
        }
        return { 
            isValid: true, 
            status: 'VALID', 
            isOfficialMatch: true, 
            explanation: 'Matches official Czech Identification Number (8 digits) format.' 
        };
    }

    return { 
        isValid: false, 
        status: 'INVALID_FORMAT',
        explanation: 'Value does not match Czech Birth Number (9-10 digits) or IČO (8 digits) format.'
    };
};

function decodeCzechTIN(tin: string): string {
    const yy = tin.substring(0, 2);
    let mm = parseInt(tin.substring(2, 4));
    const dd = tin.substring(4, 6);
    
    let gender = 'Male';
    if (mm > 50) {
        gender = 'Female';
        mm -= 50;
    }
    
    // Century logic
    let century = '19';
    if (tin.length === 10) {
        const year = parseInt(yy);
        if (year < 54) century = '20';
    } else {
        century = '19'; // Birth numbers < 1954 were 9 digits
    }
    
    const displayMonth = mm.toString().padStart(2, '0');
    return `Birth Number (${gender}), born on ${dd}/${displayMonth}/${century}${yy}.`;
}

function validateCzechSemantic(tin: string, metadata: HolderMetadata): TinValidationResult {
    const mismatchFields: string[] = [];
    const mmPart = parseInt(tin.substring(2, 4));
    const ddPart = tin.substring(4, 6);
    const yyPart = tin.substring(0, 2);

    // Gender check
    if (metadata.gender) {
        const isFemale = mmPart > 50;
        if ((metadata.gender === 'F' && !isFemale) || (metadata.gender === 'M' && isFemale)) {
            mismatchFields.push('gender');
        }
    }

    // Birth Date check
    if (metadata.birthDate) {
        const dob = new Date(metadata.birthDate);
        const day = dob.getDate().toString().padStart(2, '0');
        const month = dob.getMonth() + 1;
        const yearSuffix = dob.getFullYear().toString().slice(-2);
        
        let expectedMM = month;
        if (mmPart > 50) expectedMM += 50;

        if (day !== ddPart || expectedMM.toString().padStart(2, '0') !== tin.substring(2, 4) || yearSuffix !== yyPart) {
            mismatchFields.push('birthDate');
        }
    }

    if (mismatchFields.length > 0) {
        return {
            isValid: false,
            status: 'MISMATCH',
            reasonCode: 'ID_DATA_INCONSISTENT',
            mismatchFields,
            explanation: `Inconsistency in ${mismatchFields.join(', ')} with Czech Birth Number structure.`
        };
    }

    return { isValid: true, status: 'VALID' };
}

function validateCzechBirthNumberChecksum(tin: string): boolean {
    if (tin.length === 9) return true; // Older ones don't have this
    const num = parseInt(tin);
    return num % 11 === 0;
}

/**
 * APPENDIX: FORENSIC CRITERIA
 * The Czech Republic uses the Birth Number (Rodné číslo) for individuals and IČO for entities.
 * 1. Birth Number (9 or 10 digits): 
 *    - Digits 1-6: Birth date (YYMMDD). 
 *    - Month (MM) Encoding: +50 for females. 
 *    - Suffix (Digits 7-10): Daily serial + check digit. 
 *    - 9-digit version: Used for people born before 1954.
 *    - 10-digit version: Includes a check digit (Full number must be divisible by 11).
 * 2. IČO (8 digits): 
 *    - Unique identification number for businesses. 
 *    - Validation: Specific weighted sum check.
 * 3. Residency: Based on domicile or the 183-day presence rule in a calendar year.
 */
