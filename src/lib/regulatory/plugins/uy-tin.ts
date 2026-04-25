import { HolderMetadata, TinValidationResult, CountryRegulatoryInfo, TinInfo, TinRequirement } from './index';

/**
 * TIN Validation for Uruguay (UY)
 * Individual: Cédula de Identidad (8 digits)
 * Entity: RUT (12 digits)
 */

/**
 * TIN Requirements for Uruguay
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
 * Country Metadata for Uruguay
 */
export const COUNTRY_INFO: CountryRegulatoryInfo = {
    name: 'Uruguay',
    authority: 'Dirección General Impositiva (DGI)',
    compliance: {
        crsStatus: 'Participating',
        crsDate: 'September 2018',
        fatcaStatus: 'Model 1 (In Force)'
    },
    residency: {
        individual: 'Se considera residente si permanece más de 183 días en el año civil o si tiene el centro de sus intereses vitales en Uruguay.',
        entity: 'Se considera residente si está constituida en Uruguay.',
        notes: 'Criterio de permanencia física o centro de intereses vitales.'
    }
};

/**
 * TIN Metadata for Uruguay (Era 6.3)
 */
export const TIN_INFO: TinInfo = {
    name: 'RUT / CI',
    description: 'Uruguayan RUT (Entities) or CI (Individuals) issued by the DGI or Ministry of Interior.',
    placeholder: '21.123456.0019 / 1.234.567-8',
    officialLink: 'https://www.dgi.gub.uy',
    isOfficial: true,
    lastUpdated: '2026-04-24',
    source: 'OECD Portal / DGI',
    entityDifferentiation: {
        logic: 'Number length analysis.',
        individualDescription: 'Cédula de Identidad of 7-8 digits.',
        businessDescription: 'RUT of 12 digits (starts with 21 for most companies).'
    }
};

/**
 * Uruguay TIN Validator - Era 6.3
 */
export const validateUYTIN = (
    value: string, 
    type: 'INDIVIDUAL' | 'ENTITY' | 'ANY' = 'ANY', 
    metadata?: HolderMetadata
): TinValidationResult => {
    const sanitized = value.trim().replace(/[\s.-]/g, '');

    // 1. Individual (CI): 7 or 8 digits
    if ((sanitized.length === 7 || sanitized.length === 8) && /^[0-9]+$/.test(sanitized)) {
        if (type === 'ENTITY') {
            return { 
                isValid: false, 
                status: 'MISMATCH', 
                reasonCode: 'ENTITY_TYPE_MISMATCH',
                explanation: 'The detected format (7-8 digits) corresponds to a Uruguayan Cédula de Identidad, which is exclusive to individuals.'
            };
        }
        const fullCI = sanitized.padStart(8, '0');
        const isOfficial = validateCIChecksum(fullCI);
        return { 
            isValid: true, 
            status: isOfficial ? 'VALID' : 'VALID_UNOFFICIAL', 
            isOfficialMatch: isOfficial, 
            explanation: type === 'ANY'
                ? 'Format valid for Individuals (Cédula). Note: This identifier is not valid for legal Entities.'
                : `Matches official Uruguayan Cédula de Identidad (${sanitized.length} digits) format. ${isOfficial ? 'Verified via checksum.' : 'Pattern match.'}` 
        };
    }

    // 2. Business (RUT): 12 digits
    if (sanitized.length === 12 && /^[0-9]{12}$/.test(sanitized)) {
        if (type === 'INDIVIDUAL') {
            return { 
                isValid: false, 
                status: 'MISMATCH', 
                reasonCode: 'ENTITY_TYPE_MISMATCH',
                explanation: 'The detected format (12 digits) corresponds to a Uruguayan RUT, which applies only to entities.'
            };
        }
        const isOfficial = validateRUTChecksum(sanitized);
        return { 
            isValid: true, 
            status: isOfficial ? 'VALID' : 'VALID_UNOFFICIAL', 
            isOfficialMatch: isOfficial, 
            explanation: type === 'ANY'
                ? 'Format valid for Entities (RUT). Note: This format is invalid if the holder is an Individual.'
                : `Matches official Uruguayan RUT (12 digits) format. ${isOfficial ? 'Verified via Modulo 11.' : 'Pattern match.'}` 
        };
    }

    return { 
        isValid: false, 
        status: 'INVALID_FORMAT',
        explanation: 'Value does not match Uruguayan CI (7-8 digits) or RUT (12 digits) format.'
    };
};

function validateCIChecksum(ci: string): boolean {
    const weights = [2, 9, 8, 7, 6, 3, 4];
    let sum = 0;
    for (let i = 0; i < 7; i++) {
        sum += parseInt(ci[i]) * weights[i];
    }
    const remainder = sum % 10;
    const checkDigit = (10 - remainder) % 10;
    return checkDigit === parseInt(ci[7]);
}

function validateRUTChecksum(rut: string): boolean {
    const weights = [4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
    let sum = 0;
    for (let i = 0; i < 11; i++) {
        sum += parseInt(rut[i]) * weights[i];
    }
    const remainder = sum % 11;
    let checkDigit = 11 - remainder;
    if (checkDigit === 11) checkDigit = 0;
    if (checkDigit === 10) checkDigit = 0; // Standard practice for RUT
    return checkDigit === parseInt(rut[11]);
}

/**
 * APPENDIX: FORENSIC CRITERIA
 * Uruguay uses the Cédula de Identidad (Individuals) and RUT (Taxpayers) systems.
 * 1. CI (7 or 8 digits): 
 *    - Last digit is the check digit.
 *    - Algorithm: Weighted sum Modulo 10.
 * 2. RUT (12 digits): 
 *    - Structure: 2 digits (Category) + 6 digits (Sequence) + 3 digits (Series) + 1 digit (Check).
 *    - Algorithm: Weighted sum Modulo 11.
 * 3. Residency: Physical presence of 183 days or center of vital interests.
 * 4. Scope: Managed by the Dirección General Impositiva (DGI) and Ministry of Interior.
 */
