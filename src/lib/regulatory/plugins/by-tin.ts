
import { HolderMetadata, TinValidationResult, CountryRegulatoryInfo, TinInfo, TinRequirement } from './index';

/**
 * TIN Validation for Belarus (BY)
 * UNP (9 digits)
 */

/**
 * TIN Requirements for Belarus
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
 * Country Metadata for Belarus
 */
export const COUNTRY_INFO: CountryRegulatoryInfo = {
    name: 'Bielorrusia',
    authority: 'Ministry of Taxes and Duties of the Republic of Belarus',
    compliance: {
        crsStatus: 'Non-Participating',
        crsDate: 'N/A',
        fatcaStatus: 'Model 1 (In Force)'
    },
    residency: {
        individual: 'Se considera residente si permanece en Bielorrusia durante más de 183 días en el año civil.',
        entity: 'Se considera residente si está incorporada en Bielorrusia.',
        notes: 'Criterio de permanencia física o constitución legal.'
    }
};

/**
 * TIN Metadata for Belarus (Era 6.3)
 */
export const TIN_INFO: TinInfo = {
    name: 'UNP',
    description: 'Belarusian UNP issued by the Tax Authority.',
    placeholder: '123456789',
    officialLink: 'https://www.nalog.gov.by',
    isOfficial: true,
    lastUpdated: '2026-04-24',
    source: 'Local Authority / Belarus Tax',
    entityDifferentiation: {
        logic: 'Structurally identical identifiers.',
        individualDescription: '9-digit UNP identifier.',
        businessDescription: '9-digit UNP identifier.'
    }
};

/**
 * Belarus TIN Validator - Era 6.3
 */
export const validateBYTIN = (
    value: string, 
    type: 'INDIVIDUAL' | 'ENTITY' | 'ANY' = 'ANY', 
    metadata?: HolderMetadata
): TinValidationResult => {
    const sanitized = value.replace(/[\s-]/g, '');

    if (sanitized.length === 9 && /^[0-9]{9}$/.test(sanitized)) {
        return { 
            isValid: true, 
            status: 'VALID', 
            isOfficialMatch: true, 
            explanation: 'Matches official Belarusian UNP (9 digits) format.' 
        };
    }

    return { 
        isValid: false, 
        status: 'INVALID_FORMAT',
        explanation: 'Value does not match Belarusian UNP (9 digits) format.'
    };
};

/**
 * APPENDIX: FORENSIC CRITERIA
 * Belarus uses the UNP (Uchetny Nomer Platelshchika) as the unique tax identifier.
 * 1. Scope: Mandatory for all individuals and entities.
 * 2. Structure: 9-digit numeric sequence. 
 * 3. Validation: Structural verification based on length.
 * 4. Residency: Primarily based on the 183-day presence rule in a calendar year.
 */

