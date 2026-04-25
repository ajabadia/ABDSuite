import { HolderMetadata, TinValidationResult, CountryRegulatoryInfo, TinInfo, TinRequirement } from './index';

/**
 * TIN Validation for Estonia (EE)
 * Individual: Personal Identification Code (Isikukood) (11 digits)
 * Entity: Commercial Registry Code (8 digits)
 */

/**
 * TIN Requirements for Estonia
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
 * Country Metadata for Estonia
 */
export const COUNTRY_INFO: CountryRegulatoryInfo = {
    name: 'Estonia',
    authority: 'Tax and Customs Board (Maksu- ja Tolliamet)',
    compliance: {
        crsStatus: 'Participating',
        crsDate: 'September 2017',
        fatcaStatus: 'Model 1 (In Force)'
    },
    residency: {
        individual: 'Se considera residente si tiene su residencia principal en Estonia o si permanece allí durante más de 183 días en un periodo de 12 meses.',
        entity: 'Se considera residente si se ha establecido de acuerdo con las leyes de Estonia.',
        notes: 'Criterio de residencia principal o estancia de 183 días.'
    }
};

/**
 * TIN Metadata for Estonia (Era 6.3)
 */
export const TIN_INFO: TinInfo = {
    name: 'Isikukood / Registry Code',
    description: 'Estonian Personal Identification Code (Individuals) or Registry Code (Entities) issued by the Tax and Customs Board.',
    placeholder: '38001011234 / 12345678',
    officialLink: 'https://www.emta.ee',
    isOfficial: true,
    lastUpdated: '2026-04-24',
    source: 'OECD Portal / EMTA',
    entityDifferentiation: {
        logic: 'Number length analysis.',
        individualDescription: '11-digit Personal Identification Code.',
        businessDescription: '8-digit Registry Code.'
    }
};

/**
 * Estonia TIN Validator - Era 6.3
 */
export const validateEETIN = (
    value: string, 
    type: 'INDIVIDUAL' | 'ENTITY' | 'ANY' = 'ANY', 
    metadata?: HolderMetadata
): TinValidationResult => {
    const sanitized = value.replace(/[\s-]/g, '');

    // Individual (Isikukood): 11 digits
    if (sanitized.length === 11 && /^[1-6][0-9]{10}$/.test(sanitized)) {
        if (type === 'ENTITY') {
            return { 
                isValid: false, 
                status: 'MISMATCH', 
                reasonCode: 'ENTITY_TYPE_MISMATCH',
                explanation: 'The detected format (11 digits) corresponds to an Estonian Personal Identification Code (Isikukood).'
            };
        }
        
        if (metadata) {
            const semantic = validateEstoniaSemantic(sanitized, metadata);
            if (!semantic.isValid) {
                return semantic;
            }
        }

        if (validateEstoniaChecksum(sanitized)) {
            return { 
                isValid: true, 
                status: 'VALID', 
                isOfficialMatch: true, 
                explanation: decodeEstoniaTIN(sanitized) 
            };
        } else {
            return { isValid: false, status: 'INVALID_CHECKSUM', explanation: 'Failed Estonian Isikukood checksum validation.' };
        }
    }

    // Business (Registry Code): 8 digits
    if (sanitized.length === 8 && /^[0-9]{8}$/.test(sanitized)) {
        if (type === 'INDIVIDUAL') {
            return { 
                isValid: false, 
                status: 'MISMATCH', 
                reasonCode: 'ENTITY_TYPE_MISMATCH',
                explanation: 'The detected format (8 digits) corresponds to an Estonian Registry Code, which applies to legal entities.'
            };
        }
        return { 
            isValid: true, 
            status: 'VALID', 
            isOfficialMatch: true, 
            explanation: 'Matches official Estonian Registry Code (8 digits). NOTE: For VAT/CRS reporting, the "EE" prefix is mandatory.' 
        };
    }

    return { 
        isValid: false, 
        status: 'INVALID_FORMAT',
        explanation: 'Value does not match Estonian Isikukood (11 digits) or Registry Code (8 digits) format.'
    };
};

