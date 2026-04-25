import { HolderMetadata, TinValidationResult, CountryRegulatoryInfo, TinInfo, TinRequirement } from './index';

/**
 * TIN Validation for Saudi Arabia (SA)
 * ID Number (10 digits)
 */

/**
 * TIN Requirements for Saudi Arabia
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
 * Country Metadata for Saudi Arabia
 */
export const COUNTRY_INFO: CountryRegulatoryInfo = {
    name: 'Arabia Saudí',
    authority: 'Zakat, Tax and Customs Authority (ZATCA)',
    compliance: {
        crsStatus: 'Participating',
        crsDate: 'September 2018',
        fatcaStatus: 'Model 1 (In Force)'
    },
    residency: {
        individual: 'Se considera residente si tiene una residencia permanente en el Reino y permanece allí un total de al menos 30 días en el año fiscal, o si permanece 183 días.',
        entity: 'Se considera residente si está incorporada en el Reino o si su sede administrativa se encuentra allí.',
        notes: 'Criterio de residencia permanente o estancia de 30/183 días.'
    }
};

/**
 * TIN Metadata for Saudi Arabia (Era 6.3)
 */
export const TIN_INFO: TinInfo = {
    name: 'ID / TIN',
    description: 'Saudi National ID/Iqama (Individuals) or TIN (Entities) issued by ZATCA.',
    placeholder: '1234567890',
    officialLink: 'https://zatca.gov.sa',
    isOfficial: true,
    lastUpdated: '2026-04-24',
    source: 'OECD Portal / ZATCA',
    entityDifferentiation: {
        logic: 'Prefix analysis.',
        individualDescription: '10-digit ID starting with 1 (Citizens) or 2 (Residents).',
        businessDescription: '10-digit TIN starting with 3.'
    }
};

/**
 * Saudi Arabia TIN Validator - Era 6.3
 */
export const validateSATIN = (
    value: string, 
    type: 'INDIVIDUAL' | 'ENTITY' | 'ANY' = 'ANY', 
    metadata?: HolderMetadata
): TinValidationResult => {
    const sanitized = value.trim().replace(/[\s-]/g, '');

    if (sanitized.length === 10 && /^[0-9]{10}$/.test(sanitized)) {
        const isOfficial = validateSaudiChecksum(sanitized);
        const firstDigit = sanitized[0];
        
        if (['1', '2'].includes(firstDigit) && type === 'ENTITY') {
             return { 
                 isValid: false, 
                 status: 'MISMATCH', 
                 reasonCode: 'ENTITY_TYPE_MISMATCH',
                 explanation: `The Saudi ID prefix '${firstDigit}' is reserved for Individuals (Citizens or Residents) and not legal entities.`
             };
        }
        
        if (firstDigit === '3' && type === 'INDIVIDUAL') {
             return { 
                 isValid: false, 
                 status: 'MISMATCH', 
                 reasonCode: 'ENTITY_TYPE_MISMATCH',
                 explanation: 'The Saudi TIN prefix \'3\' is reserved for Legal Entities and not for individuals.'
             };
        }

        const typeDesc = firstDigit === '1' ? 'Citizen' : (firstDigit === '2' ? 'Resident/Iqama' : (firstDigit === '3' ? 'Legal Entity' : 'Other'));

        return { 
            isValid: true, 
            status: isOfficial ? 'VALID' : 'VALID_UNOFFICIAL', 
            isOfficialMatch: isOfficial, 
            explanation: `Matches official Saudi 10-digit identifier (${typeDesc}). ${isOfficial ? 'Verified via checksum.' : 'Pattern match.'}` 
        };
    }

    return { 
        isValid: false, 
        status: 'INVALID_FORMAT',
        explanation: 'Value does not match Saudi 10-digit ID or TIN format.'
    };
};

function validateSaudiChecksum(tin: string): boolean {
    let sum = 0;
    for (let i = 0; i < 9; i++) {
        let n = parseInt(tin[i]);
        if (i % 2 === 0) {
            n *= 2;
            if (n > 9) n = Math.floor(n / 10) + (n % 10);
        }
        sum += n;
    }
    const checkDigit = (10 - (sum % 10)) % 10;
    return checkDigit === parseInt(tin[9]);
}

/**
 * APPENDIX: FORENSIC CRITERIA
 * Saudi Arabia uses a 10-digit system for all residents and taxpayers.
 * 1. Scope: Issued by the Ministry of Interior (IDs) and ZATCA (TINs).
 * 2. Structure: 
 *    - Digit 1: 1 (Saudi Citizen), 2 (Foreign Resident/Iqama), 3 (Legal Entity).
 *    - Digits 2-9: Sequence.
 *    - Digit 10: Check digit.
 * 3. Validation: Modulo 10 (Luhn-style) algorithm.
 * 4. Residency: Permanent residence + 30 days presence or 183 days total.
 */
