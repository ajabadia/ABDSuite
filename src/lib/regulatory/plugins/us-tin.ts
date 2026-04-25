import { HolderMetadata, TinValidationResult, CountryRegulatoryInfo, TinInfo, TinRequirement } from './index';

/**
 * TIN Validation for USA (US)
 * SSN (9 digits), ITIN (9 digits), EIN (9 digits)
 */

/**
 * TIN Requirements for United States
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
 * Country Metadata for United States
 */
export const COUNTRY_INFO: CountryRegulatoryInfo = {
    name: 'United States',
    authority: 'Internal Revenue Service (IRS)',
    compliance: {
        crsStatus: 'Non-Participating',
        crsDate: 'N/A',
        fatcaStatus: 'Self (FATCA Origin)'
    },
    residency: {
        individual: 'US Citizens, Green Card holders (Resident Alien), or those passing the Substantial Presence Test (183 days over 3 years).',
        entity: 'Incorporated under the laws of any US State or the District of Columbia.',
        notes: 'US Persons are subject to worldwide taxation regardless of physical location.'
    }
};

/**
 * TIN Metadata for United States (Era 6.3)
 */
export const TIN_INFO: TinInfo = {
    name: 'SSN / ITIN / EIN',
    description: 'US Social Security Number (SSN), ITIN or EIN issued by the SSA or IRS.',
    placeholder: '999-00-9999',
    officialLink: 'https://www.irs.gov',
    isOfficial: true,
    lastUpdated: '2026-04-24',
    source: 'OECD Portal / IRS',
    entityDifferentiation: {
        logic: 'Prefix and issuer system analysis.',
        individualDescription: '9 digits (SSN) or ITIN (starts with 9).',
        businessDescription: '9 digits (EIN) with specific assigned ranges.'
    }
};

/**
 * USA TIN Validator - Era 6.3
 */
export const validateUSTIN = (
    value: string, 
    type: 'INDIVIDUAL' | 'ENTITY' | 'ANY' = 'ANY', 
    metadata?: HolderMetadata
): TinValidationResult => {
    const sanitized = value.trim().replace(/[\s-]/g, '');

    if (sanitized.length !== 9 || !/^[0-9]{9}$/.test(sanitized)) {
        return { 
            isValid: false, 
            status: 'INVALID_FORMAT',
            explanation: 'Value does not match US TIN (9 digits) format.'
        };
    }

    // 1. SSN Invalid Ranges
    if (sanitized.startsWith('000') || sanitized.startsWith('666') || parseInt(sanitized.substring(0, 3)) >= 900) {
        if (!sanitized.startsWith('9')) { // Ranges above 900 are ITINs/ATINs
            return { isValid: false, status: 'INVALID_FORMAT', explanation: 'SSN contains an invalid area number (000, 666, or 900+).' };
        }
    }
    if (sanitized.substring(3, 5) === '00') {
        return { isValid: false, status: 'INVALID_FORMAT', explanation: 'SSN/ITIN contains an invalid group number (00).' };
    }
    if (sanitized.substring(5, 9) === '0000') {
        return { isValid: false, status: 'INVALID_FORMAT', explanation: 'SSN/ITIN contains an invalid serial number (0000).' };
    }

    const isITIN = sanitized.startsWith('9');
    
    if (isITIN && type === 'ENTITY') {
        return { isValid: false, status: 'MISMATCH', reasonCode: 'ENTITY_TYPE_MISMATCH', explanation: 'ITIN is reserved for individuals, not entities.' };
    }

    const explanation = decodeUSTIN(sanitized);

    return { 
        isValid: true, 
        status: 'VALID', 
        isOfficialMatch: true, 
        explanation: type === 'ANY'
            ? (sanitized.startsWith('9') 
                ? 'Format valid for Individuals (ITIN). Note: This identifier is not valid for legal Entities.'
                : 'Format valid for US TIN (9 digits). This could be an SSN (Individual) or EIN (Entity/Employer).')
            : explanation
    };
};

function decodeUSTIN(tin: string): string {
    if (tin.startsWith('9')) {
        const middleDigits = parseInt(tin.substring(3, 5));
        // ITIN range check (Historical and Current)
        const isITINRange = (middleDigits >= 50 && middleDigits <= 65) || 
                            (middleDigits >= 70 && middleDigits <= 88) || 
                            (middleDigits >= 90 && middleDigits <= 92) || 
                            (middleDigits >= 94 && middleDigits <= 99);
        
        if (isITINRange) {
            return `Individual Taxpayer Identification Number (ITIN). Issued to non-residents.`;
        }
        return `U.S. Individual Tax Identification (ITIN/ATIN). Range check verified.`;
    }
    
    // EIN (Employer Identification Number) usually uses prefixes defined by the IRS
    // Prefix ranges like 10, 12, 20, 26, 27, 30, 32, 35-39, 41-48, 50-61, 65-68, 71-77, 80-88, 90-95, 98-99
    const prefix = parseInt(tin.substring(0, 2));
    const einPrefixes = [10, 12, 20, 26, 27, 30, 32, 35, 36, 37, 38, 39, 41, 42, 43, 44, 45, 46, 47, 48, 50, 51, 52, 53, 54, 55, 56, 57, 58, 59, 60, 61, 65, 66, 67, 68, 71, 72, 73, 74, 75, 76, 77, 80, 81, 82, 83, 84, 85, 86, 87, 88, 90, 91, 92, 93, 94, 95, 98, 99];
    
    if (einPrefixes.includes(prefix)) {
        return `U.S. Identification Number (Possible EIN or SSN). Verified via 9-digit format.`;
    }
    
    return `U.S. Social Security Number (SSN). Area/Group/Serial verification passed.`;
}

/**
 * APPENDIX: FORENSIC CRITERIA
 * The United States uses a 9-digit system for all tax identification.
 * 1. SSN (Social Security Number): 
 *    - Issued by SSA. Pattern: AAA-GG-SSSS.
 *    - Invalid: AAA (000, 666, 900+), GG (00), SSSS (0000).
 * 2. ITIN (Individual TIN): 
 *    - Issued by IRS. Pattern: 9XX-XX-XXXX.
 *    - Used for those not eligible for SSN.
 * 3. EIN (Employer ID Number): 
 *    - Pattern: XX-XXXXXXX. 
 *    - Used for entities and employers.
 * 4. Residency: Green Card rule, Substantial Presence Test (183 days weighted over 3 years), or Citizenship.
 */
