
import { HolderMetadata, TinValidationResult, CountryRegulatoryInfo, TinInfo, TinRequirement } from './index';

/**
 * TIN Validation for Israel (IL)
 * Identity Number (9 digits)
 */

/**
 * TIN Requirements for Israel
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
 * Country Metadata for Israel
 */
export const COUNTRY_INFO: CountryRegulatoryInfo = {
    name: 'Israel',
    authority: 'Israel Tax Authority',
    compliance: {
        crsStatus: 'Participating',
        crsDate: 'September 2018',
        fatcaStatus: 'Model 1 (In Force)'
    },
    residency: {
        individual: 'Se considera residente si el centro de su vida está en Israel. Se presume si permanece más de 183 días en el año fiscal.',
        entity: 'Se considera residente si está incorporada en Israel o si su gestión y control se ejercen en Israel.',
        notes: 'Criterio de centro de vida o permanencia de 183 días.'
    }
};

/**
 * TIN Metadata for Israel (Era 6.3)
 */
export const TIN_INFO: TinInfo = {
    name: 'Identity Number / Company Number',
    description: 'Israeli Identity Number (Individuals) or Company Number (Entities) issued by the Ministry of Interior or Tax Authority.',
    placeholder: '012345678',
    officialLink: 'https://www.gov.il/he/departments/israel_tax_authority',
    isOfficial: true,
    lastUpdated: '2026-04-24',
    source: 'OECD Portal / ITA',
    entityDifferentiation: {
        logic: 'Structurally identical identifiers.',
        individualDescription: '9-digit Identity Number.',
        businessDescription: '9-digit Company Number (Het-Pe).'
    }
};

/**
 * Israel TIN Validator - Era 6.3
 */
export const validateILTIN = (
    value: string, 
    type: 'INDIVIDUAL' | 'ENTITY' | 'ANY' = 'ANY', 
    metadata?: HolderMetadata
): TinValidationResult => {
    const sanitized = value.replace(/[\s-]/g, '');

    if (sanitized.length === 9 && /^[0-9]{9}$/.test(sanitized)) {
        if (validateIsraelChecksum(sanitized)) {
            return { 
                isValid: true, 
                status: 'VALID', 
                isOfficialMatch: true, 
                explanation: 'Matches official Israeli 9-digit format (Mispar Zehut). Verified via Luhn checksum.' 
            };
        } else {
            return { isValid: false, status: 'INVALID_CHECKSUM', explanation: 'Failed Israeli Identity Number checksum validation.' };
        }
    }

    return { 
        isValid: false, 
        status: 'INVALID_FORMAT',
        explanation: 'Value does not match Israeli 9-digit format.'
    };
};

function validateIsraelChecksum(id: string): boolean {
    let sum = 0;
    for (let i = 0; i < 9; i++) {
        let num = parseInt(id[i]) * ((i % 2) + 1);
        sum += num > 9 ? num - 9 : num;
    }
    return sum % 10 === 0;
}