function decodeEstoniaTIN(tin: string): string {
    const g = parseInt(tin[0]);
    const yy = tin.substring(1, 3);
    const mm = tin.substring(3, 5);
    const dd = tin.substring(5, 7);
    
    let century = '19';
    let gender = 'Unknown';
    
    if (g === 1) { century = '18'; gender = 'Male'; }
    else if (g === 2) { century = '18'; gender = 'Female'; }
    else if (g === 3) { century = '19'; gender = 'Male'; }
    else if (g === 4) { century = '19'; gender = 'Female'; }
    else if (g === 5) { century = '20'; gender = 'Male'; }
    else if (g === 6) { century = '20'; gender = 'Female'; }
    
    return `Person (${gender}), born on ${dd}/${mm}/${century}${yy}. Verified via checksum.`;
}

function validateEstoniaSemantic(tin: string, metadata: HolderMetadata): TinValidationResult {
    const mismatchFields: string[] = [];
    const gPart = parseInt(tin[0]);
    const yyPart = tin.substring(1, 3);
    const mmPart = tin.substring(3, 5);
    const ddPart = tin.substring(5, 7);

    // Gender check (Odd=Male, Even=Female)
    if (metadata.gender) {
        const isFemale = gPart % 2 === 0;
        if ((metadata.gender === 'F' && !isFemale) || (metadata.gender === 'M' && isFemale)) {
            mismatchFields.push('gender');
        }
    }

    // Birth Date check
    if (metadata.birthDate) {
        const dob = new Date(metadata.birthDate);
        const day = dob.getDate().toString().padStart(2, '0');
        const month = (dob.getMonth() + 1).toString().padStart(2, '0');
        const year = dob.getFullYear();
        const yearSuffix = year.toString().slice(-2);
        
        let expectedG = 0;
        if (year >= 2000) expectedG = metadata.gender === 'F' ? 6 : 5;
        else if (year >= 1900) expectedG = metadata.gender === 'F' ? 4 : 3;
        else if (year >= 1800) expectedG = metadata.gender === 'F' ? 2 : 1;

        if (day !== ddPart || month !== mmPart || yearSuffix !== yyPart) {
            mismatchFields.push('birthDate');
        }
        if (expectedG !== 0 && expectedG !== gPart) {
             mismatchFields.push('gender'); // Century mismatch also affects G
        }
    }

    if (mismatchFields.length > 0) {
        return {
            isValid: false,
            status: 'MISMATCH',
            reasonCode: 'ID_DATA_INCONSISTENT',
            mismatchFields,
            explanation: `Inconsistency in ${mismatchFields.join(', ')} with Estonian Isikukood structure.`
        };
    }

    return { isValid: true, status: 'VALID' };
}

function validateEstoniaChecksum(tin: string): boolean {
    const w1 = [1, 2, 3, 4, 5, 6, 7, 8, 9, 1];
    const w2 = [3, 4, 5, 6, 7, 8, 9, 1, 2, 3];
    
    let sum = 0;
    for (let i = 0; i < 10; i++) sum += parseInt(tin[i]) * w1[i];
    let check = sum % 11;
    
    if (check === 10) {
        sum = 0;
        for (let i = 0; i < 10; i++) sum += parseInt(tin[i]) * w2[i];
        check = sum % 11;
        if (check === 10) check = 0;
    }
    
    return check === parseInt(tin[10]);
}

/**
 * APPENDIX: FORENSIC CRITERIA
 * Estonia uses a highly structured 11-digit Personal Identification Code (IK).
 * 1. Structure (IK): GYYMMDDSSSC.
 *    - G (Gender/Century): 1-2 (1800s), 3-4 (1900s), 5-6 (2000s). Odd = Male, Even = Female.
 *    - YYMMDD: Birth date.
 *    - SSS: Sequential number (registration order/region). 
 *    - C: Check digit (Double-pass Modulo 11).
 * 2. Checksum Logic: 
 *    - Pass 1: Weights 1,2,3,4,5,6,7,8,9,1.
 *    - Pass 2 (if remainder is 10): Weights 3,4,5,6,7,8,9,1,2,3.
 *    - If remainder still 10: Check digit is 0.
 * 3. Residency: Based on domicile or the 183-day presence rule.
 */
