import { HolderMetadata, TinValidationResult, CountryRegulatoryInfo, TinInfo, TinRequirement } from './index';

/**
 * TIN Validation for El Salvador (SV)
 * Individual: DUI (9 digits) or NIT (14 digits)
 * Entity: NIT (14 digits)
 */

/**
 * TIN Requirements for El Salvador
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
 * Country Metadata for El Salvador
 */
export const COUNTRY_INFO: CountryRegulatoryInfo = {
    name: 'El Salvador',
    authority: 'Ministerio de Hacienda',
    compliance: {
        crsStatus: 'Non-Participating',
        crsDate: 'N/A',
        fatcaStatus: 'Model 1 (In Force)'
    },
    residency: {
        individual: 'Se considera residente si permanece en El Salvador durante más de 183 días en el año civil.',
        entity: 'Se considera residente si está constituida en El Salvador.',
        notes: 'Criterio de permanencia física o constitución legal.'
    }
};

/**
 * TIN Metadata for El Salvador (Era 6.3)
 */
export const TIN_INFO: TinInfo = {
    name: 'NIT / DUI',
    description: 'Salvadoran NIT (Entities/Individuals) or DUI (Individuals) issued by the Ministry of Finance or RNPN.',
    placeholder: '0614-010190-123-4 / 12345678-9',
    officialLink: 'https://www.mh.gob.sv',
    isOfficial: true,
    lastUpdated: '2026-04-24',
    source: 'Local Authority / El Salvador MH',
    entityDifferentiation: {
        logic: 'Number length analysis.',
        individualDescription: '9-digit DUI or 14-digit NIT.',
        businessDescription: '14-digit NIT.'
    }
};

/**
 * El Salvador TIN Validator - Era 6.3
 */
export const validateSVTIN = (
    value: string, 
    type: 'INDIVIDUAL' | 'ENTITY' | 'ANY' = 'ANY', 
    metadata?: HolderMetadata
): TinValidationResult => {
    const sanitized = value.trim().replace(/[\s-]/g, '');

    // 1. Individual (DUI): 9 digits
    if (sanitized.length === 9 && /^[0-9]{9}$/.test(sanitized)) {
        if (type === 'ENTITY') {
             return { 
                 isValid: false, 
                 status: 'MISMATCH', 
                 reasonCode: 'ENTITY_TYPE_MISMATCH',
                 explanation: 'The detected format (9 digits) corresponds to a Salvadoran DUI, which is exclusive to individuals.'
             };
        }
        const isOfficial = validateDUIChecksum(sanitized);
        return { 
            isValid: true, 
            status: isOfficial ? 'VALID' : 'VALID_UNOFFICIAL', 
            isOfficialMatch: isOfficial, 
            explanation: `Matches official Salvadoran DUI (9 digits) format. ${isOfficial ? 'Verified via checksum.' : 'Pattern match.'}` 
        };
    }

    // 2. NIT: 14 digits
    if (sanitized.length === 14 && /^[0-9]{14}$/.test(sanitized)) {
        const isOfficial = validateNITChecksum(sanitized);
        return { 
            isValid: true, 
            status: isOfficial ? 'VALID' : 'VALID_UNOFFICIAL', 
            isOfficialMatch: isOfficial, 
            explanation: `Matches official Salvadoran NIT (14 digits) format. ${isOfficial ? 'Verified via specialized Modulo 11.' : 'Pattern match.'}` 
        };
    }

    return { 
        isValid: false, 
        status: 'INVALID_FORMAT',
        explanation: 'Value does not match Salvadoran DUI (9 digits) or NIT (14 digits) format.'
    };
};

function validateDUIChecksum(tin: string): boolean {
    let sum = 0;
    for (let i = 0; i < 8; i++) {
        sum += parseInt(tin[i]) * (9 - i);
    }
    const remainder = sum % 10;
    let checkDigit = 10 - remainder;
    if (checkDigit === 10) checkDigit = 0;
    return checkDigit === parseInt(tin[8]);
}

function validateNITChecksum(tin: string): boolean {
    const sequence = tin.substring(10, 13);
    const checkDigit = parseInt(tin[13]);
    let sum = 0;

    if (parseInt(sequence) <= 100) {
        // Standard Modulo 11
        for (let i = 0; i < 13; i++) {
            sum += parseInt(tin[i]) * (14 - i);
        }
        let remainder = sum % 11;
        let expected = (11 - remainder) % 10;
        return expected === checkDigit;
    } else {
        // Special Weighting
        const weights = [14, 13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2];
        for (let i = 0; i < 13; i++) {
            sum += parseInt(tin[i]) * weights[i];
        }
        let remainder = sum % 11;
        let expected = 11 - remainder;
        if (expected === 10) expected = 0;
        if (expected === 11) expected = 0;
        return expected === checkDigit;
    }
}

/**
 * APPENDIX: FORENSIC CRITERIA
 * El Salvador uses the DUI (Individuals) and NIT (Taxpayers) systems.
 * 1. DUI (9 digits): 
 *    - Last digit is the check digit.
 *    - Algorithm: Modulo 10.
 * 2. NIT (14 digits): 
 *    - Structure: 4 digits (Location) + 6 digits (Birth/Date) + 3 digits (Sequence) + 1 digit (Check).
 *    - Algorithm: Specialized Modulo 11. If sequence <= 100, weights are simple; if > 100, weights are specific.
 * 3. Residency: Based on the 183-day presence rule.
 * 4. Scope: Managed by the Ministerio de Hacienda and RNPN.
 */
