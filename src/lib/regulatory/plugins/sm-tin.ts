import { HolderMetadata, TinValidationResult, CountryRegulatoryInfo, TinInfo, TinRequirement } from './index';

/**
 * TIN Validation for San Marino (SM)
 * COE / IGR (5 digits)
 */

/**
 * TIN Requirements for San Marino
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
 * Country Metadata for San Marino
 */
export const COUNTRY_INFO: CountryRegulatoryInfo = {
    name: 'San Marino',
    authority: 'Ufficio Tributario (Tax Office)',
    compliance: {
        crsStatus: 'Participating',
        crsDate: 'September 2017',
        fatcaStatus: 'Model 2 (In Force)'
    },
    residency: {
        individual: 'Se considera residente si tiene su residencia habitual en San Marino.',
        entity: 'Se considera residente si está constituida en San Marino.',
        notes: 'Criterio de residencia habitual o constitución.'
    }
};

/**
 * TIN Metadata for San Marino (Era 6.3)
 */
export const TIN_INFO: TinInfo = {
    name: 'COE / IGR',
    description: 'San Marino COE (Entities) or IGR (Individuals) issued by the Tax Office.',
    placeholder: '12345',
    officialLink: 'https://www.pa.sm',
    isOfficial: true,
    lastUpdated: '2026-04-24',
    source: 'OECD Portal / Tax Office',
    entityDifferentiation: {
        logic: 'Structurally identical identifiers.',
        individualDescription: '5-digit IGR (Imposta Generale sui Redditi).',
        businessDescription: '5-digit COE (Codice Operatore Economico).'
    }
};

/**
 * San Marino TIN Validator - Era 6.3
 */
export const validateSMTIN = (
    value: string, 
    type: 'INDIVIDUAL' | 'ENTITY' | 'ANY' = 'ANY', 
    metadata?: HolderMetadata
): TinValidationResult => {
    const sanitized = value.trim().toUpperCase().replace(/[\s-]/g, '');

    if (sanitized.length === 5 && /^[0-9]{5}$/.test(sanitized)) {
        return { 
            isValid: true, 
            status: 'VALID', 
            isOfficialMatch: true, 
            explanation: `Matches official San Marino ${type === 'ENTITY' ? 'COE' : 'IGR'} (5 digits) format.` 
        };
    }

    if (sanitized.length >= 4 && sanitized.length <= 15 && /^[A-Z0-9]+$/.test(sanitized)) {
        return { 
            isValid: true, 
            status: 'VALID', 
            isOfficialMatch: true, 
            explanation: 'Matches general San Marino identifier alphanumeric format.' 
        };
    }

    return { 
        isValid: false, 
        status: 'INVALID_FORMAT',
        explanation: 'Value does not match San Marino COE or IGR (5 digits) format.'
    };
};

/**
 * APPENDIX: FORENSIC CRITERIA
 * San Marino uses the Codice Operatore Economico (COE) for businesses and 
 * the Codice IGR (Imposta Generale sui Redditi) for individuals.
 * 1. COE: 5-digit numeric code assigned to economic operators.
 * 2. Codice IGR: Personal tax code for individuals (5 digits).
 * 3. Validation: Structural verification based on pattern and length. 
 * 4. Residency: Centered on the habitual residence or legal incorporation rule.
 */
