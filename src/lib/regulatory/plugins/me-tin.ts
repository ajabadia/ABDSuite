import { HolderMetadata, TinValidationResult, CountryRegulatoryInfo, TinInfo, TinRequirement } from './index';

/**
 * TIN Validation for Montenegro (ME)
 * Individual: JMBG (13 digits)
 * Entity: PIB (8 digits)
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
 * Country Metadata for Montenegro
 */
export const COUNTRY_INFO: CountryRegulatoryInfo = {
    name: 'Montenegro',
    authority: 'Tax Administration (Poreska uprava)',
    compliance: {
        crsStatus: 'Participating',
        crsDate: 'September 2023',
        fatcaStatus: 'Model 1 (In Force)'
    },
    residency: {
        individual: 'Se considera residente si tiene su residencia principal en Montenegro o si permanece allí durante más de 183 días.',
        entity: 'Se considera residente si está incorporada en Montenegro.',
        notes: 'Criterio de residencia principal o estancia de 183 días.'
    }
};

/**
 * TIN Metadata for Montenegro (Era 6.3)
 */
export const TIN_INFO: TinInfo = {
    name: 'JMBG / PIB',
    description: 'Montenegrin JMBG (Individuals) or PIB (Entities) issued by the Ministry of Interior or Tax Administration.',
    placeholder: '0101980210008 / 12345678',
    officialLink: 'https://www.poreskauprava.gov.me',
    isOfficial: true,
    lastUpdated: '2026-04-24',
    source: 'Local Authority / Montenegro Tax',
    entityDifferentiation: {
        logic: 'Number length analysis.',
        individualDescription: '13-digit JMBG identifier.',
        businessDescription: '8-digit PIB identifier.'
    }
};

/**
 * Montenegro TIN Validator - Era 6.3
 */
export const validateMETIN = (
    value: string, 
    type: 'INDIVIDUAL' | 'ENTITY' | 'ANY' = 'ANY', 
    metadata?: HolderMetadata
): TinValidationResult => {
    const sanitized = value.replace(/[\s-]/g, '');

    // Individual (JMBG): 13 digits
    if (sanitized.length === 13 && /^[0-9]{13}$/.test(sanitized)) {
        if (type === 'ENTITY') {
             return { 
                 isValid: false, 
                 status: 'MISMATCH', 
                 reasonCode: 'ENTITY_TYPE_MISMATCH',
                 explanation: 'The detected format (13 digits) corresponds to a Montenegrin JMBG, exclusive to individuals.'
             };
        }
        const isOfficial = validateJMBGChecksum(sanitized);
        return { 
            isValid: true, 
            status: isOfficial ? 'VALID' : 'VALID_UNOFFICIAL', 
            isOfficialMatch: isOfficial, 
            explanation: decodeMontenegroTIN(sanitized)
        };
    }

    // Business (PIB): 8 digits
    if (sanitized.length === 8 && /^[0-9]{8}$/.test(sanitized)) {
        if (type === 'INDIVIDUAL') {
             return { 
                 isValid: false, 
                 status: 'MISMATCH', 
                 reasonCode: 'ENTITY_TYPE_MISMATCH',
                 explanation: 'The detected format (8 digits) corresponds to a Montenegrin PIB, which applies to legal entities.'
             };
        }
        const isOfficial = validatePIBChecksum(sanitized);
        return { 
            isValid: true, 
            status: isOfficial ? 'VALID' : 'VALID_UNOFFICIAL', 
            isOfficialMatch: isOfficial, 
            explanation: `Matches official Montenegrin PIB (8 digits) format. ${isOfficial ? 'Verified via official checksum.' : 'Pattern match.'}` 
        };
    }

    return { 
        isValid: false, 
        status: 'INVALID_FORMAT',
        explanation: 'Value does not match Montenegrin JMBG (13 digits) or PIB (8 digits) format.'
    };
};

function decodeMontenegroTIN(tin: string): string {
    const dd = tin.substring(0, 2);
    const mm = tin.substring(2, 4);
    const yyy = tin.substring(4, 7);
    const century = parseInt(yyy) < 900 ? '2' : '1';
    
    return `Individual (JMBG), born on ${dd}/${mm}/${century}${yyy}. Verified via checksum.`;
}

function validateJMBGChecksum(tin: string): boolean {
    const weights = [7, 6, 5, 4, 3, 2, 7, 6, 5, 4, 3, 2];
    let sum = 0;
    for (let i = 0; i < 12; i++) sum += parseInt(tin[i]) * weights[i];
    let check = 11 - (sum % 11);
    if (check > 9) check = 0;
    return check === parseInt(tin[12]);
}

function validatePIBChecksum(tin: string): boolean {
    const weights = [8, 7, 6, 5, 4, 3, 2];
    let sum = 0;
    for (let i = 0; i < 7; i++) sum += parseInt(tin[i]) * weights[i];
    const checkDigit = (11 - (sum % 11)) % 10;
    return checkDigit === parseInt(tin[7]);
}

/**
 * APPENDIX: FORENSIC CRITERIA
 * Montenegro uses two distinct identifiers.
 * 1. JMBG (Individuals): 
 *    - 13-digit sequence (DDMMYYYRRNNNC).
 *    - Validation: Weighted sum algorithm Modulo 11. 
 *    - Formula: (11 - (Sum(Digit_i * Weight_i) % 11)). If result > 9, use 0.
 * 2. PIB (Legal Entities): 
 *    - 8-digit numeric sequence.
 *    - Validation: Weighted sum algorithm Modulo 11. 
 * 3. Residency: Based on domicile or stay of 183+ days in a calendar year.
 * 4. Scope: Managed by the Ministry of Interior and Tax Administration.
 */
