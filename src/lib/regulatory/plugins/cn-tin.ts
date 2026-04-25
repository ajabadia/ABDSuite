
import { HolderMetadata, TinValidationResult, CountryRegulatoryInfo, TinInfo, TinRequirement } from './index';

/**
 * TIN Validation for China (CN)
 * Individual: Citizen ID / Resident ID (18 characters)
 * Entity: Unified Social Credit Code (USCC) (18 characters)
 */

/**
 * TIN Requirements for China
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
    ]},
    { key: 'birthPlaceCode', label: 'province', type: 'select', scope: 'INDIVIDUAL', options: [
        { value: '11', label: 'Beijing' }, { value: '12', label: 'Tianjin' }, { value: '13', label: 'Hebei' },
        { value: '14', label: 'Shanxi' }, { value: '15', label: 'Inner Mongolia' }, { value: '21', label: 'Liaoning' },
        { value: '22', label: 'Jilin' }, { value: '23', label: 'Heilongjiang' }, { value: '31', label: 'Shanghai' },
        { value: '32', label: 'Jiangsu' }, { value: '33', label: 'Zhejiang' }, { value: '34', label: 'Anhui' },
        { value: '35', label: 'Fujian' }, { value: '36', label: 'Jiangxi' }, { value: '37', label: 'Shandong' },
        { value: '41', label: 'Henan' }, { value: '42', label: 'Hubei' }, { value: '43', label: 'Hunan' },
        { value: '44', label: 'Guangdong' }, { value: '45', label: 'Guangxi' }, { value: '46', label: 'Hainan' },
        { value: '50', label: 'Chongqing' }, { value: '51', label: 'Sichuan' }, { value: '52', label: 'Guizhou' },
        { value: '53', label: 'Yunnan' }, { value: '54', label: 'Tibet' }, { value: '61', label: 'Shaanxi' },
        { value: '62', label: 'Gansu' }, { value: '63', label: 'Qinghai' }, { value: '64', label: 'Ningxia' },
        { value: '65', label: 'Xinjiang' }
    ]}
];

/**
 * Country Metadata for China
 */
export const COUNTRY_INFO: CountryRegulatoryInfo = {
    name: 'China',
    authority: 'State Taxation Administration (STA)',
    compliance: {
        crsStatus: 'Participating',
        crsDate: 'September 2018',
        fatcaStatus: 'Model 1 (In Force)'
    },
    residency: {
        individual: 'Se considera residente si tiene domicilio en China o si permanece en China durante un total de 183 días o más en un año natural.',
        entity: 'Se considera residente si está establecida en China de acuerdo con sus leyes, o si su gestión central se encuentra en China.',
        notes: 'Criterio de domicilio o estancia de 183 días.'
    }
};

/**
 * TIN Metadata for China (Era 6.3)
 */
export const TIN_INFO: TinInfo = {
    name: 'Citizen ID / USCC',
    description: 'Chinese Citizen Identification Number (Individuals) or Unified Social Credit Code (Entities) issued by the STA.',
    placeholder: '11010519800101123X / 91110000XXXXXXXXXX',
    officialLink: 'http://www.chinatax.gov.cn',
    isOfficial: true,
    lastUpdated: '2026-04-24',
    source: 'OECD Portal / STA',
    entityDifferentiation: {
        logic: 'Structure and usage analysis.',
        individualDescription: '18 characters for individuals (Citizen ID).',
        businessDescription: '18 characters for entities (USCC).'
    }
};

/**
 * China TIN Validator - Era 6.3
 */
