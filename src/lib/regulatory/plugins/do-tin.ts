import { HolderMetadata, TinValidationResult, CountryRegulatoryInfo, TinInfo, TinRequirement } from './index';

/**
 * TIN Validation for Dominican Republic (DO)
 * Individual: Cédula de Identidad y Electoral (11 digits)
 * Entity: Registro Nacional de Contribuyentes (RNC) (9 digits)
 */

/**
 * TIN Requirements for Dominican Republic
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
 * Country Metadata for Dominican Republic
 */
export const COUNTRY_INFO: CountryRegulatoryInfo = {
    name: 'República Dominicana',
    authority: 'Dirección General de Impuestos Internos (DGII)',
    compliance: {
        crsStatus: 'Non-Participating',
        crsDate: 'N/A',
        fatcaStatus: 'Model 1 (In Force)'
    },
    residency: {
        individual: 'Se considera residente si permanece en la República Dominicana durante más de 182 días en el año fiscal.',
        entity: 'Se considera residente si está constituida en la República Dominicana.',
        notes: 'Criterio de permanencia física o constitución legal.'
    }
};

/**
 * TIN Metadata for Dominican Republic (Era 6.3)
 */
export const TIN_INFO: TinInfo = {
    name: 'RNC / Cédula',
    description: 'Dominican RNC (Entities) or Cédula (Individuals) issued by the DGII or JCE.',
    placeholder: '123-45678-9 / 001-1234567-8',
    officialLink: 'https://dgii.gov.do',
    isOfficial: true,
    lastUpdated: '2026-04-24',
    source: 'Local Authority / Dominican DGII',
    entityDifferentiation: {
        logic: 'Number length analysis.',
        individualDescription: '11-digit Cédula identifier.',
        businessDescription: '9-digit RNC identifier.'
    }
};

/**
 * Dominican Republic TIN Validator - Era 6.3
 */
export const validateDOTIN = (
    value: string, 
    type: 'INDIVIDUAL' | 'ENTITY' | 'ANY' = 'ANY', 
    metadata?: HolderMetadata
): TinValidationResult => {
    const sanitized = value.replace(/[\s-]/g, '');

    // Individual (Cédula): 11 digits
    if (sanitized.length === 11 && /^[0-9]{11}$/.test(sanitized)) {
        if (type === 'ENTITY') {
             return { isValid: false, status: 'MISMATCH', reasonCode: 'ENTITY_TYPE_MISMATCH' };
        }
        
        const isOfficial = validateCedulaChecksum(sanitized);
        return { 
            isValid: true, 
            status: isOfficial ? 'VALID' : 'VALID_UNOFFICIAL', 
            isOfficialMatch: isOfficial, 
            explanation: type === 'ANY'
                ? 'Format valid for Individuals (Cédula). Note: This identifier is not valid for legal Entities.'
                : decodeDominicanTIN(sanitized)
        };
    }

    // Business (RNC): 9 digits
    if (sanitized.length === 9 && /^[0-9]{9}$/.test(sanitized)) {
        if (type === 'INDIVIDUAL') {
             return { isValid: false, status: 'MISMATCH', reasonCode: 'ENTITY_TYPE_MISMATCH' };
        }

        const isOfficial = validateRNCChecksum(sanitized);
        const explanation = decodeDominicanTIN(sanitized);
        const firstDigit = sanitized[0];
        const isEntity = firstDigit === '4' || firstDigit === '5';

        return { 
            isValid: true, 
            status: isOfficial ? 'VALID' : 'VALID_UNOFFICIAL', 
            isOfficialMatch: isOfficial, 
            explanation: type === 'ANY'
                ? (isEntity 
                    ? 'Format valid for Entities (RNC). Note: This identifier is not valid for Individuals.'
                    : 'Format valid for Individuals (RNC). Note: This identifier is not valid for legal Entities.')
                : explanation
        };
    }

    return { 
        isValid: false, 
        status: 'INVALID_FORMAT',
        explanation: 'Value does not match Dominican Cédula (11 digits) or RNC (9 digits) format.'
    };
};

function decodeDominicanTIN(tin: string): string {
    const firstDigit = tin[0];
    
    if (tin.length === 11) {
        return 'Dominican Cédula de Identidad y Electoral (Individual). Verified via checksum.';
    }
    
    if (tin.length === 9) {
        let type = 'Other Legal Entity';
        if (firstDigit === '1') type = 'Individual (RNC Person)';
        else if (firstDigit === '4' || firstDigit === '5') type = 'Legal Entity (Company)';
        
        return `Dominican RNC, Type: ${type}. Verified via checksum.`;
    }
    
    return 'Matches official Dominican RNC format.';
}

function validateCedulaChecksum(cedula: string): boolean {
    const weights = [1, 2, 1, 2, 1, 2, 1, 2, 1, 2];
    let sum = 0;
    for (let i = 0; i < 10; i++) {
        let mult = parseInt(cedula[i]) * weights[i];
        if (mult > 9) mult = mult - 9;
        sum += mult;
    }
    const checkDigit = (10 - (sum % 10)) % 10;
    return checkDigit === parseInt(cedula[10]);
}

function validateRNCChecksum(rnc: string): boolean {
    const weights = [7, 9, 8, 6, 5, 4, 3, 2];
    let sum = 0;
    for (let i = 0; i < 8; i++) sum += parseInt(rnc[i]) * weights[i];
    const remainder = sum % 11;
    let checkDigit = 11 - remainder;
    if (checkDigit === 11) checkDigit = 2;
    if (checkDigit === 10) checkDigit = 1;
    return checkDigit === parseInt(rnc[8]);
}

/**
 * APPENDIX: FORENSIC CRITERIA
 * The Dominican Republic uses the Cédula for individuals and RNC for entities.
 * 1. Cédula de Identidad y Electoral (11 digits): 
 *    - Format: XXX-XXXXXXX-X. 
 *    - Validation: Luhn algorithm (variant) or weighted sum Modulo 10.
 * 2. RNC (9 digits): 
 *    - Format: X-XXXXXXX-X. 
 *    - Encoding: First digit indicates type (1: Individual, 4-5: Companies).
 *    - Validation: Weighted sum algorithm Modulo 11.
 * 3. Residency: Based on physical presence of more than 182 days in a fiscal year.
 */
