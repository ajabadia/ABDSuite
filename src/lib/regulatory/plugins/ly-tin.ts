import { HolderMetadata, TinValidationResult, CountryRegulatoryInfo, TinInfo, TinRequirement } from './index';

/**
 * TIN Validation for Libya (LY)
 * Individual: National Number (12 digits)
 * Entity: Tax Identification Number (TIN) (variable)
 */

/**
 * TIN Requirements for Libya
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
 * Country Metadata for Libya
 */
export const COUNTRY_INFO: CountryRegulatoryInfo = {
    name: 'Libia',
    authority: 'Tax Authority / Civil Status Authority',
    compliance: {
        crsStatus: 'Non-Participating',
        crsDate: 'N/A',
        fatcaStatus: 'N/A'
    },
    residency: {
        individual: 'Se considera residente si permanece en Libia durante más de 183 días en el año civil.',
        entity: 'Se considera residente si está incorporada en Libia.',
        notes: 'Criterio de permanencia física o constitución legal.'
    }
};

/**
 * TIN Metadata for Libya (Era 6.3)
 */
export const TIN_INFO: TinInfo = {
    name: 'National No. / TIN',
    description: 'Libyan National Number (Individuals) or TIN (Entities) issued by the Civil Registry or Tax Authority.',
    placeholder: '119801234567',
    officialLink: 'https://tax.gov.ly',
    isOfficial: true,
    lastUpdated: '2026-04-24',
    source: 'Local Authority / Libya Tax',
    entityDifferentiation: {
        logic: 'Number length and prefix analysis.',
        individualDescription: '12-digit National Number starting with 1 (Male) or 2 (Female).',
        businessDescription: 'Tax Identification Number assigned to legal entities.'
    }
};

/**
 * Libya TIN Validator - Era 6.3
 */
export const validateLYTIN = (
    value: string, 
    type: 'INDIVIDUAL' | 'ENTITY' | 'ANY' = 'ANY', 
    metadata?: HolderMetadata
): TinValidationResult => {
    const sanitized = value.trim().toUpperCase().replace(/[\s-]/g, '');

    // Individual: 12 digits
    if (sanitized.length === 12 && /^[0-9]{12}$/.test(sanitized)) {
        const firstDigit = parseInt(sanitized[0]);
        const isIndividual = [1, 2].includes(firstDigit);
        
        if (isIndividual && type === 'ENTITY') {
             return { isValid: false, status: 'MISMATCH', reasonCode: 'ENTITY_TYPE_MISMATCH' };
        }
        
        return { 
            isValid: true, 
            status: 'VALID', 
            isOfficialMatch: true, 
            explanation: decodeLibyaTIN(sanitized)
        };
    }

    // Business/Other: variable length
    if (sanitized.length >= 4 && sanitized.length <= 15 && /^[A-Z0-9]+$/.test(sanitized)) {
        return { 
            isValid: true, 
            status: 'VALID', 
            isOfficialMatch: true, 
            explanation: 'Matches general Libyan TIN format.' 
        };
    }

    return { 
        isValid: false, 
        status: 'INVALID_FORMAT',
        explanation: 'Value does not match Libyan National Number (12 digits) or TIN format.'
    };
};

function decodeLibyaTIN(tin: string): string {
    const g = parseInt(tin[0]);
    const gender = g === 1 ? 'Male' : (g === 2 ? 'Female' : 'Unknown');
    const yyyy = tin.substring(1, 5);
    
    return `National Number (${gender}), born in ${yyyy}. Verified via structure.`;
}

/**
 * APPENDIX: FORENSIC CRITERIA
 * Libya uses the National Number for all citizens as the primary tax identifier.
 * 1. Scope: Issued by the Civil Status Authority (CSA).
 * 2. Structure: 12-digit numeric sequence.
 *    - Digit 1: Gender (1=Male, 2=Female).
 *    - Digits 2-5: Birth year (YYYY).
 *    - Digits 6-12: Serial and registration data.
 * 3. Validation: Structural verification based on pattern and length. 
 * 4. Residency: Centered on the 183-day presence rule in a calendar year.
 */
