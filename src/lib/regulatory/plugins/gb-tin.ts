import { HolderMetadata, TinValidationResult, CountryRegulatoryInfo, TinInfo, TinRequirement } from './index';

/**
 * TIN Validation for United Kingdom (GB)
 * NINO (9 chars: AA 12 34 56 A)
 * UTR (10 digits)
 */

/**
 * TIN Requirements for United Kingdom
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
 * Country Metadata for United Kingdom
 */
export const COUNTRY_INFO: CountryRegulatoryInfo = {
    name: 'Reino Unido',
    authority: 'HM Revenue & Customs (HMRC)',
    compliance: {
        crsStatus: 'Participating',
        crsDate: 'September 2017',
        fatcaStatus: 'Model 1 (In Force)'
    },
    residency: {
        individual: 'Se determina mediante la Prueba de Residencia Estatutaria (Statutory Residence Test - SRT), que considera los días pasados en el Reino Unido y los vínculos con el país.',
        entity: 'Se considera residente si está incorporada en el Reino Unido o si su gestión y control central se ejercen en el Reino Unido.',
        notes: 'Criterio SRT para individuos y lugar de gestión central para entidades.'
    }
};

/**
 * TIN Metadata for United Kingdom (Era 6.3)
 */
export const TIN_INFO: TinInfo = {
    name: 'NINO / UTR',
    description: 'UK National Insurance Number (NINO) or Unique Taxpayer Reference (UTR) issued by HMRC.',
    placeholder: 'QQ 12 34 56 A / 12345 67890',
    officialLink: 'https://www.gov.uk/hmrc',
    isOfficial: true,
    lastUpdated: '2026-04-24',
    source: 'OECD Portal / HMRC',
    entityDifferentiation: {
        logic: 'Type of identifier.',
        individualDescription: 'National Insurance Number (NINO) for employment/SS or UTR for self-assessment.',
        businessDescription: 'Unique Taxpayer Reference (UTR) of 10 digits assigned to companies and trusts.'
    }
};

/**
 * UK TIN Validator - Era 6.3
 */
export const validateGBTIN = (
    value: string, 
    type: 'INDIVIDUAL' | 'ENTITY' | 'ANY' = 'ANY', 
    metadata?: HolderMetadata
): TinValidationResult => {
    const sanitized = value.replace(/[\s-]/g, '').toUpperCase();

    // 1. NINO Check
    if (sanitized.length === 9 && /^[A-CEGHJ-PR-TW-Z]{2}[0-9]{6}[A-D]$/.test(sanitized)) {
        const prefix = sanitized.substring(0, 2);
        const prohibited = ['BG', 'GB', 'KN', 'NK', 'NT', 'TN', 'ZZ'];
        
        if (prohibited.includes(prefix)) {
             return { isValid: false, status: 'INVALID_FORMAT', explanation: `Prefix ${prefix} is reserved or prohibited in UK NINO identifiers.` };
        }
        
        if (type === 'ENTITY') {
            return { 
                isValid: false, 
                status: 'MISMATCH', 
                reasonCode: 'ENTITY_TYPE_MISMATCH',
                explanation: 'The detected format corresponds to a UK National Insurance Number (NINO), which is exclusive to individuals.'
            };
        }
        return { 
            isValid: true, 
            status: 'VALID', 
            isOfficialMatch: true, 
            explanation: type === 'ANY'
                ? 'Format valid for Individuals (NINO). Note: This identifier is not valid for legal Entities.'
                : 'Matches official UK National Insurance Number (NINO) format.' 
        };
    }
    
    // 2. UTR Check
    if (sanitized.length === 10 && /^[0-9]{10}$/.test(sanitized)) {
        const isOfficial = validateUTRChecksum(sanitized);
        return { 
            isValid: true, 
            status: isOfficial ? 'VALID' : 'VALID_UNOFFICIAL', 
            isOfficialMatch: isOfficial, 
            explanation: type === 'ANY'
                ? 'Format matches UK UTR (10 digits). Valid for both Entities and self-employed Individuals.'
                : `Matches official UK Unique Taxpayer Reference (UTR) format. ${isOfficial ? 'Verified via HMRC checksum.' : 'Structural match only.'}` 
        };
    }

    return { 
        isValid: false, 
        status: 'INVALID_FORMAT',
        explanation: 'Value does not match UK NINO (9 chars) or UTR (10 digits) format.'
    };
};

function validateUTRChecksum(utr: string): boolean {
    const weights = [6, 7, 8, 9, 10, 5, 4, 3, 2];
    let sum = 0;
    for (let i = 0; i < 9; i++) sum += parseInt(utr[i+1]) * weights[i];
    const remainder = sum % 11;
    const checkDigit = (11 - remainder) % 10;
    return checkDigit === parseInt(utr[0]);
}

/**
 * APPENDIX: FORENSIC CRITERIA
 * The United Kingdom uses the NINO for social security/employment and the UTR 
 * for general tax purposes.
 * 1. NINO (9 characters): 
 *    - Structure: AA 12 34 56 A. 
 *    - Validation: Structural check with prefix/suffix rules (prohibits GB, BG, etc.).
 * 2. UTR (10 digits): 
 *    - Unique Taxpayer Reference issued to individuals (self-assessment) and entities.
 *    - Validation: Weighted sum algorithm Modulo 11 (Note: The first digit is 
 *      the check digit, calculated based on the following 9).
 * 3. Residency: Statutory Residence Test (SRT) for individuals; place of central 
 *    management and control for entities.
 */
