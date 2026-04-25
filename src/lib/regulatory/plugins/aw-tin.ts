
import { HolderMetadata, TinValidationResult, CountryRegulatoryInfo, TinInfo, TinRequirement } from './index';

/**
 * TIN Validation for Aruba (AW)
 * Persoonsnummer (8 digits)
 */

/**
 * TIN Requirements for Aruba
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
 * Country Metadata for Aruba
 */
export const COUNTRY_INFO: CountryRegulatoryInfo = {
    name: 'Aruba',
    authority: 'Tax Collector\'s Office (Departamento di Impuesto)',
    compliance: {
        crsStatus: 'Participating',
        crsDate: 'September 2018',
        fatcaStatus: 'N/A'
    },
    residency: {
        individual: 'Se considera residente si tiene domicilio permanente en Aruba o si permanece allí durante más de 183 días.',
        entity: 'Se considera residente si se ha incorporado en Aruba.',
        notes: 'Criterio de domicilio o estancia de 183 días.'
    }
};

/**
 * TIN Metadata for Aruba (Era 6.3)
 */
export const TIN_INFO: TinInfo = {
    name: 'Persoonsnummer',
    description: 'Aruban Persoonsnummer issued by the Tax Collector\'s Office.',
    placeholder: '12345678',
    officialLink: 'https://www.impuesto.aw',
    isOfficial: true,
    lastUpdated: '2026-04-24',
    source: 'OECD Portal / Aruba Tax',
    entityDifferentiation: {
        logic: 'Structurally identical identifiers.',
        individualDescription: '8-digit Persoonsnummer.',
        businessDescription: '8-digit Persoonsnummer.'
    }
};

/**
 * Aruba TIN Validator - Era 6.3
 */
export const validateAWTIN = (
    value: string, 
    type: 'INDIVIDUAL' | 'ENTITY' | 'ANY' = 'ANY', 
    metadata?: HolderMetadata
): TinValidationResult => {
    const sanitized = value.replace(/[\s-]/g, '');

    if (sanitized.length === 8 && /^[0-9]{8}$/.test(sanitized)) {
        return { 
            isValid: true, 
            status: 'VALID', 
            isOfficialMatch: true, 
            explanation: 'Matches official Aruban Persoonsnummer (8 digits) format.' 
        };
    }

    return { 
        isValid: false, 
        status: 'INVALID_FORMAT',
        explanation: 'Value does not match Aruban Persoonsnummer (8 digits) format.'
    };
};

/**
 * APPENDIX: FORENSIC CRITERIA
 * Aruba's Persoonsnummer is an 8-digit identification code.
 * 1. Scope: Used for individuals and business entities (Sole Proprietorships/NV).
 * 2. Structure: Numeric sequence of 8 digits. 
 * 3. Validation: Structural verification based on length.
 * 4. Residency: Centered on the 183-day physical presence rule or permanent domicile.
 */

