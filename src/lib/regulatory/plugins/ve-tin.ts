import { HolderMetadata, TinValidationResult, CountryRegulatoryInfo, TinInfo, TinRequirement } from './index';

/**
 * TIN Validation for Venezuela (VE)
 * RIF (10 characters: V-12345678-9)
 */

/**
 * TIN Requirements for Venezuela
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
 * Country Metadata for Venezuela
 */
export const COUNTRY_INFO: CountryRegulatoryInfo = {
    name: 'Venezuela',
    authority: 'Servicio Nacional Integrado de Administración Aduanera y Tributaria (SENIAT)',
    compliance: {
        crsStatus: 'Non-Participating',
        crsDate: 'N/A',
        fatcaStatus: 'N/A'
    },
    residency: {
        individual: 'Se considera residente si permanece en Venezuela durante más de 183 días en el año civil.',
        entity: 'Se considera residente si está constituida en Venezuela.',
        notes: 'Criterio de permanencia física o constitución legal.'
    }
};

/**
 * TIN Metadata for Venezuela (Era 6.3)
 */
export const TIN_INFO: TinInfo = {
    name: 'RIF',
    description: 'Venezuelan RIF issued by the SENIAT.',
    placeholder: 'V-12345678-9',
    officialLink: 'http://www.seniat.gob.ve',
    isOfficial: true,
    lastUpdated: '2026-04-24',
    source: 'Local Authority / Venezuela SENIAT',
    entityDifferentiation: {
        logic: 'Prefix analysis.',
        individualDescription: 'RIF starting with V (Venezuelan) or E (Foreigner).',
        businessDescription: 'RIF starting with J (Juridical) or G (Governmental).'
    }
};

/**
 * Venezuela TIN Validator - Era 6.3
 */
export const validateVETIN = (
    value: string, 
    type: 'INDIVIDUAL' | 'ENTITY' | 'ANY' = 'ANY', 
    metadata?: HolderMetadata
): TinValidationResult => {
    const sanitized = value.trim().toUpperCase().replace(/[\s-]/g, '');

    if (sanitized.length === 10 && /^[VJEGP][0-9]{9}$/.test(sanitized)) {
        const prefix = sanitized[0];

        if (type === 'INDIVIDUAL' && (prefix === 'J' || prefix === 'G' || prefix === 'C')) {
             return { 
                 isValid: false, 
                 status: 'MISMATCH', 
                 reasonCode: 'ENTITY_TYPE_MISMATCH',
                 explanation: `The RIF prefix '${prefix}' corresponds to a Legal Entity and not an individual.`
             };
        }
        if (type === 'ENTITY' && (prefix === 'V' || prefix === 'E' || prefix === 'P')) {
             return { 
                 isValid: false, 
                 status: 'MISMATCH', 
                 reasonCode: 'ENTITY_TYPE_MISMATCH',
                 explanation: `The RIF prefix '${prefix}' corresponds to an Individual and not a legal entity.`
             };
        }

        const isOfficial = validateRIFChecksum(sanitized);
        return { 
            isValid: true, 
            status: isOfficial ? 'VALID' : 'VALID_UNOFFICIAL', 
            isOfficialMatch: isOfficial, 
            explanation: decodeVenezuelanRIF(sanitized) + (isOfficial ? ' Verified via Modulo 11.' : ' Pattern match.')
        };
    }

    return { 
        isValid: false, 
        status: 'INVALID_FORMAT',
        explanation: 'Value does not match Venezuelan RIF (10 characters) format.'
    };
};

function decodeVenezuelanRIF(tin: string): string {
    const prefixes: Record<string, string> = {
        'V': 'Venezuelan Individual',
        'E': 'Foreign Individual',
        'J': 'Juridical Entity (Private)',
        'G': 'Governmental Entity',
        'P': 'Passport / Foreign Resident',
        'C': 'Comuna / Local Entity'
    };
    return `Venezuelan RIF, Type: ${prefixes[tin[0]] || 'Other'}.`;
}

function validateRIFChecksum(tin: string): boolean {
    const prefixMap: Record<string, number> = {
        'V': 1, 'E': 2, 'J': 3, 'P': 4, 'G': 5, 'C': 6
    };
    const prefixVal = prefixMap[tin[0]];
    if (prefixVal === undefined) return false;

    const weights = [4, 3, 2, 7, 6, 5, 4, 3, 2];
    const digits = [prefixVal, ...tin.substring(1, 9).split('').map(Number)];
    
    let sum = 0;
    for (let i = 0; i < 9; i++) {
        sum += digits[i] * weights[i];
    }
    
    const remainder = sum % 11;
    let checkDigit = 11 - remainder;
    if (checkDigit >= 10) checkDigit = 0;
    
    return checkDigit === parseInt(tin[9]);
}

/**
 * APPENDIX: FORENSIC CRITERIA
 * Venezuela uses the Registro Único de Información Fiscal (RIF).
 * 1. Structure: 1 Letter (Type) + 8 Digits (Sequence) + 1 Digit (Check).
 * 2. Type Mapping: V(1), E(2), J(3), P(4), G(5), C(6).
 * 3. Validation: Weighted sum algorithm Modulo 11.
 * 4. Residency: Center of vital interests or 183-day presence in a calendar year.
 * 5. Scope: Issued and managed by SENIAT.
 */
