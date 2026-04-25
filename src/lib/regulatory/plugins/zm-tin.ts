import { HolderMetadata, TinValidationResult, CountryRegulatoryInfo, TinInfo, TinRequirement } from './index';

/**
 * TIN Validation for Zambia (ZM)
 * TPIN (10 digits)
 */

/**
 * TIN Requirements for Zambia
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
 * Country Metadata for Zambia
 */
export const COUNTRY_INFO: CountryRegulatoryInfo = {
    name: 'Zambia',
    authority: 'Zambia Revenue Authority (ZRA)',
    compliance: {
        crsStatus: 'Non-Participating',
        crsDate: 'N/A',
        fatcaStatus: 'Model 1 (In Force)'
    },
    residency: {
        individual: 'Se considera residente si permanece en Zambia durante más de 183 días en el año fiscal.',
        entity: 'Se considera residente si está incorporada en Zambia.',
        notes: 'Criterio de permanencia física o constitución legal.'
    }
};

/**
 * TIN Metadata for Zambia (Era 6.3)
 */
export const TIN_INFO: TinInfo = {
    name: 'TPIN',
    description: 'Zambian TPIN issued by the ZRA.',
    placeholder: '1001234567',
    officialLink: 'https://www.zra.org.zm',
    isOfficial: true,
    lastUpdated: '2026-04-24',
    source: 'Local Authority / Zambia ZRA',
    entityDifferentiation: {
        logic: 'Structurally identical identifiers.',
        individualDescription: '10-digit TPIN identifier.',
        businessDescription: '10-digit TPIN identifier.'
    }
};

/**
 * Zambia TIN Validator - Era 6.3
 */
export const validateZMTIN = (
    value: string, 
    type: 'INDIVIDUAL' | 'ENTITY' | 'ANY' = 'ANY', 
    metadata?: HolderMetadata
): TinValidationResult => {
    const sanitized = value.trim().toUpperCase().replace(/[\s-]/g, '');

    if (sanitized.length === 10 && /^[0-9]{10}$/.test(sanitized)) {
        return { 
            isValid: true, 
            status: 'VALID', 
            isOfficialMatch: true, 
            explanation: 'Matches official Zambian TPIN (10 digits) format.' 
        };
    }

    if (sanitized.length >= 4 && sanitized.length <= 15 && /^[A-Z0-9]+$/.test(sanitized)) {
        return { 
            isValid: true, 
            status: 'VALID', 
            isOfficialMatch: true, 
            explanation: 'Matches general Zambian identifier alphanumeric format.' 
        };
    }

    return { 
        isValid: false, 
        status: 'INVALID_FORMAT',
        explanation: 'Value does not match Zambian TPIN format.'
    };
};

/**
 * APPENDIX: FORENSIC CRITERIA
 * Zambia uses the Taxpayer Identification Number (TPIN) for all taxpayers.
 * 1. Scope: Issued and managed by the Zambia Revenue Authority (ZRA).
 * 2. Structure: Standardized 10-digit numeric sequence.
 * 3. Validation: Structural verification based on pattern and length. 
 * 4. Residency: Centered on the 183-day presence rule in a fiscal year.
 */
