
import { HolderMetadata, TinValidationResult, CountryRegulatoryInfo, TinInfo, TinRequirement } from './index';

/**
 * TIN Validation for Malaysia (MY)
 * Individual: MyKad (12 digits) or Income Tax No (SG/OG prefix)
 * Entity: Income Tax No (C prefix)
 */

/**
 * TIN Requirements for Malaysia
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
 * Country Metadata for Malaysia
 */
export const COUNTRY_INFO: CountryRegulatoryInfo = {
    name: 'Malasia',
    authority: 'Lembaga Hasil Dalam Negeri (LHDN) / Inland Revenue Board',
    compliance: {
        crsStatus: 'Participating',
        crsDate: 'September 2018',
        fatcaStatus: 'Model 1 (In Force)'
    },
    residency: {
        individual: 'Se considera residente si permanece en Malasia durante 182 días o más en un año natural.',
        entity: 'Se considera residente si su gestión y control se ejercen en Malasia en cualquier momento del año fiscal.',
        notes: 'Criterio de permanencia física o control de gestión.'
    }
};

/**
 * TIN Metadata for Malaysia (Era 6.3)
 */
export const TIN_INFO: TinInfo = {
    name: 'Income Tax No. / MyKad',
    description: 'Malaysian Income Tax Number or MyKad issued by LHDN or National Registration Department.',
    placeholder: 'SG 1234567890 / 800101-14-1234',
    officialLink: 'https://www.hasil.gov.my',
    isOfficial: true,
    lastUpdated: '2026-04-24',
    source: 'OECD Portal / LHDN',
    entityDifferentiation: {
        logic: 'Prefix analysis.',
        individualDescription: 'MyKad (12 digits) or Tax No starting with SG or OG.',
        businessDescription: 'Tax No starting with C or CS.'
    }
};

/**
 * Malaysia TIN Validator - Era 6.3
 */
export const validateMYTIN = (
    value: string, 
    type: 'INDIVIDUAL' | 'ENTITY' | 'ANY' = 'ANY', 
    metadata?: HolderMetadata
): TinValidationResult => {
    const sanitized = value.replace(/[\s-]/g, '').toUpperCase();

    // MyKad: 12 digits
    if (sanitized.length === 12 && /^[0-9]{12}$/.test(sanitized)) {
        if (type === 'ENTITY') {
            return { 
                isValid: false, 
                status: 'MISMATCH', 
                reasonCode: 'ENTITY_TYPE_MISMATCH',
                explanation: 'The detected format (12 digits) corresponds to a Malaysian MyKad, which is exclusive to individuals.'
            };
        }
        if (metadata) {
            const semantic = validateMalaysiaSemantic(sanitized, metadata);
            if (!semantic.isValid) {
                return semantic;
            }
        }

        return { 
            isValid: true, 
            status: 'VALID', 
            isOfficialMatch: true, 
            explanation: type === 'ANY'
                ? 'Format valid for Individuals (MyKad). Note: This identifier is not valid for legal Entities.'
                : decodeMalaysiaTIN(sanitized)
        };
    }

    // Income Tax No: Prefix based
    if (/^(SG|OG|C|CS|E|D|F|TA|TC|TP|TR|TN|IT)\d+$/.test(sanitized)) {
        const prefix = sanitized.substring(0, sanitized.startsWith('C') ? 1 : 2);
        
        if (['SG', 'OG'].includes(prefix) && type === 'ENTITY') {
             return { 
                 isValid: false, 
                 status: 'MISMATCH', 
                 reasonCode: 'ENTITY_TYPE_MISMATCH',
                 explanation: `The Malaysian Tax prefix '${prefix}' is reserved for Individuals.`
             };
        }
        
        if (prefix === 'C' && type === 'INDIVIDUAL') {
             return { 
                 isValid: false, 
                 status: 'MISMATCH', 
                 reasonCode: 'ENTITY_TYPE_MISMATCH',
                 explanation: 'The Malaysian Tax prefix \'C\' is reserved for Companies/Entities.'
             };
        }

        const isIndividualPrefix = ['SG', 'OG', 'IT'].includes(prefix);
        const isEntityPrefix = prefix === 'C' || prefix === 'CS';

        return { 
            isValid: true, 
            status: 'VALID', 
            isOfficialMatch: true, 
            explanation: type === 'ANY'
                ? (isEntityPrefix 
                    ? 'Format valid for Entities (Tax No). Note: This identifier is not valid for Individuals.'
                    : (isIndividualPrefix 
                        ? 'Format valid for Individuals (Tax No). Note: This identifier is not valid for legal Entities.'
                        : `Matches official Malaysian Income Tax Number format with prefix ${prefix}.`))
                : `Matches official Malaysian Income Tax Number format with prefix ${prefix}.` 
        };
    }

    return { 
        isValid: false, 
        status: 'INVALID_FORMAT',
        explanation: 'Value does not match Malaysian MyKad (12 digits) or Income Tax Number format.'
    };
};

function decodeMalaysiaTIN(tin: string): string {
    const yy = tin.substring(0, 2);
    const mm = tin.substring(2, 4);
    const dd = tin.substring(4, 6);
    const pb = tin.substring(6, 8);
    const genderDigit = parseInt(tin[11]);
    const gender = genderDigit % 2 === 0 ? 'Female' : 'Male';
    
    // Birthplace mapping (simplified)
    const stateCodes: Record<string, string> = {
        '01': 'Johor', '02': 'Kedah', '03': 'Kelantan', '04': 'Melaka', '05': 'Negeri Sembilan',
        '06': 'Pahang', '07': 'Pulau Pinang', '08': 'Perak', '09': 'Perlis', '10': 'Selangor',
        '11': 'Terengganu', '12': 'Sabah', '13': 'Sarawak', '14': 'Kuala Lumpur', '15': 'Labuan', '16': 'Putrajaya'
    };
    const state = stateCodes[pb] || (parseInt(pb) > 16 ? 'Foreigner/Unknown' : 'State Code ' + pb);
    
    return `Individual MyKad (${gender}), born on ${dd}/${mm}/${yy} in ${state}. Verified via structure.`;
}

function validateMalaysiaSemantic(tin: string, metadata: HolderMetadata): TinValidationResult {
    const mismatchFields: string[] = [];
    const yyPart = tin.substring(0, 2);
    const mmPart = tin.substring(2, 4);
    const ddPart = tin.substring(4, 6);
    const genderDigit = parseInt(tin[11]);

    // Gender check (Odd=Male, Even=Female)
    if (metadata.gender) {
        const isMale = genderDigit % 2 !== 0;
        if ((metadata.gender === 'M' && !isMale) || (metadata.gender === 'F' && isMale)) {
            mismatchFields.push('gender');
        }
    }

    // Birth Date check
    if (metadata.birthDate) {
        const dob = new Date(metadata.birthDate);
        const day = dob.getDate().toString().padStart(2, '0');
        const month = (dob.getMonth() + 1).toString().padStart(2, '0');
        const yearSuffix = dob.getFullYear().toString().slice(-2);
        
        if (day !== ddPart || month !== mmPart || yearSuffix !== yyPart) {
            mismatchFields.push('birthDate');
        }
    }

    if (mismatchFields.length > 0) {
        return {
            isValid: false,
            status: 'MISMATCH',
            reasonCode: 'ID_DATA_INCONSISTENT',
            mismatchFields,
            explanation: `Inconsistency in ${mismatchFields.join(', ')} with Malaysian MyKad structure.`
        };
    }

    return { isValid: true, status: 'VALID' };
}
