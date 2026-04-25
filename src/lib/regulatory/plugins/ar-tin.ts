import { HolderMetadata, TinValidationResult, CountryRegulatoryInfo, TinInfo, TinRequirement } from './index';

/**
 * TIN Requirements for Argentina
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
    { key: 'gender', label: 'gender', type: 'select', scope: 'INDIVIDUAL', options: [
        { value: 'M', label: 'male' },
        { value: 'F', label: 'female' }
    ]}
];

/**
 * Country Metadata for Argentina
 */
export const COUNTRY_INFO: CountryRegulatoryInfo = {
    name: 'Argentina',
    authority: 'Administración Federal de Ingresos Públicos (AFIP)',
    compliance: {
        crsStatus: 'Participating',
        crsDate: 'September 2017',
        fatcaStatus: 'IGA Model 1'
    },
    residency: {
        individual: 'Se considera residente si permanece más de 12 meses en Argentina o si el centro de sus intereses vitales está en el país.',
        entity: 'Se considera residente si está constituida en Argentina o tiene su sede de dirección efectiva en el país.',
        notes: 'Criterio de permanencia o centro de intereses vitales.'
    }
};

/**
 * TIN Metadata for Argentina (Era 6.3)
 */
export const TIN_INFO: TinInfo = {
    name: 'CUIT / CUIL',
    description: 'Unique identifier issued by the AFIP for tax purposes.',
    placeholder: '20-12345678-9',
    officialLink: 'https://www.afip.gob.ar/',
    isOfficial: true,
    lastUpdated: '2026-04-24',
    source: 'OECD Portal / AFIP',
    entityDifferentiation: {
        logic: 'Prefix (20, 27, 30, etc.) analysis.',
        individualDescription: 'Prefixes 20, 23, 24, 27.',
        businessDescription: 'Prefixes 30, 33, 34.'
    }
};

/**
 * Argentina TIN Validator (11 digits) - Era 6.3
 */
export const validateARTIN = (
    value: string, 
    type: 'INDIVIDUAL' | 'ENTITY' | 'ANY' = 'ANY', 
    metadata?: HolderMetadata
): TinValidationResult => {
    const sanitized = value.trim().replace(/-/g, '');
    
    if (!/^\d{11}$/.test(sanitized)) {
        return {
            isValid: false,
            status: 'INVALID_FORMAT',
            explanation: 'Argentina CUITs/CUILs must be exactly 11 digits.'
        };
    }

    // Checksum Validation (Modulo 11)
    const weights = [5, 4, 3, 2, 7, 6, 5, 4, 3, 2];
    let sum = 0;
    for (let i = 0; i < 10; i++) {
        sum += parseInt(sanitized[i]) * weights[i];
    }
    const checkDigit = parseInt(sanitized[10]);
    const res = sum % 11;
    const expectedCheck = res === 0 ? 0 : (res === 1 ? -1 : 11 - res);
    
    if (expectedCheck !== checkDigit && expectedCheck !== -1) {
         return { isValid: false, status: 'INVALID_CHECKSUM', explanation: 'Failed AFIP checksum validation.' };
    }

    const prefix = sanitized.substring(0, 2);
    const isEntityPrefix = ['30', '33', '34'].includes(prefix);
    const isIndividualPrefix = ['20', '23', '24', '27'].includes(prefix);

    if (isEntityPrefix && type === 'INDIVIDUAL') {
        return { 
            isValid: false, 
            status: 'MISMATCH', 
            reasonCode: 'ENTITY_TYPE_MISMATCH',
            explanation: `The CUIT prefix '${prefix}' is reserved for Legal Entities/Organizations.`
        };
    }
    if (isIndividualPrefix && type === 'ENTITY') {
        return { 
            isValid: false, 
            status: 'MISMATCH', 
            reasonCode: 'ENTITY_TYPE_MISMATCH',
            explanation: `The CUIT/CUIL prefix '${prefix}' is reserved for Individuals (Natural Persons).`
        };
    }

    // High-Fidelity Semantic Check (Era 6.3)
    if (metadata && metadata.gender) {
        const isFemalePrefix = prefix === '27';
        const isMalePrefix = prefix === '20';
        
        if (metadata.gender === 'F' && isMalePrefix) {
            return { 
                isValid: false, 
                status: 'MISMATCH', 
                reasonCode: 'METADATA_MISMATCH',
                explanation: 'CUIT prefix (20) implies Male, but metadata specifies Female.'
            };
        }
        if (metadata.gender === 'M' && isFemalePrefix) {
            return { 
                isValid: false, 
                status: 'MISMATCH', 
                reasonCode: 'METADATA_MISMATCH',
                explanation: 'CUIT prefix (27) implies Female, but metadata specifies Male.'
            };
        }
    }

    const explanation = decodeArgentinaTIN(sanitized);

    return {
        isValid: true,
        status: 'VALID',
        isOfficialMatch: true,
        explanation: type === 'ANY'
            ? (isEntityPrefix 
                ? 'Format valid for Entities (CUIT). Note: This identifier is not valid for Individuals.'
                : 'Format valid for Individuals (CUIL). Note: This identifier is not valid for legal Entities.')
            : explanation
    };
};

function decodeArgentinaTIN(tin: string): string {
    const prefix = tin.substring(0, 2);
    const prefixes: Record<string, string> = {
        '20': 'Male (Individual)',
        '27': 'Female (Individual)',
        '30': 'Juridical Entity (Company)',
        '23': 'Special Individual Case (Transition/Non-standard)',
        '24': 'Special Individual Case (Transition/Non-standard)',
        '33': 'Juridical Entity (Special)',
        '34': 'Juridical Entity (Special)'
    };
    
    const type = prefixes[prefix] || 'Other/Undefined';
    return `CUIT/CUIL: ${type}. DNI/Number Part: ${tin.substring(2, 10)}. Verified via structure.`;
}

/**
 * APPENDIX: FORENSIC CRITERIA
 * Argentina's CUIT (entities) and CUIL (individuals) follow a rigid prefix-based system.
 * 1. Prefixes:
 *    - 20: Male individuals.
 *    - 27: Female individuals.
 *    - 23/24: Individuals where the prefix 20/27 results in a checksum collision.
 *    - 30/33/34: Legal entities and organizations.
 * 2. Structure: Prefix (2 digits) + ID Number (8 digits) + Check Digit (1 digit).
 * 3. Checksum: Validated using weights [5,4,3,2,7,6,5,4,3,2] and Modulo 11.
 * 4. Residency: Reside if physically present for 12+ months or center of vital 
 *    interests.
 */
