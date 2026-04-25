
import { HolderMetadata, TinValidationResult, CountryRegulatoryInfo, TinInfo, TinRequirement } from './index';

/**
 * TIN Validation for Bulgaria (BG)
 * Individual: Uniform Civil Number (EGN) (10 digits)
 * Entity: Unified Identification Code (EIK/UIC) (9 digits)
 */

/**
 * TIN Requirements for Bulgaria
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
 * Country Metadata for Bulgaria
 */
export const COUNTRY_INFO: CountryRegulatoryInfo = {
    name: 'Bulgaria',
    authority: 'National Revenue Agency (NRA)',
    compliance: {
        crsStatus: 'Participating',
        crsDate: 'September 2017',
        fatcaStatus: 'Model 1 (In Force)'
    },
    residency: {
        individual: 'Se considera residente si tiene su residencia principal en Bulgaria o si permanece allí durante más de 183 días en el año civil.',
        entity: 'Se considera residente si se ha incorporado bajo las leyes de Bulgaria.',
        notes: 'Criterio de residencia principal o estancia de 183 días.'
    }
};

/**
 * TIN Metadata for Bulgaria (Era 6.3)
 */
export const TIN_INFO: TinInfo = {
    name: 'EGN / EIK',
    description: 'Bulgarian EGN (Individuals) or EIK/UIC (Entities) issued by the NRA or Registry Agency.',
    placeholder: '8001011234 / 123456789',
    officialLink: 'https://www.nap.bg',
    isOfficial: true,
    lastUpdated: '2026-04-24',
    source: 'OECD Portal / NAP',
    entityDifferentiation: {
        logic: 'Number length analysis.',
        individualDescription: '10-digit Uniform Civil Number (EGN).',
        businessDescription: '9-digit Unified Identification Code (EIK).'
    }
};

/**
 * Bulgaria TIN Validator - Era 6.3
 */
export const validateBGTIN = (
    value: string, 
    type: 'INDIVIDUAL' | 'ENTITY' | 'ANY' = 'ANY', 
    metadata?: HolderMetadata
): TinValidationResult => {
    const sanitized = value.replace(/[\s-]/g, '');

    // Individual (EGN/PNF): 10 digits
    if (sanitized.length === 10 && /^[0-9]{10}$/.test(sanitized)) {
        if (type === 'ENTITY') {
            return { 
                isValid: false, 
                status: 'MISMATCH', 
                reasonCode: 'ENTITY_TYPE_MISMATCH',
                explanation: 'The detected format (10 digits) corresponds to a Bulgarian EGN, which is exclusive to individuals.'
            };
        }
        
        if (metadata) {
            const semantic = validateBulgariaSemantic(sanitized, metadata);
            if (!semantic.isValid) {
                return semantic;
            }
        }

        return { 
            isValid: true, 
            status: 'VALID', 
            isOfficialMatch: true, 
            explanation: type === 'ANY'
                ? 'Format valid for Individuals (EGN). Note: This identifier is not valid for legal Entities.'
                : decodeBulgariaTIN(sanitized)
        };
    }

    // Business (EIK/UIC): 9 digits
    if (sanitized.length === 9 && /^[0-9]{9}$/.test(sanitized)) {
        if (type === 'INDIVIDUAL') {
            return { 
                isValid: false, 
                status: 'MISMATCH', 
                reasonCode: 'ENTITY_TYPE_MISMATCH',
                explanation: 'The detected format (9 digits) corresponds to a Bulgarian EIK, which applies only to entities.'
            };
        }
        return { 
            isValid: true, 
            status: 'VALID', 
            isOfficialMatch: true, 
            explanation: type === 'ANY'
                ? 'Format valid for Entities (EIK). Note: This format is invalid if the holder is an Individual.'
                : 'Matches official Bulgarian EIK/UIC (9 digits) format.' 
        };
    }

    return { 
        isValid: false, 
        status: 'INVALID_FORMAT',
        explanation: 'Value does not match Bulgarian EGN (10 digits) or EIK (9 digits) format.'
    };
};

function decodeBulgariaTIN(tin: string): string {
    const yy = tin.substring(0, 2);
    let mm = parseInt(tin.substring(2, 4));
    const dd = tin.substring(4, 6);
    
    let yearPrefix = '19';
    if (mm > 40) {
        yearPrefix = '20';
        mm -= 40;
    } else if (mm > 20) {
        yearPrefix = '18';
        mm -= 20;
    }
    
    const month = mm.toString().padStart(2, '0');
    const gender = parseInt(tin[8]) % 2 === 0 ? 'Male' : 'Female';
    
    return `EGN: Individual (${gender}), born on ${dd}/${month}/${yearPrefix}${yy}. Verified via structure.`;
}

function validateBulgariaSemantic(tin: string, metadata: HolderMetadata): TinValidationResult {
    const mismatchFields: string[] = [];

    // Gender check (Digit 9: Even=Male, Odd=Female)
    if (metadata.gender) {
        const isMale = parseInt(tin[8]) % 2 === 0;
        if ((metadata.gender === 'M' && !isMale) || (metadata.gender === 'F' && isMale)) {
            mismatchFields.push('gender');
        }
    }

    // Birth Date check
    if (metadata.birthDate) {
        const dob = new Date(metadata.birthDate);
        const day = dob.getDate().toString().padStart(2, '0');
        let month = dob.getMonth() + 1;
        const year = dob.getFullYear();
        const yearSuffix = year.toString().slice(-2);
        
        let expectedMM = month;
        if (year >= 2000) expectedMM += 40;
        else if (year < 1900) expectedMM += 20;

        if (day !== tin.substring(4, 6) || expectedMM.toString().padStart(2, '0') !== tin.substring(2, 4) || yearSuffix !== tin.substring(0, 2)) {
            mismatchFields.push('birthDate');
        }
    }

    if (mismatchFields.length > 0) {
        return {
            isValid: false,
            status: 'MISMATCH',
            reasonCode: 'ID_DATA_INCONSISTENT',
            mismatchFields,
            explanation: `Inconsistency in ${mismatchFields.join(', ')} with Bulgarian EGN structure.`
        };
    }

    return { isValid: true, status: 'VALID' };
}

/**
 * APPENDIX: FORENSIC CRITERIA
 * Bulgaria uses the EGN (Uniform Civil Number) for citizens and EIK (Unified Identification Code) for businesses.
 * 1. EGN (10 digits): 
 *    - Digits 1-6: Birth date (YYMMDD). 
 *    - Century Encoding: Month (MM) is offset: +20 for years 1800-1899, +40 for years 2000-2099.
 *    - Digit 9: Gender (Even = Male, Odd = Female).
 *    - Digit 10: Checksum (Weighted sum Modulo 11).
 * 2. EIK/BULSTAT (9 digits): 
 *    - 9-digit numeric code for legal entities.
 *    - Validation: Weighted sum check (sum of i*EIK[i]).
 * 3. Residency: Based on the 183-day calendar year rule.
 */

