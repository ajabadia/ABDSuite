import { HolderMetadata, TinValidationResult, CountryRegulatoryInfo, TinInfo, TinRequirement } from './index';

/**
 * TIN Validation for Mexico (MX)
 * RFC (12 or 13 chars)
 * CURP (18 chars)
 */

/**
 * TIN Requirements for Mexico
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
    { key: 'birthPlaceCode', label: 'birthPlaceState', type: 'select', scope: 'INDIVIDUAL', options: [
        { value: 'AS', label: 'Aguascalientes' }, { value: 'BC', label: 'Baja California' },
        { value: 'BS', label: 'Baja California Sur' }, { value: 'CC', label: 'Campeche' },
        { value: 'CL', label: 'Coahuila' }, { value: 'CM', label: 'Colima' },
        { value: 'CS', label: 'Chiapas' }, { value: 'CH', label: 'Chihuahua' },
        { value: 'DF', label: 'Ciudad de México' }, { value: 'DG', label: 'Durango' },
        { value: 'GT', label: 'Guanajuato' }, { value: 'GR', label: 'Guerrero' },
        { value: 'HG', label: 'Hidalgo' }, { value: 'JC', label: 'Jalisco' },
        { value: 'MC', label: 'Estado de México' }, { value: 'MN', label: 'Michoacán' },
        { value: 'MS', label: 'Morelos' }, { value: 'NT', label: 'Nayarit' },
        { value: 'NL', label: 'Nuevo León' }, { value: 'OC', label: 'Oaxaca' },
        { value: 'PL', label: 'Puebla' }, { value: 'QT', label: 'Querétaro' },
        { value: 'QR', label: 'Quintana Roo' }, { value: 'SP', label: 'San Luis Potosí' },
        { value: 'SL', label: 'Sinaloa' }, { value: 'SR', label: 'Sonora' },
        { value: 'TC', label: 'Tabasco' }, { value: 'TS', label: 'Tamaulipas' },
        { value: 'TL', label: 'Tlaxcala' }, { value: 'VZ', label: 'Veracruz' },
        { value: 'YN', label: 'Yucatán' }, { value: 'ZS', label: 'Zacatecas' },
        { value: 'NE', label: 'Nacido en el Extranjero' }
    ]}
];

/**
 * Country Metadata for Mexico
 */
export const COUNTRY_INFO: CountryRegulatoryInfo = {
    name: 'México',
    authority: 'Servicio de Administración Tributaria (SAT)',
    compliance: {
        crsStatus: 'Participating',
        crsDate: 'September 2017',
        fatcaStatus: 'Model 1 (In Force)'
    },
    residency: {
        individual: 'Se considera residente si establece su casa habitación en México. Si tiene casa en otro país, es residente en México si el centro de sus intereses vitales está en territorio nacional.',
        entity: 'Se considera residente si se ha constituido conforme a las leyes mexicanas o tiene en México la administración principal de su negocio o su sede de dirección efectiva.',
        notes: 'Criterio de casa habitación o centro de intereses vitales.'
    }
};

/**
 * TIN Metadata for Mexico (Era 6.3)
 */
export const TIN_INFO: TinInfo = {
    name: 'RFC / CURP',
    description: 'Mexican RFC (TIN) or CURP (Personal ID) issued by the SAT or RENAPO.',
    placeholder: 'VECJ880326XXX / VECJ880326HDFRND01',
    officialLink: 'https://www.sat.gob.mx',
    isOfficial: true,
    lastUpdated: '2026-04-24',
    source: 'OECD Portal / SAT',
    entityDifferentiation: {
        logic: 'Length and initial characters.',
        individualDescription: '13 characters (RFC) or 18 characters (CURP).',
        businessDescription: '12 characters (RFC).'
    }
};

/**
 * Mexico TIN Validator - Era 6.3
 */
