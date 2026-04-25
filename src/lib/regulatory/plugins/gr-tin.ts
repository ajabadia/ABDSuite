
import { HolderMetadata, TinValidationResult, CountryRegulatoryInfo, TinInfo, TinRequirement } from './index';

/**
 * TIN Validation for Greece (GR)
 * AFM (9 digits)
 */

/**
 * TIN Requirements for Greece
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
 * Country Metadata for Greece
 */
export const COUNTRY_INFO: CountryRegulatoryInfo = {
    name: 'Grecia',
    authority: 'Independent Authority for Public Revenue (IAPR/AADE)',
    compliance: {
        crsStatus: 'Participating',
        crsDate: 'September 2017',
        fatcaStatus: 'Model 1 (In Force)'
    },
    residency: {
        individual: 'Se considera residente si tiene su residencia principal en Grecia o si permanece allí durante más de 183 días en el año civil.',
        entity: 'Se considera residente si tiene su sede legal o lugar de administración efectiva en Grecia.',
        notes: 'Criterio de residencia principal o estancia de 183 días.'
    }
};

/**
 * TIN Metadata for Greece (Era 6.3)
 */
export const TIN_INFO: TinInfo = {
    name: 'AFM',
    description: 'Greek AFM issued by the IAPR.',
    placeholder: '123456789',
    officialLink: 'https://www.aade.gr',
    isOfficial: true,
    lastUpdated: '2026-04-24',
    source: 'OECD Portal / AADE',
    entityDifferentiation: {
        logic: 'Structurally identical identifiers.',
        individualDescription: '9-digit AFM identifier.',
        businessDescription: '9-digit AFM identifier.'
    }
};

/**
 * Greece TIN Validator - Era 6.3
 */
export const validateGRTIN = (
    value: string, 
    type: 'INDIVIDUAL' | 'ENTITY' | 'ANY' = 'ANY', 
    metadata?: HolderMetadata
): TinValidationResult => {
    const sanitized = value.replace(/[\s-]/g, '');

    if (sanitized.length === 9 && /^[0-9]{9}$/.test(sanitized)) {
        if (validateAFMChecksum(sanitized)) {
            const firstDigit = parseInt(sanitized[0]);
            const isEntityPrefix = [7, 8, 9].includes(firstDigit);
            const isIndividualPrefix = [0, 1, 2, 3, 4].includes(firstDigit);

            if (isEntityPrefix && type === 'INDIVIDUAL') {
                 return { 
                     isValid: false, 
                     status: 'MISMATCH', 
                     reasonCode: 'ENTITY_TYPE_MISMATCH',
                     explanation: `The Greek AFM prefix '${firstDigit}' is reserved for Legal Entities.`
                 };
            }
            if (isIndividualPrefix && type === 'ENTITY') {
                 return { 
                     isValid: false, 
                     status: 'MISMATCH', 
                     reasonCode: 'ENTITY_TYPE_MISMATCH',
                     explanation: `The Greek AFM prefix '${firstDigit}' is reserved for Natural Persons (Individuals).`
                 };
            }

            const explanation = decodeGreeceTIN(sanitized);

            return { 
                isValid: true, 
                status: 'VALID', 
                isOfficialMatch: true, 
                explanation: type === 'ANY'
                    ? (isEntityPrefix 
                        ? 'Format valid for Entities (AFM). Note: This identifier is not valid for Individuals.'
                        : 'Format valid for Individuals (AFM). Note: This identifier is not valid for legal Entities.')
                    : explanation
            };
        } else {
            return { isValid: false, status: 'INVALID_CHECKSUM', explanation: 'Failed Greek AFM checksum validation.' };
        }
    }

    return { 
        isValid: false, 
        status: 'INVALID_FORMAT',
        explanation: 'Value does not match Greek AFM (9 digits) format.'
    };
};

function decodeGreeceTIN(tin: string): string {
    const firstDigit = parseInt(tin[0]);
    let description = 'Unknown/Special Type';
    
    if (firstDigit >= 0 && firstDigit <= 4) description = 'Individual (Natural Person)';
    else if (firstDigit === 7) description = 'Legal Entity (Domestic Company)';
    else if (firstDigit === 8) description = 'Legal Entity (Associations/Unions)';
    else if (firstDigit === 9) description = 'Legal Entity (Public/Other Bodies)';
    
    return `AFM: ${description}. Verified via official checksum.`;
}

function validateAFMChecksum(tin: string): boolean {
    const weights = [256, 128, 64, 32, 16, 8, 4, 2];
    let sum = 0;
    for (let i = 0; i < 8; i++) sum += parseInt(tin[i]) * weights[i];
    const check = (sum % 11) % 10;
    return check === parseInt(tin[8]);
}
