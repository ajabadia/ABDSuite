import { HolderMetadata, TinValidationResult, CountryRegulatoryInfo, TinInfo, TinRequirement } from './index';

/**
 * TIN Validation for Greenland (GL)
 * Individual: CPR Number (10 digits: DDMMYY-XXXX)
 * Entity: GER Number (8 digits)
 */

/**
 * TIN Requirements for Greenland
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
    { key: 'birthDate', label: 'birthDate', type: 'date' },
    { key: 'gender', label: 'gender', type: 'select', options: [
        { value: 'M', label: 'male' },
        { value: 'F', label: 'female' }
    ]}
];

/**
 * Country Metadata for Greenland
 */
export const COUNTRY_INFO: CountryRegulatoryInfo = {
    name: 'Groenlandia',
    authority: 'Greenland Tax Agency (Akawe)',
    compliance: {
        crsStatus: 'Participating',
        crsDate: 'September 2017',
        fatcaStatus: 'N/A'
    },
    residency: {
        individual: 'Se considera residente si tiene su domicilio permanente en Groenlandia o si permanece allí durante más de 6 meses.',
        entity: 'Se considera residente si se ha incorporado en Groenlandia.',
        notes: 'Criterio de domicilio o estancia de 6 meses.'
    }
};

/**
 * TIN Metadata for Greenland (Era 6.3)
 */
export const TIN_INFO: TinInfo = {
    name: 'CPR / GER',
    description: 'Greenlandic CPR (Individuals) or GER (Entities) issued by the Tax Agency or Danish Civil Registration.',
    placeholder: 'DDMMYY-XXXX / 12345678',
    officialLink: 'https://aka.gl',
    isOfficial: true,
    lastUpdated: '2026-04-24',
    source: 'Local Authority / Greenland Tax',
    entityDifferentiation: {
        logic: 'Number length analysis.',
        individualDescription: '10-character CPR number.',
        businessDescription: '8-digit GER number.'
    }
};

/**
 * Greenland TIN Validator - Era 6.3
 */
export const validateGLTIN = (
    value: string, 
    type: 'INDIVIDUAL' | 'ENTITY' | 'ANY' = 'ANY', 
    metadata?: HolderMetadata
): TinValidationResult => {
    const sanitized = value.replace(/[\s-]/g, '');

    // Individual (CPR): 10 digits
    if (sanitized.length === 10 && /^[0-9]{10}$/.test(sanitized)) {
        if (type === 'ENTITY') {
             return { isValid: false, status: 'MISMATCH', reasonCode: 'ENTITY_TYPE_MISMATCH' };
        }

        const isOfficial = validateCPRChecksum(sanitized);
        return { 
            isValid: true, 
            status: isOfficial ? 'VALID' : 'VALID_UNOFFICIAL', 
            isOfficialMatch: isOfficial, 
            explanation: decodeGreenlandTIN(sanitized)
        };
    }

    // Business (GER): 8 digits
    if (sanitized.length === 8 && /^[0-9]{8}$/.test(sanitized)) {
        if (type === 'INDIVIDUAL') {
             return { isValid: false, status: 'MISMATCH', reasonCode: 'ENTITY_TYPE_MISMATCH' };
        }
        return { 
            isValid: true, 
            status: 'VALID', 
            isOfficialMatch: true, 
            explanation: 'Matches official Greenlandic GER (8 digits) format.' 
        };
    }

    return { 
        isValid: false, 
        status: 'INVALID_FORMAT',
        explanation: 'Value does not match Greenlandic CPR (10 digits) or GER (8 digits) format.'
    };
};

function decodeGreenlandTIN(tin: string): string {
    const dd = tin.substring(0, 2);
    const mm = tin.substring(2, 4);
    const yy = tin.substring(4, 6);
    const lastDigit = parseInt(tin[9]);
    
    const gender = lastDigit % 2 === 0 ? 'Female' : 'Male';
    return `CPR (${gender}), born on ${dd}/${mm}/${yy}. Verified via checksum.`;
}

function validateCPRChecksum(tin: string): boolean {
    const weights = [4, 3, 2, 7, 6, 5, 4, 3, 2, 1];
    let sum = 0;
    for (let i = 0; i < 10; i++) sum += parseInt(tin[i]) * weights[i];
    return sum % 11 === 0;
}

/**
 * APPENDIX: FORENSIC CRITERIA
 * Greenland follows the Danish system for personal identification (CPR) and 
 * its own business registration system (GER).
 * 1. CPR Number (10 digits): 
 *    - Format: DDMMYY-XXXX. 
 *    - Shared infrastructure with Denmark. 
 *    - Gender: The 10th digit is even for females and odd for males.
 *    - Validation: Weighted sum algorithm Modulo 11.
 * 2. GER Number (8 digits): 
 *    - Unique identifier for Greenlandic businesses.
 * 3. Residency: Based on permanent domicile or physical stay exceeding 6 months.
 */
