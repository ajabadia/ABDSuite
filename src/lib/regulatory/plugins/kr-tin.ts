
import { HolderMetadata, TinValidationResult, CountryRegulatoryInfo, TinInfo, TinRequirement } from './index';

/**
 * TIN Validation for South Korea (KR)
 * Individual: Resident Registration Number (RRN) (13 digits)
 * Entity: Business Registration Number (BRN) (10 digits)
 */

/**
 * TIN Requirements for South Korea
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
 * Country Metadata for South Korea
 */
export const COUNTRY_INFO: CountryRegulatoryInfo = {
    name: 'Corea del Sur',
    authority: 'National Tax Service (NTS)',
    compliance: {
        crsStatus: 'Participating',
        crsDate: 'September 2017',
        fatcaStatus: 'Model 1 (In Force)'
    },
    residency: {
        individual: 'Se considera residente si tiene domicilio en Corea o si ha tenido residencia allí durante 183 días o más.',
        entity: 'Se considera residente si tiene su oficina principal o sede social en Corea, o si tiene su sede administrativa efectiva allí.',
        notes: 'Criterio de domicilio o estancia de 183 días.'
    }
};

/**
 * TIN Metadata for South Korea (Era 6.3)
 */
export const TIN_INFO: TinInfo = {
    name: 'RRN / BRN',
    description: 'South Korean RRN (Individuals) or BRN (Entities) issued by the Ministry of Interior or NTS.',
    placeholder: '800101-1234567 / 123-45-67890',
    officialLink: 'https://www.nts.go.kr',
    isOfficial: true,
    lastUpdated: '2026-04-24',
    source: 'OECD Portal / NTS',
    entityDifferentiation: {
        logic: 'Number length analysis.',
        individualDescription: 'Resident Registration Number (RRN) of 13 digits.',
        businessDescription: 'Business Registration Number (BRN) of 10 digits.'
    }
};

/**
 * South Korea TIN Validator - Era 6.3
 */
export const validateKRTIN = (
    value: string, 
    type: 'INDIVIDUAL' | 'ENTITY' | 'ANY' = 'ANY', 
    metadata?: HolderMetadata
): TinValidationResult => {
    const sanitized = value.replace(/[\s-]/g, '');

    // Individual (RRN): 13 digits
    if (sanitized.length === 13 && /^[0-9]{13}$/.test(sanitized)) {
        if (type === 'ENTITY') {
            return { 
                isValid: false, 
                status: 'MISMATCH', 
                reasonCode: 'ENTITY_TYPE_MISMATCH',
                explanation: 'The detected format (13 digits) corresponds to a South Korean RRN, which is exclusive to individuals.'
            };
        }
        
        if (metadata) {
            const semantic = validateKoreaSemantic(sanitized, metadata);
            if (!semantic.isValid) {
                return semantic;
            }
        }

        if (validateRRNChecksum(sanitized)) {
            const explanation = decodeSouthKoreaTIN(sanitized);
            return { 
                isValid: true, 
                status: 'VALID', 
                isOfficialMatch: true, 
                explanation: type === 'ANY'
                    ? 'Format valid for Individuals (RRN). Note: This identifier is not valid for legal Entities.'
                    : explanation
            };
        } else {
            return { isValid: false, status: 'INVALID_CHECKSUM', explanation: 'Failed South Korean RRN checksum validation.' };
        }
    }

    // Business (BRN): 10 digits
    if (sanitized.length === 10 && /^[0-9]{10}$/.test(sanitized)) {
        if (type === 'INDIVIDUAL') {
            return { 
                isValid: false, 
                status: 'MISMATCH', 
                reasonCode: 'ENTITY_TYPE_MISMATCH',
                explanation: 'The detected format (10 digits) corresponds to a South Korean BRN, which applies only to entities.'
            };
        }
        return { 
            isValid: true, 
            status: 'VALID', 
            isOfficialMatch: true, 
            explanation: type === 'ANY'
                ? 'Format valid for Entities (BRN). Note: This identifier is not valid for Individuals.'
                : 'Matches official South Korean BRN (10 digits) format.' 
        };
    }

    return { 
        isValid: false, 
        status: 'INVALID_FORMAT',
        explanation: 'Value does not match South Korean RRN (13 digits) or BRN (10 digits) format.'
    };
};

function decodeSouthKoreaTIN(tin: string): string {
    const yy = tin.substring(0, 2);
    const mm = tin.substring(2, 4);
    const dd = tin.substring(4, 6);
    const s = parseInt(tin[6]);
    
    let century = '19';
    let gender = 'Unknown';
    let status = 'Citizen';
    
    if (s === 1 || s === 2 || s === 5 || s === 6) century = '19';
    else if (s === 3 || s === 4 || s === 7 || s === 8) century = '20';
    else if (s === 9 || s === 0) century = '18';
    
    if ([1, 3, 5, 7, 9].includes(s)) gender = 'Male';
    else if ([2, 4, 6, 8, 0].includes(s)) gender = 'Female';
    
    if (s >= 5 && s <= 8) status = 'Foreigner';
    
    return `Individual (${gender}, ${status}), born on ${dd}/${mm}/${century}${yy}. Verified via checksum.`;
}

function validateKoreaSemantic(tin: string, metadata: HolderMetadata): TinValidationResult {
    const mismatchFields: string[] = [];
    const yyPart = tin.substring(0, 2);
    const mmPart = tin.substring(2, 4);
    const ddPart = tin.substring(4, 6);
    const s = parseInt(tin[6]);

    // Gender check (Odd=Male, Even=Female)
    if (metadata.gender) {
        const isMale = [1, 3, 5, 7, 9].includes(s);
        if ((metadata.gender === 'M' && !isMale) || (metadata.gender === 'F' && isMale)) {
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
        
        let expectedS_Options: number[] = [];
        if (year < 1900) expectedS_Options = [9, 0];
        else if (year < 2000) expectedS_Options = [1, 2, 5, 6];
        else expectedS_Options = [3, 4, 7, 8];

        if (day !== ddPart || month !== mmPart || yearSuffix !== yyPart || !expectedS_Options.includes(s)) {
            mismatchFields.push('birthDate');
        }
    }

    if (mismatchFields.length > 0) {
        return {
            isValid: false,
            status: 'MISMATCH',
            reasonCode: 'ID_DATA_INCONSISTENT',
            mismatchFields,
            explanation: `Inconsistency in ${mismatchFields.join(', ')} with South Korean RRN structure.`
        };
    }

    return { isValid: true, status: 'VALID' };
}

function validateRRNChecksum(tin: string): boolean {
    const weights = [2, 3, 4, 5, 6, 7, 8, 9, 2, 3, 4, 5];
    let sum = 0;
    for (let i = 0; i < 12; i++) sum += parseInt(tin[i]) * weights[i];
    const checkDigit = (11 - (sum % 11)) % 10;
    return checkDigit === parseInt(tin[12]);
}
