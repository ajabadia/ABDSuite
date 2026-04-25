import { HolderMetadata, TinValidationResult, CountryRegulatoryInfo, TinInfo, TinRequirement } from './index';

/**
 * TIN Validation for Poland (PL)
 * PESEL (11 digits)
 * NIP (10 digits)
 */

/**
 * TIN Requirements for Poland
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
 * Country Metadata for Poland
 */
export const COUNTRY_INFO: CountryRegulatoryInfo = {
    name: 'Polonia',
    authority: 'Ministry of Finance',
    compliance: {
        crsStatus: 'Participating',
        crsDate: 'September 2017',
        fatcaStatus: 'Model 1 (In Force)'
    },
    residency: {
        individual: 'Se considera residente si tiene el centro de sus intereses personales o económicos en Polonia o si permanece más de 183 días en el año fiscal.',
        entity: 'Se considera residente si tiene su sede legal o su administración central en Polonia.',
        notes: 'Criterio de centro de intereses o permanencia de 183 días.'
    }
};

/**
 * TIN Metadata for Poland (Era 6.3)
 */
export const TIN_INFO: TinInfo = {
    name: 'PESEL / NIP',
    description: 'Polish PESEL (Individuals) or NIP (Tax Identification Number) issued by the Ministry of Finance.',
    placeholder: '12345678901 / 1234567890',
    officialLink: 'https://www.gov.pl/web/finanse',
    isOfficial: true,
    lastUpdated: '2026-04-24',
    source: 'OECD Portal / Ministry of Finance',
    entityDifferentiation: {
        logic: 'Length and usage analysis.',
        individualDescription: 'PESEL of 11 digits for individuals.',
        businessDescription: 'NIP of 10 digits for businesses and self-employed.'
    }
};

/**
 * Poland TIN Validator - Era 6.3
 */
export const validatePLTIN = (
    value: string, 
    type: 'INDIVIDUAL' | 'ENTITY' | 'ANY' = 'ANY', 
    metadata?: HolderMetadata
): TinValidationResult => {
    const sanitized = value.replace(/[\s-]/g, '');

    // Individual (PESEL): 11 digits
    if (sanitized.length === 11 && /^[0-9]{11}$/.test(sanitized)) {
        if (type === 'ENTITY') {
            return { 
                isValid: false, 
                status: 'MISMATCH', 
                reasonCode: 'ENTITY_TYPE_MISMATCH',
                explanation: 'The detected format (11 digits) corresponds to a Polish PESEL, which is exclusive to individuals.'
            };
        }
        
        if (metadata) {
            const semantic = validatePolandSemantic(sanitized, metadata);
            if (!semantic.isValid) {
                return semantic;
            }
        }

        if (validatePESELChecksum(sanitized)) {
            const explanation = decodePolandTIN(sanitized);
            return { 
                isValid: true, 
                status: 'VALID', 
                isOfficialMatch: true, 
                explanation: type === 'ANY'
                    ? 'Format valid for Individuals (PESEL). Note: This identifier is not valid for legal Entities.'
                    : explanation 
            };
        } else {
            return { isValid: false, status: 'INVALID_CHECKSUM', explanation: 'Failed Polish PESEL checksum validation.' };
        }
    }

    // NIP: 10 digits
    if (sanitized.length === 10 && /^[0-9]{10}$/.test(sanitized)) {
        if (type === 'INDIVIDUAL') {
            return { 
                isValid: false, 
                status: 'MISMATCH', 
                reasonCode: 'ENTITY_TYPE_MISMATCH',
                explanation: 'The detected format (10 digits) corresponds to a Polish NIP, which is primarily used for legal entities and business activities.'
            };
        }
        if (validateNIPChecksum(sanitized)) {
            return { 
                isValid: true, 
                status: 'VALID', 
                isOfficialMatch: true, 
                explanation: type === 'ANY'
                    ? 'Format valid for Entities and self-employed Individuals (NIP). Please verify holder type.'
                    : 'Matches official Polish NIP (10 digits) format and checksum.' 
            };
        } else {
            return { isValid: false, status: 'INVALID_CHECKSUM', explanation: 'Failed Polish NIP checksum validation.' };
        }
    }

    return { 
        isValid: false, 
        status: 'INVALID_FORMAT',
        explanation: 'Value does not match Polish PESEL (11 digits) or NIP (10 digits) format.'
    };
};

