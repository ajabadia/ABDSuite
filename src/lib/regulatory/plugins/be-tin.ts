
import { HolderMetadata, TinValidationResult, CountryRegulatoryInfo, TinInfo, TinRequirement } from './index';

/**
 * TIN Validation for Belgium (BE)
 * NN / No. d’identification (11 digits: YY.MM.DD-XXX.XX)
 * Entity: BCE / CBE (10 digits)
 */

/**
 * Belgium TIN Validator - Era 6.3
 */
export const validateBETIN = (
    value: string, 
    type: 'INDIVIDUAL' | 'ENTITY' | 'ANY' = 'ANY', 
    metadata?: HolderMetadata
): TinValidationResult => {
    const sanitized = value.replace(/[.\-/]/g, '');

    // 1. Structural Checks and Entity Differentiation
    const isIndividualNN = sanitized.length === 11 && /^[0-9]{11}$/.test(sanitized);
    const isEntityBCE = sanitized.length === 10 && /^[01][0-9]{9}$/.test(sanitized);

    if (!isIndividualNN && !isEntityBCE) {
        return { isValid: false, status: 'INVALID_FORMAT' };
    }

    if (isIndividualNN && type === 'ENTITY') {
        return { 
            isValid: false, 
            status: 'MISMATCH', 
            reasonCode: 'ENTITY_TYPE_MISMATCH',
            explanation: 'The detected format (11 digits) corresponds to a Belgian National Number (NN), which is exclusive to individuals.'
        };
    }

    if (isEntityBCE && type === 'INDIVIDUAL') {
        return { 
            isValid: false, 
            status: 'MISMATCH', 
            reasonCode: 'ENTITY_TYPE_MISMATCH',
            explanation: 'The detected format (10 digits starting with 0 or 1) corresponds to a Belgian Enterprise Number (BCE), which applies to legal entities.'
        };
    }

    // 2. Validation for Entity (BCE / KBO)
    if (isEntityBCE) {
        const baseBCE = parseInt(sanitized.substring(0, 8), 10);
        const checkBCE = parseInt(sanitized.substring(8, 10), 10);
        if (97 - (baseBCE % 97) !== checkBCE) {
            return { isValid: false, status: 'INVALID_CHECKSUM' };
        }
        return { 
            isValid: true, 
            status: 'VALID', 
            isOfficialMatch: true, 
            explanation: type === 'ANY'
                ? 'Format valid for Entities (BCE/KBO). Note: This identifier is not valid for Individuals.'
                : 'Matches official Belgian Enterprise Number (BCE/KBO) format.' 
        };
    }

    // 3. Validation for Individual (NN)
    const base = parseInt(sanitized.substring(0, 9));
    const check = parseInt(sanitized.substring(9, 11));
    
    // Modulo 97 check (supports pre and post-2000)
    const isValidStructure = (97 - (base % 97) === check) || (97 - (parseInt('2' + sanitized.substring(0, 9)) % 97) === check);
    if (!isValidStructure) return { isValid: false, status: 'INVALID_CHECKSUM', explanation: 'Failed Belgian NN checksum validation.' };

    // 4. Semantic Check (Era 6) - Only for Individuals
    if (metadata) {
        const mismatchFields: string[] = [];

        // Date of Birth Check (YYMMDD)
        if (metadata.birthDate) {
            const dob = new Date(metadata.birthDate);
            const expectedYYMMDD = dob.getFullYear().toString().slice(-2) + 
                                  (dob.getMonth() + 1).toString().padStart(2, '0') + 
                                  dob.getDate().toString().padStart(2, '0');
            const actualYYMMDD = sanitized.substring(0, 6);
            if (expectedYYMMDD !== actualYYMMDD) mismatchFields.push('birthDate');
        }

        // Gender Check (Even = Female, Odd = Male)
        if (metadata.gender) {
            const isFemale = parseInt(sanitized.substring(6, 9)) % 2 === 0;
            if ((metadata.gender === 'F' && !isFemale) || (metadata.gender === 'M' && isFemale)) {
                mismatchFields.push('gender');
            }
        }

        if (mismatchFields.length > 0) {
            const details = decodeBelgiumTIN(sanitized);
            return {
                isValid: false,
                status: 'MISMATCH',
                reasonCode: 'ID_DATA_INCONSISTENT',
                mismatchFields,
                explanation: `Inconsistency in ${mismatchFields.join(', ')}. TIN details: ${details}`
            };
        }
    }

    const explanation = decodeBelgiumTIN(sanitized);

    return { 
        isValid: true, 
        status: 'VALID', 
        isOfficialMatch: true, 
        explanation: type === 'ANY'
            ? 'Format valid for Individuals (National Number). Note: This identifier is not valid for legal Entities.'
            : explanation
    };
};

