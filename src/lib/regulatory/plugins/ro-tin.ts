import { HolderMetadata, TinValidationResult, CountryRegulatoryInfo, TinInfo, TinRequirement } from './index';

/**
 * TIN Validation for Romania (RO)
 * Individual: Personal Numerical Code (CNP) (13 digits)
 * Entity: Tax Identification Number (CIF) (2 to 10 digits)
 */

/**
 * TIN Requirements for Romania
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
 * Country Metadata for Romania
 */
export const COUNTRY_INFO: CountryRegulatoryInfo = {
    name: 'Rumanía',
    authority: 'National Agency for Fiscal Administration (ANAF)',
    compliance: {
        crsStatus: 'Participating',
        crsDate: 'September 2017',
        fatcaStatus: 'Model 1 (In Force)'
    },
    residency: {
        individual: 'Se considera residente si tiene su domicilio en Rumanía, el centro de sus intereses vitales allí o si permanece 183 días en el año civil.',
        entity: 'Se considera residente si se ha incorporado en Rumanía o si tiene su sede administrativa efectiva allí.',
        notes: 'Criterio de domicilio, intereses vitales o permanencia.'
    }
};

/**
 * TIN Metadata for Romania (Era 6.3)
 */
export const TIN_INFO: TinInfo = {
    name: 'CNP / CIF',
    description: 'Romanian CNP (Individuals) or CIF (Entities) issued by the Ministry of Interior or ANAF.',
    placeholder: '1234567890123 / 12345678',
    officialLink: 'https://www.anaf.ro',
    isOfficial: true,
    lastUpdated: '2026-04-24',
    source: 'OECD Portal / ANAF',
    entityDifferentiation: {
        logic: 'Number length analysis.',
        individualDescription: '13-digit Personal Numerical Code.',
        businessDescription: '2 to 10-digit Tax Identification Number.'
    }
};

/**
 * Romania TIN Validator - Era 6.3
 */
export const validateROTIN = (
    value: string, 
    type: 'INDIVIDUAL' | 'ENTITY' | 'ANY' = 'ANY', 
    metadata?: HolderMetadata
): TinValidationResult => {
    const sanitized = value.trim().replace(/[\s-]/g, '');

    // 1. Individual (CNP): 13 digits
    if (sanitized.length === 13 && /^[0-9]{13}$/.test(sanitized)) {
        if (type === 'ENTITY') {
            return { 
                isValid: false, 
                status: 'MISMATCH', 
                reasonCode: 'ENTITY_TYPE_MISMATCH',
                explanation: 'The detected format (13 digits) corresponds to a Romanian CNP, which is exclusive to individuals.'
            };
        }
        
        if (metadata) {
            const semantic = validateRomaniaSemantic(sanitized, metadata);
            if (!semantic.isValid) {
                return semantic;
            }
        }

        const isOfficial = validateCNPChecksum(sanitized);
        return { 
            isValid: true, 
            status: isOfficial ? 'VALID' : 'VALID_UNOFFICIAL', 
            isOfficialMatch: isOfficial, 
            explanation: type === 'ANY'
                ? 'Format valid for Individuals (CNP). Note: This identifier is not valid for legal Entities.'
                : decodeRomaniaTIN(sanitized) + (isOfficial ? ' Verified via official checksum.' : ' Pattern match.')
        };
    }

    // 2. Business (CIF): 2 to 10 digits
    if (sanitized.length >= 2 && sanitized.length <= 10 && /^[0-9]+$/.test(sanitized)) {
        if (type === 'INDIVIDUAL') {
            return { 
                isValid: false, 
                status: 'MISMATCH', 
                reasonCode: 'ENTITY_TYPE_MISMATCH',
                explanation: 'The detected format (2-10 digits) corresponds to a Romanian CIF, which applies only to entities.'
            };
        }
        return { 
            isValid: true, 
            status: 'VALID', 
            isOfficialMatch: true, 
            explanation: type === 'ANY'
                ? 'Format valid for Entities (CIF). Note: This identifier is not valid for local Individuals.'
                : `Matches official Romanian CIF (${sanitized.length} digits) format.` 
        };
    }

    return { 
        isValid: false, 
        status: 'INVALID_FORMAT',
        explanation: 'Value does not match Romanian CNP (13 digits) or CIF (2-10 digits) format.'
    };
};

