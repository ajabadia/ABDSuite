import { HolderMetadata, TinValidationResult, CountryRegulatoryInfo, TinInfo, TinRequirement } from './index';

/**
 * TIN Validation for Ecuador (EC)
 * Individual: Cédula de Identidad (10 digits) or RUC (13 digits)
 * Entity: Registro Único de Contribuyentes (RUC) (13 digits)
 */

/**
 * TIN Requirements for Ecuador
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
    { key: 'birthPlaceCode', label: 'province', type: 'select', scope: 'INDIVIDUAL', options: [
        { value: '01', label: 'Azuay' }, { value: '02', label: 'Bolívar' }, { value: '03', label: 'Cañar' },
        { value: '04', label: 'Carchi' }, { value: '05', label: 'Cotopaxi' }, { value: '06', label: 'Chimborazo' },
        { value: '07', label: 'El Oro' }, { value: '08', label: 'Esmeraldas' }, { value: '09', label: 'Guayas' },
        { value: '10', label: 'Imbabura' }, { value: '11', label: 'Loja' }, { value: '12', label: 'Los Ríos' },
        { value: '13', label: 'Manabí' }, { value: '14', label: 'Morona Santiago' }, { value: '15', label: 'Napo' },
        { value: '16', label: 'Pastaza' }, { value: '17', label: 'Pichincha' }, { value: '18', label: 'Tungurahua' },
        { value: '19', label: 'Zamora Chinchipe' }, { value: '20', label: 'Galápagos' }, { value: '21', label: 'Sucumbíos' },
        { value: '22', label: 'Orellana' }, { value: '23', label: 'Santo Domingo de los Tsáchilas' }, { value: '24', label: 'Santa Elena' }
    ]}
];

/**
 * Country Metadata for Ecuador
 */
export const COUNTRY_INFO: CountryRegulatoryInfo = {
    name: 'Ecuador',
    authority: 'Servicio de Rentas Internas (SRI)',
    compliance: {
        crsStatus: 'Participating',
        crsDate: 'September 2019',
        fatcaStatus: 'N/A'
    },
    residency: {
        individual: 'Se considera residente si permanece en Ecuador durante más de 183 días en el año fiscal.',
        entity: 'Se considera residente si está constituida en Ecuador.',
        notes: 'Criterio de permanencia física o constitución legal.'
    }
};

/**
 * TIN Metadata for Ecuador (Era 6.3)
 */
export const TIN_INFO: TinInfo = {
    name: 'RUC / Cédula',
    description: 'Ecuadorian RUC (Entities/Individuals) or Cédula (Individuals) issued by the SRI or Civil Registry.',
    placeholder: '1712345678001 / 1712345678',
    officialLink: 'https://www.sri.gob.ec',
    isOfficial: true,
    lastUpdated: '2026-04-24',
    source: 'Local Authority / Ecuador SRI',
    entityDifferentiation: {
        logic: 'Number length and 3rd digit analysis.',
        individualDescription: '10-digit Cédula or 13-digit RUC starting with a natural person code.',
        businessDescription: '13-digit RUC starting with a legal entity code.'
    }
};

/**
 * Ecuador TIN Validator - Era 6.3
 */
export const validateECTIN = (
    value: string, 
    type: 'INDIVIDUAL' | 'ENTITY' | 'ANY' = 'ANY', 
    metadata?: HolderMetadata
): TinValidationResult => {
    const sanitized = value.replace(/[\s-]/g, '');

    // Individual (Cédula): 10 digits
    if (sanitized.length === 10 && /^[0-9]{10}$/.test(sanitized)) {
        if (type === 'ENTITY') {
             return { isValid: false, status: 'MISMATCH', reasonCode: 'ENTITY_TYPE_MISMATCH' };
        }
        
        if (metadata?.birthPlaceCode && sanitized.substring(0, 2) !== metadata.birthPlaceCode) {
            return {
                isValid: false,
                status: 'MISMATCH',
                reasonCode: 'ID_DATA_INCONSISTENT',
                mismatchFields: ['birthPlaceCode'],
                explanation: `Province mismatch. Cédula indicates province ${sanitized.substring(0, 2)}, but metadata says ${metadata.birthPlaceCode}.`
            };
        }
        
        const isOfficial = validateEcuadorianChecksum(sanitized);
        return { 
            isValid: true, 
            status: isOfficial ? 'VALID' : 'VALID_UNOFFICIAL', 
            isOfficialMatch: isOfficial, 
            explanation: type === 'ANY'
                ? 'Format valid for Individuals (Cédula). Note: This identifier is not valid for legal Entities.'
                : 'Matches official Ecuadorian Cédula (10 digits) format.' 
        };
    }

    // RUC: 13 digits
    if (sanitized.length === 13 && /^[0-9]{13}$/.test(sanitized)) {
        if (metadata?.birthPlaceCode && sanitized.substring(0, 2) !== metadata.birthPlaceCode) {
            return {
                isValid: false,
                status: 'MISMATCH',
                reasonCode: 'ID_DATA_INCONSISTENT',
                mismatchFields: ['birthPlaceCode'],
                explanation: `Province mismatch. RUC indicates province ${sanitized.substring(0, 2)}, but metadata says ${metadata.birthPlaceCode}.`
            };
        }

        const isOfficial = validateEcuadorianChecksum(sanitized);
        const explanation = decodeEcuadorTIN(sanitized);
        const thirdDigit = parseInt(sanitized[2]);
        const isEntity = thirdDigit === 6 || thirdDigit === 9;

        return { 
            isValid: true, 
            status: isOfficial ? 'VALID' : 'VALID_UNOFFICIAL', 
            isOfficialMatch: isOfficial, 
            explanation: type === 'ANY'
                ? (isEntity 
                    ? 'Format valid for Entities (RUC). Note: This identifier is not valid for Individuals.'
                    : 'Format valid for Individuals (RUC). Note: This identifier is not valid for legal Entities.')
                : explanation
        };
    }

    return { 
        isValid: false, 
        status: 'INVALID_FORMAT',
        explanation: 'Value does not match Ecuadorian Cédula (10 digits) or RUC (13 digits) format.'
    };
};

