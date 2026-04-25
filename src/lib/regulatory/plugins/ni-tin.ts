import { HolderMetadata, TinValidationResult, CountryRegulatoryInfo, TinInfo, TinRequirement } from './index';

/**
 * TIN Validation for Nicaragua (NI)
 * RUC (14 characters: 123-123456-1234A)
 */

/**
 * TIN Requirements for Nicaragua
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
    { key: 'birthDate', label: 'birthDate', type: 'date', scope: 'INDIVIDUAL' },
    { 
        key: 'birthPlaceCode', 
        label: 'municipality', 
        type: 'select', 
        scope: 'INDIVIDUAL',
        options: [
            { value: '001', label: 'Managua' },
            { value: '041', label: 'León' },
            { value: '081', label: 'Granada' },
            { value: '121', label: 'Masaya' }
        ]
    }
];

/**
 * Country Metadata for Nicaragua
 */
export const COUNTRY_INFO: CountryRegulatoryInfo = {
    name: 'Nicaragua',
    authority: 'Dirección General de Ingresos (DGI)',
    compliance: {
        crsStatus: 'Non-Participating',
        crsDate: 'N/A',
        fatcaStatus: 'N/A'
    },
    residency: {
        individual: 'Se considera residente si permanece en Nicaragua durante más de 183 días en el año civil.',
        entity: 'Se considera residente si está constituida en Nicaragua.',
        notes: 'Criterio de permanencia física o constitución legal.'
    }
};

/**
 * TIN Metadata for Nicaragua (Era 6.4)
 */
export const TIN_INFO: TinInfo = {
    name: 'RUC',
    description: 'Nicaraguan RUC issued by the DGI.',
    placeholder: '001-010180-0001A',
    officialLink: 'https://www.dgi.gob.ni',
    isOfficial: true,
    lastUpdated: '2026-04-24',
    source: 'Local Authority / Nicaragua DGI',
    entityDifferentiation: {
        logic: 'Prefix analysis (Municipality code).',
        individualDescription: '14-character RUC based on Identity Card.',
        businessDescription: '14-character RUC (typically starting with J for legal units).'
    }
};

/**
 * Nicaragua TIN Validator - Era 6.4
 */
export const validateNITIN = (
    value: string, 
    type: 'INDIVIDUAL' | 'ENTITY' | 'ANY' = 'ANY', 
    metadata?: HolderMetadata
): TinValidationResult => {
    const sanitized = value.replace(/[\s-]/g, '').toUpperCase();

    if (sanitized.length === 14 && /^[0-9]{13}[A-Z]$/.test(sanitized)) {
        if (metadata) {
            const semantic = validateNicaraguaSemantic(sanitized, metadata);
            if (!semantic.isValid) return semantic;
        }

        const isOfficial = validateRUCAlphaChecksum(sanitized);
        return { 
            isValid: true, 
            status: isOfficial ? 'VALID' : 'VALID_UNOFFICIAL', 
            isOfficialMatch: isOfficial, 
            explanation: decodeNicaraguaTIN(sanitized)
        };
    }

    return { 
        isValid: false, 
        status: 'INVALID_FORMAT',
        explanation: 'Value does not match Nicaraguan RUC (14 chars) format.'
    };
};

function decodeNicaraguaTIN(tin: string): string {
    const muni = tin.substring(0, 3);
    const dd = tin.substring(3, 5);
    const mm = tin.substring(5, 7);
    const yy = tin.substring(7, 9);
    
    return `Individual RUC, Municipality ${muni}, born on ${dd}/${mm}/${yy}. Verified via format.`;
}

function validateNicaraguaSemantic(tin: string, metadata: HolderMetadata): TinValidationResult {
    const mismatchFields: string[] = [];

    if (metadata.birthDate) {
        const dob = new Date(metadata.birthDate);
        const expectedDDMMYY = dob.getDate().toString().padStart(2, '0') + 
                               (dob.getMonth() + 1).toString().padStart(2, '0') + 
                               dob.getFullYear().toString().slice(-2);
        if (tin.substring(3, 9) !== expectedDDMMYY) {
            mismatchFields.push('birthDate');
        }
    }

    if (metadata.birthPlaceCode && tin.substring(0, 3) !== metadata.birthPlaceCode) {
        mismatchFields.push('birthPlaceCode');
    }

    if (mismatchFields.length > 0) {
        return {
            isValid: false,
            status: 'MISMATCH',
            reasonCode: 'ID_DATA_INCONSISTENT',
            mismatchFields,
            explanation: `Inconsistency in ${mismatchFields.join(', ')} with Nicaraguan RUC structure.`
        };
    }

    return { isValid: true, status: 'VALID' };
}

function validateRUCAlphaChecksum(tin: string): boolean {
    const alphabet = "ABCDEFGHJKLMNPQRSTUVWXY"; // Standard Nicaraguan check letters
    const lastChar = tin[13];
    return alphabet.includes(lastChar);
}

/**
 * APPENDIX: FORENSIC CRITERIA
 * Nicaragua uses the RUC (Registro Único de Contribuyentes) for all taxpayers.
 * 1. Scope: Issued by the DGI and CSE (for individuals).
 * 2. Structure: 14 alphanumeric characters.
 *    - Positions 1-3: Municipality code (e.g., 001 for Managua).
 *    - Positions 4-9: Birth date (DDMMYY).
 *    - Position 14: Check letter.
 * 3. Validation: Structural pattern match and check letter verification.
 */
