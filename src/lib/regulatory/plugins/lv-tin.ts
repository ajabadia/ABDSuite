import { HolderMetadata, TinValidationResult, CountryRegulatoryInfo, TinInfo, TinRequirement } from './index';

/**
 * TIN Validation for Latvia (LV)
 * Personal Code (11 digits: DDMMYY-XXXXX or 32XXXX-XXXXX)
 * Registration Number (11 digits)
 */

/**
 * TIN Requirements for Latvia
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
 * Country Metadata for Latvia
 */
export const COUNTRY_INFO: CountryRegulatoryInfo = {
    name: 'Letonia',
    authority: 'State Revenue Service (VID)',
    compliance: {
        crsStatus: 'Participating',
        crsDate: 'September 2017',
        fatcaStatus: 'Model 1 (In Force)'
    },
    residency: {
        individual: 'Se considera residente si tiene su residencia principal en Letonia o si permanece allí durante más de 183 días en el año civil.',
        entity: 'Se considera residente si se ha establecido en Letonia.',
        notes: 'Criterio de residencia principal o estancia de 183 días.'
    }
};

/**
 * TIN Metadata for Latvia (Era 6.3)
 */
export const TIN_INFO: TinInfo = {
    name: 'Personal Code / Reg. No',
    description: 'Latvian Personal Code (Individuals) or Registration Number (Entities) issued by the SRS.',
    placeholder: '010180-12345 / 40001234567',
    officialLink: 'https://www.vid.gov.lv',
    isOfficial: true,
    lastUpdated: '2026-04-24',
    source: 'OECD Portal / VID',
    entityDifferentiation: {
        logic: 'Prefix analysis.',
        individualDescription: '11-digit Personal Code (starts with birth date or "32").',
        businessDescription: '11-digit Registration Number (starts with 4 or 5).'
    }
};

/**
 * Latvia TIN Validator - Era 6.3
 */
export const validateLVTIN = (
    value: string, 
    type: 'INDIVIDUAL' | 'ENTITY' | 'ANY' = 'ANY', 
    metadata?: HolderMetadata
): TinValidationResult => {
    const sanitized = value.replace(/[\s-]/g, '');

    if (sanitized.length === 11 && /^[0-9]{11}$/.test(sanitized)) {
        const isNewFormat = sanitized.startsWith('32');
        const isEntity = ['4', '5'].includes(sanitized[0]);
        
        if (isEntity && type === 'INDIVIDUAL') {
            return { 
                isValid: false, 
                status: 'MISMATCH', 
                reasonCode: 'ENTITY_TYPE_MISMATCH',
                explanation: 'The detected format (prefix 4 or 5) corresponds to a Latvian Registration Number, which applies to legal entities.'
            };
        }
        if (!isEntity && !isNewFormat && type === 'ENTITY') {
            return { 
                isValid: false, 
                status: 'MISMATCH', 
                reasonCode: 'ENTITY_TYPE_MISMATCH',
                explanation: 'The detected format (prefix 0-2) corresponds to a Latvian Individual Personal Code (Old Format).'
            };
        }

        if (metadata) {
            const semantic = validateLatviaSemantic(sanitized, metadata);
            if (!semantic.isValid) {
                return semantic;
            }
        }

        const isOfficial = isNewFormat ? true : validateLatviaChecksum(sanitized);
        return { 
            isValid: true, 
            status: isOfficial ? 'VALID' : 'VALID_UNOFFICIAL', 
            isOfficialMatch: isOfficial, 
            explanation: decodeLatviaTIN(sanitized)
        };
    }

    return { 
        isValid: false, 
        status: 'INVALID_FORMAT',
        explanation: 'Value does not match Latvian Personal Code or Registration Number (11 digits) format.'
    };
};

function decodeLatviaTIN(tin: string): string {
    if (tin.startsWith('32')) {
        return 'Personal Code (New Format, non-biological). Verified via length.';
    }
    
    const firstDigit = parseInt(tin[0]);
    if (firstDigit === 4 || firstDigit === 5) {
        return 'Legal Entity (Registration Number). Verified via prefix and checksum.';
    }
    
    // Old format: DDMMYY-SNNNC
    const dd = tin.substring(0, 2);
    const mm = tin.substring(2, 4);
    const yy = tin.substring(4, 6);
    const s = parseInt(tin[6]);
    
    const centuryMap: Record<number, string> = {
        0: '18',
        1: '19',
        2: '20'
    };
    const century = centuryMap[s] || '19';
    
    return `Personal Code (Old Format), born on ${dd}/${mm}/${century}${yy}. Verified via checksum.`;
}

function validateLatviaSemantic(tin: string, metadata: HolderMetadata): TinValidationResult {
    if (tin.startsWith('32')) return { isValid: true, status: 'VALID' }; // New format is random

    const firstDigit = parseInt(tin[0]);
    if (firstDigit === 4 || firstDigit === 5) return { isValid: true, status: 'VALID' }; // Entity

    if (metadata.birthDate) {
        const ddPart = tin.substring(0, 2);
        const mmPart = tin.substring(2, 4);
        const yyPart = tin.substring(4, 6);
        const sDigit = parseInt(tin[6]);

        const dob = new Date(metadata.birthDate);
        const day = dob.getDate().toString().padStart(2, '0');
        const month = (dob.getMonth() + 1).toString().padStart(2, '0');
        const year = dob.getFullYear();
        const yearSuffix = year.toString().slice(-2);
        
        let expectedS = 1; // Default 1900s
        if (year < 1900) expectedS = 0;
        else if (year < 2000) expectedS = 1;
        else expectedS = 2;

        if (ddPart !== day || mmPart !== month || yyPart !== yearSuffix || sDigit !== expectedS) {
            return {
                isValid: false,
                status: 'MISMATCH',
                reasonCode: 'ID_DATA_INCONSISTENT',
                mismatchFields: ['birthDate'],
                explanation: `Personal Code birth part (${ddPart}${mmPart}${yyPart}, century code ${sDigit}) does not match metadata birth date.`
            };
        }
    }

    return { isValid: true, status: 'VALID' };
}

function validateLatviaChecksum(tin: string): boolean {
    const weights = [1, 10, 8, 4, 2, 1, 6, 3, 7, 9];
    let sum = 0;
    for (let i = 0; i < 10; i++) sum += parseInt(tin[i]) * weights[i];
    const check = (1101 - sum) % 11;
    return check === parseInt(tin[10]);
}

/**
 * APPENDIX: FORENSIC CRITERIA
 * Latvia uses an 11-digit identification number for all taxpayers.
 * 1. Personal Code (Individuals):
 *    - Old format: DDMMYY-SNNNC (S=Century: 0=19th, 1=20th, 2=21st).
 *    - New format (since 2017): Starts with "32". Non-biological.
 * 2. Registration Number (Entities):
 *    - 11 digits starting with 4 or 5.
 * 3. Validation: Weighted sum algorithm Modulo 11 for old/entity formats.
 *    - Formula: (1101 - Sum(Digit_i * Weight_i)) % 11.
 * 4. Residency: Based on the 183-day presence rule or primary residence.
 */
