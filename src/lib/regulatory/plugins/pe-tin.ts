import { HolderMetadata, TinValidationResult, CountryRegulatoryInfo, TinInfo, TinRequirement } from './index';

/**
 * TIN Validation for Peru (PE)
 * RUC (11 digits)
 */

/**
 * TIN Requirements for Peru
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
 * Country Metadata for Peru
 */
export const COUNTRY_INFO: CountryRegulatoryInfo = {
    name: 'Perú',
    authority: 'Superintendencia Nacional de Aduanas y de Administración Tributaria (SUNAT)',
    compliance: {
        crsStatus: 'Participating',
        crsDate: 'September 2020',
        fatcaStatus: 'Model 1 (In Force)'
    },
    residency: {
        individual: 'Se considera residente si permanece en Perú más de 183 días en un periodo de 12 meses.',
        entity: 'Se considera residente si está constituida en Perú.',
        notes: 'Criterio de permanencia física o constitución legal.'
    }
};

/**
 * TIN Metadata for Peru (Era 6.3)
 */
export const TIN_INFO: TinInfo = {
    name: 'RUC',
    description: 'Peruvian RUC issued by the SUNAT for tax purposes.',
    placeholder: '20123456789',
    officialLink: 'https://www.sunat.gob.pe',
    isOfficial: true,
    lastUpdated: '2026-04-24',
    source: 'OECD Portal / SUNAT',
    entityDifferentiation: {
        logic: 'Initial two digits analysis.',
        individualDescription: 'RUC starting with 10 (Resident) or 15/17 (Foreigner).',
        businessDescription: 'RUC starting with 20 (Legal Entity).'
    }
};

/**
 * Peru TIN Validator - Era 6.3
 */
export const validatePETIN = (
    value: string, 
    type: 'INDIVIDUAL' | 'ENTITY' | 'ANY' = 'ANY', 
    metadata?: HolderMetadata
): TinValidationResult => {
    const sanitized = value.replace(/[\s-]/g, '');

    if (sanitized.length === 11 && /^[0-9]{11}$/.test(sanitized)) {
        const isOfficial = validateRUCChecksum(sanitized);
        const prefix = sanitized.substring(0, 2);
        
        if (prefix === '10' && type === 'ENTITY') {
            return { 
                isValid: false, 
                status: 'MISMATCH', 
                reasonCode: 'ENTITY_TYPE_MISMATCH',
                explanation: 'The RUC prefix 10 is reserved for Natural Persons and not for legal entities.'
            };
        }
        if (prefix === '20' && type === 'INDIVIDUAL') {
            return { 
                isValid: false, 
                status: 'MISMATCH', 
                reasonCode: 'ENTITY_TYPE_MISMATCH',
                explanation: 'The RUC prefix 20 is reserved for Legal Entities and not for individuals.'
            };
        }

        const isIndividual = prefix === '10' || ['15', '16', '17'].includes(prefix);
        const isEntity = prefix === '20';

        return { 
            isValid: true, 
            status: isOfficial ? 'VALID' : 'VALID_UNOFFICIAL', 
            isOfficialMatch: isOfficial, 
            explanation: type === 'ANY'
                ? (isEntity 
                    ? 'Format valid for Entities (RUC starting with 20). Note: This identifier is not valid for Individuals.'
                    : (isIndividual 
                        ? 'Format valid for Individuals (RUC starting with 1X). Note: This identifier is not valid for legal Entities.'
                        : decodePeruTIN(sanitized)))
                : decodePeruTIN(sanitized) + (isOfficial ? ' Verified via official checksum.' : ' Pattern match.')
        };
    }

    return { 
        isValid: false, 
        status: 'INVALID_FORMAT',
        explanation: 'Value does not match Peruvian RUC (11 digits) format.'
    };
};

function decodePeruTIN(tin: string): string {
    const prefix = tin.substring(0, 2);
    const typeMap: Record<string, string> = {
        '10': 'Natural Person (Resident)',
        '15': 'Natural Person (Foreigner)',
        '16': 'Natural Person (Foreigner)',
        '17': 'Natural Person (Foreigner)',
        '20': 'Legal Entity'
    };
    const taxpayerType = typeMap[prefix] || 'Other Taxpayer';
    return `Peruvian RUC, ${taxpayerType}.`;
}

function validateRUCChecksum(ruc: string): boolean {
    const weights = [5, 4, 3, 2, 7, 6, 5, 4, 3, 2];
    let sum = 0;
    for (let i = 0; i < 10; i++) {
        sum += parseInt(ruc[i]) * weights[i];
    }
    const remainder = sum % 11;
    let expected = 11 - remainder;
    if (expected === 11) expected = 0;
    else if (expected === 10) expected = 1;
    
    return expected === parseInt(ruc[10]);
}

/**
 * APPENDIX: FORENSIC CRITERIA
 * Peru uses the RUC (Registro Único de Contribuyentes) for all taxpayers.
 * 1. Scope: Issued and managed by SUNAT.
 * 2. Structure: 11-digit numeric sequence.
 *    - Prefix 10: Individual (Natural Person with DNI).
 *    - Prefix 15/17: Foreign Individuals.
 *    - Prefix 20: Legal Entities.
 * 3. Validation: Weighted sum algorithm Modulo 11.
 *    - Weights: [5, 4, 3, 2, 7, 6, 5, 4, 3, 2].
 *    - Special rule: If remainder result is 10, check digit is 1.
 * 4. Residency: Based on the 183-day presence rule in a 12-month period.
 */
