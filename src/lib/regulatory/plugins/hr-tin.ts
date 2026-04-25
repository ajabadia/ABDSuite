import { HolderMetadata, TinValidationResult, CountryRegulatoryInfo, TinInfo, TinRequirement } from './index';

/**
 * TIN Validation for Croatia (HR)
 * OIB (11 digits)
 */

/**
 * TIN Requirements for Croatia
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
 * Country Metadata for Croatia
 */
export const COUNTRY_INFO: CountryRegulatoryInfo = {
    name: 'Croacia',
    authority: 'Tax Administration (Porezna uprava)',
    compliance: {
        crsStatus: 'Participating',
        crsDate: 'September 2017',
        fatcaStatus: 'Model 1 (In Force)'
    },
    residency: {
        individual: 'Se considera residente si tiene domicilio o residencia habitual en Croacia.',
        entity: 'Se considera residente si tiene su sede legal o lugar de administración efectiva en Croacia.',
        notes: 'Criterio de domicilio o administración efectiva.'
    }
};

/**
 * TIN Metadata for Croatia (Era 6.3)
 */
export const TIN_INFO: TinInfo = {
    name: 'OIB',
    description: 'Croatian OIB issued by the Tax Administration.',
    placeholder: '12345678901',
    officialLink: 'https://www.porezna-uprava.hr',
    isOfficial: true,
    lastUpdated: '2026-04-24',
    source: 'OECD Portal / Porezna uprava',
    entityDifferentiation: {
        logic: 'Structurally identical identifiers.',
        individualDescription: '11-digit OIB identifier.',
        businessDescription: '11-digit OIB identifier.'
    }
};

/**
 * Croatia TIN Validator - Era 6.3
 */
export const validateHRTIN = (
    value: string, 
    type: 'INDIVIDUAL' | 'ENTITY' | 'ANY' = 'ANY', 
    metadata?: HolderMetadata
): TinValidationResult => {
    const sanitized = value.replace(/[\s-]/g, '');

    if (sanitized.length === 11 && /^[0-9]{11}$/.test(sanitized)) {
        const isOfficial = validateOIBChecksum(sanitized);
        return { 
            isValid: true, 
            status: isOfficial ? 'VALID' : 'VALID_UNOFFICIAL', 
            isOfficialMatch: isOfficial, 
            explanation: `Matches official Croatian OIB (11 digits) format. ${isOfficial ? 'Verified via ISO 7064 checksum.' : 'Structural match only.'}` 
        };
    }

    return { 
        isValid: false, 
        status: 'INVALID_FORMAT',
        explanation: 'Value does not match Croatian OIB (11 digits) format.'
    };
};

function validateOIBChecksum(oib: string): boolean {
    let remainder = 10;
    for (let i = 0; i < 10; i++) {
        let digit = parseInt(oib[i]);
        remainder = (remainder + digit) % 10;
        if (remainder === 0) remainder = 10;
        remainder = (remainder * 2) % 11;
    }
    const checkDigit = (11 - remainder) % 10;
    return checkDigit === parseInt(oib[10]);
}

/**
 * APPENDIX: FORENSIC CRITERIA
 * Croatia uses the OIB (Osobni Identifikacijski Broj) for all tax and identity 
 * purposes.
 * 1. Structure: 11 digits. 
 *    - The first 10 digits are sequential/numeric.
 *    - The 11th digit is the check digit.
 * 2. Validation: Algorithm ISO 7064, Modulo 11, 10.
 *    - Note: This is a recursive algorithm where each step depends on the 
 *      result of the previous one.
 * 3. Residency: Based on domicile, habitual residence, or place of effective 
 *    management.
 * 4. Scope: Issued by the Tax Administration (Porezna uprava).
 */
