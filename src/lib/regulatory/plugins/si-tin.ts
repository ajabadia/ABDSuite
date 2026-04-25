import { HolderMetadata, TinValidationResult, CountryRegulatoryInfo, TinInfo, TinRequirement } from './index';

/**
 * TIN Validation for Slovenia (SI)
 * Tax Number (8 digits)
 */

/**
 * TIN Requirements for Slovenia
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
 * Country Metadata for Slovenia
 */
export const COUNTRY_INFO: CountryRegulatoryInfo = {
    name: 'Eslovenia',
    authority: 'Financial Administration (Finančna uprava)',
    compliance: {
        crsStatus: 'Participating',
        crsDate: 'September 2017',
        fatcaStatus: 'Model 1 (In Force)'
    },
    residency: {
        individual: 'Se considera residente si tiene su residencia principal en Eslovenia o si permanece allí durante más de 183 días en el año civil.',
        entity: 'Se considera residente si tiene su sede legal o lugar de administración efectiva en Eslovenia.',
        notes: 'Criterio de residencia principal o estancia de 183 días.'
    }
};

/**
 * TIN Metadata for Slovenia (Era 6.3)
 */
export const TIN_INFO: TinInfo = {
    name: 'Davčna številka',
    description: 'Slovenian Tax Number issued by the Financial Administration.',
    placeholder: '12345678',
    officialLink: 'https://www.fu.gov.si',
    isOfficial: true,
    lastUpdated: '2026-04-24',
    source: 'OECD Portal / Finančna uprava',
    entityDifferentiation: {
        logic: 'Structurally identical identifiers.',
        individualDescription: '8-digit Tax Number.',
        businessDescription: '8-digit Tax Number.'
    }
};

/**
 * Slovenia TIN Validator - Era 6.3
 */
export const validateSITIN = (
    value: string, 
    type: 'INDIVIDUAL' | 'ENTITY' | 'ANY' = 'ANY', 
    metadata?: HolderMetadata
): TinValidationResult => {
    const sanitized = value.trim().toUpperCase().replace(/[\s-]/g, '');

    if (sanitized.length === 8 && /^[0-9]{8}$/.test(sanitized)) {
        const isOfficial = validateSIChecksum(sanitized);
        return { 
            isValid: true, 
            status: isOfficial ? 'VALID' : 'VALID_UNOFFICIAL', 
            isOfficialMatch: isOfficial, 
            explanation: `Matches official Slovenian 8-digit Tax Number format. ${isOfficial ? 'Verified via checksum.' : 'Pattern match.'}` 
        };
    }

    return { 
        isValid: false, 
        status: 'INVALID_FORMAT',
        explanation: 'Value does not match Slovenian Tax Number (8 digits) format.'
    };
};

function validateSIChecksum(tin: string): boolean {
    const weights = [8, 7, 6, 5, 4, 3, 2];
    let sum = 0;
    for (let i = 0; i < 7; i++) sum += parseInt(tin[i]) * weights[i];
    const remainder = sum % 11;
    let checkDigit = 11 - remainder;
    if (checkDigit === 10) checkDigit = 0;
    if (checkDigit === 11) checkDigit = 0; // Not common but per standard
    return checkDigit === parseInt(tin[7]);
}

/**
 * APPENDIX: FORENSIC CRITERIA
 * Slovenia uses the Tax Number (Davčna številka) for all taxpayers.
 * 1. Scope: Issued and managed by the Financial Administration (FURS).
 * 2. Structure: Numeric sequence of 8 digits.
 * 3. Validation: Weighted sum algorithm Modulo 11.
 *    - Weights: [8, 7, 6, 5, 4, 3, 2].
 * 4. Residency: Centered on the 183-day presence rule or principal residence.
 */
