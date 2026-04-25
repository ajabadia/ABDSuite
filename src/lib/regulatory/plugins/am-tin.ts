
import { HolderMetadata, TinValidationResult, CountryRegulatoryInfo, TinInfo, TinRequirement } from './index';

/**
 * TIN Validation for Armenia (AM)
 * Individual: Public Services Number (PSS) (10 digits) or TIN (8 digits)
 * Entity: Tax Identification Number (TIN) (8 digits)
 */

/**
 * TIN Requirements for Armenia
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
 * Country Metadata for Armenia
 */
export const COUNTRY_INFO: CountryRegulatoryInfo = {
    name: 'Armenia',
    authority: 'State Revenue Committee',
    compliance: {
        crsStatus: 'Non-Participating',
        crsDate: 'N/A',
        fatcaStatus: 'Model 1 (In Force)'
    },
    residency: {
        individual: 'Se considera residente si permanece en Armenia durante más de 183 días en el año fiscal.',
        entity: 'Se considera residente si está incorporada en Armenia.',
        notes: 'Criterio de permanencia física o constitución legal.'
    }
};

/**
 * TIN Metadata for Armenia (Era 6.3)
 */
export const TIN_INFO: TinInfo = {
    name: 'TIN / PSS',
    description: 'Armenian TIN (Entities) or PSS (Individuals) issued by the State Revenue Committee or Passport and Visa Department.',
    placeholder: '12345678 / 1234567890',
    officialLink: 'https://www.petekamutner.am',
    isOfficial: true,
    lastUpdated: '2026-04-24',
    source: 'Local Authority / Armenia SRC',
    entityDifferentiation: {
        logic: 'Number length analysis.',
        individualDescription: '10-digit PSS or 8-digit TIN.',
        businessDescription: '8-digit Tax Identification Number (TIN).'
    }
};

/**
 * Armenia TIN Validator - Era 6.3
 */
export const validateAMTIN = (
    value: string, 
    type: 'INDIVIDUAL' | 'ENTITY' | 'ANY' = 'ANY', 
    metadata?: HolderMetadata
): TinValidationResult => {
    const sanitized = value.replace(/[\s-]/g, '');

    // Individual (PSS): 10 digits
    if (sanitized.length === 10 && /^[0-9]{10}$/.test(sanitized)) {
        if (type === 'ENTITY') {
             return { isValid: false, status: 'MISMATCH', reasonCode: 'ENTITY_TYPE_MISMATCH' };
        }
        return { 
            isValid: true, 
            status: 'VALID', 
            isOfficialMatch: true, 
            explanation: 'Matches official Armenian Public Services Number (10 digits) format.' 
        };
    }

    // Business/Individual (TIN): 8 digits
    if (sanitized.length === 8 && /^[0-9]{8}$/.test(sanitized)) {
        return { 
            isValid: true, 
            status: 'VALID', 
            isOfficialMatch: true, 
            explanation: 'Matches official Armenian Tax Identification Number (8 digits) format.' 
        };
    }

    return { 
        isValid: false, 
        status: 'INVALID_FORMAT',
        explanation: 'Value does not match Armenian TIN (8 digits) or PSS (10 digits) format.'
    };
};

/**
 * APPENDIX: FORENSIC CRITERIA
 * Armenia utilizes a dual system for identification:
 * 1. PSS (Public Services Number): 10 digits, assigned to individuals. It is the 
 *    primary identifier for individuals.
 * 2. TIN (Tax Identification Number): 8 digits, assigned to legal entities and 
 *    self-employed individuals.
 * 3. Validation: Structural verification based on length (10 digits for PSS, 8 for TIN).
 * 4. Residency: Defined by the 183-day presence rule in a fiscal year.
 */

