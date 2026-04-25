import { HolderMetadata, TinValidationResult, TinInfo, CountryRegulatoryInfo, TinRequirement } from './index';

/**
 * TIN Validation for Vietnam (VN)
 * TIN (10, 12, or 13 digits)
 */

/**
 * TIN Requirements for Vietnam
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
 * Country Metadata for Vietnam
 */
export const COUNTRY_INFO: CountryRegulatoryInfo = {
    name: 'Vietnam',
    authority: 'General Department of Taxation (GDT)',
    compliance: {
        crsStatus: 'Participating',
        crsDate: 'September 2024',
        fatcaStatus: 'Model 1 (In Force)'
    },
    residency: {
        individual: 'Se considera residente si permanece 183 días o más en 12 meses consecutivos o tiene residencia regular.',
        entity: 'Se considera residente si se ha incorporado bajo las leyes de Vietnam.',
        notes: 'Criterio de permanencia física de 183 días.'
    }
};

/**
 * TIN Metadata for Vietnam (Era 6.3)
 */
export const TIN_INFO: TinInfo = {
    name: 'Tax Identification Number',
    description: 'Unique identifier issued by the General Department of Taxation.',
    placeholder: '1234567890 / 1234567890123',
    officialLink: 'https://tongcuthue.gov.vn/',
    isOfficial: true,
    lastUpdated: '2026-04-24',
    source: 'OECD Portal / General Department of Taxation of Vietnam',
    entityDifferentiation: {
        logic: 'Length analysis. 10 digits (Main) vs 13 digits (Dependent Units). 12 digits (CCCD).',
        individualDescription: '10-digit TIN or 12-digit CCCD.',
        businessDescription: '10-digit TIN (Head) or 13-digit TIN (Branch).'
    }
};

/**
 * Vietnam TIN Validator (10, 12 or 13 digits) - Era 6.3
 */
export const validateVNTIN = (
    value: string, 
    type: 'INDIVIDUAL' | 'ENTITY' | 'ANY' = 'ANY', 
    metadata?: HolderMetadata
): TinValidationResult => {
    const cleanValue = value.trim().replace(/[\s-]/g, '');
    
    // 1. Standard TIN (10 digits)
    if (/^\d{10}$/.test(cleanValue)) {
        const isOfficial = validateVietnamTINChecksum(cleanValue);
        return {
            isValid: true,
            status: isOfficial ? 'VALID' : 'VALID_UNOFFICIAL',
            isOfficialMatch: isOfficial,
            explanation: type === 'ANY'
                ? 'Valid format for both Individuals and Entities (10-digit TIN). Please verify holder type.'
                : `Matches official 10-digit Vietnam TIN format. ${isOfficial ? 'Verified via Modulo 11.' : 'Pattern match.'}`
        };
    }

    // 2. Personal ID (CCCD) (12 digits)
    if (/^\d{12}$/.test(cleanValue)) {
        if (type === 'ENTITY') {
             return { 
                 isValid: false, 
                 status: 'MISMATCH', 
                 reasonCode: 'ENTITY_TYPE_MISMATCH',
                 explanation: 'The detected format (12 digits) corresponds to a Vietnamese CCCD, which is exclusive to individuals.'
             };
        }
        if (metadata) {
            const semantic = validateVietnamSemantic(cleanValue, metadata);
            if (!semantic.isValid) {
                return semantic;
            }
        }
        return {
            isValid: true,
            status: 'VALID',
            isOfficialMatch: true,
            explanation: type === 'ANY'
                ? 'Valid format for Individuals (CCCD). Note: This identifier is not valid for legal Entities.'
                : decodeVietnamCCCD(cleanValue)
        };
    }

    // 3. Branch/Dependent TIN (13 digits)
    if (/^\d{13}$/.test(cleanValue)) {
        const headTIN = cleanValue.substring(0, 10);
        const isOfficialHead = validateVietnamTINChecksum(headTIN);
        const branchPart = cleanValue.substring(10, 13);
        const branchType = branchPart === '000' ? 'Main Office' : `Branch #${branchPart}`;
        return {
            isValid: true,
            status: isOfficialHead ? 'VALID' : 'VALID_UNOFFICIAL',
            isOfficialMatch: isOfficialHead,
            explanation: type === 'ANY'
                ? `Valid format for Entities (Branch TIN: ${branchType}). Not valid for Individuals.`
                : `Matches official 13-digit Vietnam branch TIN format (${branchType}). ${isOfficialHead ? 'Head office TIN verified.' : 'Pattern match.'}`
        };
    }

    return {
        isValid: false,
        status: 'INVALID_FORMAT',
        explanation: 'Vietnam TINs are numeric codes of 10, 12 (CCCD) or 13 digits.'
    };
};

