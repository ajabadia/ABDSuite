import { HolderMetadata, TinValidationResult, CountryRegulatoryInfo, TinInfo, TinRequirement } from './index';

/**
 * TIN Validation for Moldova (MD)
 * IDNP (13 digits)
 */

/**
 * TIN Requirements for Moldova
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
 * Country Metadata for Moldova
 */
export const COUNTRY_INFO: CountryRegulatoryInfo = {
    name: 'Moldavia',
    authority: 'State Tax Service (Serviciul Fiscal de Stat)',
    compliance: {
        crsStatus: 'Non-Participating',
        crsDate: 'N/A',
        fatcaStatus: 'Model 2 (In Force)'
    },
    residency: {
        individual: 'Se considera residente si tiene domicilio permanente en Moldavia o si permanece allí durante más de 183 días en el año fiscal.',
        entity: 'Se considera residente si se ha incorporado en Moldavia.',
        notes: 'Criterio de domicilio o estancia de 183 días.'
    }
};

/**
 * TIN Metadata for Moldova (Era 6.3)
 */
export const TIN_INFO: TinInfo = {
    name: 'IDNP',
    description: 'Moldovan IDNP issued by the State Tax Service.',
    placeholder: '2000001234567',
    officialLink: 'https://www.sfs.md',
    isOfficial: true,
    lastUpdated: '2026-04-24',
    source: 'Local Authority / Moldova SFS',
    entityDifferentiation: {
        logic: 'Prefix analysis (first digit).',
        individualDescription: '13-digit IDNP starting with 2.',
        businessDescription: '13-digit IDNP starting with 0 or other indicators.'
    }
};

/**
 * Moldova TIN Validator - Era 6.3
 */
export const validateMDTIN = (
    value: string, 
    type: 'INDIVIDUAL' | 'ENTITY' | 'ANY' = 'ANY', 
    metadata?: HolderMetadata
): TinValidationResult => {
    const sanitized = value.replace(/[\s-]/g, '');

    if (sanitized.length === 13 && /^[0-9]{13}$/.test(sanitized)) {
        const firstDigit = parseInt(sanitized[0]);
        const isIndividual = firstDigit === 2;
        
        if (isIndividual && type === 'ENTITY') {
             return { isValid: false, status: 'MISMATCH', reasonCode: 'ENTITY_TYPE_MISMATCH' };
        }
        
        const isOfficial = validateIDNPChecksum(sanitized);
        return { 
            isValid: true, 
            status: isOfficial ? 'VALID' : 'VALID_UNOFFICIAL', 
            isOfficialMatch: isOfficial, 
            explanation: `Matches official Moldovan IDNP (13 digits) format. ${isOfficial ? 'Verified via official checksum.' : 'Pattern match.'}` 
        };
    }

    return { 
        isValid: false, 
        status: 'INVALID_FORMAT',
        explanation: 'Value does not match Moldovan IDNP (13 digits) format.'
    };
};

function validateIDNPChecksum(tin: string): boolean {
    const weights = [7, 3, 1, 7, 3, 1, 7, 3, 1, 7, 3, 1];
    let sum = 0;
    for (let i = 0; i < 12; i++) sum += parseInt(tin[i]) * weights[i];
    const checkDigit = sum % 10;
    return checkDigit === parseInt(tin[12]);
}

/**
 * APPENDIX: FORENSIC CRITERIA
 * Moldova uses the IDNP (Identification Number of the Person) as a unified 
 * identifier.
 * 1. Scope: Issued by the Public Services Agency (ASP).
 * 2. Structure: 13-digit numeric sequence.
 *    - Digit 1: Entity type (2=Natural Person).
 *    - Digit 13: Check digit.
 * 3. Validation: Weighted sum algorithm Modulo 10.
 *    - Formula: Sum(Digit_i * Weight_i) % 10.
 * 4. Residency: Based on domicile or 183-day presence rule.
 */
