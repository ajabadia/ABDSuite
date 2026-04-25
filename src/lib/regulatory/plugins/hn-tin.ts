import { HolderMetadata, TinValidationResult, CountryRegulatoryInfo, TinInfo, TinRequirement } from './index';

/**
 * TIN Validation for Honduras (HN)
 * RTN (14 digits)
 */

/**
 * TIN Requirements for Honduras
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
 * Country Metadata for Honduras
 */
export const COUNTRY_INFO: CountryRegulatoryInfo = {
    name: 'Honduras',
    authority: 'Servicio de Administración de Rentas (SAR)',
    compliance: {
        crsStatus: 'Non-Participating',
        crsDate: 'N/A',
        fatcaStatus: 'Model 1 (In Force)'
    },
    residency: {
        individual: 'Se considera residente si permanece en Honduras durante más de 182 días en el año fiscal.',
        entity: 'Se considera residente si está constituida en Honduras.',
        notes: 'Criterio de permanencia física o constitución legal.'
    }
};

/**
 * TIN Metadata for Honduras (Era 6.3)
 */
export const TIN_INFO: TinInfo = {
    name: 'RTN',
    description: 'Honduran RTN issued by the SAR.',
    placeholder: '0801-1990-12345-6',
    officialLink: 'https://www.sar.gob.hn',
    isOfficial: true,
    lastUpdated: '2026-04-24',
    source: 'Local Authority / Honduras SAR',
    entityDifferentiation: {
        logic: 'Structurally identical identifiers.',
        individualDescription: '14-digit RTN identifier.',
        businessDescription: '14-digit RTN identifier.'
    }
};

/**
 * Honduras TIN Validator - Era 6.3
 */
export const validateHNTIN = (
    value: string, 
    type: 'INDIVIDUAL' | 'ENTITY' | 'ANY' = 'ANY', 
    metadata?: HolderMetadata
): TinValidationResult => {
    const sanitized = value.replace(/[\s-]/g, '');

    if (sanitized.length === 14 && /^[0-9]{14}$/.test(sanitized)) {
        const isOfficial = validateRTNChecksum(sanitized);
        return { 
            isValid: true, 
            status: isOfficial ? 'VALID' : 'VALID_UNOFFICIAL', 
            isOfficialMatch: isOfficial, 
            explanation: `Matches official Honduran RTN (14 digits) format. ${isOfficial ? 'Verified via SAR checksum.' : 'Structural match only.'}` 
        };
    }

    return { 
        isValid: false, 
        status: 'INVALID_FORMAT',
        explanation: 'Value does not match Honduran RTN (14 digits) format.'
    };
};

function validateRTNChecksum(rtn: string): boolean {
    const body = rtn.substring(0, 13);
    const last = parseInt(rtn[13]);
    const weights = [2, 3, 4, 5, 6, 7, 8, 9, 2, 3, 4, 5, 6];
    
    let sum = 0;
    for (let i = 0; i < 13; i++) {
        sum += parseInt(body[12 - i]) * weights[i];
    }
    
    const remainder = sum % 11;
    const checkDigit = remainder === 10 ? 0 : remainder;
    return checkDigit === last;
}

/**
 * APPENDIX: FORENSIC CRITERIA
 * Honduras uses the RTN (Registro Tributario Nacional) for all taxpayers.
 * 1. Structure: 14 digits (e.g., 0801-1990-12345-6).
 *    - Digits 1-4: Municipality code.
 *    - Digits 5-8: Year of birth or constitution.
 *    - Digits 9-13: Sequential number.
 *    - Digit 14: Check digit.
 * 2. Validation: Weighted sum algorithm Modulo 11.
 * 3. Residency: Based on physical presence of more than 182 days in a fiscal year.
 * 4. Scope: Issued by the Servicio de Administración de Rentas (SAR).
 */
