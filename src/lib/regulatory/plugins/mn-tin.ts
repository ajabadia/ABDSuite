import { HolderMetadata, TinValidationResult, CountryRegulatoryInfo, TinInfo, TinRequirement } from './index';

/**
 * TIN Validation for Mongolia (MN)
 * Registration Number (10 characters: AA00000000)
 */

/**
 * TIN Requirements for Mongolia
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
 * Country Metadata for Mongolia
 */
export const COUNTRY_INFO: CountryRegulatoryInfo = {
    name: 'Mongolia',
    authority: 'Mongolian Tax Administration (MTA)',
    compliance: {
        crsStatus: 'Non-Participating',
        crsDate: 'N/A',
        fatcaStatus: 'N/A'
    },
    residency: {
        individual: 'Se considera residente si permanece en Mongolia durante más de 183 días en el año fiscal.',
        entity: 'Se considera residente si está incorporada en Mongolia.',
        notes: 'Criterio de permanencia física o constitución legal.'
    }
};

/**
 * TIN Metadata for Mongolia (Era 6.3)
 */
export const TIN_INFO: TinInfo = {
    name: 'Registration Number',
    description: 'Mongolian Registration Number issued by the State Registration Office.',
    placeholder: 'УП80010112',
    officialLink: 'https://mta.gov.mn',
    isOfficial: true,
    lastUpdated: '2026-04-24',
    source: 'Local Authority / Mongolia MTA',
    entityDifferentiation: {
        logic: 'Structurally identical identifiers for citizens; entities use 7-digit numbers.',
        individualDescription: '10-character Registration Number (2 letters + 8 digits).',
        businessDescription: '7-digit Registration Number (Entities).'
    }
};

/**
 * Mongolia TIN Validator - Era 6.3
 */
export const validateMNTIN = (
    value: string, 
    type: 'INDIVIDUAL' | 'ENTITY' | 'ANY' = 'ANY', 
    metadata?: HolderMetadata
): TinValidationResult => {
    const sanitized = value.trim().toUpperCase().replace(/[\s-]/g, '');

    // 1. Individual (RD): 10 characters (2 Cyrillic/Latin letters + 8 digits)
    if (sanitized.length === 10 && /^[A-ZА-Я]{2}[0-9]{8}$/.test(sanitized)) {
        if (type === 'ENTITY') {
             return { isValid: false, status: 'MISMATCH', reasonCode: 'ENTITY_TYPE_MISMATCH' };
        }
        return { 
            isValid: true, 
            status: 'VALID', 
            isOfficialMatch: true, 
            explanation: decodeMongoliaTIN(sanitized)
        };
    }

    // 2. Entity (RD): 7 digits
    if (sanitized.length === 7 && /^[0-9]{7}$/.test(sanitized)) {
        if (type === 'INDIVIDUAL') {
             return { isValid: false, status: 'MISMATCH', reasonCode: 'ENTITY_TYPE_MISMATCH' };
        }
        return { 
            isValid: true, 
            status: 'VALID', 
            isOfficialMatch: true, 
            explanation: 'Matches official Mongolian Entity Registration Number (7 digits) format.' 
        };
    }

    return { 
        isValid: false, 
        status: 'INVALID_FORMAT',
        explanation: 'Value does not match Mongolian Registration Number (10 chars or 7 digits) format.'
    };
};

function decodeMongoliaTIN(tin: string): string {
    const yy = tin.substring(2, 4);
    const mm = tin.substring(4, 6);
    const dd = tin.substring(6, 8);
    const g = parseInt(tin[9]);
    const gender = g % 2 === 0 ? 'Female' : 'Male';
    
    // First two digits represent district/region
    return `Individual (${gender}), born on ${dd}/${mm}/19${yy} (approx). Verified via structure.`;
}

/**
 * APPENDIX: FORENSIC CRITERIA
 * Mongolia uses the Registration Number (RD) for individuals and entities.
 * 1. Individuals (10 characters):
 *    - Format: 2 letters (representing the province/district) followed by 8 digits.
 *    - Digits 3-8: Birth date (YYMMDD).
 *    - Digit 9: Sequence.
 *    - Digit 10: Gender (Odd=Male, Even=Female).
 * 2. Entities: 7-digit numeric sequence.
 * 3. Validation: Structural verification based on pattern and length. 
 * 4. Residency: Centered on the 183-day presence rule in a fiscal year.
 */
