import { HolderMetadata, TinValidationResult, CountryRegulatoryInfo, TinInfo, TinRequirement } from './index';

/**
 * TIN Validation for Gibraltar (GI)
 * Tax Reference Number (variable length)
 */

/**
 * TIN Requirements for Gibraltar
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
 * Country Metadata for Gibraltar
 */
export const COUNTRY_INFO: CountryRegulatoryInfo = {
    name: 'Gibraltar',
    authority: 'Income Tax Office',
    compliance: {
        crsStatus: 'Participating',
        crsDate: 'September 2017',
        fatcaStatus: 'Model 1 (In Force)'
    },
    residency: {
        individual: 'Se considera residente si permanece en Gibraltar durante más de 183 días en el año civil o más de 300 días en tres años consecutivos.',
        entity: 'Se considera residente si la gestión y el control de su negocio se ejercen en Gibraltar.',
        notes: 'Criterio de permanencia física o control de gestión.'
    }
};

/**
 * TIN Metadata for Gibraltar (Era 6.3)
 */
export const TIN_INFO: TinInfo = {
    name: 'Tax Reference Number',
    description: 'Gibraltarian Tax Reference Number issued by the Income Tax Office.',
    placeholder: '123456',
    officialLink: 'https://www.gibraltar.gov.gi/income-tax',
    isOfficial: true,
    lastUpdated: '2026-04-24',
    source: 'OECD Portal / Gibraltar Tax',
    entityDifferentiation: {
        logic: 'Structurally identical identifiers.',
        individualDescription: 'Tax Reference Number for individuals.',
        businessDescription: 'Tax Reference Number for entities.'
    }
};

/**
 * Gibraltar TIN Validator - Era 6.3
 */
export const validateGITIN = (
    value: string, 
    type: 'INDIVIDUAL' | 'ENTITY' | 'ANY' = 'ANY', 
    metadata?: HolderMetadata
): TinValidationResult => {
    const sanitized = value.trim().toUpperCase().replace(/[\s-]/g, '');

    if (sanitized.length >= 4 && sanitized.length <= 15 && /^[A-Z0-9]+$/.test(sanitized)) {
        return { 
            isValid: true, 
            status: 'VALID', 
            isOfficialMatch: true, 
            explanation: 'Matches general Gibraltarian Tax Reference Number format.' 
        };
    }

    return { 
        isValid: false, 
        status: 'INVALID_FORMAT',
        explanation: 'Value does not match Gibraltarian Tax Reference Number format.'
    };
};

/**
 * APPENDIX: FORENSIC CRITERIA
 * Gibraltar uses the Tax Reference Number (TRN) for all tax-related purposes.
 * 1. Structure: Typically 6 to 10 digits, sometimes with alphanumeric suffixes.
 * 2. Scope: Issued by the Income Tax Office.
 * 3. Validation: Structural verification based on alphanumeric pattern and length.
 * 4. Residency: Centered on the 183-day presence rule (annual) or 300-day rule (3-year period).
 */