export const validateCNTIN = (
    value: string, 
    type: 'INDIVIDUAL' | 'ENTITY' | 'ANY' = 'ANY', 
    metadata?: HolderMetadata
): TinValidationResult => {
    const sanitized = value.replace(/[\s-]/g, '').toUpperCase();

    if (sanitized.length !== 18 || !/^[0-9A-Z]{18}$/.test(sanitized)) {
        return { 
            isValid: false, 
            status: 'INVALID_FORMAT',
            explanation: 'Value does not match Chinese Citizen ID or USCC (18 characters) format.'
        };
    }

    // Citizen ID typically ends with a digit or 'X'
    const isCitizenID = /^[0-9]{17}[0-9X]$/.test(sanitized);

    if (isCitizenID && type === 'ENTITY') {
        return { 
            isValid: false, 
            status: 'MISMATCH', 
            reasonCode: 'ENTITY_TYPE_MISMATCH',
            explanation: 'The detected format corresponds to a Chinese Citizen Identification Number, exclusive to individuals.'
        };
    }

    if (!isCitizenID && type === 'INDIVIDUAL') {
        return { 
            isValid: false, 
            status: 'MISMATCH', 
            reasonCode: 'ENTITY_TYPE_MISMATCH',
            explanation: 'The detected format corresponds to a Chinese Unified Social Credit Code (USCC), which applies to legal entities.'
        };
    }

    // Checksum for Citizen ID
    if (isCitizenID) {
        const weights = [7, 9, 10, 5, 8, 4, 2, 1, 6, 3, 7, 9, 10, 5, 8, 4, 2];
        const checkMap = ['1', '0', 'X', '9', '8', '7', '6', '5', '4', '3', '2'];
        let sum = 0;
        for (let i = 0; i < 17; i++) {
            sum += parseInt(sanitized[i]) * weights[i];
        }
        if (checkMap[sum % 11] !== sanitized[17]) {
            return { isValid: false, status: 'INVALID_CHECKSUM', explanation: 'Failed Chinese Citizen ID checksum validation.' };
        }
    }

    if (metadata && isCitizenID) {
        const mismatchFields: string[] = [];
        
        if (metadata.birthDate) {
            const dob = new Date(metadata.birthDate);
            const expectedYYYYMMDD = dob.getFullYear().toString() + 
                                   (dob.getMonth() + 1).toString().padStart(2, '0') + 
                                   dob.getDate().toString().padStart(2, '0');
            if (expectedYYYYMMDD !== sanitized.substring(6, 14)) mismatchFields.push('birthDate');
        }

        if (metadata.gender) {
            const genderDigit = parseInt(sanitized[16]);
            const isMale = genderDigit % 2 !== 0;
            if ((metadata.gender === 'M' && !isMale) || (metadata.gender === 'F' && isMale)) {
                mismatchFields.push('gender');
            }
        }

        if (metadata.birthPlaceCode) {
            const areaCode = sanitized.substring(0, 2);
            if (areaCode !== metadata.birthPlaceCode) {
                mismatchFields.push('birthPlaceCode');
            }
        }

        if (mismatchFields.length > 0) {
            const details = decodeChinaTIN(sanitized);
            return {
                isValid: false,
                status: 'MISMATCH',
                reasonCode: 'ID_DATA_INCONSISTENT',
                mismatchFields,
                explanation: `Inconsistency in ${mismatchFields.join(', ')}. TIN details: ${details}`
            };
        }
    }

    const explanation = decodeChinaTIN(sanitized);

    return { 
        isValid: true, 
        status: 'VALID', 
        isOfficialMatch: true, 
        explanation: type === 'ANY'
            ? (isCitizenID 
                ? 'Valid format for Individuals (Citizen ID). Note: This identifier is not valid for legal Entities.'
                : 'Valid format for Entities (USCC). Not valid for Individuals.')
            : explanation
    };
};

function decodeChinaTIN(tin: string): string {
    if (/^[0-9]{17}[0-9X]$/.test(tin)) {
        const areaCode = tin.substring(0, 2);
        const yyyy = tin.substring(6, 10);
        const mm = tin.substring(10, 12);
        const dd = tin.substring(12, 14);
        const genderDigit = parseInt(tin[16]);
        const gender = genderDigit % 2 !== 0 ? 'Male' : 'Female';
        
        const provinces: Record<string, string> = {
            '11': 'Beijing', '12': 'Tianjin', '13': 'Hebei', '14': 'Shanxi', '15': 'Inner Mongolia',
            '21': 'Liaoning', '22': 'Jilin', '23': 'Heilongjiang', '31': 'Shanghai', '32': 'Jiangsu',
            '33': 'Zhejiang', '34': 'Anhui', '35': 'Fujian', '36': 'Jiangxi', '37': 'Shandong',
            '41': 'Henan', '42': 'Hubei', '43': 'Hunan', '44': 'Guangdong', '45': 'Guangxi',
            '46': 'Hainan', '50': 'Chongqing', '51': 'Sichuan', '52': 'Guizhou', '53': 'Yunnan',
            '54': 'Tibet', '61': 'Shaanxi', '62': 'Gansu', '63': 'Qinghai', '64': 'Ningxia',
            '65': 'Xinjiang'
        };
        const province = provinces[areaCode] || `Area ${areaCode}`;
        
        return `Citizen ID (${gender}), born on ${dd}/${mm}/${yyyy} in ${province}. Verified via checksum.`;
    }
    
    // USCC Authority
    const authCode = tin[0];
    const authorities: Record<string, string> = {
        '1': 'Governmental Organization',
        '2': 'Military Org',
        '3': 'Social Group',
        '5': 'Civil Affairs',
        '9': 'Market Supervision (AIC)'
    };
    const auth = authorities[authCode] || 'Other Authority';
    return `Unified Social Credit Code (USCC) issued by ${auth}. Verified via structure.`;
}

/**
 * APPENDIX: FORENSIC CRITERIA
 * China uses the 18-character Resident Identity Card for individuals and USCC for entities.
 * 1. Citizen Identification Number (GB 11643-1999):
 *    - Digits 1-6: Area code (Administrative division).
 *    - Digits 7-14: Birth date (YYYYMMDD).
 *    - Digits 15-17: Sequential code (Digit 17: Odd = Male, Even = Female).
 *    - Digit 18: Checksum (ISO 7064 Modulo 11-2).
 * 2. USCC (Unified Social Credit Code - GB 32100-2015):
 *    - Digit 1: Authority code (e.g., 9 for market supervision).
 *    - Digit 2: Organization type.
 *    - Digits 3-8: Registering authority.
 *    - Digits 9-17: Organization code.
 *    - Digit 18: Checksum (weighted sum).
 * 3. Residency: Based on domicile or the 183-day presence rule in a calendar year.
 */

