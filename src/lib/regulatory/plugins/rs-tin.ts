import { HolderMetadata, TinValidationResult, CountryRegulatoryInfo, TinInfo, TinRequirement } from './index';

/**
 * TIN Validation for Serbia (RS)
 * Individual: JMBG (13 digits)
 * Entity: PIB (9 digits)
 */

/**
 * TIN Requirements for Serbia
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
 * Country Metadata for Serbia
 */
export const COUNTRY_INFO: CountryRegulatoryInfo = {
    name: 'Serbia',
    authority: 'Tax Administration (Poreska uprava)',
    compliance: {
        crsStatus: 'Non-Participating',
        crsDate: 'N/A',
        fatcaStatus: 'Model 1 (In Force)'
    },
    residency: {
        individual: 'Se considera residente si tiene su residencia principal en Serbia o si permanece allí durante más de 183 días.',
        entity: 'Se considera residente si está incorporada en Serbia.',
        notes: 'Criterio de residencia principal o estancia de 183 días.'
    }
};

/**
 * TIN Metadata for Serbia (Era 6.3)
 */
export const TIN_INFO: TinInfo = {
    name: 'JMBG / PIB',
    description: 'Serbian JMBG (Individuals) or PIB (Entities) issued by the Ministry of Interior or Tax Administration.',
    placeholder: '0101980710000 / 123456789',
    officialLink: 'https://www.purs.gov.rs',
    isOfficial: true,
    lastUpdated: '2026-04-24',
    source: 'Local Authority / Serbia Tax',
    entityDifferentiation: {
        logic: 'Number length analysis.',
        individualDescription: '13-digit JMBG (Personal ID).',
        businessDescription: '9-digit PIB (Tax ID).'
    }
};

/**
 * Serbia TIN Validator - Era 6.3
 */
export const validateRSTIN = (
    value: string, 
    type: 'INDIVIDUAL' | 'ENTITY' | 'ANY' = 'ANY', 
    metadata?: HolderMetadata
): TinValidationResult => {
    const sanitized = value.trim().replace(/[\s-]/g, '');

    // 1. Individual (JMBG): 13 digits
    if (sanitized.length === 13 && /^[0-9]{13}$/.test(sanitized)) {
        if (type === 'ENTITY') {
             return { 
                 isValid: false, 
                 status: 'MISMATCH', 
                 reasonCode: 'ENTITY_TYPE_MISMATCH',
                 explanation: 'The detected format (13 digits) corresponds to a Serbian JMBG, which is exclusive to individuals.'
             };
        }
        if (metadata) {
            const semantic = validateSerbianSemantic(sanitized, metadata);
            if (!semantic.isValid) {
                return semantic;
            }
        }

        const isOfficial = validateJMBGChecksum(sanitized);
        return { 
            isValid: true, 
            status: isOfficial ? 'VALID' : 'VALID_UNOFFICIAL', 
            isOfficialMatch: isOfficial, 
            explanation: decodeSerbianJMBG(sanitized) + (isOfficial ? ' Verified via official checksum.' : ' Pattern match.')
        };
    }

    // 2. Business (PIB): 9 digits
    if (sanitized.length === 9 && /^[0-9]{9}$/.test(sanitized)) {
        if (type === 'INDIVIDUAL') {
             return { 
                 isValid: false, 
                 status: 'MISMATCH', 
                 reasonCode: 'ENTITY_TYPE_MISMATCH',
                 explanation: 'The detected format (9 digits) corresponds to a Serbian PIB, which applies only to entities.'
             };
        }
        const isOfficial = validatePIBChecksum(sanitized);
        return { 
            isValid: true, 
            status: isOfficial ? 'VALID' : 'VALID_UNOFFICIAL', 
            isOfficialMatch: isOfficial, 
            explanation: `Matches official Serbian PIB (9 digits) format. ${isOfficial ? 'Verified via checksum.' : 'Pattern match.'}` 
        };
    }

    return { 
        isValid: false, 
        status: 'INVALID_FORMAT',
        explanation: 'Value does not match Serbian JMBG (13 digits) or PIB (9 digits) format.'
    };
};

