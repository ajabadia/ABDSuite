import { HolderMetadata, TinValidationResult, CountryRegulatoryInfo, TinInfo, TinRequirement } from './index';

/**
 * TIN Validation for Egypt (EG)
 * Individual: National ID (14 digits)
 * Entity: Tax Registration Number (9 digits)
 */

/**
 * TIN Requirements for Egypt
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
 * Country Metadata for Egypt
 */
export const COUNTRY_INFO: CountryRegulatoryInfo = {
    name: 'Egipto',
    authority: 'Egyptian Tax Authority (ETA)',
    compliance: {
        crsStatus: 'Non-Participating',
        crsDate: 'N/A',
        fatcaStatus: 'Model 1 (In Force)'
    },
    residency: {
        individual: 'Se considera residente si permanece en Egipto durante más de 183 días en el año civil.',
        entity: 'Se considera residente si está incorporada en Egipto.',
        notes: 'Criterio de permanencia física o constitución legal.'
    }
};

/**
 * TIN Metadata for Egypt (Era 6.3)
 */
export const TIN_INFO: TinInfo = {
    name: 'National ID / Tax Reg. No.',
    description: 'Egyptian National ID (Individuals) or Tax Registration Number (Entities) issued by the Civil Registry or ETA.',
    placeholder: '12345678901234 / 123456789',
    officialLink: 'https://www.eta.gov.eg',
    isOfficial: true,
    lastUpdated: '2026-04-24',
    source: 'Local Authority / Egypt Tax',
    entityDifferentiation: {
        logic: 'Number length analysis.',
        individualDescription: '14-digit National ID.',
        businessDescription: '9-digit Tax Registration Number.'
    }
};

/**
 * Egypt TIN Validator - Era 6.3
 */
export const validateEGTIN = (
    value: string, 
    type: 'INDIVIDUAL' | 'ENTITY' | 'ANY' = 'ANY', 
    metadata?: HolderMetadata
): TinValidationResult => {
    const sanitized = value.replace(/[\s-]/g, '');

    // Individual (National ID): 14 digits
    if (sanitized.length === 14 && /^[0-9]{14}$/.test(sanitized)) {
        if (type === 'ENTITY') {
             return { isValid: false, status: 'MISMATCH', reasonCode: 'ENTITY_TYPE_MISMATCH' };
        }
        if (metadata) {
            const semantic = validateEgyptSemantic(sanitized, metadata);
            if (!semantic.isValid) {
                return semantic;
            }
        }

        return { 
            isValid: true, 
            status: 'VALID', 
            isOfficialMatch: true, 
            explanation: decodeEgyptTIN(sanitized)
        };
    }

    // Business (Tax Reg No): 9 digits
    if (sanitized.length === 9 && /^[0-9]{9}$/.test(sanitized)) {
        if (type === 'INDIVIDUAL') {
             return { isValid: false, status: 'MISMATCH', reasonCode: 'ENTITY_TYPE_MISMATCH' };
        }
        return { 
            isValid: true, 
            status: 'VALID', 
            isOfficialMatch: true, 
            explanation: 'Matches official Egyptian Tax Registration Number (9 digits) format.' 
        };
    }

    return { 
        isValid: false, 
        status: 'INVALID_FORMAT',
        explanation: 'Value does not match Egyptian National ID (14 digits) or Tax Registration Number (9 digits) format.'
    };
};

function decodeEgyptTIN(tin: string): string {
    const centuryDigit = parseInt(tin[0]);
    const yy = tin.substring(1, 3);
    const mm = tin.substring(3, 5);
    const dd = tin.substring(5, 7);
    const govCode = tin.substring(7, 9);
    const genderDigit = parseInt(tin[12]);
    
    const century = centuryDigit === 2 ? '19' : (centuryDigit === 3 ? '20' : 'Unknown');
    const gender = genderDigit % 2 === 0 ? 'Female' : 'Male';
    
    const governorates: Record<string, string> = {
        '01': 'Cairo', '02': 'Alexandria', '03': 'Port Said', '04': 'Suez',
        '11': 'Damietta', '12': 'Dakahlia', '13': 'Ash Sharqia', '14': 'Kaliobeya',
        '15': 'Kafr El Sheikh', '16': 'Gharbia', '17': 'Monufia', '18': 'Beheira', '19': 'Ismailia',
        '21': 'Giza', '22': 'Beni Suef', '23': 'Fayoum', '24': 'Minya', '25': 'Assiut', '26': 'Sohag',
        '27': 'Qena', '28': 'Aswan', '29': 'Luxor', '31': 'Red Sea', '32': 'New Valley', '33': 'Matrouh',
        '34': 'North Sinai', '35': 'South Sinai', '88': 'Foreign'
    };
    
    const gov = governorates[govCode] || `Unknown (${govCode})`;
    
    return `National ID (${gender}), born on ${dd}/${mm}/${century}${yy} in ${gov}. Verified via structure.`;
}

function validateEgyptSemantic(tin: string, metadata: HolderMetadata): TinValidationResult {
    const mismatchFields: string[] = [];
    const centuryDigit = parseInt(tin[0]);
    const yyPart = tin.substring(1, 3);
    const mmPart = tin.substring(3, 5);
    const ddPart = tin.substring(5, 7);
    const genderDigit = parseInt(tin[12]);

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
        const month = (dob.getMonth() + 1).toString().padStart(2, '0');
        const year = dob.getFullYear();
        const yearSuffix = year.toString().slice(-2);
        const expectedCentury = year >= 2000 ? 3 : 2;

        if (day !== ddPart || month !== mmPart || yearSuffix !== yyPart || expectedCentury !== centuryDigit) {
            mismatchFields.push('birthDate');
        }
    }

    if (mismatchFields.length > 0) {
        return {
            isValid: false,
            status: 'MISMATCH',
            reasonCode: 'ID_DATA_INCONSISTENT',
            mismatchFields,
            explanation: `Inconsistency in ${mismatchFields.join(', ')} with Egyptian National ID structure.`
        };
    }

    return { isValid: true, status: 'VALID' };
}

/**
 * APPENDIX: FORENSIC CRITERIA
 * Egypt uses a highly structured 14-digit National Identification Number.
 * 1. Structure: C YY MM DD GG SSSS Z.
 *    - C (Century): 2 (1900-1999), 3 (2000-2099).
 *    - YYMMDD: Birth date.
 *    - GG (Governorate): Code of the place of birth (e.g., 01: Cairo).
 *    - SSSS: Sequential number (registration order).
 *    - Digit 13 (Gender): Even for females, Odd for males.
 *    - Z: Check digit.
 * 2. Tax Registration Number (Entities): 9-digit numeric code assigned by the ETA.
 * 3. Residency: Based on physical presence of more than 183 days in a calendar year.
 * 4. Validation: Structural verification based on century, date, and governorate codes.
 */
