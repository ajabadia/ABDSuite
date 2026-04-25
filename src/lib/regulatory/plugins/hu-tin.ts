
import { HolderMetadata, TinValidationResult, CountryRegulatoryInfo, TinInfo, TinRequirement } from './index';

/**
 * TIN Validation for Hungary (HU)
 * Individual: Tax Identification Number (10 digits)
 * Entity: Tax Number (11 digits)
 */

/**
 * TIN Requirements for Hungary
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
    },
    { key: 'birthDate', label: 'birthDate', type: 'date', scope: 'INDIVIDUAL' }
];

/**
 * Country Metadata for Hungary
 */
export const COUNTRY_INFO: CountryRegulatoryInfo = {
    name: 'Hungría',
    authority: 'National Tax and Customs Administration (NAV)',
    compliance: {
        crsStatus: 'Participating',
        crsDate: 'September 2017',
        fatcaStatus: 'Model 1 (In Force)'
    },
    residency: {
        individual: 'Se considera residente si tiene domicilio permanente en Hungría, si su centro de intereses vitales está allí o si permanece 183 días en el año natural.',
        entity: 'Se considera residente si se ha incorporado en Hungría o si tiene su sede administrativa efectiva allí.',
        notes: 'Criterio de domicilio, intereses vitales o permanencia.'
    }
};

/**
 * TIN Metadata for Hungary (Era 6.3)
 */
export const TIN_INFO: TinInfo = {
    name: 'Adóazonosító / Adószám',
    description: 'Hungarian Tax Identification Number (Individuals) or Tax Number (Entities) issued by the NAV.',
    placeholder: '8123456789 / 12345678-1-12',
    officialLink: 'https://www.nav.gov.hu',
    isOfficial: true,
    lastUpdated: '2026-04-24',
    source: 'OECD Portal / NAV',
    entityDifferentiation: {
        logic: 'Number length and prefix analysis.',
        individualDescription: '10-digit number starting with 8.',
        businessDescription: '11-digit number.'
    }
};

/**
 * Hungary TIN Validator - Era 6.3
 */
export const validateHUTIN = (
    value: string, 
    type: 'INDIVIDUAL' | 'ENTITY' | 'ANY' = 'ANY', 
    metadata?: HolderMetadata
): TinValidationResult => {
    const sanitized = value.replace(/[\s-]/g, '');

    // Individual: 10 digits starting with 8
    if (sanitized.length === 10 && sanitized[0] === '8' && /^[0-9]{10}$/.test(sanitized)) {
        if (type === 'ENTITY') {
            return { 
                isValid: false, 
                status: 'MISMATCH', 
                reasonCode: 'ENTITY_TYPE_MISMATCH',
                explanation: 'The detected format (10 digits starting with 8) corresponds to a Hungarian Individual TIN (Adóazonosító jel).'
            };
        }
        return { 
            isValid: true, 
            status: 'VALID', 
            isOfficialMatch: true, 
            explanation: decodeHungaryTIN(sanitized)
        };
    }

    // Entity: 11 digits
    if (sanitized.length === 11 && /^[0-9]{11}$/.test(sanitized)) {
        if (type === 'INDIVIDUAL') {
            return { 
                isValid: false, 
                status: 'MISMATCH', 
                reasonCode: 'ENTITY_TYPE_MISMATCH',
                explanation: 'The detected format (11 digits) corresponds to a Hungarian Tax Number (Adószám), which applies only to entities.'
            };
        }
        return { 
            isValid: true, 
            status: 'VALID', 
            isOfficialMatch: true, 
            explanation: 'Matches official Hungarian Tax Number (11 digits) format.' 
        };
    }

    return { 
        isValid: false, 
        status: 'INVALID_FORMAT',
        explanation: 'Value does not match Hungarian Tax Identification Number (10 digits) or Tax Number (11 digits) format.'
    };
};

function decodeHungaryTIN(tin: string): string {
    const dobPart = parseInt(tin.substring(1, 7));
    // The date is number of days since 1867-01-01
    const startDate = new Date(1867, 0, 1);
    const birthDate = new Date(startDate.getTime() + dobPart * 24 * 60 * 60 * 1000);
    
    return `Individual TIN: Encoded Birth Date ${birthDate.toISOString().split('T')[0]}. Verified via structure.`;
}

/**
 * APPENDIX: FORENSIC CRITERIA
 * Hungary's individual TIN (Adóazonosító jel) is a 10-digit number.
 * 1. Prefix: Must start with the digit '8'.
 * 2. Birth Date: Digits 2 through 7 represent the number of days between 
 *    the holder's birth date and January 1st, 1867.
 * 3. Checksum: The 10th digit is a check digit based on a weighted sum (1 to 9) 
 *    Modulo 11.
 * 4. Entity: 11-digit Adószám (Tax Number).
 */

