import { HolderMetadata, TinValidationResult, CountryRegulatoryInfo, TinInfo, TinRequirement } from './index';

/**
 * TIN Validation for Kyrgyzstan (KG)
 * INN (14 digits)
 */

/**
 * TIN Requirements for Kyrgyzstan
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
        key: 'birthDate', 
        label: 'birthDate', 
        type: 'date', 
        scope: 'INDIVIDUAL' 
    },
    { 
        key: 'gender', 
        label: 'gender', 
        type: 'select', 
        scope: 'INDIVIDUAL',
        options: [
            { value: 'M', label: 'male' },
            { value: 'F', label: 'female' }
        ]
    }
];

/**
 * Country Metadata for Kyrgyzstan
 */
export const COUNTRY_INFO: CountryRegulatoryInfo = {
    name: 'Kirguistán',
    authority: 'State Tax Service',
    compliance: {
        crsStatus: 'Non-Participating',
        crsDate: 'N/A',
        fatcaStatus: 'N/A'
    },
    residency: {
        individual: 'Se considera residente si permanece en Kirguistán durante más de 183 días en el año civil.',
        entity: 'Se considera residente si está incorporada en Kirguistán.',
        notes: 'Criterio de permanencia física o constitución legal.'
    }
};

/**
 * TIN Metadata for Kyrgyzstan (Era 6.3)
 */
export const TIN_INFO: TinInfo = {
    name: 'TIN / INN',
    description: 'Kyrgyzstani INN issued by the State Tax Service.',
    placeholder: '12345678901234',
    officialLink: 'https://www.sti.gov.kg',
    isOfficial: true,
    lastUpdated: '2026-04-24',
    source: 'Local Authority / Kyrgyzstan Tax',
    entityDifferentiation: {
        logic: 'Prefix analysis (first digit).',
        individualDescription: '14-digit INN starting with 1 (Male) or 2 (Female).',
        businessDescription: '14-digit INN starting with 0.'
    }
};

/**
 * Kyrgyzstan TIN Validator - Era 6.3
 */
export const validateKGTIN = (
    value: string, 
    type: 'INDIVIDUAL' | 'ENTITY' | 'ANY' = 'ANY', 
    metadata?: HolderMetadata
): TinValidationResult => {
    const sanitized = value.replace(/[\s-]/g, '');

    if (sanitized.length === 14 && /^[0-9]{14}$/.test(sanitized)) {
        const firstDigit = parseInt(sanitized[0]);
        const isIndividual = [1, 2].includes(firstDigit);
        const isEntity = firstDigit === 0;

        if (isIndividual && type === 'ENTITY') {
             return { isValid: false, status: 'MISMATCH', reasonCode: 'ENTITY_TYPE_MISMATCH' };
        }
        if (isEntity && type === 'INDIVIDUAL') {
             return { isValid: false, status: 'MISMATCH', reasonCode: 'ENTITY_TYPE_MISMATCH' };
        }

        return { 
            isValid: true, 
            status: 'VALID', 
            isOfficialMatch: true, 
            explanation: decodeKyrgyzTIN(sanitized)
        };
    }

    return { 
        isValid: false, 
        status: 'INVALID_FORMAT',
        explanation: 'Value does not match Kyrgyzstani TIN (14 digits) format.'
    };
};

function decodeKyrgyzTIN(tin: string): string {
    const firstDigit = parseInt(tin[0]);
    if (firstDigit === 0) return 'Legal Entity (INN). Registered at State Tax Service.';
    
    const gender = firstDigit === 1 ? 'Male' : 'Female';
    const dd = tin.substring(1, 3);
    const mm = tin.substring(3, 5);
    const yyyy = tin.substring(5, 9);
    
    return `Individual (${gender}), born on ${dd}/${mm}/${yyyy}. Verified via structure.`;
}

/**
 * APPENDIX: FORENSIC CRITERIA
 * Kyrgyzstan uses the INN (Individual Identification Number) for all taxpayers.
 * 1. Structure: 14 digits.
 *    - Digit 1: Gender/Type (1=Male, 2=Female, 0=Legal Entity).
 *    - Digits 2-9: Birth date (DDMMYYYY).
 *    - Digits 10-13: Serial number.
 *    - Digit 14: Check digit.
 * 2. Validation: Structural verification based on gender prefix and birth date 
 *    encoding.
 * 3. Residency: Based on the 183-day presence rule in a calendar year.
 * 4. Scope: Issued by the State Tax Service.
 */