export const validateMXTIN = (
    value: string, 
    type: 'INDIVIDUAL' | 'ENTITY' | 'ANY' = 'ANY', 
    metadata?: HolderMetadata
): TinValidationResult => {
    const sanitized = value.replace(/[\s-]/g, '').toUpperCase();

    const isRFC13 = sanitized.length === 13 && /^[A-Z&]{4}[0-9]{6}[A-Z0-9]{3}$/.test(sanitized);
    const isRFC12 = sanitized.length === 12 && /^[A-Z&]{3}[0-9]{6}[A-Z0-9]{3}$/.test(sanitized);
    const isCURP = sanitized.length === 18 && /^[A-Z]{4}[0-9]{6}[HM][A-Z]{5}[0-9A-Z][0-9]$/.test(sanitized);

    if (!isRFC13 && !isRFC12 && !isCURP) {
        return { 
            isValid: false, 
            status: 'INVALID_FORMAT',
            explanation: 'Value does not match Mexican RFC (12/13 chars) or CURP (18 chars) format.'
        };
    }

    if (isRFC13 && type === 'ENTITY') {
        return { 
            isValid: false, 
            status: 'MISMATCH', 
            reasonCode: 'ENTITY_TYPE_MISMATCH',
            explanation: 'The detected RFC (13 characters) corresponds to an individual and not a legal entity.'
        };
    }

    if (isRFC12 && type === 'INDIVIDUAL') {
        return { 
            isValid: false, 
            status: 'MISMATCH', 
            reasonCode: 'ENTITY_TYPE_MISMATCH',
            explanation: 'The detected RFC (12 characters) corresponds to a legal entity and not an individual.'
        };
    }
    
    if (isCURP && type === 'ENTITY') {
        return { 
            isValid: false, 
            status: 'MISMATCH', 
            reasonCode: 'ENTITY_TYPE_MISMATCH',
            explanation: 'The detected CURP (18 characters) is a personal identity number and does not apply to legal entities.'
        };
    }

    // Semantic Check for Individuals (RFC13 or CURP)
    if (metadata && (isCURP || isRFC13)) {
        const mismatchFields: string[] = [];
        const tinDate = sanitized.substring(isRFC13 ? 4 : 4, isRFC13 ? 10 : 10);
        
        if (metadata.birthDate) {
            const dob = new Date(metadata.birthDate);
            const expectedYYMMDD = dob.getFullYear().toString().slice(-2) + 
                                  (dob.getMonth() + 1).toString().padStart(2, '0') + 
                                  dob.getDate().toString().padStart(2, '0');
            if (tinDate !== expectedYYMMDD) {
                mismatchFields.push('birthDate');
            }
        }

        if (isCURP && metadata.gender) {
            const tinGender = sanitized[10];
            if ((metadata.gender === 'M' && tinGender !== 'H') || (metadata.gender === 'F' && tinGender !== 'M')) {
                mismatchFields.push('gender');
            }
        }

        if (mismatchFields.length > 0) {
            return {
                isValid: false,
                status: 'MISMATCH',
                reasonCode: 'ID_DATA_INCONSISTENT',
                mismatchFields,
                explanation: `Inconsistency in ${mismatchFields.join(', ')} with Mexican identifier structure.`
            };
        }
    }

    if (isRFC12 || isRFC13) {
        const isOfficial = validateRFCChecksum(sanitized);
        const explanation = decodeMexicanTIN(sanitized);
        return { 
            isValid: true, 
            status: isOfficial ? 'VALID' : 'VALID_UNOFFICIAL', 
            isOfficialMatch: isOfficial, 
            explanation: type === 'ANY'
                ? (isRFC12 
                    ? `Valid format for Entities (RFC). Note: This format is invalid if the holder is an Individual.`
                    : `Valid format for Individuals (RFC). Note: This format is invalid if the holder is an Entity.`)
                : explanation + (isOfficial ? ' Verified via official checksum.' : ' Pattern match.')
        };
    }

    return { 
        isValid: true, 
        status: 'VALID', 
        isOfficialMatch: true, 
        explanation: type === 'ANY'
            ? 'Valid format for Individuals (CURP). Note: This identifier is not valid for legal Entities.'
            : decodeMexicanTIN(sanitized)
    };
};