function decodePolandTIN(tin: string): string {
    const yy = tin.substring(0, 2);
    let mm = parseInt(tin.substring(2, 4));
    const dd = tin.substring(4, 6);
    const genderDigit = parseInt(tin[9]);
    
    let century = '19';
    if (mm > 80) { century = '18'; mm -= 80; }
    else if (mm > 60) { century = '22'; mm -= 60; }
    else if (mm > 40) { century = '21'; mm -= 40; }
    else if (mm > 20) { century = '20'; mm -= 20; }
    
    const gender = genderDigit % 2 === 0 ? 'Female' : 'Male';
    return `PESEL: ${gender}, born on ${dd}/${mm}/${century}${yy}. Verified via structure.`;
}

function validatePolandSemantic(tin: string, metadata: HolderMetadata): TinValidationResult {
    const mismatchFields: string[] = [];
    const yyPart = tin.substring(0, 2);
    const mmPart = parseInt(tin.substring(2, 4));
    const ddPart = tin.substring(4, 6);
    const genderDigit = parseInt(tin[9]);

    // Gender check (Even=Female, Odd=Male)
    if (metadata.gender) {
        const isFemale = genderDigit % 2 === 0;
        if ((metadata.gender === 'F' && !isFemale) || (metadata.gender === 'M' && isFemale)) {
            mismatchFields.push('gender');
        }
    }

    // Birth Date check
    if (metadata.birthDate) {
        const dob = new Date(metadata.birthDate);
        const day = dob.getDate().toString().padStart(2, '0');
        const month = dob.getMonth() + 1;
        const year = dob.getFullYear();
        const yearSuffix = year.toString().slice(-2);
        
        let expectedMM = month;
        if (year >= 2200) expectedMM += 60;
        else if (year >= 2100) expectedMM += 40;
        else if (year >= 2000) expectedMM += 20;
        else if (year < 1900) expectedMM += 80;

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
            explanation: `Inconsistency in ${mismatchFields.join(', ')} with Polish PESEL structure.`
        };
    }

    return { isValid: true, status: 'VALID' };
}

function validatePESELChecksum(tin: string): boolean {
    const weights = [1, 3, 7, 9, 1, 3, 7, 9, 1, 3];
    let sum = 0;
    for (let i = 0; i < 10; i++) {
        sum += parseInt(tin[i]) * weights[i];
    }
    const check = (10 - (sum % 10)) % 10;
    return check === parseInt(tin[10]);
}

function validateNIPChecksum(tin: string): boolean {
    const weights = [6, 5, 7, 2, 3, 4, 5, 6, 7];
    let sum = 0;
    for (let i = 0; i < 9; i++) {
        sum += parseInt(tin[i]) * weights[i];
    }
    return (sum % 11) === parseInt(tin[9]);
}

/**
 * APPENDIX: FORENSIC CRITERIA
 * Poland uses the PESEL (individuals) and NIP (tax identification) systems.
 * 1. PESEL (11 digits): 
 *    - YYMMDD + Century encoding in Month (e.g., +20 for 21st century).
 *    - Gender: 10th digit (even=Female, odd=Male).
 *    - Checksum: Weighted sum Modulo 10.
 * 2. NIP (10 digits): Used for tax purposes by businesses and self-employed. 
 *    Validated via a 9-digit weighted sum Modulo 11.
 * 3. Residency: Based on the center of personal/economic interests (vital interests) 
 *    or staying more than 183 days.
 */
