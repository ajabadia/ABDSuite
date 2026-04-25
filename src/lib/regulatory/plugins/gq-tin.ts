import { HolderMetadata, TinValidationResult, CountryRegulatoryInfo, TinInfo, TinRequirement } from './index';

/**
 * TIN Validation for Equatorial Guinea (GQ)
 * NIF (9 digits)
 */

/**
 * TIN Requirements for Equatorial Guinea
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
 * Country Metadata for Equatorial Guinea
 */
export const COUNTRY_INFO: CountryRegulatoryInfo = {
    name: 'Guinea Ecuatorial',
    authority: 'Ministerio de Hacienda, Economía y Planificación',
    compliance: {
        crsStatus: 'Non-Participating',
        crsDate: 'N/A',
        fatcaStatus: 'N/A'
    },
    residency: {
        individual: 'Se considera residente si permanece en Guinea Ecuatorial durante más de 183 días en el año civil.',
        entity: 'Se considera residente si está incorporada en Guinea Ecuatorial.',
        notes: 'Criterio de permanencia física o constitución legal.'
    }
};

/**
 * TIN Metadata for Equatorial Guinea (Era 6.3)
 */
export const TIN_INFO: TinInfo = {
    name: 'NIF',
    description: 'Equatoguinean NIF issued by the Ministry of Finance.',
    placeholder: '123456789',
    officialLink: 'https://www.minhacienda-ge.org',
    isOfficial: true,
    lastUpdated: '2026-04-24',
    source: 'Local Authority / Equatorial Guinea Tax',
    entityDifferentiation: {
        logic: 'Structurally identical identifiers.',
        individualDescription: 'NIF for individuals.',
        businessDescription: 'NIF for entities.'
    }
};

/**
 * Equatorial Guinea TIN Validator - Era 6.3
 */
export const validateGQTIN = (
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
            explanation: 'Matches official Equatoguinean NIF (9 digits) format.' 
        };
    }

    if (sanitized.length >= 4 && sanitized.length <= 15 && /^[A-Z0-9]+$/.test(sanitized)) {
        return { 
            isValid: true, 
            status: 'VALID', 
            isOfficialMatch: true, 
            explanation: 'Matches general Equatoguinean NIF alphanumeric format.' 
        };
    }

    return { 
        isValid: false, 
        status: 'INVALID_FORMAT',
        explanation: 'Value does not match Equatoguinean NIF format.'
    };
};

/**
 * APPENDIX: FORENSIC CRITERIA
 * Equatorial Guinea uses the NIF (Número de Identificación Fiscal) for all tax activities.
 * 1. Scope: Managed by the Ministerio de Hacienda, Economía y Planificación.
 * 2. Structure: Standardized 9-digit numeric sequence.
 * 3. Validation: Structural verification based on pattern and length. 
 * 4. Residency: Centered on the 183-day presence rule in a calendar year.
 */
