
import { HolderMetadata, TinValidationResult, CountryRegulatoryInfo, TinInfo, TinRequirement } from './index';

/**
 * TIN Validation for Canada (CA)
 * Individual: SIN (9 digits)
 * Entity: BN (9 digits)
 */

/**
 * TIN Requirements for Canada
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
 * Country Metadata for Canada
 */
export const COUNTRY_INFO: CountryRegulatoryInfo = {
    name: 'Canadá',
    authority: 'Canada Revenue Agency (CRA)',
    compliance: {
        crsStatus: 'Participating',
        crsDate: 'September 2017',
        fatcaStatus: 'Model 1 (In Force)'
    },
    residency: {
        individual: 'Se basa en los vínculos residenciales (vivienda, cónyuge, dependientes). También se consideran residentes quienes permanecen en el país más de 183 días (sojourners).',
        entity: 'Se considera residente si ha sido incorporada en Canadá o si su gestión y control central se ejercen en el país.',
        notes: 'Criterio de vínculos significativos o permanencia de 183 días.'
    }
};

/**
 * TIN Metadata for Canada (Era 6.3)
 */
export const TIN_INFO: TinInfo = {
    name: 'SIN / BN',
    description: 'Canadian Social Insurance Number (SIN) or Business Number (BN) issued by the CRA.',
    placeholder: '123-456-789',
    officialLink: 'https://www.canada.ca/en/revenue-agency.html',
    isOfficial: true,
    lastUpdated: '2026-04-24',
    source: 'OECD Portal / CRA',
    entityDifferentiation: {
        logic: 'Usage of the identifier.',
        individualDescription: 'Social Insurance Number (SIN) of 9 digits for individuals.',
        businessDescription: 'Business Number (BN) of 9 digits for companies and organizations.'
    }
};

/**
 * Canada TIN Validator - Era 6.3
 */
export const validateCATIN = (
    value: string, 
    type: 'INDIVIDUAL' | 'ENTITY' | 'ANY' = 'ANY', 
    metadata?: HolderMetadata
): TinValidationResult => {
    const sanitized = value.replace(/[\s-]/g, '');

    if (sanitized.length === 9 && /^[0-9]{9}$/.test(sanitized)) {
        // Individual SIN usually passes Luhn
        if (type === 'INDIVIDUAL' || type === 'ANY') {
            if (validateLuhn(sanitized)) {
                return { 
                    isValid: true, 
                    status: 'VALID', 
                    isOfficialMatch: true, 
                    explanation: type === 'ANY'
                        ? 'Format valid for Individuals (SIN). Note: This identifier is not valid for legal Entities.'
                        : decodeCanadaTIN(sanitized)
                };
            } else if (type === 'INDIVIDUAL') {
                return {
                    isValid: false,
                    status: 'INVALID_CHECKSUM',
                    explanation: 'Value matches 9-digit format but failed Canadian SIN Luhn checksum.'
                };
            }
        }

        return { 
            isValid: true, 
            status: 'VALID', 
            isOfficialMatch: true, 
            explanation: type === 'ANY'
                ? 'Format valid for Entities (Business Number). Note: This identifier is not valid for local Individuals.'
                : 'Matches official Canadian Business Number (BN) format.' 
        };
    }

    return { 
        isValid: false, 
        status: 'INVALID_FORMAT',
        explanation: 'Value does not match Canadian SIN or BN (9 digits) format.'
    };
};

function decodeCanadaTIN(sin: string): string {
    const firstDigit = sin[0];
    const regionMap: Record<string, string> = {
        '1': 'Atlantic Provinces',
        '2': 'Quebec',
        '3': 'Quebec',
        '4': 'Ontario',
        '5': 'Ontario',
        '6': 'Prairie Provinces / NWT / Nunavut',
        '7': 'Pacific Provinces / Yukon',
        '9': 'Temporary Resident (Worker/Student)'
    };
    
    const region = regionMap[firstDigit] || 'Unknown Region';
    const status = firstDigit === '9' ? 'Temporary' : 'Resident/Citizen';
    
    return `Canadian SIN (${status}) issued in ${region}. Verified via Luhn checksum.`;
}

function validateLuhn(value: string): boolean {
    let sum = 0;
    for (let i = 0; i < value.length; i++) {
        let digit = parseInt(value[i]);
        if ((value.length - i) % 2 === 0) {
            digit *= 2;
            if (digit > 9) digit -= 9;
        }
        sum += digit;
    }
    return sum % 10 === 0;
}

/**
 * APPENDIX: FORENSIC CRITERIA
 * Canada uses a 9-digit system for both SIN (Individuals) and BN (Entities).
 * 1. SIN (Social Insurance Number): 
 *    - Digit 1: Region code (e.g., 1 for Atlantic, 4/5 for Ontario). 
 *    - Digit 1 = '9': Temporary residents.
 *    - Validation: Luhn algorithm (sum of digits with weights 1,2,1,2...).
 * 2. BN (Business Number): 
 *    - 9-digit numeric code assigned by the CRA. 
 *    - Often followed by a 6-character program account code (e.g., RC0001).
 * 3. Residency: Multi-factor 'Residential Ties' test (Significant vs Secondary ties).
 * 4. Validation: Structural verification and Luhn check for SIN.
 */

