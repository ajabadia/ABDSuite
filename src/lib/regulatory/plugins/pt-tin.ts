
import { HolderMetadata, TinValidationResult, CountryRegulatoryInfo, TinInfo, TinRequirement } from './index';

/**
 * TIN Validation for Portugal (PT)
 * NIF (9 digits)
 */

/**
 * TIN Requirements for Portugal
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
 * Country Metadata for Portugal
 */
export const COUNTRY_INFO: CountryRegulatoryInfo = {
    name: 'Portugal',
    authority: 'Autoridade Tributária e Aduaneira',
    compliance: {
        crsStatus: 'Participating',
        crsDate: 'September 2017',
        fatcaStatus: 'Model 1 (In Force)'
    },
    residency: {
        individual: 'Se considera residente si permanece más de 183 días en Portugal en un período de 12 meses, o si tiene una vivienda en condiciones que sugieran la intención de mantenerla como residencia habitual.',
        entity: 'Se considera residente si tiene su sede estatutaria o su dirección efectiva en Portugal.',
        notes: 'Criterio de vivienda habitual o permanencia de 183 días.'
    }
};

/**
 * TIN Metadata for Portugal (Era 6.3)
 */
export const TIN_INFO: TinInfo = {
    name: 'NIF / NIPC',
    description: 'Portuguese NIF (Individuals) or NIPC (Entities) issued by Autoridade Tributária e Aduaneira.',
    placeholder: '123456789',
    officialLink: 'https://www.portaldasfinancas.gov.pt',
    isOfficial: true,
    lastUpdated: '2026-04-24',
    source: 'OECD Portal / Autoridade Tributária',
    entityDifferentiation: {
        logic: 'First digit analysis.',
        individualDescription: 'NIF starts with 1, 2, 3 (residents) or 45 (non-residents).',
        businessDescription: 'NIPC starts with 5 (companies), 6 (public bodies), 8 (inheritances) or 9 (irregular entities).'
    }
};

/**
 * Portugal TIN Validator - Era 6.3
 */
export const validatePTTIN = (
    value: string, 
    type: 'INDIVIDUAL' | 'ENTITY' | 'ANY' = 'ANY', 
    metadata?: HolderMetadata
): TinValidationResult => {
    const sanitized = value.replace(/[\s-]/g, '');

    if (sanitized.length === 9 && /^[0-9]{9}$/.test(sanitized)) {
        if (validateNIFChecksum(sanitized)) {
            const firstDigit = parseInt(sanitized[0]);
            const isEntityPrefix = [5, 6, 8, 9].includes(firstDigit);
            const isIndividualPrefix = [1, 2, 3, 4, 7].includes(firstDigit);

            if (isEntityPrefix && type === 'INDIVIDUAL') {
                return { 
                    isValid: false, 
                    status: 'MISMATCH', 
                    reasonCode: 'ENTITY_TYPE_MISMATCH',
                    explanation: `The Portuguese NIF prefix '${firstDigit}' is reserved for legal entities (NIPC) and not for individuals.`
                };
            }
            if (isIndividualPrefix && type === 'ENTITY') {
                return { 
                    isValid: false, 
                    status: 'MISMATCH', 
                    reasonCode: 'ENTITY_TYPE_MISMATCH',
                    explanation: `The Portuguese NIF prefix '${firstDigit}' is reserved for individuals and not for legal entities.`
                };
            }

            const explanation = decodePortugalTIN(sanitized);

            return { 
                isValid: true, 
                status: 'VALID', 
                isOfficialMatch: true, 
                explanation: type === 'ANY'
                    ? (isEntityPrefix 
                        ? 'Format valid for Entities (NIPC). Note: This identifier is not valid for Individuals.'
                        : 'Format valid for Individuals (NIF). Note: This identifier is not valid for legal Entities.')
                    : explanation
            };
        } else {
            return {
                isValid: false,
                status: 'INVALID_CHECKSUM',
                explanation: 'Value matches 9-digit format but failed Portuguese checksum algorithm.'
            };
        }
    }

    return { 
        isValid: false, 
        status: 'INVALID_FORMAT',
        explanation: 'Value does not match Portuguese NIF/NIPC (9 digits) format.'
    };
};

function decodePortugalTIN(tin: string): string {
    const firstDigit = parseInt(tin[0]);
    const prefixMap: Record<number, string> = {
        1: 'Individual (Resident)',
        2: 'Individual (Resident)',
        3: 'Individual (Resident)',
        4: 'Individual (Non-Resident / Overseas)',
        5: 'Legal Entity (Company / BCE)',
        6: 'Public Body / Non-Resident Entity',
        7: 'Foreign Individual (Specific cases)',
        8: 'Undivided Inheritance / Others',
        9: 'Public Entity / Irregular entities'
    };
    
    const description = prefixMap[firstDigit] || 'Unknown Type';
    return `NIF/NIPC: ${description}. Verified via official checksum.`;
}

function validateNIFChecksum(nif: string): boolean {
    const firstDigit = parseInt(nif[0]);
    // Valid initial digits for NIF/NIPC
    if (![1, 2, 3, 5, 6, 8, 9, 4, 7].includes(firstDigit)) return false;

    let sum = 0;
    for (let i = 0; i < 8; i++) {
        sum += parseInt(nif[i]) * (9 - i);
    }
    const remainder = sum % 11;
    const checkDigit = remainder < 2 ? 0 : 11 - remainder;
    return checkDigit === parseInt(nif[8]);
}
