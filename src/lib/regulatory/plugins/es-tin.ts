import { HolderMetadata, TinValidationResult, CountryRegulatoryInfo, TinInfo, TinRequirement } from './index';

/**
 * TIN Validation for Spain (ES)
 * DNI (8 digits + 1 letter)
 * NIE (1 letter + 7 digits + 1 letter)
 * NIF (Entities, 1 letter + 8 digits)
 */

/**
 * TIN Requirements for Spain
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
 * Country Metadata for Spain
 */
export const COUNTRY_INFO: CountryRegulatoryInfo = {
    name: 'España',
    authority: 'Agencia Tributaria (AEAT)',
    compliance: {
        crsStatus: 'Participating',
        crsDate: 'September 2017',
        fatcaStatus: 'Model 1 (In Force)'
    },
    residency: {
        individual: 'Se considera residente si permanece más de 183 días en territorio español o si el núcleo principal de sus actividades o intereses económicos radica en España.',
        entity: 'Se considera residente si se ha constituido conforme a las leyes españolas, tiene su domicilio social en España o su sede de dirección efectiva en territorio español.',
        notes: 'Presunción de residencia si el cónyuge no separado legalmente y los hijos menores residen habitualmente en España.'
    }
};

/**
 * TIN Metadata for Spain (Era 6.3)
 */
export const TIN_INFO: TinInfo = {
    name: 'Número de Identificación Fiscal (NIF)',
    description: 'Spanish DNI, NIE or NIF for entities issued by the AEAT.',
    placeholder: '12345678Z / X1234567L',
    officialLink: 'https://www.agenciatributaria.es',
    isOfficial: true,
    lastUpdated: '2026-04-24',
    source: 'OECD Portal / Agencia Tributaria',
    entityDifferentiation: {
        logic: 'Initial letter and length.',
        individualDescription: 'DNI (8 numbers + Letter) or NIE (Letter X/Y/Z + 7 numbers + Letter).',
        businessDescription: 'Initial letter (A, B, C, D, E, F, G, H, J, P, Q, R, S, U, V, N, W) + 8 digits.'
    }
};

/**
 * Spain TIN Validator - Era 6.3
 */
export const validateESTIN = (
    value: string, 
    type: 'INDIVIDUAL' | 'ENTITY' | 'ANY' = 'ANY', 
    metadata?: HolderMetadata
): TinValidationResult => {
    const sanitized = value.toUpperCase().replace(/[\s-]/g, '');

    // 1. Check for Entity Format (CIF/NIF Entidades)
    if (/^[ABCDEFGHJNPQRSUVW][0-9]{7}[0-9A-J]$/.test(sanitized)) {
        if (type === 'INDIVIDUAL') {
            return { 
                isValid: false, 
                status: 'MISMATCH', 
                reasonCode: 'ENTITY_TYPE_MISMATCH',
                explanation: 'The detected format corresponds to a Spanish Entity NIF (CIF) and not an individual identifier.'
            };
        }
        
        const isOfficial = validateCIF(sanitized);
        const explanation = decodeSpanishTIN(sanitized);
        return { 
            isValid: true, 
            status: isOfficial ? 'VALID' : 'VALID_UNOFFICIAL', 
            isOfficialMatch: isOfficial, 
            explanation: type === 'ANY'
                ? 'TIN validated successfully for entities (CIF). Not valid for individuals.'
                : explanation
        };
    }

    // 2. Check for Individual Format (DNI/NIE)
    const isOfficialDNI = validateDNI_NIE(sanitized);
    const isUnofficialPattern = /^[XYZ0-9][0-9]{7}[A-Z]$/.test(sanitized);

    if (isOfficialDNI || isUnofficialPattern) {
        if (type === 'ENTITY') {
            return { 
                isValid: false, 
                status: 'MISMATCH', 
                reasonCode: 'ENTITY_TYPE_MISMATCH',
                explanation: 'The detected format corresponds to a Spanish Personal Identifier (DNI/NIE) and not an entity NIF.'
            };
        }

        const explanation = decodeSpanishTIN(sanitized);

        return { 
            isValid: true, 
            status: isOfficialDNI ? 'VALID' : 'VALID_UNOFFICIAL', 
            isOfficialMatch: isOfficialDNI,
            explanation: type === 'ANY'
                ? 'TIN validated successfully for individuals (DNI/NIE). Not valid for entities.'
                : `${explanation} ${isOfficialDNI ? 'Verified via AEAT checksum.' : 'Failed official checksum.'}`
        };
    }

    return { 
        isValid: false, 
        status: 'INVALID_FORMAT',
        explanation: 'Value does not match Spanish DNI, NIE or Entity NIF format.'
    };
};

