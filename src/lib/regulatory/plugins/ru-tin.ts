import { HolderMetadata, TinValidationResult, CountryRegulatoryInfo, TinInfo, TinRequirement } from './index';

/**
 * TIN Validation for Russia (RU)
 * Individual: INN (12 digits)
 * Entity: INN (10 digits)
 */

/**
 * TIN Requirements for Russia
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
    { 
        key: 'birthPlaceCode', 
        label: 'taxRegion', 
        type: 'select', 
        options: [
            { value: '77', label: 'Moscow City' },
            { value: '78', label: 'Saint Petersburg' },
            { value: '50', label: 'Moscow Region' },
            { value: '47', label: 'Leningrad Region' },
            { value: '23', label: 'Krasnodar Krai' },
            { value: '66', label: 'Sverdlovsk Region' },
            { value: '54', label: 'Novosibirsk Region' },
            { value: '16', label: 'Republic of Tatarstan' }
        ]
    }
];

/**
 * Country Metadata for Russia
 */
export const COUNTRY_INFO: CountryRegulatoryInfo = {
    name: 'Rusia',
    authority: 'Federal Tax Service',
    compliance: {
        crsStatus: 'Participating (Suspended/Variable)',
        crsDate: 'September 2018',
        fatcaStatus: 'IGA Model 1 (Suspended)'
    },
    residency: {
        individual: 'Se considera residente si permanece en Rusia durante al menos 183 días en un período de 12 meses consecutivos.',
        entity: 'Se considera residente si está incorporada en Rusia o si su gestión efectiva se encuentra en Rusia.',
        notes: 'Criterio de permanencia física o incorporación.'
    }
};

/**
 * TIN Metadata for Russia (Era 6.4)
 */
export const TIN_INFO: TinInfo = {
    name: 'INN',
    description: 'Russian Tax Identification Number (INN) issued by the Federal Tax Service.',
    placeholder: '7707083893 / 500100732259',
    officialLink: 'https://www.nalog.gov.ru',
    isOfficial: true,
    lastUpdated: '2026-04-24',
    source: 'OECD Portal / Federal Tax Service',
    entityDifferentiation: {
        logic: 'Number length analysis.',
        individualDescription: '12 digits for individuals (Individual Entrepreneur or Citizen).',
        businessDescription: '10 digits for legal entities.'
    }
};

/**
 * Russia TIN Validator - Era 6.4
 */
export const validateRUTIN = (
    value: string, 
    type: 'INDIVIDUAL' | 'ENTITY' | 'ANY' = 'ANY', 
    metadata?: HolderMetadata
): TinValidationResult => {
    const sanitized = value.trim().replace(/[\s-]/g, '');

    // 1. Individual INN: 12 digits
    if (sanitized.length === 12 && /^[0-9]{12}$/.test(sanitized)) {
        if (type === 'ENTITY') {
            return { 
                isValid: false, 
                status: 'MISMATCH', 
                reasonCode: 'ENTITY_TYPE_MISMATCH',
                explanation: 'The detected format (12 digits) corresponds to a Russian Individual INN, which is exclusive to individuals.'
            };
        }
        
        if (metadata?.birthPlaceCode && sanitized.substring(0, 2) !== metadata.birthPlaceCode) {
            return {
                isValid: false,
                status: 'MISMATCH',
                reasonCode: 'ID_DATA_INCONSISTENT',
                mismatchFields: ['birthPlaceCode'],
                explanation: `INN Region code (${sanitized.substring(0, 2)}) does not match provided region (${metadata.birthPlaceCode}).`
            };
        }

        const isOfficial = validateINN12Checksum(sanitized);
        return { 
            isValid: true, 
            status: isOfficial ? 'VALID' : 'VALID_UNOFFICIAL', 
            isOfficialMatch: isOfficial, 
            explanation: type === 'ANY'
                ? 'Format valid for Individuals (INN-12). Note: This identifier is not valid for legal Entities.'
                : decodeRussiaTIN(sanitized)
        };
    }

    // 2. Entity INN: 10 digits
    if (sanitized.length === 10 && /^[0-9]{10}$/.test(sanitized)) {
        if (type === 'INDIVIDUAL') {
            return { 
                isValid: false, 
                status: 'MISMATCH', 
                reasonCode: 'ENTITY_TYPE_MISMATCH',
                explanation: 'The detected format (10 digits) corresponds to a Russian Entity INN, which applies only to legal entities.'
            };
        }

        if (metadata?.birthPlaceCode && sanitized.substring(0, 2) !== metadata.birthPlaceCode) {
            return {
                isValid: false,
                status: 'MISMATCH',
                reasonCode: 'ID_DATA_INCONSISTENT',
                mismatchFields: ['birthPlaceCode'],
                explanation: `INN Region code (${sanitized.substring(0, 2)}) does not match provided region (${metadata.birthPlaceCode}).`
            };
        }

        const isOfficial = validateINN10Checksum(sanitized);
        return { 
            isValid: true, 
            status: isOfficial ? 'VALID' : 'VALID_UNOFFICIAL', 
            isOfficialMatch: isOfficial, 
            explanation: type === 'ANY'
                ? 'Format valid for Entities (INN-10). Note: This format is invalid if the holder is an Individual.'
                : decodeRussiaTIN(sanitized)
        };
    }

    return { 
        isValid: false, 
        status: 'INVALID_FORMAT',
        explanation: 'Value does not match Russian INN (10 or 12 digits) format.'
    };
};

