import { HolderMetadata, TinValidationResult, CountryRegulatoryInfo, TinInfo, TinRequirement } from './index';

/**
 * TIN Validation for France (FR)
 * Numéro Fiscal (13 digits)
 * SIREN (9 digits)
 * SIRET (14 digits)
 */

/**
 * TIN Requirements for France
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
    ]},
    { key: 'birthPlaceCode', label: 'department', type: 'text', scope: 'INDIVIDUAL', placeholder: 'e.g., 75' }
];

/**
 * Country Metadata for France
 */
export const COUNTRY_INFO: CountryRegulatoryInfo = {
    name: 'Francia',
    authority: 'Direction Générale des Finances Publiques (DGFiP)',
    compliance: {
        crsStatus: 'Participating',
        crsDate: 'September 2017',
        fatcaStatus: 'Model 1 (In Force)'
    },
    residency: {
        individual: 'Se considera residente si tiene su hogar o lugar de estancia principal en Francia, ejerce su actividad profesional allí o tiene el centro de sus intereses económicos en Francia.',
        entity: 'Se considera residente si tiene su sede social (siège social) o su lugar de dirección efectiva en Francia.',
        notes: 'Criterio de hogar (foyer) o lugar de estancia principal.'
    }
};

/**
 * TIN Metadata for France (Era 6.3)
 */
export const TIN_INFO: TinInfo = {
    name: 'NIF / SIREN / SIRET',
    description: "French Numéro d'Identification Fiscale (NIF) issued by DGFiP or SIREN/SIRET issued by INSEE.",
    placeholder: '01 23 456 789 012 / 123 456 789',
    officialLink: 'https://www.impots.gouv.fr',
    isOfficial: true,
    lastUpdated: '2026-04-24',
    source: 'OECD Portal / DGFiP',
    entityDifferentiation: {
        logic: 'Registration system and length.',
        individualDescription: '13 digits (SPI / NIF) starting with 0, 1, 2 or 3.',
        businessDescription: '9 digits (SIREN) or 14 digits (SIRET) for establishments.'
    }
};

/**
 * France TIN Validator - Era 6.3
 */
export const validateFRTIN = (
    value: string, 
    type: 'INDIVIDUAL' | 'ENTITY' | 'ANY' = 'ANY', 
    metadata?: HolderMetadata
): TinValidationResult => {
    const sanitized = value.replace(/[\s-]/g, '');

    const isSPI = sanitized.length === 13 && /^[0-3][0-9]{12}$/.test(sanitized);
    const isNIR = sanitized.length === 15 && /^[12][0-9]{14}$/.test(sanitized);
    const isSIREN = sanitized.length === 9 && /^[0-9]{9}$/.test(sanitized);
    const isSIRET = sanitized.length === 14 && /^[0-9]{14}$/.test(sanitized);

    if (!isSPI && !isNIR && !isSIREN && !isSIRET) {
        return { 
            isValid: false, 
            status: 'INVALID_FORMAT',
            explanation: 'Value does not match French NIF/SPI (13 digits), NIR (15 digits), SIREN (9 digits) or SIRET (14 digits) format.'
        };
    }

    if ((isSPI || isNIR) && type === 'ENTITY') {
        return { 
            isValid: false, 
            status: 'MISMATCH', 
            reasonCode: 'ENTITY_TYPE_MISMATCH',
            explanation: 'The detected format corresponds to a French Personal Identifier (NIF/SPI or NIR) and not a business identifier.'
        };
    }

    if ((isSIREN || isSIRET) && type === 'INDIVIDUAL') {
        return { 
            isValid: false, 
            status: 'MISMATCH', 
            reasonCode: 'ENTITY_TYPE_MISMATCH',
            explanation: 'The detected format corresponds to a French Business Identifier (SIREN/SIRET) and not a personal identifier.'
        };
    }

    // NIR Validation and Semantic Check
    if (isNIR) {
        const baseNIR = sanitized.substring(0, 13);
        const key = parseInt(sanitized.substring(13, 15));
        const expectedKey = 97 - (Number(BigInt(baseNIR) % BigInt(97)));
        
        if (key !== expectedKey) {
            return { isValid: false, status: 'INVALID_CHECKSUM', explanation: 'Failed French NIR checksum (Modulo 97) validation.' };
        }

        if (metadata) {
            const semantic = validateFranceSemantic(sanitized, metadata);
            if (!semantic.isValid) return semantic;
        }
    }

    // SIREN/SIRET Checksum (Luhn)
    if (isSIREN || isSIRET) {
        let sum = 0;
        for (let i = 0; i < sanitized.length; i++) {
            let digit = parseInt(sanitized[i]);
            if ((sanitized.length - i) % 2 === 0) {
                digit *= 2;
                if (digit > 9) digit -= 9;
            }
            sum += digit;
        }
        if (sum % 10 !== 0) {
            return { 
                isValid: false, 
                status: 'INVALID_CHECKSUM',
                explanation: `Failed French ${isSIREN ? 'SIREN' : 'SIRET'} checksum (Luhn) validation.` 
            };
        }
    }

    const isIndividual = isSPI || isNIR;
    const isEntity = isSIREN || isSIRET;

    const baseExplanation = decodeFranceTIN(sanitized);

    return { 
        isValid: true, 
        status: 'VALID', 
        isOfficialMatch: true, 
        explanation: type === 'ANY'
            ? (isIndividual 
                ? `Valid format for Individuals (${sanitized.length === 13 ? 'NIF/SPI' : 'NIR'}). Note: This identifier is not valid for Entities.`
                : `Valid format for Entities (${isSIREN ? 'SIREN' : 'SIRET'}). Not valid for Individuals.`)
            : baseExplanation 
    };
};

