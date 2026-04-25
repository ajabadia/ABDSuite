import { HolderMetadata, TinValidationResult, CountryRegulatoryInfo, TinInfo, TinRequirement } from './index';

/**
 * TIN Validation for India (IN)
 * PAN (10 characters: AAAAA0000A)
 */

/**
 * TIN Requirements for India
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
 * Country Metadata for India
 */
export const COUNTRY_INFO: CountryRegulatoryInfo = {
    name: 'India',
    authority: 'Income Tax Department',
    compliance: {
        crsStatus: 'Participating',
        crsDate: 'September 2017',
        fatcaStatus: 'Model 1 (In Force)'
    },
    residency: {
        individual: 'Residente si permanece 182 días o más en el año fiscal, o 60 días si ha permanecido 365 días en los 4 años anteriores.',
        entity: 'Compañía india o si su lugar de dirección efectiva (POEM) está en la India.',
        notes: 'Income-tax Act, 1961.'
    }
};

/**
 * TIN Metadata for India (Era 6.3)
 */
export const TIN_INFO: TinInfo = {
    name: 'Permanent Account Number (PAN)',
    description: 'Indian Permanent Account Number (PAN) issued by the Income Tax Department.',
    placeholder: 'ABCDE1234F',
    officialLink: 'https://www.incometax.gov.in',
    isOfficial: true,
    lastUpdated: '2026-04-24',
    source: 'OECD Portal / Income Tax Department',
    entityDifferentiation: {
        logic: '4th character (Status) and 5th character analysis.',
        individualDescription: 'The 4th character must be "P". The 5th is the initial of the surname.',
        businessDescription: 'The 4th character indicates the type (C=Company, F=Firm, etc.). The 5th is the initial of the entity name.'
    }
};

/**
 * India TIN Validator - Era 6.3
 */
export const validateINTIN = (
    value: string, 
    type: 'INDIVIDUAL' | 'ENTITY' | 'ANY' = 'ANY', 
    metadata?: HolderMetadata
): TinValidationResult => {
    const sanitized = value.replace(/[\s-]/g, '').toUpperCase();

    if (sanitized.length !== 10 || !/^[A-Z]{5}[0-9]{4}[A-Z]$/.test(sanitized)) {
        return { 
            isValid: false, 
            status: 'INVALID_FORMAT',
            explanation: 'Value does not match Indian PAN (10 characters: AAAAA0000A) format.'
        };
    }

    const statusChar = sanitized[3];
    const isIndividualFormat = statusChar === 'P';
    const isBusinessFormat = ['C', 'H', 'F', 'A', 'T', 'B', 'L', 'J', 'G'].includes(statusChar);

    if (isIndividualFormat && type === 'ENTITY') {
        return { 
            isValid: false, 
            status: 'MISMATCH', 
            reasonCode: 'ENTITY_TYPE_MISMATCH',
            explanation: `The PAN's 4th character ('${statusChar}') indicates a 'Person' (Individual) and not a legal entity.`
        };
    }

    if (isBusinessFormat && type === 'INDIVIDUAL') {
        return { 
            isValid: false, 
            status: 'MISMATCH', 
            reasonCode: 'ENTITY_TYPE_MISMATCH',
            explanation: `The PAN's 4th character ('${statusChar}') indicates a business or association and not an individual.`
        };
    }

    // 2. Semantic Check
    if (metadata) {
        const mismatchFields: string[] = [];
        
        // 5th character is the first character of the surname (individual) or entity name
        if (isIndividualFormat && metadata.lastName) {
            const expectedInitial = getCleanInitial(metadata.lastName);
            if (expectedInitial && sanitized[4] !== expectedInitial) {
                mismatchFields.push('lastName');
            }
        } else if (isBusinessFormat && metadata.lastName) {
            const expectedInitial = getCleanInitial(metadata.lastName);
            if (expectedInitial && sanitized[4] !== expectedInitial) {
                mismatchFields.push('lastName');
            }
        }

        if (mismatchFields.length > 0) {
            return {
                isValid: false,
                status: 'MISMATCH',
                message: `Data mismatch: ${mismatchFields.join(', ')}`,
                explanation: `The PAN's 5th character (${sanitized[4]}) does not match the initial of the surname (${getCleanInitial(metadata.lastName || '')}).`
            };
        }
    }

    const explanation = decodeIndiaTIN(sanitized);

    return { 
        isValid: true, 
        status: 'VALID', 
        isOfficialMatch: true, 
        explanation: type === 'ANY'
            ? (isIndividualFormat 
                ? `Valid format for Individuals (PAN Status 'P'). Note: This identifier is not valid for legal Entities.`
                : `Valid format for Entities (PAN Status '${statusChar}'). Not valid for Individuals.`)
            : explanation 
    };
};

function decodeIndiaTIN(tin: string): string {
    const statusCodes: Record<string, string> = {
        'C': 'Company',
        'P': 'Individual (Physical Person)',
        'H': 'Hindu Undivided Family (HUF)',
        'F': 'Firm',
        'A': 'Association of Persons (AOP)',
        'T': 'Trust',
        'B': 'Body of Individuals (BOI)',
        'L': 'Local Authority',
        'J': 'Artificial Juridical Person',
        'G': 'Government'
    };
    
    const status = statusCodes[tin[3]] || 'Other Status';
    return `PAN: ${status}. 5th char initial: ${tin[4]}. Verified via structure.`;
}

function getCleanInitial(name: string): string | null {
    if (!name) return null;
    const cleaned = name.toUpperCase().replace(/[^A-Z]/g, '');
    return cleaned.length > 0 ? cleaned[0] : null;
}

/**
 * APPENDIX: FORENSIC CRITERIA
 * India's PAN (Permanent Account Number) is a 10-character alphanumeric code.
 * 1. 4th Character (Status): Critical for entity differentiation. 
 *    (P=Individual, C=Company, H=HUF, F=Firm, A=AOP, T=Trust, B=BOI, L=Local Authority, 
 *    J=Artificial Juridical Person, G=Govt).
 * 2. 5th Character (Initial): Represents the first letter of the surname (Individual) 
 *    or the name of the entity.
 * 3. Validation: Structural check for the AAAAA0000A pattern.
 * 4. Residency: Reside if physically present for 182+ days in a tax year.
 */
