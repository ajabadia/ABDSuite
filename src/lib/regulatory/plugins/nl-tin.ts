import { HolderMetadata, TinValidationResult, CountryRegulatoryInfo, TinInfo, TinRequirement } from './index';

/**
 * TIN Validation for Netherlands (NL)
 * BSN / RSIN (9 digits)
 * BTW (VAT): NL + 9 digits + B + 01-99
 */

/**
 * TIN Requirements for Netherlands
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
 * Country Metadata for Netherlands
 */
export const COUNTRY_INFO: CountryRegulatoryInfo = {
    name: 'Países Bajos',
    authority: 'Belastingdienst',
    compliance: {
        crsStatus: 'Participating',
        crsDate: 'September 2017',
        fatcaStatus: 'Model 1 (In Force)'
    },
    residency: {
        individual: 'Se determina en función de circunstancias factuales (lugar donde reside habitualmente, centro de intereses vitales y económicos).',
        entity: 'Residentes si se constituyeron bajo las leyes neerlandesas o si el lugar de dirección efectiva se encuentra en los Países Bajos.',
        notes: 'Criterios basados en hechos y circunstancias (Article 4 of the General Tax Act).'
    }
};

/**
 * TIN Metadata for Netherlands (Era 6.3)
 */
export const TIN_INFO: TinInfo = {
    name: 'BSN / RSIN / BTW',
    description: 'Dutch BSN (Individuals), RSIN (Entities), or VAT (BTW).',
    placeholder: '123456789 / NL123456789B01',
    officialLink: 'https://www.belastingdienst.nl',
    isOfficial: true,
    lastUpdated: '2026-04-24',
    source: 'OECD Portal / Belastingdienst',
    entityDifferentiation: {
        logic: 'Prefix and structure analysis.',
        individualDescription: 'Burgerservicenummer (BSN) of 9 digits.',
        businessDescription: 'Rechtspersonen en Samenwerkingsverbanden Informatienummer (RSIN) of 9 digits or VAT number.'
    }
};

/**
 * Netherlands TIN Validator - Era 6.3
 */
export const validateNLTIN = (
    value: string, 
    type: 'INDIVIDUAL' | 'ENTITY' | 'ANY' = 'ANY', 
    metadata?: HolderMetadata
): TinValidationResult => {
    const sanitized = value.trim().replace(/[\s.-]/g, '').toUpperCase();

    // 1. BSN / RSIN: 9 digits
    if (sanitized.length === 9 && /^[0-9]{9}$/.test(sanitized)) {
        const isOfficial = validateElfproef(sanitized);
        return { 
            isValid: true, 
            status: isOfficial ? 'VALID' : 'VALID_UNOFFICIAL', 
            isOfficialMatch: isOfficial, 
            explanation: type === 'ANY'
                ? 'Format valid for both Individuals (BSN) and Entities (RSIN). Please verify holder type.'
                : `Matches official Dutch 9-digit format (BSN/RSIN). ${isOfficial ? 'Verified via Elfproef (11-proef).' : 'Pattern match.'}` 
        };
    }

    // 2. BTW (VAT): NL + 9 digits + B + 2 digits
    if (/^NL[0-9]{9}B[0-9]{2}$/.test(sanitized)) {
        if (type === 'INDIVIDUAL') {
            return { 
                isValid: false, 
                status: 'MISMATCH', 
                reasonCode: 'ENTITY_TYPE_MISMATCH',
                explanation: 'The detected format (starting with NL) corresponds to a Dutch VAT (BTW) number, which applies to entities.'
            };
        }
        
        const bsnPart = sanitized.substring(2, 11);
        const suffix = sanitized.substring(12, 15);
        const isOfficial = validateElfproef(bsnPart);
        
        return {
            isValid: true,
            status: isOfficial ? 'VALID' : 'VALID_UNOFFICIAL',
            isOfficialMatch: isOfficial,
            explanation: type === 'ANY'
                ? 'Format valid for Entities (BTW/VAT). Note: This identifier is not valid for legal Individuals.'
                : `Matches official Dutch VAT (BTW) format. Suffix: ${suffix}. ${isOfficial ? 'Root verified via Elfproef.' : ''}`
        };
    }

    return { 
        isValid: false, 
        status: 'INVALID_FORMAT',
        explanation: 'Value does not match Dutch BSN (9 digits) or VAT (NL+9+B+2) format.'
    };
};

function validateElfproef(bsn: string): boolean {
    let sum = 0;
    for (let i = 0; i < 8; i++) {
        sum += parseInt(bsn.charAt(i)) * (9 - i);
    }
    sum -= parseInt(bsn.charAt(8));
    return sum % 11 === 0;
}

/**
 * APPENDIX: FORENSIC CRITERIA
 * Netherlands uses the BSN/RSIN and BTW systems.
 * 1. BSN (Individuals): 
 *    - 9-digit unique number assigned at birth or residency registration.
 *    - Validation: Elfproef (11-proef). 
 *    - Formula: Sum(Digit_i * (9-i)) - Digit_9. Result must be multiple of 11.
 * 2. RSIN (Entities): 
 *    - 9-digit number for legal units, shares the BSN structure and Elfproef.
 * 3. BTW (VAT): 
 *    - Format: NL + 9 digits (RSIN/BSN) + B + 2 digits (sequence 01-99).
 * 4. Residency: Factual circumstances based on center of economic/vital interests.
 */