function decodeVietnamCCCD(tin: string): string {
    const provinceCode = tin.substring(0, 3);
    const sDigit = parseInt(tin[3]);
    const yy = tin.substring(4, 6);
    
    // 0: Male (1900), 1: Female (1900)
    // 2: Male (2000), 3: Female (2000)
    // 4: Male (2100), 5: Female (2100)
    // 6: Male (2200), 7: Female (2200)
    // 8: Male (1800), 9: Female (1800)
    const isFemale = sDigit % 2 !== 0;
    const gender = isFemale ? 'Female' : 'Male';
    
    let century = '19';
    if (sDigit === 0 || sDigit === 1) century = '19';
    else if (sDigit === 2 || sDigit === 3) century = '20';
    else if (sDigit === 4 || sDigit === 5) century = '21';
    else if (sDigit === 6 || sDigit === 7) century = '22';
    else if (sDigit === 8 || sDigit === 9) century = '18';
    
    const provinces: Record<string, string> = {
        '001': 'Hanoi', '048': 'Da Nang', '079': 'Ho Chi Minh City',
        '004': 'Cao Bằng', '006': 'Bắc Kạn'
    };
    const province = provinces[provinceCode] || `Province Code ${provinceCode}`;
    
    return `Personal ID (CCCD), ${gender}, born in ${century}${yy} in ${province}. Verified via structure.`;
}

function validateVietnamSemantic(tin: string, metadata: HolderMetadata): TinValidationResult {
    const sDigit = parseInt(tin[3]);
    const yyPart = tin.substring(4, 6);

    const mismatchFields: string[] = [];

    // Gender check
    if (metadata.gender) {
        const isFemale = sDigit % 2 !== 0;
        if ((metadata.gender === 'F' && !isFemale) || (metadata.gender === 'M' && isFemale)) {
            mismatchFields.push('gender');
        }
    }

    // Birth Year Check
    if (metadata.birthDate) {
        const dob = new Date(metadata.birthDate);
        const year = dob.getFullYear();
        const yearSuffix = year.toString().slice(-2);
        
        let expectedS_Options: number[] = [];
        if (year < 1900) expectedS_Options = [8, 9];
        else if (year < 2000) expectedS_Options = [0, 1];
        else if (year < 2100) expectedS_Options = [2, 3];
        else expectedS_Options = [4, 5];

        if (yyPart !== yearSuffix || !expectedS_Options.includes(sDigit)) {
            mismatchFields.push('birthDate');
        }
    }

    if (mismatchFields.length > 0) {
        return {
            isValid: false,
            status: 'MISMATCH',
            reasonCode: 'ID_DATA_INCONSISTENT',
            mismatchFields,
            explanation: `Inconsistency in ${mismatchFields.join(', ')} with Vietnamese CCCD structure.`
        };
    }

    return { isValid: true, status: 'VALID' };
}

function validateVietnamTINChecksum(tin: string): boolean {
    const weights = [31, 29, 23, 19, 17, 13, 7, 5, 3];
    let sum = 0;
    for (let i = 0; i < 9; i++) {
        sum += parseInt(tin[i]) * weights[i];
    }
    const remainder = sum % 11;
    const checkDigit = (10 - remainder) % 11; // 10 results in 0 check digit in practice
    return checkDigit === parseInt(tin[9]);
}

/**
 * APPENDIX: FORENSIC CRITERIA
 * Vietnam uses a dual identification system.
 * 1. TIN (10 or 13 digits): 
 *    - Main TIN: 10 digits. Last digit is check digit (Modulo 11).
 *    - Branch TIN: 13 digits (10 Head + 3 Serial).
 * 2. CCCD (12 digits): 
 *    - Identity card for citizens.
 *    - Structure: 3 digits (Province) + 1 digit (Century/Gender) + 2 digits (Year) + 6 digits (Sequence).
 * 3. Validation: Modulo 11 for the 10-digit TIN.
 * 4. Residency: Based on the 183-day presence rule in 12 consecutive months.
 */
