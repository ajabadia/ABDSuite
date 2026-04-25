
import { HolderMetadata, TinValidationResult, CountryRegulatoryInfo, TinInfo, TinRequirement } from './index';

/**
 * TIN Validation for Bahamas (BS)
 * TIN (variable length, typically for VAT)
 */

/**
 * TIN Requirements for Bahamas
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
 * Country Metadata for Bahamas
 */
export const COUNTRY_INFO: CountryRegulatoryInfo = {
    name: 'Bahamas',
    authority: 'Department of Inland Revenue',
    compliance: {
        crsStatus: 'Participating',
        crsDate: 'September 2018',
        fatcaStatus: 'Model 1 (In Force)'
    },
    residency: {
        individual: 'Se considera residente si permanece en las Bahamas durante más de 183 días en el año civil o si tiene una residencia permanente.',
        entity: 'Se considera residente si está incorporada en las Bahamas.',
        notes: 'Criterio de permanencia física o residencia permanente.'
    }
};

/**
 * TIN Metadata for Bahamas (Era 6.3)
 */
export const TIN_INFO: TinInfo = {
    name: 'TIN / NIB',
    description: 'Bahamian TIN (for VAT) or NIB (Individuals) issued by the Department of Inland Revenue or National Insurance Board.',
    placeholder: '12345678',
    officialLink: 'https://inlandrevenue.finance.gov.bs',
    isOfficial: true,
    lastUpdated: '2026-04-24',
    source: 'OECD Portal / Bahamas DIR',
    entityDifferentiation: {
        logic: 'Identificador varía según registro (VAT vs NIB).',
        individualDescription: 'National Insurance Board (NIB) number or TIN for business individuals.',
        businessDescription: 'Tax Identification Number (TIN) issued for VAT purposes.'
    }
};

/**
 * Bahamas TIN Validator - Era 6.3
 */
export const validateBSTIN = (
    value: string, 
    type: 'INDIVIDUAL' | 'ENTITY' | 'ANY' = 'ANY', 
    metadata?: HolderMetadata
): TinValidationResult => {
    const sanitized = value.trim().toUpperCase();

    if (sanitized.length >= 4 && sanitized.length <= 15 && /^[A-Z0-9]+$/.test(sanitized)) {
        return { 
            isValid: true, 
            status: 'VALID', 
            isOfficialMatch: true, 
            explanation: 'Matches general Bahamian identifier (TIN/NIB) format.' 
        };
    }

    return { 
        isValid: false, 
        status: 'INVALID_FORMAT',
        explanation: 'Value does not match Bahamian identifier format.'
    };
};

/**
 * APPENDIX: FORENSIC CRITERIA
 * The Bahamas does not issue a traditional income tax TIN.
 * 1. VAT TIN: Issued to individuals and entities registered for VAT.
 * 2. NIB Number: National Insurance Board number used for social security and 
 *    often as a functional equivalent for identification.
 * 3. Validation: Structural verification against variable length alphanumeric patterns.
 * 4. CRS Note: In the absence of a TIN, birth date and place of birth are mandatory.
 */