function decodeFranceTIN(tin: string): string {
    if (tin.length === 15) {
        const gender = tin[0] === '1' ? 'Male' : 'Female';
        const yy = tin.substring(1, 3);
        const mm = tin.substring(3, 5);
        const dept = tin.substring(5, 7);
        return `NIR (Social Security): ${gender}, born 19${yy}/${mm} in Dept ${dept}. Verified via Modulo 97.`;
    }
    if (tin.length === 14) {
        const siren = tin.substring(0, 9);
        const nic = tin.substring(9, 14);
        return `SIRET: Establishment #${nic} of Company ${siren}. Verified via Luhn.`;
    }
    if (tin.length === 9) {
        return 'SIREN: Unique Business Identifier. Verified via Luhn.';
    }
    if (tin.length === 13) {
        return 'NIF (SPI): Personal Tax Identifier for Individuals. Verified via structure.';
    }
    return 'French Tax Identifier. Verified via structure.';
}

function validateFranceSemantic(tin: string, metadata: HolderMetadata): TinValidationResult {
    const mismatchFields: string[] = [];
    
    // NIR: Sex (1), Year (2), Month (2), Dept (2)
    if (metadata.gender) {
        const isMale = tin[0] === '1';
        if ((metadata.gender === 'M' && !isMale) || (metadata.gender === 'F' && isMale)) {
            mismatchFields.push('gender');
        }
    }

    if (metadata.birthDate) {
        const dob = new Date(metadata.birthDate);
        const yy = dob.getFullYear().toString().slice(-2);
        const mm = (dob.getMonth() + 1).toString().padStart(2, '0');
        if (tin.substring(1, 3) !== yy || tin.substring(3, 5) !== mm) {
            mismatchFields.push('birthDate');
        }
    }

    if (metadata.birthPlaceCode) {
        const dept = tin.substring(5, 7);
        if (dept !== metadata.birthPlaceCode) {
            mismatchFields.push('birthPlaceCode');
        }
    }

    if (mismatchFields.length > 0) {
        return {
            isValid: false,
            status: 'MISMATCH',
            reasonCode: 'ID_DATA_INCONSISTENT',
            mismatchFields,
            explanation: `Inconsistency in ${mismatchFields.join(', ')} with French NIR structure.`
        };
    }

    return { isValid: true, status: 'VALID' };
}

/**
 * APPENDIX: FORENSIC CRITERIA
 * France uses different systems for individuals (NIF/NIR) and businesses (SIREN/SIRET).
 * 1. NIF/SPI (Individuals): 13 digits, assigned by DGFiP.
 * 2. NIR (Social Security Number): 15 digits. 
 *    - Digit 1: Gender (1=Male, 2=Female).
 *    - Digits 2-3: Birth year (YY).
 *    - Digits 4-5: Birth month (MM).
 *    - Digits 6-7: Birth department (e.g., 75 for Paris).
 *    - Validation: Modulo 97 (97 - (First 13 digits % 97)).
 * 3. SIREN (Businesses): 9 digits, assigned by INSEE.
 * 4. SIRET (Establishments): 14 digits (SIREN + 5-digit NIC).
 * 5. Validation: SIREN and SIRET follow the Luhn algorithm.
 */
