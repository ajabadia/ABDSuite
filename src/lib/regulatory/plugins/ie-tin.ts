import { HolderMetadata, TinValidationResult, CountryRegulatoryInfo, TinInfo, TinRequirement } from './index';

/**
 * TIN Validation for Ireland (IE)
 * PPS No. (7 digits + 1 or 2 letters)
 */

/**
 * TIN Requirements for Ireland
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
 * Country Metadata for Ireland
 */
export const COUNTRY_INFO: CountryRegulatoryInfo = {
    name: 'Irlanda',
    authority: 'Irish Revenue Commissioners',
    compliance: {
        crsStatus: 'Participating',
        crsDate: 'September 2017',
        fatcaStatus: 'Model 1 (In Force)'
    },
    residency: {
        individual: 'Residente si está presente 183 días en el año fiscal, o 280 días entre el año actual y el anterior (con mínimo de 30 días en el actual).',
        entity: 'Toda empresa constituida en Irlanda es residente, salvo las exentas por tratados. Las empresas extranjeras son residentes si su control y gestión central están en Irlanda.',
        notes: 'Criterio basado en Section 18 y Section 23A of the Taxes Consolidation Act 1997.'
    }
};

/**
 * TIN Metadata for Ireland (Era 6.3)
 */
export const TIN_INFO: TinInfo = {
    name: 'PPS No. / TRN',
    description: 'Irish PPS No (Individuals) or TRN (Entities) issued by the Revenue Commissioners.',
    placeholder: '1234567A / 1234567AW',
    officialLink: 'https://www.revenue.ie',
    isOfficial: true,
    lastUpdated: '2026-04-24',
    source: 'OECD Portal / Revenue Commissioners',
    entityDifferentiation: {
        logic: 'Structurally similar.',
        individualDescription: 'Personal Public Service (PPS) Number of 7 digits and 1 or 2 letters.',
        businessDescription: 'Tax Reference Number (TRN) with similar structure or CHY prefix for charities.'
    }
};

/**
 * Ireland TIN Validator - Era 6.3
 */
export const validateIETIN = (
    value: string, 
    type: 'INDIVIDUAL' | 'ENTITY' | 'ANY' = 'ANY', 
    metadata?: HolderMetadata
): TinValidationResult => {
    const sanitized = value.replace(/[\s-]/g, '').toUpperCase();

    if (/^[0-9]{7}[A-Z]{1,2}$/.test(sanitized)) {
        if (validatePPSChecksum(sanitized)) {
            return { 
                isValid: true, 
                status: 'VALID', 
                isOfficialMatch: true, 
                explanation: 'Matches official Irish PPS/TRN format and checksum.' 
            };
        } else {
            return {
                isValid: false,
                status: 'INVALID_CHECKSUM',
                explanation: 'Value matches format but failed Irish PPS checksum algorithm.'
            };
        }
    }

    return { 
        isValid: false, 
        status: 'INVALID_FORMAT',
        explanation: 'Value does not match Irish PPS/TRN (7 digits + 1-2 letters) format.'
    };
};

function validatePPSChecksum(pps: string): boolean {
    const chars = 'WABCDEFGHIJKLMNOPQRSTUV';
    let sum = 0;
    for (let i = 0; i < 7; i++) {
        sum += parseInt(pps.charAt(i)) * (8 - i);
    }
    
    // If there's a second letter (post-2013 format)
    if (pps.length === 9) {
        sum += (pps.charCodeAt(8) - 64) * 9;
    }
    
    const checkLetter = chars.charAt(sum % 23);
    return checkLetter === pps.charAt(7);
}
