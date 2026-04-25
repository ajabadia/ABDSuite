
import { HolderMetadata, TinValidationResult, TinInfo, CountryRegulatoryInfo, TinRequirement } from './index';

/**
 * TIN Requirements for Nigeria
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
 * Country Metadata for Nigeria
 */
export const COUNTRY_INFO: CountryRegulatoryInfo = {
    name: 'Nigeria',
    authority: 'Federal Inland Revenue Service (FIRS)',
    compliance: {
        crsStatus: 'Participating',
        crsDate: 'September 2020',
        fatcaStatus: 'Model 1 (In Force)'
    },
    residency: {
        individual: 'Se considera residente si permanece más de 183 días en un periodo de 12 meses.',
        entity: 'Se considera residente si se ha incorporado en Nigeria.',
        notes: 'Criterio de permanencia física de 183 días.'
    }
};

/**
 * TIN Metadata for Nigeria (Era 6.3)
 */
export const TIN_INFO: TinInfo = {
    name: 'Tax Identification Number (TIN)',
    description: 'Unique identifier issued by the Federal Inland Revenue Service (FIRS) or Joint Tax Board (JTB).',
    placeholder: '1234567890 / 123456789012',
    officialLink: 'https://www.firs.gov.ng/',
    isOfficial: true,
    lastUpdated: '2026-04-24',
    source: 'OECD Portal / Federal Inland Revenue Service (FIRS)',
    entityDifferentiation: {
        logic: 'Numeric sequence without structural differentiation.',
        individualDescription: '10 or 12-digit TIN.',
        businessDescription: '10 or 12-digit TIN.'
    }
};

/**
 * Nigeria TIN Validator (10 or 12 digits) - Era 6.3
 */
export const validateNGTIN = (
    value: string, 
    type: 'INDIVIDUAL' | 'ENTITY' | 'ANY' = 'ANY', 
    metadata?: HolderMetadata
): TinValidationResult => {
    const cleanValue = value.trim().replace(/-/g, '');
    
    if (/^\d{10}$/.test(cleanValue)) {
        return {
            isValid: true,
            status: 'VALID',
            isOfficialMatch: true,
            explanation: 'Matches official 10-digit Nigeria TIN format.'
        };
    }

    if (/^\d{12}$/.test(cleanValue)) {
        return {
            isValid: true,
            status: 'VALID',
            isOfficialMatch: true,
            explanation: 'Matches official 12-digit Nigeria TIN format.'
        };
    }

    return {
        isValid: false,
        status: 'INVALID_FORMAT',
        explanation: 'Nigeria TINs are numeric codes of 10 or 12 digits.'
    };
};

/**
 * APPENDIX: FORENSIC CRITERIA
 * Nigeria's TIN is managed by the Joint Tax Board (JTB) which synchronizes data between 
 * the Federal (FIRS) and State tax authorities. 
 * Both 10-digit and 12-digit formats are active, with the latter being more common 
 * for newer registrations and corporate entities.
 */