function decodeMexicanTIN(tin: string): string {
    if (tin.length === 12) return `Legal Entity RFC. Registered on ${tin.substring(3, 5)}/${tin.substring(5, 7)}/19${tin.substring(7, 9)}.`;
    
    const dob = `${tin.substring(8, 10)}/${tin.substring(6, 8)}/19${tin.substring(4, 6)}`;
    if (tin.length === 13) return `Individual RFC. Born on ${dob}.`;
    
    const gender = tin[10] === 'H' ? 'Male' : 'Female';
    const state = MX_STATES[tin.substring(11, 13)] || 'Unknown State';
    return `Individual CURP (${gender}) from ${state}. Born on ${dob}.`;
}

function validateRFCChecksum(rfc: string): boolean {
    const table = "0123456789ABCDEFGHIJKLMN&OPQRSTUVWXYZ Ñ";
    const values: Record<string, number> = {};
    for (let i = 0; i < table.length; i++) values[table[i]] = i;
    
    const isEntity = rfc.length === 12;
    const weights = isEntity 
        ? [12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2] 
        : [13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2];
    
    let sum = 0;
    for (let i = 0; i < rfc.length - 1; i++) {
        sum += (values[rfc[i]] || 0) * weights[i];
    }
    
    const remainder = sum % 11;
    let expected: string;
    if (remainder === 0) expected = '0';
    else {
        const diff = 11 - remainder;
        if (diff === 10) expected = 'A';
        else expected = diff.toString();
    }
    
    return expected === rfc[rfc.length - 1];
}

const MX_STATES: Record<string, string> = {
    'AS': 'Aguascalientes', 'BC': 'Baja California', 'BS': 'Baja California Sur', 'CC': 'Campeche',
    'CL': 'Coahuila de Zaragoza', 'CM': 'Colima', 'CS': 'Chiapas', 'CH': 'Chihuahua',
    'DF': 'Ciudad de México', 'DG': 'Durango', 'GT': 'Guanajuato', 'GR': 'Guerrero',
    'HG': 'Hidalgo', 'JC': 'Jalisco', 'MC': 'México', 'MN': 'Michoacán de Ocampo',
    'MS': 'Morelos', 'NT': 'Nayarit', 'NL': 'Nuevo León', 'OC': 'Oaxaca',
    'PL': 'Puebla', 'QT': 'Querétaro', 'QR': 'Quintana Roo', 'SP': 'San Luis Potosí',
    'SL': 'Sinaloa', 'SR': 'Sonora', 'TC': 'Tabasco', 'TS': 'Tamaulipas',
    'TL': 'Tlaxcala', 'VZ': 'Veracruz de Ignacio de la Llave', 'YN': 'Yucatán',
    'ZS': 'Zacatecas', 'NE': 'Nacido en el Extranjero'
};

/**
 * APPENDIX: FORENSIC CRITERIA
 * Mexico uses the RFC (Registro Federal de Contribuyentes) for tax purposes 
 * and the CURP for unique population identity.
 * 1. RFC (Individuals - 13 chars): 
 *    - Format: LLLL YYMMDD Homoclave(3).
 *    - LLLL: Name-based code.
 *    - YYMMDD: Date of birth.
 * 2. RFC (Entities - 12 chars): 
 *    - Format: LLL YYMMDD Homoclave(3).
 *    - LLL: Name-based code.
 *    - YYMMDD: Creation date.
 * 3. Validation: Weighted sum algorithm Modulo 11 for the Homoclave's 
 *    last digit.
 * 4. CURP (18 chars): Includes state of birth and gender (H/M).
 * 5. Residency: Based on primary home (casa habitación) or center of 
 *    vital interests.
 */
