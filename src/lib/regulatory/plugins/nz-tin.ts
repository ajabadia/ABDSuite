import { HolderMetadata, TinValidationResult, CountryRegulatoryInfo, TinInfo, TinRequirement } from './index';

/**
 * TIN Validation for New Zealand (NZ)
 * IRD Number (8 or 9 digits)
 */

/**
 * TIN Requirements for New Zealand
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
 * Country Metadata for New Zealand
 */
export const COUNTRY_INFO: CountryRegulatoryInfo = {
    name: 'Nueva Zelanda',
    authority: 'Inland Revenue (Te Tari Taake)',
    compliance: {
        crsStatus: 'Participating',
        crsDate: 'September 2017',
        fatcaStatus: 'Model 1 (In Force)'
    },
    residency: {
        individual: 'Se considera residente si tiene un lugar de residencia permanente en NZ o si permanece en NZ más de 183 días en un periodo de 12 meses.',
        entity: 'Se considera residente si está incorporada en NZ, si su gestión central se encuentra allí o si su centro de gestión se encuentra allí.',
        notes: 'Criterio de residencia permanente o permanencia de 183 días.'
    }
};

/**
 * TIN Metadata for New Zealand (Era 6.3)
 */
export const TIN_INFO: TinInfo = {
    name: 'IRD Number',
    description: 'New Zealand IRD Number issued by Inland Revenue.',
    placeholder: '123-456-789',
    officialLink: 'https://www.ird.govt.nz',
    isOfficial: true,
    lastUpdated: '2026-04-24',
    source: 'OECD Portal / Inland Revenue',
    entityDifferentiation: {
        logic: 'Structurally identical identifiers.',
        individualDescription: '8 or 9-digit IRD Number.',
        businessDescription: '8 or 9-digit IRD Number.'
    }
};

/**
 * New Zealand TIN Validator - Era 6.3
 */
export const validateNZTIN = (
    value: string, 
    type: 'INDIVIDUAL' | 'ENTITY' | 'ANY' = 'ANY', 
    metadata?: HolderMetadata
): TinValidationResult => {
    const sanitized = value.replace(/[\s-]/g, '');

    if ((sanitized.length === 8 || sanitized.length === 9) && /^[0-9]+$/.test(sanitized)) {
        const isOfficial = validateIRDChecksum(sanitized);
        return { 
            isValid: true, 
            status: isOfficial ? 'VALID' : 'VALID_UNOFFICIAL', 
            isOfficialMatch: isOfficial, 
            explanation: `Matches official New Zealand IRD Number (8 or 9 digits) format. ${isOfficial ? 'Verified via official checksum.' : 'Pattern match.'}` 
        };
    }

    return { 
        isValid: false, 
        status: 'INVALID_FORMAT',
        explanation: 'Value does not match New Zealand IRD Number (8 or 9 digits) format.'
    };
};

function validateIRDChecksum(tin: string): boolean {
    const fullTin = tin.padStart(9, '0');
    const weights1 = [3, 2, 7, 6, 5, 4, 3, 2];
    const weights2 = [7, 4, 3, 2, 5, 2, 7, 6];
    
    const calculateCheck = (weights: number[]) => {
        let sum = 0;
        for (let i = 0; i < 8; i++) sum += parseInt(fullTin[i]) * weights[i];
        const remainder = sum % 11;
        if (remainder === 0) return 0;
        return 11 - remainder;
    };

    let check = calculateCheck(weights1);
    if (check === 10) {
        check = calculateCheck(weights2);
    }
    
    return check === parseInt(fullTin[8]);
}

/**
 * APPENDIX: FORENSIC CRITERIA
 * New Zealand uses the IRD Number for all tax-related identifications.
 * 1. Scope: Issued by Inland Revenue (Te Tari Taake).
 * 2. Structure: 8 or 9-digit numeric sequence.
 * 3. Validation: Weighted sum algorithm Modulo 11.
 *    - Two sets of weights are used if the first calculation results in 10.
 *    - Weights 1: [3, 2, 7, 6, 5, 4, 3, 2]
 *    - Weights 2: [7, 4, 3, 2, 5, 2, 7, 6]
 * 4. Residency: Permanent residence place or 183-day presence rule.
 */