function decodeBelgiumTIN(tin: string): string {
    if (tin.length !== 11) return 'Belgian Identifier. Verified via structure.';

    const yy = tin.substring(0, 2);
    const mm = tin.substring(2, 4);
    const dd = tin.substring(4, 6);
    const serial = parseInt(tin.substring(6, 9));
    
    // Check checksum to determine century
    const base = parseInt(tin.substring(0, 9));
    const check = parseInt(tin.substring(9, 11));
    const is21stCentury = (97 - (parseInt('2' + tin.substring(0, 9)) % 97) === check);
    const yearPrefix = is21stCentury ? '20' : '19';
    
    const gender = serial % 2 === 0 ? 'Female' : 'Male';
    
    return `Person (${gender}), born on ${dd}/${mm}/${yearPrefix}${yy}. Verified via checksum.`;
}

/**
 * TIN Requirements for Belgium
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
 * Country Metadata for Belgium
 */
export const COUNTRY_INFO: CountryRegulatoryInfo = {
    name: 'Bélgica',
    authority: 'FPS Finance / Service Public Fédéral Finances',
    compliance: {
        crsStatus: 'Participating',
        crsDate: 'September 2017',
        fatcaStatus: 'Model 1 (In Force)'
    },
    residency: {
        individual: 'Residente si ha establecido en Bélgica su domicilio o el asiento de su fortuna (centro de intereses económicos).',
        entity: 'Residentes si su domicilio social, principal establecimiento o sede de dirección o administración se encuentra en Bélgica.',
        notes: 'Income Tax Code 1992 (WIB 92 / CIR 92).'
    }
};

/**
 * TIN Metadata for Belgium (Era 6.3)
 */
export const TIN_INFO: TinInfo = {
    name: 'NN / BCE',
    description: 'Belgian National Number (Individuals) or Enterprise Number (Entities).',
    placeholder: '80010112345 / 0123456789',
    officialLink: 'https://finance.belgium.be',
    isOfficial: true,
    lastUpdated: '2026-04-24',
    source: 'OECD Portal / SPF Finances',
    entityDifferentiation: {
        logic: 'Length and Modulo check.',
        individualDescription: 'National Number (NN) of 11 digits, including YYMMDD encoding.',
        businessDescription: 'Enterprise Number (BCE / KBO) of 10 digits, starting with 0 or 1.'
    }
};

/**
 * APPENDIX: FORENSIC CRITERIA
 * Belgium uses the NN (Rijksregisternummer) for individuals and BCE (Numéro d'entreprise) for entities.
 * 1. NN (11 digits):
 *    - Digits 1-6: Birth date (YYMMDD).
 *    - Digits 7-9: Daily serial number (Even for females, Odd for males).
 *    - Digits 10-11: Checksum (97 - (FullNumber % 97)). 
 *    - Century Note: For births after 31/12/1999, a '2' is prefixed to the first 9 digits before the modulo.
 * 2. BCE/KBO (10 digits): 
 *    - Starts with 0 or 1. 
 *    - Validation: Checksum is 97 - (First 8 digits % 97).
 * 3. Residency: Determined by domicile or the 'Seat of Fortune' (economic interests).
 */

