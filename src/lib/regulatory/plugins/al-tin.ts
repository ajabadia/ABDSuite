
import { HolderMetadata, TinValidationResult, CountryRegulatoryInfo, TinInfo, TinRequirement } from './index';

/**
 * TIN Validation for Albania (AL)
 * Individual: Personal Number (NID) (10 characters: A12345678B)
 * Entity: NIPT (10 characters: L12345678B)
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
 * Country Metadata for Albania
 */
export const COUNTRY_INFO: CountryRegulatoryInfo = {
    name: 'Albania',
    authority: 'General Directorate of Taxes',
    compliance: {
        crsStatus: 'Participating',
        crsDate: 'September 2020',
        fatcaStatus: 'Model 1 (In Force)'
    },
    residency: {
        individual: 'Se considera residente si tiene su residencia principal en Albania o si permanece allí durante más de 183 días en el año civil.',
        entity: 'Se considera residente si se ha incorporado en Albania o si su gestión y control se ejercen allí.',
        notes: 'Criterio de residencia principal o estancia de 183 días.'
    }
};

/**
 * TIN Metadata for Albania (Era 6.3)
 */
export const TIN_INFO: TinInfo = {
    name: 'NID / NIPT',
    description: 'Albanian NID (Individuals) or NIPT (Entities) issued by the General Directorate of Taxes.',
    placeholder: 'A12345678B / L12345678B',
    officialLink: 'https://www.tatime.gov.al',
    isOfficial: true,
    lastUpdated: '2026-04-24',
    source: 'OECD Portal / Albania Taxes',
    entityDifferentiation: {
        logic: 'Prefix analysis.',
        individualDescription: '10-character NID starting with a letter (typically birth-related).',
        businessDescription: '10-character NIPT starting with a specific letter (L, J, K...).'
    }
};

/**
 * Albania TIN Validator - Era 6.3
 */
export const validateALTIN = (
    value: string, 
    type: 'INDIVIDUAL' | 'ENTITY' | 'ANY' = 'ANY', 
    metadata?: HolderMetadata
): TinValidationResult => {
    const sanitized = value.trim().toUpperCase();

    if (sanitized.length === 10 && /^[A-Z][0-9]{8}[A-Z]$/.test(sanitized)) {
        const isEntity = ['L', 'K', 'J', 'M'].includes(sanitized[0]);
        
        if (type === 'INDIVIDUAL' && isEntity) {
            return { isValid: false, status: 'MISMATCH', reasonCode: 'ENTITY_TYPE_MISMATCH' };
        }
        if (type === 'ENTITY' && !isEntity) {
            return { isValid: false, status: 'MISMATCH', reasonCode: 'ENTITY_TYPE_MISMATCH' };
        }

        const semantic = isEntity ? null : validateAlbaniaSemantic(sanitized, metadata);
        if (semantic && !semantic.isValid) {
            return semantic;
        }

        return { 
            isValid: true, 
            status: 'VALID', 
            isOfficialMatch: true, 
            explanation: decodeAlbaniaTIN(sanitized)
        };
    }

    return { 
        isValid: false, 
        status: 'INVALID_FORMAT',
        explanation: 'Value does not match Albanian identifier (10 chars) format.'
    };
};

function decodeAlbaniaTIN(tin: string): string {
    const firstChar = tin[0];
    const isEntity = ['L', 'K', 'J', 'M'].includes(firstChar);
    
    if (isEntity) {
        return `NIPT (Business): Starts with '${firstChar}' (Registration decade/type). Verified via structure.`;
    }

    const monthPart = parseInt(tin.substring(2, 4));
    const dayPart = tin.substring(4, 6);
    const gender = monthPart > 50 ? 'Female' : 'Male';
    const month = monthPart > 50 ? monthPart - 50 : monthPart;
    
    return `NID (Individual): ${gender}, born on ${dayPart}/${month.toString().padStart(2, '0')} (Year encoded in '${tin.substring(0, 2)}'). Verified via structure.`;
}

function validateAlbaniaSemantic(tin: string, metadata?: HolderMetadata): TinValidationResult | null {
    if (!metadata) return null;

    const monthPart = parseInt(tin.substring(2, 4));
    const dayPart = parseInt(tin.substring(4, 6));
    const mismatchFields: string[] = [];

    // Gender check
    if (metadata.gender) {
        const isFemale = monthPart > 50;
        const expectedFemale = metadata.gender === 'F';
        if (isFemale !== expectedFemale) {
            mismatchFields.push('gender');
        }
    }

    // Birth Date check (Day/Month only, as Year is encoded in a letter)
    if (metadata.birthDate) {
        const date = new Date(metadata.birthDate);
        const mMonth = date.getUTCMonth() + 1;
        const mDay = date.getUTCDate();
        
        const tinMonth = monthPart > 50 ? monthPart - 50 : monthPart;
        
        if (tinMonth !== mMonth || dayPart !== mDay) {
            mismatchFields.push('birthDate');
        }
    }

    if (mismatchFields.length > 0) {
        const tinMonth = monthPart > 50 ? monthPart - 50 : monthPart;
        return {
            isValid: false,
            status: 'MISMATCH',
            reasonCode: 'ID_DATA_INCONSISTENT',
            mismatchFields,
            explanation: `Albanian NID indicates ${dayPart}/${tinMonth} and ${monthPart > 50 ? 'Female' : 'Male'}, which contradicts the provided metadata.`
        };
    }

    return { isValid: true, status: 'VALID' };
}

/**
 * APPENDIX: FORENSIC CRITERIA
 * Albania uses a 10-character alphanumeric system for tax identification.
 * 1. Individual (NID): 10 characters (A12345678B). The initial letter often relates 
 *    to birth century/region coding.
 * 2. Entity (NIPT): 10 characters (L12345678B). Usually starts with 'L' for local 
 *    entities or 'K' for specific categories.
 * 3. Structure: Letter + 8 numeric digits + Letter.
 * 4. Residency: Centered on the 183-day rule within a calendar year.
 */