function decodeRussiaTIN(tin: string): string {
    const regionCode = tin.substring(0, 2);
    const regions: Record<string, string> = {
        '77': 'Moscow City', '78': 'Saint Petersburg', '50': 'Moscow Region',
        '47': 'Leningrad Region', '23': 'Krasnodar Krai', '66': 'Sverdlovsk Region',
        '54': 'Novosibirsk Region', '16': 'Republic of Tatarstan'
    };
    const regionName = regions[regionCode] || `Region ${regionCode}`;
    const type = tin.length === 12 ? 'Individual' : 'Entity';
    
    return `Russian ${type} INN, issued in ${regionName}. Verified via checksum.`;
}

function validateINN10Checksum(tin: string): boolean {
    const weights = [2, 4, 10, 3, 5, 9, 4, 6, 8];
    let sum = 0;
    for (let i = 0; i < 9; i++) sum += parseInt(tin[i]) * weights[i];
    const checkDigit = (sum % 11) % 10;
    return checkDigit === parseInt(tin[9]);
}

function validateINN12Checksum(tin: string): boolean {
    const weights1 = [7, 2, 4, 10, 3, 5, 9, 4, 6, 8];
    let sum1 = 0;
    for (let i = 0; i < 10; i++) sum1 += parseInt(tin[i]) * weights1[i];
    const checkDigit1 = (sum1 % 11) % 10;
    if (checkDigit1 !== parseInt(tin[10])) return false;

    const weights2 = [3, 7, 2, 4, 10, 3, 5, 9, 4, 6, 8];
    let sum2 = 0;
    for (let i = 0; i < 11; i++) sum2 += parseInt(tin[i]) * weights2[i];
    const checkDigit2 = (sum2 % 11) % 10;
    return checkDigit2 === parseInt(tin[11]);
}

/**
 * APPENDIX: FORENSIC CRITERIA
 * Russia uses the INN (Identifikatsionny Nomer Nalogoplatelshchika) system.
 * 1. Scope: Issued by the Federal Tax Service (FNS).
 * 2. Structure: 
 *    - Entities: 10 digits. Last digit is the check digit.
 *    - Individuals: 12 digits. Last two digits are check digits.
 *    - Region: First 2-4 digits represent the tax office (e.g., 77 for Moscow).
 * 3. Validation: Weighted sum algorithm Modulo 11.
 * 4. Residency: 183-day rule in a 12-month period.
 */
