import { HolderMetadata, TinValidationResult, CountryRegulatoryInfo, TinInfo, TinRequirement } from './index';

/**
 * TIN Validation for Sri Lanka (LK)
 * Individual: National Identity Card (NIC) (10 or 12 characters)
 * Entity: Tax Identification Number (TIN) (9 digits)
 */

/**
 * TIN Requirements for Sri Lanka
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
 * Country Metadata for Sri Lanka
 */
export const COUNTRY_INFO: CountryRegulatoryInfo = {
    name: 'Sri Lanka',
    authority: 'Inland Revenue Department (IRD)',
    compliance: {
        crsStatus: 'Non-Participating',
        crsDate: 'N/A',
        fatcaStatus: 'Model 2 (In Force)'
    },
    residency: {
        individual: 'Se considera residente si permanece en Sri Lanka durante más de 183 días en el año fiscal.',
        entity: 'Se considera residente si está incorporada en Sri Lanka.',
        notes: 'Criterio de permanencia física o constitución legal.'
    }
};

/**
 * TIN Metadata for Sri Lanka (Era 6.3)
 */
export const TIN_INFO: TinInfo = {
    name: 'NIC / TIN',
    description: 'Sri Lankan NIC (Individuals) or TIN (Entities) issued by the DRP or IRD.',
    placeholder: '123456789V / 200012345678',
    officialLink: 'https://www.ird.gov.lk',
    isOfficial: true,
    lastUpdated: '2026-04-24',
    source: 'Local Authority / Sri Lanka Tax',
    entityDifferentiation: {
        logic: 'Structure analysis.',
        individualDescription: '10-char NIC (ending V/X) or 12-digit NIC.',
        businessDescription: '9-digit TIN identifier.'
    }
};

/**
 * Sri Lanka TIN Validator - Era 6.3
 */
export const validateLKTIN = (
    value: string, 
    type: 'INDIVIDUAL' | 'ENTITY' | 'ANY' = 'ANY', 
    metadata?: HolderMetadata
): TinValidationResult => {
    const sanitized = value.trim().toUpperCase().replace(/[\s-]/g, '');

    // 1. Individual (NIC): Old format (10 chars: 9 digits + V/X)
    if (sanitized.length === 10 && /^[0-9]{9}[VX]$/.test(sanitized)) {
        if (type === 'ENTITY') {
             return { isValid: false, status: 'MISMATCH', reasonCode: 'ENTITY_TYPE_MISMATCH' };
        }
        return { 
            isValid: true, 
            status: 'VALID', 
            isOfficialMatch: true, 
            explanation: decodeOldNIC(sanitized)
        };
    }

    // 2. Individual (NIC): New format (12 digits)
    if (sanitized.length === 12 && /^[0-9]{12}$/.test(sanitized)) {
        if (type === 'ENTITY') {
             return { isValid: false, status: 'MISMATCH', reasonCode: 'ENTITY_TYPE_MISMATCH' };
        }
        return { 
            isValid: true, 
            status: 'VALID', 
            isOfficialMatch: true, 
            explanation: decodeNewNIC(sanitized)
        };
    }

    // 3. Business/Entity (TIN): 9 digits
    if (sanitized.length === 9 && /^[0-9]{9}$/.test(sanitized)) {
        if (type === 'INDIVIDUAL') {
             return { isValid: false, status: 'MISMATCH', reasonCode: 'ENTITY_TYPE_MISMATCH' };
        }
        return { 
            isValid: true, 
            status: 'VALID', 
            isOfficialMatch: true, 
            explanation: 'Matches official Sri Lankan TIN (9 digits) format.' 
        };
    }

    return { 
        isValid: false, 
        status: 'INVALID_FORMAT',
        explanation: 'Value does not match Sri Lankan NIC or TIN format.'
    };
};

function decodeOldNIC(nic: string): string {
    const yy = nic.substring(0, 2);
    let days = parseInt(nic.substring(2, 5));
    const gender = days > 500 ? 'Female' : 'Male';
    if (days > 500) days -= 500;
    const suffix = nic[9] === 'V' ? 'Voter' : 'Non-voter';
    
    return `NIC (Old): ${gender}, born in 19${yy} (day ${days}). Status: ${suffix}. Verified via structure.`;
}

function decodeNewNIC(nic: string): string {
    const yyyy = nic.substring(0, 4);
    let days = parseInt(nic.substring(4, 7));
    const gender = days > 500 ? 'Female' : 'Male';
    if (days > 500) days -= 500;
    
    return `NIC (New): ${gender}, born in ${yyyy} (day ${days}). Verified via structure.`;
}

/**
 * APPENDIX: FORENSIC CRITERIA
 * Sri Lanka uses the National Identity Card (NIC) for individuals.
 * 1. Old NIC (10 characters): 
 *    - Format: 9 digits followed by 'V' (voter) or 'X' (non-voter).
 *    - Digits 1-2: Birth year (19YY).
 *    - Digits 3-5: Birth day of the year (+500 for females).
 * 2. New NIC (12 digits): 
 *    - Introduced in 2016.
 *    - Digits 1-4: Birth year (YYYY).
 *    - Digits 5-7: Birth day of the year (+500 for females).
 * 3. Entities use a 9-digit Tax Identification Number (TIN).
 * 4. Residency: Centered on the 183-day presence rule in a fiscal year.
 */