function decodeRomaniaTIN(tin: string): string {
    const s = parseInt(tin[0]);
    const aa = tin.substring(1, 3);
    const mm = tin.substring(3, 5);
    const dd = tin.substring(5, 7);
    const jj = tin.substring(7, 9);
    
    const centuryMap: Record<number, string> = {
        1: '19', 2: '19',
        3: '18', 4: '18',
        5: '20', 6: '20',
        7: '19', 8: '19',
        9: '19'
    };
    
    const gender = [1, 3, 5, 7].includes(s) ? 'Male' : ([2, 4, 6, 8].includes(s) ? 'Female' : 'Unknown');
    const century = centuryMap[s] || '19';
    const isResident = s === 7 || s === 8 || s === 9;
    
    const countyMap: Record<string, string> = {
        '01': 'Alba', '02': 'Arad', '03': 'Argeș', '04': 'Bacău', '05': 'Bihor', '06': 'Bistrița-Năsăud',
        '07': 'Botoșani', '08': 'Brașov', '09': 'Brăila', '10': 'Buzău', '11': 'Caraș-Severin', '12': 'Călărași',
        '13': 'Cluj', '14': 'Constanța', '15': 'Covasna', '16': 'Dâmbovița', '17': 'Dolj', '18': 'Galați',
        '19': 'Giurgiu', '20': 'Gorj', '21': 'Harghita', '22': 'Hunedoara', '23': 'Ialomița', '24': 'Iași',
        '25': 'Ilfov', '26': 'Maramureș', '27': 'Mehedinți', '28': 'Mureș', '29': 'Neamț', '30': 'Olt',
        '31': 'Prahova', '32': 'Satu Mare', '33': 'Sălaj', '34': 'Sibiu', '35': 'Suceava', '36': 'Teleorman',
        '37': 'Timiș', '38': 'Tulcea', '39': 'Vaslui', '40': 'Vâlcea', '41': 'Vrancea', '42': 'București',
        '43': 'București S1', '44': 'București S2', '45': 'București S3', '46': 'București S4',
        '47': 'București S5', '48': 'București S6', '51': 'Călărași', '52': 'Giurgiu'
    };
    
    const county = countyMap[jj] || `Unknown County (${jj})`;
    const type = isResident ? 'Resident Foreigner' : 'Citizen';
    
    return `Romanian CNP ${type} (${gender}), born on ${dd}/${mm}/${century}${aa} in ${county}.`;
}

function validateRomaniaSemantic(tin: string, metadata: HolderMetadata): TinValidationResult {
    const mismatchFields: string[] = [];
    const sPart = parseInt(tin[0]);
    const aaPart = tin.substring(1, 3);
    const mmPart = tin.substring(3, 5);
    const ddPart = tin.substring(5, 7);

    // Gender check (Odd=Male, Even=Female)
    if (metadata.gender) {
        const isMale = [1, 3, 5, 7, 9].includes(sPart);
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
        
        let expectedS = 0;
        if (year >= 2000) expectedS = metadata.gender === 'F' ? 6 : 5;
        else if (year >= 1900) expectedS = metadata.gender === 'F' ? 2 : 1;
        else if (year >= 1800) expectedS = metadata.gender === 'F' ? 4 : 3;

        if (day !== ddPart || month !== mmPart || yearSuffix !== aaPart) {
            mismatchFields.push('birthDate');
        }
        if (expectedS !== 0 && expectedS !== sPart && sPart < 7) {
             mismatchFields.push('gender'); // Century mismatch affects S
        }
    }

    if (mismatchFields.length > 0) {
        return {
            isValid: false,
            status: 'MISMATCH',
            reasonCode: 'ID_DATA_INCONSISTENT',
            mismatchFields,
            explanation: `Inconsistency in ${mismatchFields.join(', ')} with Romanian CNP structure.`
        };
    }

    return { isValid: true, status: 'VALID' };
}

function validateCNPChecksum(tin: string): boolean {
    const weights = [2, 7, 9, 1, 4, 6, 3, 5, 8, 2, 7, 9];
    let sum = 0;
    for (let i = 0; i < 12; i++) sum += parseInt(tin[i]) * weights[i];
    let remainder = sum % 11;
    if (remainder === 10) remainder = 1;
    return remainder === parseInt(tin[12]);
}

/**
 * APPENDIX: FORENSIC CRITERIA
 * Romania uses the CNP (Cod Numeric Personal) and CIF systems.
 * 1. CNP (Individuals - 13 digits): 
 *    - Structure: S YY MM DD JJ NNN C.
 *    - S (Gender/Century): 1/2 (19th), 3/4 (18th), 5/6 (20th), 7/8/9 (Foreigners).
 *    - JJ: County code (01-52).
 *    - Validation: Weighted sum algorithm Modulo 11. 
 *    - Special rule: If result of sum % 11 is 10, check digit is 1.
 * 2. CIF (Entities - 2-10 digits): Tax identifier for legal units.
 * 3. Residency: Based on domicile, center of vital interests, or 183-day rule.
 */
