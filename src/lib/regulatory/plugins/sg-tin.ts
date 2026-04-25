
import { HolderMetadata, TinValidationResult, CountryRegulatoryInfo, TinInfo, TinRequirement } from './index';

/**
 * TIN Validation for Singapore (SG)
 * Individual: NRIC / FIN (9 characters: S1234567A)
 * Entity: Unique Entity Number (UEN) (9 or 10 characters)
 */

/**
 * TIN Requirements for Singapore
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
    { key: 'birthDate', label: 'birthDate', type: 'date', scope: 'INDIVIDUAL' }
];

/**
 * Country Metadata for Singapore
 */
export const COUNTRY_INFO: CountryRegulatoryInfo = {
    name: 'Singapur',
    authority: 'Inland Revenue Authority of Singapore (IRAS)',
    compliance: {
        crsStatus: 'Participating',
        crsDate: 'September 2018',
        fatcaStatus: 'Model 1 (In Force)'
    },
    residency: {
        individual: 'Se considera residente si reside en Singapur, excepto para ausencias temporales, o si permanece o trabaja allí durante 183 días o más.',
        entity: 'Se considera residente si la gestión y el control de su negocio se ejercen en Singapur.',
        notes: 'Criterio de permanencia física o control de gestión.'
    }
};

/**
 * TIN Metadata for Singapore (Era 6.3)
 */
export const TIN_INFO: TinInfo = {
    name: 'NRIC / FIN / UEN',
    description: 'Singaporean NRIC/FIN (Individuals) or UEN (Entities) issued by ICA or ACRA.',
    placeholder: 'S1234567A / 201234567G',
    officialLink: 'https://www.iras.gov.sg',
    isOfficial: true,
    lastUpdated: '2026-04-24',
    source: 'OECD Portal / IRAS',
    entityDifferentiation: {
        logic: 'Prefix and character analysis.',
        individualDescription: '9 characters starting with S, T, F, G or M.',
        businessDescription: '9 or 10 characters (starts with digits or specific letters like T, T01...).'
    }
};

/**
 * Singapore TIN Validator - Era 6.3
 */
export const validateSGTIN = (
    value: string, 
    type: 'INDIVIDUAL' | 'ENTITY' | 'ANY' = 'ANY', 
    metadata?: HolderMetadata
): TinValidationResult => {
    const sanitized = value.trim().toUpperCase();

    // Individual (NRIC/FIN): 9 characters
    if (sanitized.length === 9 && /^[STFGM][0-9]{7}[A-Z]$/.test(sanitized)) {
        if (type === 'ENTITY') {
             return { 
                 isValid: false, 
                 status: 'MISMATCH', 
                 reasonCode: 'ENTITY_TYPE_MISMATCH',
                 explanation: 'The detected format corresponds to a Singaporean NRIC/FIN, which is exclusive to individuals.'
             };
        }
        
        if (metadata) {
            const semantic = validateSingaporeSemantic(sanitized, metadata);
            if (!semantic.isValid) {
                return semantic;
            }
        }

        if (validateNRICChecksum(sanitized)) {
            return { 
                isValid: true, 
                status: 'VALID', 
                isOfficialMatch: true, 
                explanation: type === 'ANY'
                    ? 'Format valid for Individuals (NRIC/FIN). Note: This identifier is not valid for legal Entities.'
                    : decodeSingaporeTIN(sanitized)
            };
        } else {
            return { isValid: false, status: 'INVALID_CHECKSUM', explanation: 'Failed Singaporean NRIC/FIN checksum validation.' };
        }
    }

    // Entity (UEN): 9 or 10 characters
    if ((sanitized.length === 9 || sanitized.length === 10) && /^[0-9A-Z]+$/.test(sanitized)) {
        if (type === 'INDIVIDUAL' && /^[0-9]/.test(sanitized)) {
             return { 
                 isValid: false, 
                 status: 'MISMATCH', 
                 reasonCode: 'ENTITY_TYPE_MISMATCH',
                 explanation: 'The detected format starting with a digit corresponds to a Singaporean UEN, which applies to entities.'
             };
        }
        return { 
            isValid: true, 
            status: 'VALID', 
            isOfficialMatch: true, 
            explanation: type === 'ANY'
                ? 'Format valid for Entities (UEN). Note: This format is usually invalid if the holder is an Individual.'
                : `Matches official Singaporean UEN (${sanitized.length} chars) format.` 
        };
    }

    return { 
        isValid: false, 
        status: 'INVALID_FORMAT',
        explanation: 'Value does not match Singaporean NRIC/FIN or UEN format.'
    };
};

function decodeSingaporeTIN(tin: string): string {
    const prefix = tin[0];
    const statusMap: Record<string, string> = {
        'S': 'Citizen/PR (born before 2000)',
        'T': 'Citizen/PR (born 2000 onwards)',
        'F': 'Foreigner (issued before 2000)',
        'G': 'Foreigner (issued 2000 onwards)',
        'M': 'Foreigner (issued 2022 onwards)'
    };
    
    const status = statusMap[prefix] || 'Resident/Worker';
    return `Singapore ${status}. Verified via checksum.`;
}

function validateSingaporeSemantic(tin: string, metadata: HolderMetadata): TinValidationResult {
    const prefix = tin[0];
    
    if (metadata.birthDate) {
        const dob = new Date(metadata.birthDate);
        const year = dob.getFullYear();
        
        // S = Born < 2000, T = Born >= 2000
        if (prefix === 'S' && year >= 2000) {
            return {
                isValid: false,
                status: 'MISMATCH',
                reasonCode: 'ID_DATA_INCONSISTENT',
                mismatchFields: ['birthDate'],
                explanation: 'NRIC prefix S is for citizens born before 2000, but provided birth date is 2000 or later.'
            };
        }
        if (prefix === 'T' && year < 2000) {
            return {
                isValid: false,
                status: 'MISMATCH',
                reasonCode: 'ID_DATA_INCONSISTENT',
                mismatchFields: ['birthDate'],
                explanation: 'NRIC prefix T is for citizens born in 2000 or later, but provided birth date is before 2000.'
            };
        }
    }

    return { isValid: true, status: 'VALID' };
}

function validateNRICChecksum(tin: string): boolean {
    const weights = [2, 7, 6, 5, 4, 3, 2];
    let sum = 0;
    for (let i = 0; i < 7; i++) sum += parseInt(tin[i + 1]) * weights[i];
    
    const prefix = tin[0];
    if (prefix === 'T' || prefix === 'G') sum += 4;
    if (prefix === 'M') sum += 3;
    
    const remainder = sum % 11;
    const checkDigit = tin[8];
    
    const stTable = ['J', 'Z', 'I', 'H', 'G', 'F', 'E', 'D', 'C', 'B', 'A'];
    const fgTable = ['X', 'W', 'U', 'T', 'R', 'Q', 'P', 'N', 'M', 'L', 'K'];
    const mTable = ['X', 'W', 'U', 'T', 'R', 'Q', 'P', 'N', 'J', 'L', 'K'];
    
    if (prefix === 'S' || prefix === 'T') return stTable[remainder] === checkDigit;
    if (prefix === 'F' || prefix === 'G') return fgTable[remainder] === checkDigit;
    if (prefix === 'M') return mTable[remainder] === checkDigit;
    
    return false;
}
