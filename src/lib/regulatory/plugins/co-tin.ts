
import { HolderMetadata, TinValidationResult, CountryRegulatoryInfo, TinInfo, TinRequirement } from './index';

/**
 * TIN Validation for Colombia (CO)
 * NIT (8 to 11 digits)
 */

/**
 * TIN Requirements for Colombia
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
 * Country Metadata for Colombia
 */
export const COUNTRY_INFO: CountryRegulatoryInfo = {
    name: 'Colombia',
    authority: 'Dirección de Impuestos y Aduanas Nacionales (DIAN)',
    compliance: {
        crsStatus: 'Participating',
        crsDate: 'September 2017',
        fatcaStatus: 'Model 1 (In Force)'
    },
    residency: {
        individual: 'Se considera residente si permanece más de 183 días en el país durante un periodo de 365 días consecutivos.',
        entity: 'Se considera residente si tiene su sede efectiva de administración en territorio colombiano, o si se constituyó en Colombia.',
        notes: 'Criterio de permanencia física o sede de administración efectiva.'
    }
};

/**
 * TIN Metadata for Colombia (Era 6.3)
 */
export const TIN_INFO: TinInfo = {
    name: 'NIT',
    description: 'Colombian NIT issued by the DIAN for tax purposes.',
    placeholder: '123456789-0',
    officialLink: 'https://www.dian.gov.co',
    isOfficial: true,
    lastUpdated: '2026-04-24',
    source: 'OECD Portal / DIAN',
    entityDifferentiation: {
        logic: 'Structurally identical identifiers.',
        individualDescription: 'NIT (often based on Cédula de Ciudadanía).',
        businessDescription: 'NIT (assigned to legal entities).'
    }
};

/**
 * Colombia TIN Validator - Era 6.3
 */
export const validateCOTIN = (
    value: string, 
    type: 'INDIVIDUAL' | 'ENTITY' | 'ANY' = 'ANY', 
    metadata?: HolderMetadata
): TinValidationResult => {
    const sanitized = value.replace(/[\s-]/g, '');

    if (sanitized.length >= 8 && sanitized.length <= 11 && /^[0-9]+$/.test(sanitized)) {
        const firstDigit = sanitized[0];
        const isEntityPrefix = firstDigit === '8' || firstDigit === '9';

        return { 
            isValid: true, 
            status: 'VALID', 
            isOfficialMatch: true, 
            explanation: type === 'ANY'
                ? (isEntityPrefix 
                    ? 'Format valid for Entities (NIT starts with 8/9). Note: This identifier is not valid for local Individuals.'
                    : 'Format valid for Individuals (NIT/CC). Note: This identifier is not valid for legal Entities.')
                : `Matches official Colombian NIT format (${sanitized.length} digits).` 
        };
    }

    return { 
        isValid: false, 
        status: 'INVALID_FORMAT',
        explanation: 'Value does not match Colombian NIT (8-10 digits) format.'
    };
};

/**
 * APPENDIX: FORENSIC CRITERIA
 * Colombia's NIT (Número de Identificación Tributaria) is the mandatory tax identifier.
 * 1. Scope: Issued by the DIAN (Dirección de Impuestos y Aduanas Nacionales).
 * 2. Structure: 8 to 11 digits. For individuals, it usually matches the Cédula 
 *    de Ciudadanía (CC).
 * 3. Verification Digit (DV): The last digit is a check digit calculated using 
 *    a specific weighted sum algorithm (Weights: 3, 7, 13, 17, 19, 23, 29, 37, 41, 
 *    43, 47, 53, 59, 67, 71).
 * 4. Residency: Based on the 183-day presence rule within any continuous 365-day period.
 */

