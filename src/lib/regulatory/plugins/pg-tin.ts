import { HolderMetadata, TinValidationResult, CountryRegulatoryInfo, TinInfo, TinRequirement } from './index';

/**
 * TIN Validation for Papua New Guinea (PG)
 * TIN (8-9 digits)
 */

/**
 * TIN Requirements for Papua New Guinea
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
 * Country Metadata for Papua New Guinea
 */
export const COUNTRY_INFO: CountryRegulatoryInfo = {
    name: 'Papúa Nueva Guinea',
    authority: 'Internal Revenue Commission (IRC)',
    compliance: {
        crsStatus: 'Non-Participating',
        crsDate: 'N/A',
        fatcaStatus: 'N/A'
    },
    residency: {
        individual: 'Se considera residente si permanece en Papúa Nueva Guinea durante más de 183 días en el año fiscal.',
        entity: 'Se considera residente si está incorporada en Papúa Nueva Guinea.',
        notes: 'Criterio de permanencia física o constitución legal.'
    }
};

/**
 * TIN Metadata for Papua New Guinea (Era 6.3)
 */
export const TIN_INFO: TinInfo = {
    name: 'TIN',
    description: 'PNG TIN issued by the IRC.',
    placeholder: '12345678',
    officialLink: 'https://www.irc.gov.pg',
    isOfficial: true,
    lastUpdated: '2026-04-24',
    source: 'Local Authority / PNG IRC',
    entityDifferentiation: {
        logic: 'Structurally identical identifiers.',
        individualDescription: '8 or 9-digit TIN identifier.',
        businessDescription: '8 or 9-digit TIN identifier.'
    }
};

/**
 * Papua New Guinea TIN Validator - Era 6.3
 */
export const validatePGTIN = (
    value: string, 
    type: 'INDIVIDUAL' | 'ENTITY' | 'ANY' = 'ANY', 
    metadata?: HolderMetadata
): TinValidationResult => {
    const sanitized = value.trim().toUpperCase().replace(/[\s-]/g, '');

    if ((sanitized.length === 8 || sanitized.length === 9) && /^[0-9]+$/.test(sanitized)) {
        const isOfficial = validatePGChecksum(sanitized);
        return { 
            isValid: true, 
            status: isOfficial ? 'VALID' : 'VALID_UNOFFICIAL', 
            isOfficialMatch: isOfficial, 
            explanation: `Matches official PNG TIN (8-9 digits) format. ${isOfficial ? 'Verified via official checksum.' : 'Pattern match.'}` 
        };
    }

    return { 
        isValid: false, 
        status: 'INVALID_FORMAT',
        explanation: 'Value does not match PNG TIN format.'
    };
};

function validatePGChecksum(tin: string): boolean {
    const fullTin = tin.padStart(9, '0');
    const weights = [9, 8, 7, 6, 5, 4, 3, 2];
    let sum = 0;
    for (let i = 0; i < 8; i++) sum += parseInt(fullTin[i]) * weights[i];
    const checkDigit = (11 - (sum % 11)) % 10;
    return checkDigit === parseInt(fullTin[8]);
}

/**
 * APPENDIX: FORENSIC CRITERIA
 * Papua New Guinea uses the Tax Identification Number (TIN) for all taxpayers.
 * 1. Scope: Issued and managed by the Internal Revenue Commission (IRC).
 * 2. Structure: Numeric sequence of 8 or 9 digits.
 * 3. Validation: Weighted sum algorithm Modulo 11.
 * 4. Residency: Centered on the 183-day presence rule in a fiscal year.
 */
