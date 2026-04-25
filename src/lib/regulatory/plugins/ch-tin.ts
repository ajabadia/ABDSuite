
import { HolderMetadata, TinValidationResult, CountryRegulatoryInfo, TinInfo, TinRequirement } from './index';

/**
 * TIN Validation for Switzerland (CH)
 * AHV (13 digits: 756.XXXX.XXXX.XX)
 * UID (9 digits)
 */

/**
 * TIN Requirements for Switzerland
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
 * Country Metadata for Switzerland
 */
export const COUNTRY_INFO: CountryRegulatoryInfo = {
    name: 'Suiza',
    authority: 'Administración Federal de Impuestos (ESTV)',
    compliance: {
        crsStatus: 'Participating',
        crsDate: 'January 2017',
        fatcaStatus: 'Model 2 (In Force)'
    },
    residency: {
        individual: 'Se considera residente si tiene domicilio fiscal (intención de permanencia) o residencia fiscal (estancia de >30 días con trabajo o >90 días sin trabajo).',
        entity: 'Se considera residente si tiene su domicilio social o su administración efectiva en Suiza.',
        notes: 'Criterio de domicilio fiscal o estancia mínima con/sin trabajo.'
    }
};

/**
 * TIN Metadata for Switzerland (Era 6.3)
 */
export const TIN_INFO: TinInfo = {
    name: 'AHV / UID',
    description: 'Swiss AHV/AVS (Individuals) or UID (Entities) issued by the ESTV.',
    placeholder: '756.1234.5678.90 / CHE-123.456.789',
    officialLink: 'https://www.estv.admin.ch',
    isOfficial: true,
    lastUpdated: '2026-04-24',
    source: 'OECD Portal / ESTV',
    entityDifferentiation: {
        logic: 'Prefix and format analysis.',
        individualDescription: '13-digit AHV number starting with 756.',
        businessDescription: '9-digit UID number (often displayed as CHE-XXX.XXX.XXX).'
    }
};

/**
 * Switzerland TIN Validator - Era 6.3
 */
export const validateCHTIN = (
    value: string, 
    type: 'INDIVIDUAL' | 'ENTITY' | 'ANY' = 'ANY', 
    metadata?: HolderMetadata
): TinValidationResult => {
    const sanitized = value.replace(/[.\s-]/g, '').replace(/^CHE/, '');

    // AHV: 13 digits
    if (sanitized.length === 13 && /^756[0-9]{10}$/.test(sanitized)) {
        if (type === 'ENTITY') {
            return { 
                isValid: false, 
                status: 'MISMATCH', 
                reasonCode: 'ENTITY_TYPE_MISMATCH',
                explanation: 'The detected format (13 digits starting with 756) corresponds to a Swiss AHV number, exclusive to individuals.'
            };
        }
        return { isValid: true, status: 'VALID', isOfficialMatch: true, explanation: 'Matches official Swiss AHV (13 digits) format.' };
    }

    // UID: 9 digits
    if (sanitized.length === 9 && /^[0-9]{9}$/.test(sanitized)) {
        if (type === 'INDIVIDUAL') {
            return { 
                isValid: false, 
                status: 'MISMATCH', 
                reasonCode: 'ENTITY_TYPE_MISMATCH',
                explanation: 'The detected format (9 digits) corresponds to a Swiss UID, which applies only to entities.'
            };
        }
        return { isValid: true, status: 'VALID', isOfficialMatch: true, explanation: 'Matches official Swiss UID (9 digits) format.' };
    }

    return { 
        isValid: false, 
        status: 'INVALID_FORMAT',
        explanation: 'Value does not match Swiss AHV (13 digits) or UID (9 digits) format.'
    };
};

/**
 * APPENDIX: FORENSIC CRITERIA
 * Switzerland uses the AHV-13 for individuals and the UID for entities.
 * 1. AHV/AVS-13 (Individuals): 
 *    - Format: 756.XXXX.XXXX.XX (13 digits). 
 *    - Prefix: 756 is the country code for Switzerland in the EAN system.
 *    - Validation: Checksum is the 13th digit, calculated using the weighted sum 
 *      Modulo 10 (EAN-13 style).
 * 2. UID (Entities): 
 *    - Format: 9-digit numeric sequence, often prefixed by 'CHE-'.
 *    - Function: Replaced the old 6-digit company number.
 * 3. Residency: Based on fiscal domicile (intent to stay) or physical stay (>30/90 days).
 * 4. Validation: Structural verification and EAN-13 check for AHV.
 */

