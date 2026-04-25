
import { HolderMetadata, TinValidationResult, CountryRegulatoryInfo, TinInfo, TinRequirement } from './index';

/**
 * TIN Validation for Bolivia (BO)
 * NIT (7 to 15 digits)
 */

/**
 * TIN Requirements for Bolivia
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
 * Country Metadata for Bolivia
 */
export const COUNTRY_INFO: CountryRegulatoryInfo = {
    name: 'Bolivia',
    authority: 'Servicio de Impuestos Nacionales (SIN)',
    compliance: {
        crsStatus: 'Non-Participating',
        crsDate: 'N/A',
        fatcaStatus: 'N/A'
    },
    residency: {
        individual: 'Se considera residente si permanece en Bolivia durante más de 183 días en el año civil.',
        entity: 'Se considera residente si está incorporada en Bolivia.',
        notes: 'Criterio de permanencia física o constitución legal.'
    }
};

/**
 * TIN Metadata for Bolivia (Era 6.3)
 */
export const TIN_INFO: TinInfo = {
    name: 'NIT',
    description: 'Bolivian NIT issued by the SIN.',
    placeholder: '1234567890',
    officialLink: 'https://www.impuestos.gob.bo',
    isOfficial: true,
    lastUpdated: '2026-04-24',
    source: 'Local Authority / Bolivia SIN',
    entityDifferentiation: {
        logic: 'Structurally identical identifiers.',
        individualDescription: 'NIT identifier.',
        businessDescription: 'NIT identifier.'
    }
};

/**
 * Bolivia TIN Validator - Era 6.3
 */
export const validateBOTIN = (
    value: string, 
    type: 'INDIVIDUAL' | 'ENTITY' | 'ANY' = 'ANY', 
    metadata?: HolderMetadata
): TinValidationResult => {
    const sanitized = value.replace(/[\s-]/g, '');

    if (sanitized.length >= 7 && sanitized.length <= 15 && /^[0-9]+$/.test(sanitized)) {
        return { 
            isValid: true, 
            status: 'VALID', 
            isOfficialMatch: true, 
            explanation: 'Matches official Bolivian NIT format.' 
        };
    }

    return { 
        isValid: false, 
        status: 'INVALID_FORMAT',
        explanation: 'Value does not match Bolivian NIT format.'
    };
};

/**
 * APPENDIX: FORENSIC CRITERIA
 * Bolivia's NIT (Número de Identificación Tributaria) is the unique tax identifier.
 * 1. Scope: Mandatory for all individuals and entities carrying out taxable activities.
 * 2. Structure: Numeric sequence (7 to 15 digits). For individuals, it often matches 
 *    the CI (Cédula de Identidad) plus optional branch digits.
 * 3. Validation: Structural verification based on length and numeric pattern.
 * 4. Residency: Based on the 183-day presence rule in a calendar year.
 */

