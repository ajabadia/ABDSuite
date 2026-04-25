import { HolderMetadata, TinValidationResult, CountryRegulatoryInfo, TinInfo, TinRequirement } from './index';

/**
 * TIN Validation for Cyprus (CY)
 * TIC (9 chars: 8 digits + 1 letter)
 */

/**
 * TIN Requirements for Cyprus
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
 * Country Metadata for Cyprus
 */
export const COUNTRY_INFO: CountryRegulatoryInfo = {
    name: 'Chipre',
    authority: 'Tax Department of the Republic of Cyprus',
    compliance: {
        crsStatus: 'Participating',
        crsDate: 'September 2017',
        fatcaStatus: 'Model 1 (In Force)'
    },
    residency: {
        individual: 'Se considera residente si permanece más de 183 días en un año. También aplica la "regla de los 60 días" (reside al menos 60 días, tiene vivienda, hace negocios en Chipre y no es residente en otro lugar).',
        entity: 'Se considera residente si su gestión y control se ejercen en Chipre, o si se incorporó allí (ley de 2023).',
        notes: 'Aplicable tanto la prueba física como el test de control corporativo.'
    }
};

/**
 * TIN Metadata for Cyprus (Era 6.3)
 */
export const TIN_INFO: TinInfo = {
    name: 'Tax Identification Code (TIC)',
    description: 'Cypriot TIC (9 characters) issued by the Tax Department.',
    placeholder: '12345678A',
    officialLink: 'https://www.mof.gov.cy',
    isOfficial: true,
    lastUpdated: '2026-04-24',
    source: 'OECD Portal / Tax Department',
    entityDifferentiation: {
        logic: 'Structurally identical; first digit analysis.',
        individualDescription: 'TIC of 8 digits and 1 letter. Assigned to individuals.',
        businessDescription: 'TIC of 8 digits and 1 letter. Same format for entities (companies); often starts with 9.'
    }
};

/**
 * Cyprus TIN Validator - Era 6.3
 */
export const validateCYTIN = (
    value: string, 
    type: 'INDIVIDUAL' | 'ENTITY' | 'ANY' = 'ANY', 
    metadata?: HolderMetadata
): TinValidationResult => {
    const sanitized = value.replace(/[\s-]/g, '').toUpperCase();

    if (sanitized.length !== 9 || !/^[0-9]{8}[A-Z]$/.test(sanitized)) {
        return { 
            isValid: false, 
            status: 'INVALID_FORMAT',
            explanation: 'Value does not match Cypriot TIC (8 digits + 1 letter) format.'
        };
    }

    const firstDigit = parseInt(sanitized[0]);
    const isEntityFormat = firstDigit === 9; // Entities often start with 9
    const isIndividualFormat = firstDigit < 9;

    if (isEntityFormat && type === 'INDIVIDUAL') {
        return { 
            isValid: false, 
            status: 'MISMATCH', 
            reasonCode: 'ENTITY_TYPE_MISMATCH',
            explanation: 'The detected format (starting with 9) corresponds to a Cypriot TIC for legal entities.'
        };
    }

    if (isIndividualFormat && type === 'ENTITY') {
        if (firstDigit <= 5) {
            return { 
                isValid: false, 
                status: 'MISMATCH', 
                reasonCode: 'ENTITY_TYPE_MISMATCH',
                explanation: `The detected TIC prefix (${firstDigit}) is reserved for individuals.`
            };
        }
    }

    // Checksum Validation
    if (!validateCYChecksum(sanitized)) {
        return { 
            isValid: false, 
            status: 'INVALID_CHECKSUM',
            explanation: 'Value matches format but failed Cypriot TIC checksum algorithm.' 
        };
    }

    return { 
        isValid: true, 
        status: 'VALID', 
        isOfficialMatch: true, 
        explanation: 'Matches official Cypriot TIC format and checksum.'
    };
};

function validateCYChecksum(tic: string): boolean {
    const digits = tic.substring(0, 8).split('').map(Number);
    const evenMap = [1, 0, 5, 7, 9, 13, 15, 17, 19, 21];
    let sum = 0;
    for (let i = 0; i < 8; i++) {
        if (i % 2 === 0) {
            sum += digits[i];
        } else {
            sum += evenMap[digits[i]];
        }
    }
    const remainder = sum % 26;
    const checkLetter = String.fromCharCode(65 + remainder); // 0 -> A, 1 -> B, ...
    return checkLetter === tic[8];
}

/**
 * APPENDIX: FORENSIC CRITERIA
 * Cyprus uses the 9-character Tax Identification Code (TIC).
 * 1. Scope: Issued by the Tax Department to all residents and entities.
 * 2. Structure: 8 digits followed by 1 letter (check character). 
 * 3. Validation: Specific weighted sum algorithm Modulo 26.
 *    - Positions 1, 3, 5, 7 are added directly. 
 *    - Positions 2, 4, 6, 8 are mapped through a transformation table before adding.
 *    - The remainder (Sum % 26) identifies the check letter (A=0, B=1, etc.).
 * 4. Residency: Multi-factor test including the 183-day rule and the 60-day rule.
 */
