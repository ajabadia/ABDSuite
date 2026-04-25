import { HolderMetadata, TinValidationResult, CountryRegulatoryInfo, TinInfo, TinRequirement } from './index';

/**
 * TIN Validation for Kuwait (KW)
 * Civil ID (12 digits)
 */

/**
 * TIN Requirements for Kuwait
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
 * Country Metadata for Kuwait
 */
export const COUNTRY_INFO: CountryRegulatoryInfo = {
    name: 'Kuwait',
    authority: 'Ministry of Finance / PACI',
    compliance: {
        crsStatus: 'Participating',
        crsDate: 'September 2018',
        fatcaStatus: 'Model 1 (In Force)'
    },
    residency: {
        individual: 'Se considera residente si permanece en Kuwait durante más de 183 días en el año fiscal.',
        entity: 'Se considera residente si está incorporada en Kuwait.',
        notes: 'Criterio de permanencia física o constitución legal.'
    }
};

/**
 * TIN Metadata for Kuwait (Era 6.3)
 */
export const TIN_INFO: TinInfo = {
    name: 'Civil ID',
    description: 'Kuwaiti Civil ID issued by the PACI.',
    placeholder: '280010101234',
    officialLink: 'https://www.paci.gov.kw',
    isOfficial: true,
    lastUpdated: '2026-04-24',
    source: 'Local Authority / Kuwait MOF',
    entityDifferentiation: {
        logic: 'Prefix analysis.',
        individualDescription: '12-digit Civil ID starting with 2 or 3.',
        businessDescription: '12-digit Civil ID starting with 1 (Entity).'
    }
};

/**
 * Kuwait TIN Validator - Era 6.3
 */
export const validateKWTIN = (
    value: string, 
    type: 'INDIVIDUAL' | 'ENTITY' | 'ANY' = 'ANY', 
    metadata?: HolderMetadata
): TinValidationResult => {
    const sanitized = value.replace(/[\s-]/g, '');

    if (sanitized.length === 12 && /^[0-9]{12}$/.test(sanitized)) {
        const firstDigit = parseInt(sanitized[0]);
        const isIndividual = [2, 3].includes(firstDigit);
        const isEntity = firstDigit === 1;

        if (isIndividual && type === 'ENTITY') {
             return { isValid: false, status: 'MISMATCH', reasonCode: 'ENTITY_TYPE_MISMATCH' };
        }
        if (isEntity && type === 'INDIVIDUAL') {
             return { isValid: false, status: 'MISMATCH', reasonCode: 'ENTITY_TYPE_MISMATCH' };
        }

        const isOfficial = validateCivilIDChecksum(sanitized);
        return { 
            isValid: true, 
            status: isOfficial ? 'VALID' : 'VALID_UNOFFICIAL', 
            isOfficialMatch: isOfficial, 
            explanation: decodeKuwaitTIN(sanitized)
        };
    }

    return { 
        isValid: false, 
        status: 'INVALID_FORMAT',
        explanation: 'Value does not match Kuwaiti Civil ID (12 digits) format.'
    };
};

function decodeKuwaitTIN(tin: string): string {
    const firstDigit = parseInt(tin[0]);
    if (firstDigit === 1) return 'Legal Entity (Civil ID). Verified via prefix.';
    
    const century = firstDigit === 2 ? '19' : '20';
    const yy = tin.substring(1, 3);
    const mm = tin.substring(3, 5);
    const dd = tin.substring(5, 7);
    
    return `Individual, born on ${dd}/${mm}/${century}${yy}. Verified via structure.`;
}

function validateCivilIDChecksum(tin: string): boolean {
    const weights = [2, 1, 6, 3, 7, 9, 10, 5, 8, 4, 2];
    let sum = 0;
    for (let i = 0; i < 11; i++) sum += parseInt(tin[i]) * weights[i];
    const remainder = sum % 11;
    const checkDigit = 11 - remainder;
    return checkDigit === parseInt(tin[11]);
}

/**
 * APPENDIX: FORENSIC CRITERIA
 * Kuwait uses the Civil ID as the primary identifier for both individuals and 
 * entities.
 * 1. Scope: Issued and managed by the Public Authority for Civil Information (PACI).
 * 2. Structure: 12-digit numeric sequence.
 *    - Digit 1: Century indicator (2=19th, 3=20th century; 1=Legal Entity).
 *    - Digits 2-7: Birth date (YYMMDD).
 *    - Digit 12: Check digit.
 * 3. Validation: Weighted sum algorithm Modulo 11.
 * 4. Residency: Centered on the 183-day presence rule in a fiscal year.
 */
