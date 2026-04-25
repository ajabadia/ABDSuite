import { HolderMetadata, TinValidationResult, CountryRegulatoryInfo, TinInfo, TinRequirement } from './index';

/**
 * TIN Validation for Macau (MO)
 * BIR Number (8 digits)
 */

/**
 * TIN Requirements for Macau
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
 * Country Metadata for Macau
 */
export const COUNTRY_INFO: CountryRegulatoryInfo = {
    name: 'Macao',
    authority: 'Direcção dos Serviços de Finanças (DSF)',
    compliance: {
        crsStatus: 'Participating',
        crsDate: 'September 2018',
        fatcaStatus: 'Model 2 (In Force)'
    },
    residency: {
        individual: 'Se considera residente si tiene residencia habitual en Macao.',
        entity: 'Se considera residente si está constituida en Macao o si su gestión y control se ejercen allí.',
        notes: 'Criterio de residencia habitual o control de gestión.'
    }
};

/**
 * TIN Metadata for Macau (Era 6.3)
 */
export const TIN_INFO: TinInfo = {
    name: 'BIR Number / Tax ID',
    description: 'Macanese BIR (Individuals) or Tax ID (Entities) issued by the Identification Services Bureau or DSF.',
    placeholder: '1234567(8)',
    officialLink: 'https://www.dsf.gov.mo',
    isOfficial: true,
    lastUpdated: '2026-04-24',
    source: 'Local Authority / Macau DSF',
    entityDifferentiation: {
        logic: 'Prefix analysis.',
        individualDescription: '8-digit BIR identifier starting with 1, 5, or 7.',
        businessDescription: '8-digit Tax ID identifier for entities.'
    }
};

/**
 * Macau TIN Validator - Era 6.3
 */
export const validateMOTIN = (
    value: string, 
    type: 'INDIVIDUAL' | 'ENTITY' | 'ANY' = 'ANY', 
    metadata?: HolderMetadata
): TinValidationResult => {
    const sanitized = value.replace(/[\s()]/g, '');

    if (sanitized.length === 8 && /^[0-9]{8}$/.test(sanitized)) {
        const firstDigit = parseInt(sanitized[0]);
        const isIndividual = [1, 5, 7].includes(firstDigit);
        
        if (isIndividual && type === 'ENTITY') {
             return { isValid: false, status: 'MISMATCH', reasonCode: 'ENTITY_TYPE_MISMATCH' };
        }
        
        const isOfficial = validateBIRChecksum(sanitized);
        return { 
            isValid: true, 
            status: isOfficial ? 'VALID' : 'VALID_UNOFFICIAL', 
            isOfficialMatch: isOfficial, 
            explanation: `Matches official Macanese 8-digit identifier format. ${isOfficial ? 'Verified via official checksum.' : 'Pattern match.'}` 
        };
    }

    return { 
        isValid: false, 
        status: 'INVALID_FORMAT',
        explanation: 'Value does not match Macanese 8-digit format.'
    };
};

function validateBIRChecksum(tin: string): boolean {
    const weights = [8, 7, 6, 5, 4, 3, 2];
    let sum = 0;
    for (let i = 0; i < 7; i++) sum += parseInt(tin[i]) * weights[i];
    const remainder = sum % 11;
    const checkDigit = (11 - remainder) % 11;
    return checkDigit === parseInt(tin[7]);
}

/**
 * APPENDIX: FORENSIC CRITERIA
 * Macau uses the BIR (Bilhete de Identidade de Residente) as a tax identifier.
 * 1. Scope: Issued by the Identification Services Bureau (DSI).
 * 2. Structure: 8-digit numeric sequence.
 *    - Digit 1: Residency type (1, 5, 7 for residents).
 *    - Digit 8: Check digit.
 * 3. Validation: Weighted sum algorithm Modulo 11.
 * 4. Residency: Based on habitual residence or center of management/control.
 */
