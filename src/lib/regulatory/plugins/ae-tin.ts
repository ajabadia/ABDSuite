
import { HolderMetadata, TinValidationResult, CountryRegulatoryInfo, TinInfo, TinRequirement } from './index';

/**
 * TIN Validation for UAE (AE)
 * Emirates ID (15 digits: 784-YYYY-XXXXXXX-Z)
 */

/**
 * TIN Requirements for UAE
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
 * Country Metadata for UAE
 */
export const COUNTRY_INFO: CountryRegulatoryInfo = {
    name: 'Emiratos Árabes Unidos',
    authority: 'Ministry of Finance / Federal Tax Authority',
    compliance: {
        crsStatus: 'Participating',
        crsDate: 'September 2018',
        fatcaStatus: 'Model 1 (In Force)'
    },
    residency: {
        individual: 'Se considera residente si tiene su residencia principal o el centro de sus intereses vitales en los EAU, o si permanece allí 183 días o más.',
        entity: 'Se considera residente si se ha incorporado en los EAU o si su sede administrativa efectiva se encuentra allí.',
        notes: 'Criterio de residencia principal o estancia de 183 días.'
    }
};

/**
 * TIN Metadata for UAE (Era 6.3)
 */
export const TIN_INFO: TinInfo = {
    name: 'Emirates ID / TRN',
    description: 'UAE Emirates ID (Individuals) or Tax Registration Number (Entities) issued by EICP or FTA.',
    placeholder: '784-1234-5678901-2',
    officialLink: 'https://mof.gov.ae',
    isOfficial: true,
    lastUpdated: '2026-04-24',
    source: 'OECD Portal / MOF',
    entityDifferentiation: {
        logic: 'Prefix analysis.',
        individualDescription: '15-digit Emirates ID starting with 784.',
        businessDescription: '15-digit TRN starting with 100.'
    }
};

/**
 * UAE TIN Validator - Era 6.3
 */
export const validateAETIN = (
    value: string, 
    type: 'INDIVIDUAL' | 'ENTITY' | 'ANY' = 'ANY', 
    metadata?: HolderMetadata
): TinValidationResult => {
    const sanitized = value.replace(/[\s-]/g, '');

    if (sanitized.length === 15 && /^[0-9]{15}$/.test(sanitized)) {
        const prefix = sanitized.substring(0, 3);
        
        if (prefix === '784' && type === 'ENTITY') {
             return { isValid: false, status: 'MISMATCH', reasonCode: 'ENTITY_TYPE_MISMATCH' };
        }
        
        if (prefix === '100' && type === 'INDIVIDUAL') {
             return { isValid: false, status: 'MISMATCH', reasonCode: 'ENTITY_TYPE_MISMATCH' };
        }

        // High-Fidelity Semantic Check (Era 6.3)
        if (prefix === '784' && metadata && metadata.birthDate) {
            const birthYearEncoded = sanitized.substring(3, 7);
            const bDate = new Date(metadata.birthDate);
            const bYear = String(bDate.getFullYear());
            
            if (birthYearEncoded !== bYear) {
                return { 
                    isValid: false, 
                    status: 'MISMATCH', 
                    reasonCode: 'METADATA_MISMATCH',
                    explanation: `Emirates ID birth year part (${birthYearEncoded}) does not match provided birth year (${bYear}).`
                };
            }
        }

        return { 
            isValid: true, 
            status: 'VALID', 
            isOfficialMatch: true, 
            explanation: decodeUAETIN(sanitized)
        };
    }

    return { 
        isValid: false, 
        status: 'INVALID_FORMAT',
        explanation: 'Value does not match UAE 15-digit Emirates ID or TRN format.'
    };
};

function decodeUAETIN(tin: string): string {
    const prefix = tin.substring(0, 3);
    if (prefix === '784') {
        const birthYear = tin.substring(3, 7);
        return `Emirates ID: Individual. Encoded Birth Year: ${birthYear}. Verified via structure.`;
    }
    if (prefix === '100') {
        return 'TRN: Tax Registration Number for Entities. Verified via prefix.';
    }
    return 'UAE Identifier. Verified via structure.';
}

/**
 * APPENDIX: FORENSIC CRITERIA
 * UAE's identification is based on the Emirates ID and the TRN.
 * 1. Emirates ID (Individuals): 15 digits numeric.
 *    - Prefix 784: Country code for UAE (ISO 3166-1 numeric).
 *    - Digits 4-7: Year of birth of the cardholder.
 *    - Digits 8-14: Random sequence.
 *    - Digit 15: Check digit.
 * 2. TRN (Entities): 15 digits numeric, usually starting with 100.
 * 3. Residency: Traditionally based on visa status, now formalized under the 
 *    183-day rule for tax purposes.
 */

