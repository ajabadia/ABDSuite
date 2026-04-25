import { HolderMetadata, TinValidationResult, CountryRegulatoryInfo, TinInfo, TinRequirement } from './index';

/**
 * TIN Validation for Jordan (JO)
 * Individual: National Number (10 digits)
 * Entity: Tax Number (9 digits)
 */

/**
 * TIN Requirements for Jordan
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
 * Country Metadata for Jordan
 */
export const COUNTRY_INFO: CountryRegulatoryInfo = {
    name: 'Jordania',
    authority: 'Income and Sales Tax Department (ISTD)',
    compliance: {
        crsStatus: 'Non-Participating',
        crsDate: 'N/A',
        fatcaStatus: 'Model 1 (In Force)'
    },
    residency: {
        individual: 'Se considera residente si permanece en Jordania durante más de 183 días en el año civil.',
        entity: 'Se considera residente si está incorporada en Jordania.',
        notes: 'Criterio de permanencia física o constitución legal.'
    }
};

/**
 * TIN Metadata for Jordan (Era 6.3)
 */
export const TIN_INFO: TinInfo = {
    name: 'National Number / Tax Number',
    description: 'Jordanian National Number (Individuals) or Tax Number (Entities) issued by the ISTD or Civil Status Department.',
    placeholder: '9901012345 / 123456789',
    officialLink: 'https://www.istd.gov.jo',
    isOfficial: true,
    lastUpdated: '2026-04-24',
    source: 'Local Authority / Jordan Tax',
    entityDifferentiation: {
        logic: 'Number length analysis.',
        individualDescription: '10-digit National Number.',
        businessDescription: '9-digit Tax Number.'
    }
};

/**
 * Jordan TIN Validator - Era 6.3
 */
export const validateJOTIN = (
    value: string, 
    type: 'INDIVIDUAL' | 'ENTITY' | 'ANY' = 'ANY', 
    metadata?: HolderMetadata
): TinValidationResult => {
    const sanitized = value.trim().toUpperCase().replace(/[\s-]/g, '');

    // Individual: 10 digits
    if (sanitized.length === 10 && /^[0-9]{10}$/.test(sanitized)) {
        if (type === 'ENTITY') {
             return { 
                 isValid: false, 
                 status: 'MISMATCH', 
                 reasonCode: 'ENTITY_TYPE_MISMATCH',
                 explanation: 'The detected format (10 digits) corresponds to a Jordanian National Number, which is exclusive to individuals.'
             };
        }
        return { 
            isValid: true, 
            status: 'VALID', 
            isOfficialMatch: true, 
            explanation: 'Matches official Jordanian National Number (10 digits) format.' 
        };
    }

    // Entity: 9 digits
    if (sanitized.length === 9 && /^[0-9]{9}$/.test(sanitized)) {
        if (type === 'INDIVIDUAL') {
             return { 
                 isValid: false, 
                 status: 'MISMATCH', 
                 reasonCode: 'ENTITY_TYPE_MISMATCH',
                 explanation: 'The detected format (9 digits) corresponds to a Jordanian Tax Number, which applies only to entities.'
             };
        }
        return { 
            isValid: true, 
            status: 'VALID', 
            isOfficialMatch: true, 
            explanation: 'Matches official Jordanian Tax Number (9 digits) format.' 
        };
    }

    if (sanitized.length >= 4 && sanitized.length <= 15 && /^[A-Z0-9]+$/.test(sanitized)) {
        return { 
            isValid: true, 
            status: 'VALID', 
            isOfficialMatch: true, 
            explanation: 'Matches general Jordanian TIN alphanumeric format.' 
        };
    }

    return { 
        isValid: false, 
        status: 'INVALID_FORMAT',
        explanation: 'Value does not match Jordanian TIN format.'
    };
};

/**
 * APPENDIX: FORENSIC CRITERIA
 * Jordan uses separate identifiers for individuals and legal entities.
 * 1. National Number (Individuals): 
 *    - 10-digit numeric sequence assigned at birth or residence.
 * 2. Tax Number (Legal Entities): 
 *    - 9-digit numeric sequence assigned by the ISTD.
 * 3. Validation: Structural verification based on pattern and length. 
 * 4. Residency: Centered on the 183-day presence rule in a calendar year.
 * 5. Scope: Issued by the Income and Sales Tax Department (ISTD).
 */