const NIF_TYPES: Record<string, string> = {
    'A': 'Sociedad Anónima',
    'B': 'Sociedad de Responsabilidad Limitada',
    'C': 'Sociedad Colectiva',
    'D': 'Sociedad Comanditaria',
    'E': 'Comunidad de Bienes / Herencia Yacente',
    'F': 'Sociedad Cooperativa',
    'G': 'Asociación',
    'H': 'Comunidad de Propietarios',
    'J': 'Sociedad Civil',
    'P': 'Corporación Local',
    'Q': 'Organismo Público',
    'R': 'Congregación o Institución Religiosa',
    'S': 'Órgano de la Administración del Estado',
    'U': 'Unión Temporal de Empresas',
    'V': 'Sociedad no definida en el resto de claves',
    'N': 'Entidad Extranjera',
    'W': 'Establecimiento Permanente de Entidad no Residente'
};

function decodeSpanishTIN(tin: string): string {
    const firstChar = tin[0];
    
    if (/[ABCDEFGHJNPQRSUVW]/.test(firstChar)) {
        const type = NIF_TYPES[firstChar] || 'Juridical Entity';
        return `NIF: ${type}.`;
    }
    
    if (/[XYZ]/.test(firstChar)) {
        return 'NIE: Foreigner Identity Number.';
    }
    
    if (/[0-9]/.test(firstChar)) {
        return 'DNI: Spanish National ID.';
    }
    
    if (firstChar === 'M') return 'Special NIF (Foreigner without NIE).';
    if (firstChar === 'L') return 'Special NIF (Resident abroad without DNI).';
    if (firstChar === 'K') return 'Special NIF (Minor without DNI).';

    return 'Spanish Tax Identifier.';
}

function validateDNI_NIE(tin: string): boolean {
    if (tin.length !== 9) return false;
    
    let base = tin.substring(0, 8);
    const letter = tin[8];
    
    // Replace NIE prefixes
    if (base[0] === 'X') base = '0' + base.substring(1);
    else if (base[0] === 'Y') base = '1' + base.substring(1);
    else if (base[0] === 'Z') base = '2' + base.substring(1);
    
    if (!/^[0-9]+$/.test(base)) return false;
    
    const table = 'TRWAGMYFPDXBNJZSQVHLCKE';
    const numeric = parseInt(base);
    return table[numeric % 23] === letter;
}

function validateCIF(cif: string): boolean {
    if (cif.length !== 9) return false;
    
    const body = cif.substring(1, 8);
    const last = cif[8];
    
    let evenSum = 0;
    let oddSum = 0;
    
    for (let i = 0; i < body.length; i++) {
        const digit = parseInt(body[i]);
        if ((i + 1) % 2 === 0) {
            evenSum += digit;
        } else {
            let mult = digit * 2;
            if (mult > 9) mult = Math.floor(mult / 10) + (mult % 10);
            oddSum += mult;
        }
    }
    
    const totalSum = evenSum + oddSum;
    const digitControl = (10 - (totalSum % 10)) % 10;
    const letterControl = 'JABCDEFGHI'[digitControl];
    
    // Some CIF types only allow digit control, some letter, some both
    const first = cif[0];
    if (/[KPQS]/.test(first)) return last === letterControl;
    if (/[ABEH]/.test(first)) return last === digitControl.toString();
    return last === digitControl.toString() || last === letterControl;
}

/**
 * APPENDIX: FORENSIC CRITERIA
 * Spain uses a modular NIF (Número de Identificación Fiscal) system.
 * 1. DNI (Citizens): 8 digits + Control Letter (Modulo 23 algorithm).
 * 2. NIE (Foreigners): Prefix X, Y, or Z (representing 0, 1, 2) + 7 digits + Letter.
 * 3. CIF/NIF (Entities): Letter (representing legal form) + 7 digits + Check character.
 *    - Check Character: Can be a digit or a letter (J=0, A=1, B=2, etc.) depending 
 *      on the entity type.
 * 4. Residency: The 183-day rule is the primary legal criterion, supplemented 
 *    by the 'Economic Interests' test (IRNR - Impuesto sobre la Renta de no Residentes).
 * 5. Validation: Comprehensive support for DNI, NIE, and all entity types (CIF).
 */
