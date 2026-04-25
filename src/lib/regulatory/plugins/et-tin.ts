import { HolderMetadata, TinValidationResult, CountryRegulatoryInfo, TinInfo, TinRequirement } from './index';

/**
 * TIN Validation for Ethiopia (ET)
 * TIN (10 digits)
 */

/**
 * TIN Requirements for Ethiopia
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
 * Country Metadata for Ethiopia
 */
export const COUNTRY_INFO: CountryRegulatoryInfo = {
    name: 'Etiopía',
    authority: 'Ministry of Revenues',
    compliance: {
        crsStatus: 'Non-Participating',
        crsDate: 'N/A',
        fatcaStatus: 'N/A'
    },
    residency: {
        individual: 'Se considera residente si permanece en Etiopía durante más de 183 días en el año fiscal.',
        entity: 'Se considera residente si está incorporada en Etiopía.',
        notes: 'Criterio de permanencia física o constitución legal.'
    }
};

/**
 * TIN Metadata for Ethiopia (Era 6.3)
 */
export const TIN_INFO: TinInfo = {
    name: 'TIN',
    description: 'Ethiopian TIN issued by the Ministry of Revenues.',
    placeholder: '1234567890',
    officialLink: 'https://www.mor.gov.et',
    isOfficial: true,
    lastUpdated: '2026-04-24',
    source: 'Local Authority / Ethiopia Tax',
    entityDifferentiation: {
        logic: 'Structurally identical identifiers.',
        individualDescription: '10-digit TIN identifier.',
        businessDescription: '10-digit TIN identifier.'
    }
};

/**
 * Ethiopia TIN Validator - Era 6.3
 */
export const validateETTIN = (
    value: string, 
    type: 'INDIVIDUAL' | 'ENTITY' | 'ANY' = 'ANY', 
    metadata?: HolderMetadata
): TinValidationResult => {
    const sanitized = value.replace(/[\s-]/g, '');

    if (sanitized.length === 10 && /^[0-9]{10}$/.test(sanitized)) {
        return { 
            isValid: true, 
            status: 'VALID', 
            isOfficialMatch: true, 
            explanation: 'Matches official Ethiopian TIN (10 digits) format.' 
        };
    }

    return { 
        isValid: false, 
        status: 'INVALID_FORMAT',
        explanation: 'Value does not match Ethiopian TIN (10 digits) format.'
    };
};

/**
 * APPENDIX: FORENSIC CRITERIA
 * Ethiopia uses the 10-digit TIN (Taxpayer Identification Number) for all taxpayers.
 * 1. Scope: Mandatory for all commercial activities and personal income tax.
 * 2. Structure: 10-digit numeric sequence.
 * 3. Validation: Structural verification based on length. 
 * 4. Residency: Centered on the 183-day presence rule in a fiscal year.
 */