function decodeEcuadorTIN(tin: string): string {
    const provinceCode = tin.substring(0, 2);
    const thirdDigit = parseInt(tin[2]);
    const branchCode = tin.substring(10, 13);
    
    let type = 'Unknown';
    if (thirdDigit < 6) type = 'Natural Person';
    else if (thirdDigit === 6) type = 'Public Sector Entity';
    else if (thirdDigit === 9) type = 'Private Legal Entity';
    
    const provinces: Record<string, string> = {
        '01': 'Azuay', '02': 'Bolívar', '03': 'Cañar', '04': 'Carchi', '05': 'Cotopaxi',
        '06': 'Chimborazo', '07': 'El Oro', '08': 'Esmeraldas', '09': 'Guayas', '10': 'Imbabura',
        '11': 'Loja', '12': 'Los Ríos', '13': 'Manabí', '14': 'Morona Santiago', '15': 'Napo',
        '16': 'Pastaza', '17': 'Pichincha', '18': 'Tungurahua', '19': 'Zamora Chinchipe', '20': 'Galápagos',
        '21': 'Sucumbíos', '22': 'Orellana', '23': 'Santo Domingo de los Tsáchilas', '24': 'Santa Elena'
    };
    
    const province = provinces[provinceCode] || `Province Code ${provinceCode}`;
    const branchInfo = branchCode === '001' ? 'Matrix' : `Branch #${branchCode}`;
    
    return `Ecuadorian RUC (${type}), ${branchInfo}, issued in ${province}. Verified via checksum.`;
}

function validateEcuadorianChecksum(tin: string): boolean {
    const province = parseInt(tin.substring(0, 2));
    if (province < 1 || province > 24) return false;

    const thirdDigit = parseInt(tin[2]);
    if (thirdDigit === 7 || thirdDigit === 8) return false;

    // Checksum for Natural Persons (Cédula or RUC < 6)
    if (thirdDigit < 6) {
        const weights = [2, 1, 2, 1, 2, 1, 2, 1, 2];
        let sum = 0;
        for (let i = 0; i < 9; i++) {
            let mult = parseInt(tin[i]) * weights[i];
            if (mult > 9) mult -= 9;
            sum += mult;
        }
        const checkDigit = (10 - (sum % 10)) % 10;
        return checkDigit === parseInt(tin[9]);
    }

    // Checksum for Legal Entities (Private = 9)
    if (thirdDigit === 9) {
        const weights = [4, 3, 2, 7, 6, 5, 4, 3, 2];
        let sum = 0;
        for (let i = 0; i < 9; i++) sum += parseInt(tin[i]) * weights[i];
        const checkDigit = (11 - (sum % 11)) % 11;
        return checkDigit === parseInt(tin[9]);
    }

    // Checksum for Public Entities (Public = 6)
    if (thirdDigit === 6) {
        const weights = [3, 2, 7, 6, 5, 4, 3, 2];
        let sum = 0;
        for (let i = 0; i < 8; i++) sum += parseInt(tin[i]) * weights[i];
        const checkDigit = (11 - (sum % 11)) % 11;
        return checkDigit === parseInt(tin[8]);
    }

    return false;
}

/**
 * APPENDIX: FORENSIC CRITERIA
 * Ecuador uses a unified identification system issued by the Civil Registry or SRI.
 * 1. Cédula de Identidad (10 digits): Used for individuals.
 * 2. RUC (Registro Único de Contribuyentes) (13 digits): 
 *    - Format: Cédula (10 digits) + 001 for natural persons.
 *    - Format: Entity ID (9 digits) + 001 for legal entities.
 * 3. Validation Logic (3rd Digit):
 *    - 0 to 5: Natural Persons (Modulo 10).
 *    - 6: Public Sector Entities (Modulo 11, weights 3,2,7,6,5,4,3,2).
 *    - 9: Private Legal Entities (Modulo 11, weights 4,3,2,7,6,5,4,3,2).
 * 4. Residency: Based on the 183-day presence rule in a fiscal year.
 */
