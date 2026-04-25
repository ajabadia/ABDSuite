
import { HolderMetadata, TinValidationResult, CountryRegulatoryInfo, TinInfo, TinRequirement } from './index';

/**
 * TIN Validation for Faroe Islands (FO)
 * Individual: P-tal (9 digits: DDMMYY-XXX)
 * Entity: V-tal (6 digits)
 */

/**
 * TIN Requirements for Faroe Islands
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
    { key: 'gender', label: 'gender', type: 'select', scope: 'INDIVIDUAL', options: [
        { value: 'M', label: 'male' },
        { value: 'F', label: 'female' }
    ]}
];

/**
 * Country Metadata for Faroe Islands
 */
export const COUNTRY_INFO: CountryRegulatoryInfo = {
    name: 'Islas Feroe',
    authority: 'Faroese Tax Administration (TAKS)',
    compliance: {
        crsStatus: 'Participating',
        crsDate: 'September 2017',
        fatcaStatus: 'N/A'
    },
    residency: {
        individual: 'Se considera residente si tiene su residencia principal en las Islas Feroe o si permanece allí durante más de 180 días.',
        entity: 'Se considera residente si se ha incorporado en las Islas Feroe.',
        notes: 'Criterio de residencia principal o estancia de 180 días.'
    }
};

/**
 * TIN Metadata for Faroe Islands (Era 6.4)
 */
export const TIN_INFO: TinInfo = {
    name: 'P-tal / V-tal',
    description: 'Faroese P-tal (Individuals) or V-tal (Entities) issued by TAKS.',
    placeholder: '010180-123 / 123456',
    officialLink: 'https://www.taks.fo',
    isOfficial: true,
    lastUpdated: '2026-04-24',
    source: 'OECD Portal / TAKS',
    entityDifferentiation: {
        logic: 'Number length analysis.',
        individualDescription: '9-digit P-tal (DDMMYY-XXX).',
        businessDescription: '6-digit V-tal.'
    }
};

/**
 * Faroe Islands TIN Validator - Era 6.4
 */
export const validateFOTIN = (
    value: string, 
    type: 'INDIVIDUAL' | 'ENTITY' | 'ANY' = 'ANY', 
    metadata?: HolderMetadata
): TinValidationResult => {
    const sanitized = value.replace(/[\s-]/g, '');

    // Individual (P-tal): 9 digits (DDMMYY-XXX)
    if (sanitized.length === 9 && /^[0-9]{9}$/.test(sanitized)) {
        if (type === 'ENTITY') {
             return { isValid: false, status: 'MISMATCH', reasonCode: 'ENTITY_TYPE_MISMATCH' };
        }

        if (metadata) {
            const semantic = validateFaroeSemantic(sanitized, metadata);
            if (!semantic.isValid) return semantic;
        }

        const isOfficial = validateFaroeseChecksum(sanitized);
        return { 
            isValid: true, 
            status: isOfficial ? 'VALID' : 'VALID_UNOFFICIAL', 
            isOfficialMatch: isOfficial, 
            explanation: decodeFaroeTIN(sanitized)
        };
    }

    // Business (V-tal): 6 digits
    if (sanitized.length === 6 && /^[0-9]{6}$/.test(sanitized)) {
        if (type === 'INDIVIDUAL') {
             return { isValid: false, status: 'MISMATCH', reasonCode: 'ENTITY_TYPE_MISMATCH' };
        }
        return { 
            isValid: true, 
            status: 'VALID', 
            isOfficialMatch: true, 
            explanation: 'Matches official Faroese V-tal (6 digits) format.' 
        };
    }

    return { 
        isValid: false, 
        status: 'INVALID_FORMAT',
        explanation: 'Value does not match Faroese P-tal (9 digits) or V-tal (6 digits) format.'
    };
};

function decodeFaroeTIN(tin: string): string {
    const dd = tin.substring(0, 2);
    const mm = tin.substring(2, 4);
    const yy = tin.substring(4, 6);
    const lastDigit = parseInt(tin[8]);
    const gender = lastDigit % 2 === 0 ? 'Female' : 'Male';
    
    return `P-tal (${gender}), born on ${dd}/${mm}/${yy}. Verified via structure.`;
}

function validateFaroeSemantic(tin: string, metadata: HolderMetadata): TinValidationResult {
    const mismatchFields: string[] = [];
    const ddPart = tin.substring(0, 2);
    const mmPart = tin.substring(2, 4);
    const yyPart = tin.substring(4, 6);
    const lastDigit = parseInt(tin[8]);

    if (metadata.birthDate) {
        const dob = new Date(metadata.birthDate);
        const d = dob.getDate().toString().padStart(2, '0');
        const m = (dob.getMonth() + 1).toString().padStart(2, '0');
        const y = dob.getFullYear().toString().slice(-2);
        
        if (ddPart !== d || mmPart !== m || yyPart !== y) {
            mismatchFields.push('birthDate');
        }
    }

    if (metadata.gender) {
        const isFemale = lastDigit % 2 === 0;
        if ((metadata.gender === 'F' && !isFemale) || (metadata.gender === 'M' && isFemale)) {
            mismatchFields.push('gender');
        }
    }

    if (mismatchFields.length > 0) {
        return {
            isValid: false,
            status: 'MISMATCH',
            reasonCode: 'ID_DATA_INCONSISTENT',
            mismatchFields,
            explanation: `Inconsistency in ${mismatchFields.join(', ')} with Faroese P-tal structure.`
        };
    }

    return { isValid: true, status: 'VALID' };
}

function validateFaroeseChecksum(tin: string): boolean {
    // Faroese P-tal uses a weighted sum Modulo 11
    const weights = [8, 7, 6, 5, 4, 3, 2, 1];
    let sum = 0;
    for (let i = 0; i < 8; i++) sum += parseInt(tin[i]) * weights[i];
    const remainder = sum % 11;
    const checkDigit = remainder === 0 ? 0 : 11 - remainder;
    // Note: If checkDigit is 10, the TIN is invalid or uses a different rule.
    return checkDigit === parseInt(tin[8]);
}
