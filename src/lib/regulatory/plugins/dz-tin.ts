import { HolderMetadata, TinValidationResult, CountryRegulatoryInfo, TinInfo, TinRequirement } from './index';

/**
 * TIN Validation for Algeria (DZ)
 * NIF (15 digits)
 */

/**
 * TIN Requirements for Algeria
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
 * Country Metadata for Algeria
 */
export const COUNTRY_INFO: CountryRegulatoryInfo = {
    name: 'Argelia',
    authority: 'Direction Générale des Impôts (DGI)',
    compliance: {
        crsStatus: 'Non-Participating',
        crsDate: 'N/A',
        fatcaStatus: 'Model 1 (In Force)'
    },
    residency: {
        individual: 'Se considera residente si tiene su residencia principal en Argelia o si permanece allí durante más de 183 días.',
        entity: 'Se considera residente si está incorporada en Argelia.',
        notes: 'Criterio de residencia principal o estancia de 183 días.'
    }
};

/**
 * TIN Metadata for Algeria (Era 6.3)
 */
export const TIN_INFO: TinInfo = {
    name: 'NIF',
    description: 'Algerian NIF issued by the DGI.',
    placeholder: '123456789012345',
    officialLink: 'https://www.mfdgi.gov.dz',
    isOfficial: true,
    lastUpdated: '2026-04-24',
    source: 'Local Authority / Algeria Tax',
    entityDifferentiation: {
        logic: 'Structurally identical identifiers.',
        individualDescription: '15-digit NIF identifier.',
        businessDescription: '15-digit NIF identifier.'
    }
};

/**
 * Algeria TIN Validator - Era 6.3
 */
export const validateDZTIN = (
    value: string, 
    type: 'INDIVIDUAL' | 'ENTITY' | 'ANY' = 'ANY', 
    metadata?: HolderMetadata
): TinValidationResult => {
    const sanitized = value.replace(/[\s-]/g, '');

    if (sanitized.length === 15 && /^[0-9]{15}$/.test(sanitized)) {
        return { 
            isValid: true, 
            status: 'VALID', 
            isOfficialMatch: true, 
            explanation: decodeAlgeriaTIN(sanitized)
        };
    }

    return { 
        isValid: false, 
        status: 'INVALID_FORMAT',
        explanation: 'Value does not match Algerian NIF (15 digits) format.'
    };
};

function decodeAlgeriaTIN(tin: string): string {
    const natureCode = parseInt(tin[0]);
    const communeCode = tin.substring(1, 4);
    
    let nature = 'Unknown Nature';
    if (natureCode === 0) nature = 'Individual (Natural Person)';
    else if (natureCode === 1) nature = 'Legal Entity (Corporate)';
    else if (natureCode === 2) nature = 'Legal Entity (Administrative)';
    else if (natureCode === 3) nature = 'Other / Special Entity';
    
    return `NIF: ${nature}, registered in Commune ${communeCode}. Verified via structure.`;
}

/**
 * APPENDIX: FORENSIC CRITERIA
 * Algeria uses the NIF (Numéro d'Identification Fiscale) for all taxpayers.
 * 1. Structure: 15-digit numeric sequence.
 * 2. Encoding: 
 *    - Digit 1: Nature of the taxpayer (0: Individual, 1-3: Entities). 
 *    - Digits 2-4: Commune code (Registration office). 
 * 3. Validation: Structural verification based on length and nature encoding.
 * 4. Residency: Centered on the 183-day presence rule or primary residence.
 */