function decodeSerbianJMBG(tin: string): string {
    const dd = tin.substring(0, 2);
    const mm = tin.substring(2, 4);
    const yyy = tin.substring(4, 7);
    const region = tin.substring(7, 9);
    
    const year = parseInt(yyy) < 900 ? `2${yyy}` : `1${yyy}`;
    const nnn = parseInt(tin.substring(9, 12));
    const gender = nnn < 500 ? 'Male' : 'Female';
    
    return `Individual JMBG (${gender}), born on ${dd}/${mm}/${year} in region ${region}. Verified via structure.`;
}

function validateSerbianSemantic(tin: string, metadata: HolderMetadata): TinValidationResult {
    const mismatchFields: string[] = [];
    const ddPart = tin.substring(0, 2);
    const mmPart = tin.substring(2, 4);
    const yyyPart = tin.substring(4, 7);
    const nnnPart = parseInt(tin.substring(9, 12));

    // Gender check (000-499 Male, 500-999 Female)
    if (metadata.gender) {
        const isMale = nnnPart < 500;
        if ((metadata.gender === 'M' && !isMale) || (metadata.gender === 'F' && isMale)) {
            mismatchFields.push('gender');
        }
    }

    // Birth Date check
    if (metadata.birthDate) {
        const dob = new Date(metadata.birthDate);
        const day = dob.getDate().toString().padStart(2, '0');
        const month = (dob.getMonth() + 1).toString().padStart(2, '0');
        const yearSuffix = dob.getFullYear().toString().slice(-3);
        
        if (day !== ddPart || month !== mmPart || yearSuffix !== yyyPart) {
            mismatchFields.push('birthDate');
        }
    }

    if (mismatchFields.length > 0) {
        return {
            isValid: false,
            status: 'MISMATCH',
            reasonCode: 'ID_DATA_INCONSISTENT',
            mismatchFields,
            explanation: `Inconsistency in ${mismatchFields.join(', ')} with Serbian JMBG structure.`
        };
    }

    return { isValid: true, status: 'VALID' };
}

function validateJMBGChecksum(tin: string): boolean {
    const weights = [7, 6, 5, 4, 3, 2, 7, 6, 5, 4, 3, 2];
    let sum = 0;
    for (let i = 0; i < 12; i++) sum += parseInt(tin[i]) * weights[i];
    const remainder = sum % 11;
    let checkDigit = 11 - remainder;
    if (checkDigit > 9) checkDigit = 0;
    return checkDigit === parseInt(tin[12]);
}

function validatePIBChecksum(tin: string): boolean {
    let sum = 10;
    for (let i = 0; i < 8; i++) {
        let digit = parseInt(tin[i]);
        sum = (sum + digit) % 10;
        if (sum === 0) sum = 10;
        sum = (sum * 2) % 11;
    }
    const checkDigit = (11 - sum) % 10;
    return checkDigit === parseInt(tin[8]);
}

/**
 * APPENDIX: FORENSIC CRITERIA
 * Serbia uses the JMBG (individuals) and PIB (entities) systems.
 * 1. JMBG (13 digits): 
 *    - Structure: DD MM YYY RR NNN K.
 *    - YYY: Last 3 digits of birth year (e.g., 980 for 1980, 005 for 2005).
 *    - RR: Political region of birth (71-79 for Serbia).
 *    - Validation: Weighted sum algorithm Modulo 11.
 * 2. PIB (9 digits): 
 *    - Validation: Recursive algorithm Modulo 11 / ISO 7064.
 * 3. Residency: Based on the 183-day presence rule or primary residence.
 * 4. Scope: Managed by the Poreska uprava and Ministry of Interior.
 */
