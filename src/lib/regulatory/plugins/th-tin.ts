import { HolderMetadata, TinValidationResult, TinInfo, CountryRegulatoryInfo, TinRequirement } from './index';

/**
 * TIN Validation for Thailand (TH)
 * ID Number / TIN (13 digits)
 */

/**
 * TIN Requirements for Thailand
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
    }
];

/**
 * Country Metadata for Thailand
 */
export const COUNTRY_INFO: CountryRegulatoryInfo = {
    name: 'Tailandia',
    authority: 'Revenue Department (RD)',
    compliance: {
        crsStatus: 'Participating',
        crsDate: 'September 2023',
        fatcaStatus: 'Model 1 (In Force)'
    },
    residency: {
        individual: 'Se considera residente si permanece en Tailandia 180 días o más en un año fiscal.',
        entity: 'Se considera residente si se ha incorporado bajo las leyes de Tailandia.',
        notes: 'Criterio de permanencia física de 180 días.'
    }
};

/**
 * TIN Metadata for Thailand (Era 6.3)
 */
export const TIN_INFO: TinInfo = {
    name: 'Personal Identification Number (PIN)',
    description: 'Unique 13-digit identifier used for identity and tax purposes.',
    placeholder: '1-2345-67890-12-3',
    officialLink: 'https://www.rd.go.th/',
    isOfficial: true,
    lastUpdated: '2026-04-24',
    source: 'OECD Portal / Revenue Department of Thailand',
    entityDifferentiation: {
        logic: 'Numeric sequence. First digit defines citizenship/registration status.',
        individualDescription: '13-digit PIN.',
        businessDescription: '13-digit Tax ID (often matches company registration).'
    }
};

/**
 * Thailand TIN Validator (13 digits) - Era 6.3
 */
export const validateTHTIN = (
    value: string, 
    type: 'INDIVIDUAL' | 'ENTITY' | 'ANY' = 'ANY', 
    metadata?: HolderMetadata
): TinValidationResult => {
    const cleanValue = value.trim().replace(/[\s-]/g, '');
    
    if (/^\d{13}$/.test(cleanValue)) {
        const isOfficial = validateThailandChecksum(cleanValue);
        return {
            isValid: true,
            status: isOfficial ? 'VALID' : 'VALID_UNOFFICIAL',
            isOfficialMatch: isOfficial,
            explanation: decodeThailandTIN(cleanValue) + (isOfficial ? ' Verified via Modulo 11.' : ' Pattern match.')
        };
    }

    return {
        isValid: false,
        status: 'INVALID_FORMAT',
        explanation: 'Thailand PINs (TINs) are exactly 13 digits long.'
    };
};

function decodeThailandTIN(tin: string): string {
    const firstDigit = parseInt(tin[0]);
    const officeCode = tin.substring(1, 5);
    
    const categories: Record<number, string> = {
        0: 'Legal Entity',
        1: 'Thai Citizen (Born after 1984)',
        2: 'Thai Citizen (Born after 1984, delayed reg)',
        3: 'Thai Citizen (Registered before 1984)',
        4: 'Thai Citizen (Delayed registration)',
        5: 'Thai Citizen (Delayed registration / Other)',
        6: 'Foreign Resident / Temporary Alien',
        7: 'Children of Foreigners (Born in Thailand)',
        8: 'Naturalized Thai Citizen / Alien with Resident status'
    };
    
    const category = categories[firstDigit] || 'Other Category';
    return `Thailand PIN, ${category}. Registered at Office ${officeCode}.`;
}

function validateThailandChecksum(tin: string): boolean {
    let sum = 0;
    for (let i = 0; i < 12; i++) {
        sum += parseInt(tin[i]) * (13 - i);
    }
    const remainder = sum % 11;
    let checkDigit = (11 - remainder) % 10;
    return checkDigit === parseInt(tin[12]);
}

/**
 * APPENDIX: FORENSIC CRITERIA
 * Thailand's PIN (Personal Identification Number) is a complex 13-digit identifier.
 * 1. Scope: Issued by the Ministry of Interior (PIN) and Revenue Department (Tax ID).
 * 2. Structure: 
 *    - Digit 1: Status indicator (1-8 for individuals, 0/3 for legal entities).
 *    - Digits 2-5: Registration office/district code.
 *    - Digits 6-10: Sequence.
 *    - Digits 11-12: Sequence/Correction.
 *    - Digit 13: Check digit.
 * 3. Validation: Weighted sum algorithm Modulo 11.
 * 4. Residency: Based on 180-day presence rule.
 */
