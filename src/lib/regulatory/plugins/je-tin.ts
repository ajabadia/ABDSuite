import { HolderMetadata, TinValidationResult, CountryRegulatoryInfo, TinInfo, TinRequirement } from './index';

/**
 * TIN Validation for Jersey (JE)
 * Tax Reference Number (10 digits) or Social Security Number (JY + 6 digits + letter)
 */

/**
 * TIN Requirements for Jersey
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
 * Country Metadata for Jersey
 */
export const COUNTRY_INFO: CountryRegulatoryInfo = {
    name: 'Jersey',
    authority: 'Revenue Jersey',
    compliance: {
        crsStatus: 'Participating',
        crsDate: 'September 2017',
        fatcaStatus: 'Model 1 (In Force)'
    },
    residency: {
        individual: 'Se considera residente si tiene su residencia principal en Jersey o si permanece allí durante más de 183 días en el año fiscal.',
        entity: 'Se considera residente si se ha incorporado en Jersey o si su gestión y control se ejercen allí.',
        notes: 'Criterio de residencia principal o estancia de 183 días.'
    }
};

/**
 * TIN Metadata for Jersey (Era 6.3)
 */
export const TIN_INFO: TinInfo = {
    name: 'Tax Reference Number / SSN',
    description: 'Jersey Tax Reference Number or Social Security Number (SSN) issued by Revenue Jersey.',
    placeholder: '1234567890 / JY123456A',
    officialLink: 'https://www.gov.je/taxes',
    isOfficial: true,
    lastUpdated: '2026-04-24',
    source: 'OECD Portal / Jersey Tax',
    entityDifferentiation: {
        logic: 'Prefix and length analysis.',
        individualDescription: '10-digit Tax Reference Number or 9-char SSN (starts with JY).',
        businessDescription: '10-digit Tax Reference Number.'
    }
};

/**
 * Jersey TIN Validator - Era 6.3
 */
export const validateJETIN = (
    value: string, 
    type: 'INDIVIDUAL' | 'ENTITY' | 'ANY' = 'ANY', 
    metadata?: HolderMetadata
): TinValidationResult => {
    const sanitized = value.replace(/[\s-]/g, '').toUpperCase();

    // 1. Tax Reference Number: 10 digits
    if (sanitized.length === 10 && /^[0-9]{10}$/.test(sanitized)) {
        return { 
            isValid: true, 
            status: 'VALID', 
            isOfficialMatch: true, 
            explanation: 'Matches official Jersey Tax Reference Number (10 digits) format.' 
        };
    }

    // 2. Social Security Number: JY + 6 digits + letter
    if (sanitized.length === 9 && /^JY[0-9]{6}[A-D]$/.test(sanitized)) {
        if (type === 'ENTITY') {
            return { 
                isValid: false, 
                status: 'MISMATCH', 
                reasonCode: 'ENTITY_TYPE_MISMATCH',
                explanation: 'The detected format (JY prefix) corresponds to a Jersey Social Security Number, which is exclusive to individuals.'
            };
        }
        return { 
            isValid: true, 
            status: 'VALID', 
            isOfficialMatch: true, 
            explanation: 'Matches official Jersey Social Security Number (JY prefix) format.' 
        };
    }

    return { 
        isValid: false, 
        status: 'INVALID_FORMAT',
        explanation: 'Value does not match Jersey Tax Reference Number (10 digits) or SSN format.'
    };
};

/**
 * APPENDIX: FORENSIC CRITERIA
 * Jersey uses two main identifiers for tax purposes.
 * 1. Tax Reference Number: 
 *    - A 10-digit numeric sequence issued to all taxpayers.
 * 2. Social Security Number (SSN): 
 *    - Format: JY followed by 6 digits and a suffix letter (A, B, C, or D).
 *    - Note: This is structurally similar to the UK's National Insurance 
 *      Number (NINO) but uses the "JY" prefix for Jersey.
 * 3. Validation: Structural verification based on pattern and length. 
 * 4. Residency: Based on physical stay of more than 183 days or primary 
 *    residence in Jersey.
 */
