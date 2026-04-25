
import { HolderMetadata, TinValidationResult, CountryRegulatoryInfo, TinInfo, TinRequirement } from './index';

/**
 * TIN Validation for Lithuania (LT)
 * Individual: Personal Code (11 digits)
 * Entity: Business Code (9 digits)
 */

/**
 * TIN Requirements for Lithuania
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
 * Country Metadata for Lithuania
 */
export const COUNTRY_INFO: CountryRegulatoryInfo = {
    name: 'Lituania',
    authority: 'State Tax Inspectorate',
    compliance: {
        crsStatus: 'Participating',
        crsDate: 'September 2017',
        fatcaStatus: 'Model 1 (In Force)'
    },
    residency: {
        individual: 'Se considera residente si tiene su residencia principal en Lituania o si permanece allí durante más de 183 días en el año civil.',
        entity: 'Se considera residente si se ha establecido en Lituania.',
        notes: 'Criterio de residencia principal o estancia de 183 días.'
    }
};

/**
 * TIN Metadata for Lithuania (Era 6.3)
 */
export const TIN_INFO: TinInfo = {
    name: 'Personal Code / Business Code',
    description: 'Lithuanian Personal Code (Individuals) or Registration Code (Entities) issued by the State Tax Inspectorate.',
    placeholder: '38001011234 / 123456789',
    officialLink: 'https://www.vmi.lt',
    isOfficial: true,
    lastUpdated: '2026-04-24',
    source: 'OECD Portal / VMI',
    entityDifferentiation: {
        logic: 'Number length analysis.',
        individualDescription: '11-digit Personal Code.',
        businessDescription: '9-digit Business Registration Code.'
    }
};

/**
 * Lithuania TIN Validator - Era 6.3
 */
export const validateLTTIN = (
    value: string, 
    type: 'INDIVIDUAL' | 'ENTITY' | 'ANY' = 'ANY', 
    metadata?: HolderMetadata
): TinValidationResult => {
    const sanitized = value.replace(/[\s-]/g, '');

    // Individual (Personal Code): 11 digits
    if (sanitized.length === 11 && /^[1-6][0-9]{10}$/.test(sanitized)) {
        if (type === 'ENTITY') {
            return { 
                isValid: false, 
                status: 'MISMATCH', 
                reasonCode: 'ENTITY_TYPE_MISMATCH',
                explanation: 'The detected format (11 digits) corresponds to a Lithuanian Personal Code, which is exclusive to individuals.'
            };
        }
        
        if (metadata) {
            const semantic = validateLithuaniaSemantic(sanitized, metadata);
            if (!semantic.isValid) {
                return semantic;
            }
        }

        if (validateLithuaniaChecksum(sanitized)) {
            return { 
                isValid: true, 
                status: 'VALID', 
                isOfficialMatch: true, 
                explanation: decodeLithuaniaTIN(sanitized) 
            };
        } else {
            return { isValid: false, status: 'INVALID_CHECKSUM', explanation: 'Failed Lithuanian Personal Code checksum validation.' };
        }
    }

    // Business (Registration Code): 9 digits
    if (sanitized.length === 9 && /^[0-9]{9}$/.test(sanitized)) {
        if (type === 'INDIVIDUAL') {
            return { 
                isValid: false, 
                status: 'MISMATCH', 
                reasonCode: 'ENTITY_TYPE_MISMATCH',
                explanation: 'The detected format (9 digits) corresponds to a Lithuanian Business Registration Code, which applies only to entities.'
            };
        }
        return { 
            isValid: true, 
            status: 'VALID', 
            isOfficialMatch: true, 
            explanation: 'Matches official Lithuanian Business Registration Code (9 digits) format.' 
        };
    }

    return { 
        isValid: false, 
        status: 'INVALID_FORMAT',
        explanation: 'Value does not match Lithuanian Personal Code (11 digits) or Business Code (9 digits) format.'
    };
};

function decodeLithuaniaTIN(tin: string): string {
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

function validateLithuaniaSemantic(tin: string, metadata: HolderMetadata): TinValidationResult {
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
            explanation: `Inconsistency in ${mismatchFields.join(', ')} with Lithuanian Personal Code structure.`
        };
    }

    return { isValid: true, status: 'VALID' };
}

function validateLithuaniaChecksum(tin: string): boolean {
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
