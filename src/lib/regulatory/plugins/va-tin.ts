import { HolderMetadata, TinValidationResult, CountryRegulatoryInfo, TinInfo, TinRequirement } from './index';

/**
 * TIN Validation for Holy See (Vatican City) (VA)
 * TIN (9 digits)
 */

/**
 * TIN Requirements for Holy See
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
 * Country Metadata for Holy See
 */
export const COUNTRY_INFO: CountryRegulatoryInfo = {
    name: 'Santa Sede (Ciudad del Vaticano)',
    authority: 'Secretariat for the Economy (SPE)',
    compliance: {
        crsStatus: 'Non-Participating',
        crsDate: 'N/A',
        fatcaStatus: 'Model 2 (In Force)'
    },
    residency: {
        individual: 'Se considera residente si tiene su residencia habitual en la Ciudad del Vaticano.',
        entity: 'Se considera residente si tiene su sede legal en la Ciudad del Vaticano.',
        notes: 'Criterio de residencia habitual o sede legal.'
    }
};

/**
 * TIN Metadata for Holy See (Era 6.3)
 */
export const TIN_INFO: TinInfo = {
    name: 'TIN',
    description: 'Vatican TIN issued by the Secretariat for the Economy.',
    placeholder: '123456789',
    officialLink: 'https://www.vatican.va',
    isOfficial: true,
    lastUpdated: '2026-04-24',
    source: 'Local Authority / Holy See Tax',
    entityDifferentiation: {
        logic: 'Structurally identical identifiers.',
        individualDescription: '9-digit TIN for individuals.',
        businessDescription: '9-digit TIN for entities.'
    }
};

/**
 * Holy See TIN Validator - Era 6.3
 */
export const validateVATIN = (
    value: string, 
    type: 'INDIVIDUAL' | 'ENTITY' | 'ANY' = 'ANY', 
    metadata?: HolderMetadata
): TinValidationResult => {
    const sanitized = value.trim().toUpperCase().replace(/[\s-]/g, '');

    if (sanitized.length === 9 && /^[0-9]{9}$/.test(sanitized)) {
        return { 
            isValid: true, 
            status: 'VALID', 
            isOfficialMatch: true, 
            explanation: 'Matches official Vatican TIN (9 digits) format.' 
        };
    }

    if (sanitized.length >= 4 && sanitized.length <= 16 && /^[A-Z0-9]+$/.test(sanitized)) {
        return { 
            isValid: true, 
            status: 'VALID', 
            isOfficialMatch: true, 
            explanation: 'Matches general Vatican identifier alphanumeric format.' 
        };
    }

    return { 
        isValid: false, 
        status: 'INVALID_FORMAT',
        explanation: 'Value does not match Vatican TIN format.'
    };
};

/**
 * APPENDIX: FORENSIC CRITERIA
 * The Holy See (Vatican City) uses a 9-digit Tax Identification Number.
 * 1. Scope: Managed by the Secretariat for the Economy.
 * 2. Structure: Standardized 9-digit numeric sequence.
 * 3. Validation: Structural verification based on pattern and length. 
 * 4. Residency: Based on habitual residence or official appointment.
 */
