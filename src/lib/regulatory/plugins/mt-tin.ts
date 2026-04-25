import { HolderMetadata, TinValidationResult, CountryRegulatoryInfo, TinInfo, TinRequirement } from './index';

/**
 * TIN Validation for Malta (MT)
 * Individual: ID Card (7 or 8 characters: 123456L)
 * Entity: Tax Number / VAT No. (9 digits)
 */

/**
 * TIN Requirements for Malta
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
 * Country Metadata for Malta
 */
export const COUNTRY_INFO: CountryRegulatoryInfo = {
    name: 'Malta',
    authority: 'Commissioner for Revenue',
    compliance: {
        crsStatus: 'Participating',
        crsDate: 'September 2017',
        fatcaStatus: 'Model 1 (In Force)'
    },
    residency: {
        individual: 'Se considera residente si tiene su domicilio en Malta o si permanece allí durante más de 183 días en el año civil.',
        entity: 'Se considera residente si se ha incorporado en Malta o si su gestión y control se ejercen allí.',
        notes: 'Criterio de domicilio o estancia de 183 días.'
    }
};

/**
 * TIN Metadata for Malta (Era 6.3)
 */
export const TIN_INFO: TinInfo = {
    name: 'ID Card / Tax No.',
    description: 'Maltese ID Card (Individuals) or Tax Number (Entities) issued by the Commissioner for Revenue.',
    placeholder: '123456M / 123456789',
    officialLink: 'https://cfr.gov.mt',
    isOfficial: true,
    lastUpdated: '2026-04-24',
    source: 'OECD Portal / CFR',
    entityDifferentiation: {
        logic: 'Structure and length analysis.',
        individualDescription: '7 or 8 characters ending with a letter (M, G, L, etc.).',
        businessDescription: '9-digit Tax Identification Number.'
    }
};

/**
 * Malta TIN Validator - Era 6.3
 */
export const validateMTTIN = (
    value: string, 
    type: 'INDIVIDUAL' | 'ENTITY' | 'ANY' = 'ANY', 
    metadata?: HolderMetadata
): TinValidationResult => {
    const sanitized = value.trim().toUpperCase().replace(/[\s-]/g, '');

    // 1. Individual (ID Card): 7 or 8 chars, ends with letter
    if (/^[0-9]{1,7}[A-Z]$/.test(sanitized)) {
        if (type === 'ENTITY') {
            return { 
                isValid: false, 
                status: 'MISMATCH', 
                reasonCode: 'ENTITY_TYPE_MISMATCH',
                explanation: 'The detected format corresponds to a Maltese ID Card, which is exclusive to individuals.'
            };
        }
        return { 
            isValid: true, 
            status: 'VALID', 
            isOfficialMatch: true, 
            explanation: type === 'ANY'
                ? 'Format valid for Individuals (ID Card). Note: This identifier is not valid for legal Entities.'
                : decodeMaltaID(sanitized)
        };
    }

    // 2. Business/Non-Citizen (Tax No): 9 digits
    if (sanitized.length === 9 && /^[0-9]{9}$/.test(sanitized)) {
        const isOfficial = validateMaltaTINChecksum(sanitized);
        return { 
            isValid: true, 
            status: isOfficial ? 'VALID' : 'VALID_UNOFFICIAL', 
            isOfficialMatch: isOfficial, 
            explanation: type === 'ANY'
                ? 'Format valid for Entities (Tax No / 9 digits). Note: This identifier is usually not valid for local Individuals.'
                : `Matches official Maltese Tax Identification Number (9 digits) format. ${isOfficial ? 'Verified via official checksum.' : 'Pattern match.'}` 
        };
    }

    return { 
        isValid: false, 
        status: 'INVALID_FORMAT',
        explanation: 'Value does not match Maltese ID Card (7-8 chars) or Tax No (9 digits) format.'
    };
};

function decodeMaltaID(id: string): string {
    const suffix = id[id.length - 1];
    const typeMap: Record<string, string> = {
        'M': 'Maltese Citizen (Born in Malta)',
        'G': 'Maltese Citizen (Born in Gozo)',
        'L': 'Maltese Citizen (Born abroad)',
        'A': 'Foreign National (Alien)',
        'P': 'Pass-Port (Individual with no ID card)',
        'H': 'Humanitarian / Specific Status'
    };
    
    return `ID Card: ${typeMap[suffix] || 'Standard Status'}. Verified via structure.`;
}

function validateMaltaTINChecksum(tin: string): boolean {
    const weights = [9, 8, 7, 6, 5, 4, 3, 2];
    let sum = 0;
    for (let i = 0; i < 8; i++) sum += parseInt(tin[i]) * weights[i];
    const checkDigit = (11 - (sum % 11)) % 10;
    return checkDigit === parseInt(tin[8]);
}

/**
 * APPENDIX: FORENSIC CRITERIA
 * Malta uses two primary systems for identification.
 * 1. ID Card (Individuals): 
 *    - Format: Up to 7 digits followed by a letter.
 *    - Letters: M (Malta), G (Gozo), L (Abroad), A (Alien), etc.
 * 2. Tax Identification Number (Entities/Foreigners): 
 *    - 9-digit numeric sequence.
 *    - Validation: Weighted sum algorithm Modulo 11. 
 * 3. Residency: Based on the 183-day presence rule or domicile.
 * 4. Scope: Managed by the Commissioner for Revenue (CfR).
 */
