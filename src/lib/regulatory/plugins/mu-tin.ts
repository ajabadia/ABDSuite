import { HolderMetadata, TinValidationResult, CountryRegulatoryInfo, TinInfo, TinRequirement } from './index';

/**
 * TIN Validation for Mauritius (MU)
 * Individual: National ID (14 characters: A123456789012B)
 * Entity: Tax Account Number (TAN) (8 digits)
 */

/**
 * TIN Requirements for Mauritius
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
    },
    { key: 'lastName', label: 'lastName', type: 'text' }
];

/**
 * Country Metadata for Mauritius
 */
export const COUNTRY_INFO: CountryRegulatoryInfo = {
    name: 'Mauricio',
    authority: 'Mauritius Revenue Authority (MRA)',
    compliance: {
        crsStatus: 'Participating',
        crsDate: 'September 2018',
        fatcaStatus: 'Model 1 (In Force)'
    },
    residency: {
        individual: 'Se considera residente si permanece en Mauricio durante 183 días o más en un año fiscal o 270 días en 3 años.',
        entity: 'Se considera residente si está incorporada en Mauricio o si su gestión central se encuentra allí.',
        notes: 'Criterio de permanencia física o gestión central.'
    }
};

/**
 * TIN Metadata for Mauritius (Era 6.3)
 */
export const TIN_INFO: TinInfo = {
    name: 'NID / TAN',
    description: 'Mauritian NID (Individuals) or TAN (Entities) issued by the MRA.',
    placeholder: 'A123456789012B / 12345678',
    officialLink: 'https://www.mra.mu',
    isOfficial: true,
    lastUpdated: '2026-04-24',
    source: 'OECD Portal / MRA',
    entityDifferentiation: {
        logic: 'Structure and length analysis.',
        individualDescription: '14-character alphanumeric NID.',
        businessDescription: '8-digit TAN.'
    }
};

/**
 * Mauritius TIN Validator - Era 6.3
 */
export const validateMUTIN = (
    value: string, 
    type: 'INDIVIDUAL' | 'ENTITY' | 'ANY' = 'ANY', 
    metadata?: HolderMetadata
): TinValidationResult => {
    const sanitized = value.trim().toUpperCase().replace(/[\s-]/g, '');

    // 1. Individual (NID): 14 characters
    if (sanitized.length === 14 && /^[A-Z][0-9]{12}[A-Z]$/.test(sanitized)) {
        if (type === 'ENTITY') {
             return { 
                 isValid: false, 
                 status: 'MISMATCH', 
                 reasonCode: 'ENTITY_TYPE_MISMATCH',
                 explanation: 'The detected format (14 characters) corresponds to a Mauritian National ID, which is exclusive to individuals.'
             };
        }
        return { 
            isValid: true, 
            status: 'VALID', 
            isOfficialMatch: true, 
            explanation: decodeMauritiusNID(sanitized, metadata)
        };
    }

    // 2. Business (TAN): 8 digits
    if (sanitized.length === 8 && /^[0-9]{8}$/.test(sanitized)) {
        if (type === 'INDIVIDUAL') {
             return { 
                 isValid: false, 
                 status: 'MISMATCH', 
                 reasonCode: 'ENTITY_TYPE_MISMATCH',
                 explanation: 'The detected format (8 digits) corresponds to a Mauritian TAN, which applies only to entities.'
             };
        }
        return { 
            isValid: true, 
            status: 'VALID', 
            isOfficialMatch: true, 
            explanation: 'Matches official Mauritian TAN format (8 digits).' 
        };
    }

    return { 
        isValid: false, 
        status: 'INVALID_FORMAT',
        explanation: 'Value does not match Mauritian NID (14 chars) or TAN (8 digits) format.'
    };
};

function decodeMauritiusNID(nid: string, metadata?: HolderMetadata): string {
    const initial = nid[0];
    const dd = nid.substring(1, 3);
    const mm = nid.substring(3, 5);
    const yy = nid.substring(5, 7);
    
    let explanation = `Individual (NID), starts with ${initial} (Surname initial). Birth sequence: ${dd}/${mm}/${yy}.`;
    
    if (metadata?.lastName && metadata.lastName[0].toUpperCase() !== initial) {
        explanation += ` [WARNING: Surname initial mismatch with ${metadata.lastName[0]}].`;
    }
    
    return explanation;
}

/**
 * APPENDIX: FORENSIC CRITERIA
 * Mauritius uses the National Identity Card (NID) for individuals.
 * 1. NID (14 characters): 
 *    - Format: L DD MM YY NNNNN L
 *    - Position 1: Initial letter of the surname.
 *    - Positions 2-3: Day of birth (DD).
 *    - Positions 4-5: Month of birth (MM).
 *    - Positions 6-7: Year of birth (YY).
 *    - Positions 8-12: Unique sequence number.
 *    - Position 13-14: Security and check characters (often alphabetic).
 * 2. TAN (Entities): 8-digit numeric sequence.
 * 3. Residency: Based on the 183-day rule (fiscal year) or 270 days over 3 years.
 * 4. Scope: Managed by the Mauritius Revenue Authority (MRA).
 */
