import { HolderMetadata, TinValidationResult, CountryRegulatoryInfo, TinInfo, TinRequirement } from './index';

/**
 * TIN Validation for Hong Kong (HK)
 * HKID (1 or 2 letters + 6 digits + check digit in brackets)
 * BRN (8 or 11 digits)
 */

/**
 * TIN Requirements for Hong Kong
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
 * Country Metadata for Hong Kong
 */
export const COUNTRY_INFO: CountryRegulatoryInfo = {
    name: 'Hong Kong',
    authority: 'Inland Revenue Department (IRD)',
    compliance: {
        crsStatus: 'Participating',
        crsDate: 'September 2018',
        fatcaStatus: 'Model 2 (In Force)'
    },
    residency: {
        individual: 'Residente si reside habitualmente en Hong Kong o si permanece más de 180 días en el año o más de 300 días repartidos en dos años.',
        entity: 'Residentes si se constituyeron en Hong Kong o si la gestión central y el control se ejercen en Hong Kong.',
        notes: 'Inland Revenue Ordinance (Cap. 112).'
    }
};

/**
 * TIN Metadata for Hong Kong (Era 6.3)
 */
export const TIN_INFO: TinInfo = {
    name: 'HKID / BRN',
    description: 'Hong Kong Identity Card (HKID) or Business Registration Number (BRN) issued by the IRD.',
    placeholder: 'A123456(7) / 12345678-000',
    officialLink: 'https://www.ird.gov.hk',
    isOfficial: true,
    lastUpdated: '2026-04-24',
    source: 'OECD Portal / IRD',
    entityDifferentiation: {
        logic: 'Alphanumeric vs Numeric structure analysis.',
        individualDescription: 'HKID with 1 or 2 letters, 6 numbers and a control digit or letter.',
        businessDescription: 'Business Registration Number (BRN) of 8 numbers (plus optional 3 digits for branch).'
    }
};

/**
 * Hong Kong TIN Validator - Era 6.3
 */
export const validateHKTIN = (
    value: string, 
    type: 'INDIVIDUAL' | 'ENTITY' | 'ANY' = 'ANY', 
    metadata?: HolderMetadata
): TinValidationResult => {
    const sanitized = value.replace(/[\s()]/g, '').toUpperCase();

    const isHKID = /^[A-Z]{1,2}[0-9]{6}[A0-9]$/.test(sanitized);
    const isBRN = /^[0-9]{8}$/.test(sanitized) || /^[0-9]{11}$/.test(sanitized);

    if (isHKID) {
        if (type === 'ENTITY') {
            return { 
                isValid: false, 
                status: 'MISMATCH', 
                reasonCode: 'ENTITY_TYPE_MISMATCH',
                explanation: 'The detected format corresponds to a Hong Kong Identity Card (HKID), which is exclusive to individuals.'
            };
        }
        
        if (validateHKIDChecksum(sanitized)) {
            return { 
                isValid: true, 
                status: 'VALID', 
                isOfficialMatch: true, 
                explanation: type === 'ANY'
                    ? 'Format valid for Individuals (HKID). Note: This identifier is not valid for legal Entities.'
                    : 'Individual HKID. Verified via official checksum.' 
            };
        } else {
            return { isValid: false, status: 'INVALID_CHECKSUM', explanation: 'Failed Hong Kong HKID checksum validation.' };
        }
    }

    if (isBRN) {
        if (type === 'INDIVIDUAL') {
            return { 
                isValid: false, 
                status: 'MISMATCH', 
                reasonCode: 'ENTITY_TYPE_MISMATCH',
                explanation: 'The detected format corresponds to a Hong Kong Business Registration Number (BRN), which applies to legal entities.'
            };
        }
        
        const brnBase = sanitized.substring(0, 8);
        return { 
            isValid: true, 
            status: 'VALID', 
            isOfficialMatch: true, 
            explanation: type === 'ANY'
                ? 'Format valid for Entities (BRN). Note: This identifier is not valid for local Individuals.'
                : `Legal Entity Business Registration Number (BRN). Base: ${brnBase}.` 
        };
    }

    return { 
        isValid: false, 
        status: 'INVALID_FORMAT',
        explanation: 'Value does not match Hong Kong HKID (alphanumeric) or BRN (8/11 digits) format.'
    };
};

function validateHKIDChecksum(hkid: string): boolean {
    const isTwoLetter = /^[A-Z]{2}/.test(hkid);
    const weights = isTwoLetter ? [9, 8, 7, 6, 5, 4, 3, 2] : [8, 7, 6, 5, 4, 3, 2];
    const dataPart = hkid.substring(0, hkid.length - 1);
    const checkPart = hkid[hkid.length - 1];
    
    let sum = isTwoLetter ? 0 : 36 * 8; // Space before single letter weights 36
    
    for (let i = 0; i < dataPart.length; i++) {
        const char = dataPart[i];
        const val = /[A-Z]/.test(char) ? char.charCodeAt(0) - 64 : parseInt(char);
        sum += val * weights[i];
    }
    
    const remainder = sum % 11;
    const expectedCheck = remainder === 0 ? '0' : (remainder === 1 ? 'A' : (11 - remainder).toString());
    
    return expectedCheck === checkPart;
}

/**
 * APPENDIX: FORENSIC CRITERIA
 * Hong Kong uses the HKID for individuals and the BRN for entities.
 * 1. HKID (1 or 2 letters + 6 digits + check character): 
 *    - Check character is in brackets on official cards.
 *    - Validation: Weighted sum algorithm Modulo 11. Letters are converted to 
 *      their alphabetic position (A=1, B=2, etc.).
 * 2. BRN (Business Registration Number): 
 *    - 8-digit numeric code assigned to all businesses.
 *    - Extensions: A 3-digit branch code is often appended (e.g., -000 for headquarters).
 * 3. Residency: Based on ordinary residence or physical stay (>180 days).
 * 4. Validation: Comprehensive support for HKID checksum and BRN structure.
 */
