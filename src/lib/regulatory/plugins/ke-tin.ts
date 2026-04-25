
import { HolderMetadata, TinValidationResult, TinInfo, CountryRegulatoryInfo, TinRequirement } from './index';

/**
 * TIN Requirements for Kenya
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
 * Country Metadata for Kenya
 */
export const COUNTRY_INFO: CountryRegulatoryInfo = {
    name: 'Kenia',
    authority: 'Kenya Revenue Authority (KRA)',
    compliance: {
        crsStatus: 'Participating',
        crsDate: 'September 2022',
        fatcaStatus: 'Model 1 (In Force)'
    },
    residency: {
        individual: 'Se considera residente si permanece más de 183 días en el año fiscal o si tiene su centro de intereses en Kenia.',
        entity: 'Se considera residente si se ha incorporado bajo las leyes de Kenia o si su gestión y control se ejercen en Kenia.',
        notes: 'Criterio de permanencia física o centro de intereses.'
    }
};

/**
 * TIN Metadata for Kenya (Era 6.3)
 */
export const TIN_INFO: TinInfo = {
    name: 'KRA PIN (Personal Identification Number)',
    description: 'Unique 11-character identifier issued by the Kenya Revenue Authority (KRA).',
    placeholder: 'A123456789B',
    officialLink: 'https://itax.kra.go.ke/',
    isOfficial: true,
    lastUpdated: '2026-04-24',
    source: 'OECD Portal / Kenya Revenue Authority (KRA)',
    entityDifferentiation: {
        logic: 'Prefix analysis. A for Individuals, P for Companies.',
        individualDescription: '11-character PIN starting with A.',
        businessDescription: '11-character PIN starting with P.'
    }
};

/**
 * Kenya TIN Validator (11 chars: A/P + 9 digits + Letter) - Era 6.3
 */
export const validateKETIN = (
    value: string, 
    type: 'INDIVIDUAL' | 'ENTITY' | 'ANY' = 'ANY', 
    metadata?: HolderMetadata
): TinValidationResult => {
    const trimmed = value.trim().toUpperCase();
    
    // Pattern: 1 letter, 9 digits, 1 letter
    if (/^[A-Z]\d{9}[A-Z]$/.test(trimmed)) {
        const firstChar = trimmed[0];
        
        if (type === 'INDIVIDUAL' && firstChar !== 'A') {
            return { isValid: false, status: 'MISMATCH', reasonCode: 'ENTITY_TYPE_MISMATCH', explanation: 'Individual KRA PINs typically start with A.' };
        }
        if (type === 'ENTITY' && firstChar !== 'P') {
            return { isValid: false, status: 'MISMATCH', reasonCode: 'ENTITY_TYPE_MISMATCH', explanation: 'Business KRA PINs typically start with P.' };
        }

        return {
            isValid: true,
            status: 'VALID',
            isOfficialMatch: true,
            explanation: `Matches official 11-character Kenya KRA PIN format (${firstChar === 'A' ? 'Individual' : 'Entity'}).`
        };
    }

    return {
        isValid: false,
        status: 'INVALID_FORMAT',
        explanation: 'Kenya KRA PINs consist of a starting letter (A for individuals, P for businesses), 9 digits, and a checksum letter.'
    };
};

/**
 * APPENDIX: FORENSIC CRITERIA
 * Kenya's KRA PIN uses the iTax system. The first character is a status indicator:
 * 'A' is assigned to natural persons, while 'P' is assigned to non-individuals (Companies, NGOs, etc.).
 * The last character is a checksum verified by the KRA's internal systems.
 */

