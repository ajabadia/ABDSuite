import { HolderMetadata, TinValidationResult, CountryRegulatoryInfo, TinInfo, TinRequirement } from './index';

/**
 * TIN Validation for Brazil (BR)
 * Individual: CPF (11 digits)
 * Entity: CNPJ (14 digits)
 */

/**
 * TIN Requirements for Brazil
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
    { key: 'birthPlaceCode', label: 'fiscalRegion', type: 'select', scope: 'INDIVIDUAL', options: [
        { value: '1', label: 'DF, GO, MS, MT, TO' }, { value: '2', label: 'AC, AM, AP, PA, RO, RR' },
        { value: '3', label: 'CE, MA, PI' }, { value: '4', label: 'AL, PB, PE, RN' },
        { value: '5', label: 'BA, SE' }, { value: '6', label: 'MG' },
        { value: '7', label: 'ES, RJ' }, { value: '8', label: 'SP' },
        { value: '9', label: 'PR, SC' }, { value: '0', label: 'RS' }
    ]}
];

/**
 * Country Metadata for Brazil
 */
export const COUNTRY_INFO: CountryRegulatoryInfo = {
    name: 'Brasil',
    authority: 'Receita Federal do Brasil',
    compliance: {
        crsStatus: 'Participating',
        crsDate: 'September 2017',
        fatcaStatus: 'Model 1 (In Force)'
    },
    residency: {
        individual: 'Se considera residente si posee visa permanente, o visa temporal con contrato de trabajo, o si permanece más de 183 días en un periodo de 12 meses.',
        entity: 'Se considera residente si está incorporada bajo la ley brasileña. Las sucursales de entidades extranjeras registradas en Brasil también se consideran residentes.',
        notes: 'Criterio de permanencia física o vínculo laboral/permanente.'
    }
};

/**
 * TIN Metadata for Brazil (Era 6.3)
 */
export const TIN_INFO: TinInfo = {
    name: 'CPF / CNPJ',
    description: 'Brazilian CPF (Individuals) or CNPJ (Entities) issued by Receita Federal.',
    placeholder: '000.000.000-00 / 00.000.000/0001-00',
    officialLink: 'https://www.receita.fazenda.gov.br',
    isOfficial: true,
    lastUpdated: '2026-04-24',
    source: 'OECD Portal / Receita Federal',
    entityDifferentiation: {
        logic: 'Number length.',
        individualDescription: '11 digits (CPF - Cadastro de Pessoas Físicas).',
        businessDescription: '14 digits (CNPJ - Cadastro Nacional da Pessoa Jurídica).'
    }
};

/**
 * Brazil TIN Validator - Era 6.3
 */
export const validateBRTIN = (
    value: string, 
    type: 'INDIVIDUAL' | 'ENTITY' | 'ANY' = 'ANY', 
    metadata?: HolderMetadata
): TinValidationResult => {
    const sanitized = value.replace(/[\s./-]/g, '');

    // Individual (CPF): 11 digits
    if (sanitized.length === 11 && /^[0-9]{11}$/.test(sanitized)) {
        if (type === 'ENTITY') {
            return { 
                isValid: false, 
                status: 'MISMATCH', 
                reasonCode: 'ENTITY_TYPE_MISMATCH',
                explanation: 'The detected format (11 digits) corresponds to a Brazilian CPF, which is exclusive to individuals.'
            };
        }
        
        if (validateCPFChecksum(sanitized)) {
            if (metadata?.birthPlaceCode && sanitized[8] !== metadata.birthPlaceCode) {
                return {
                    isValid: false,
                    status: 'MISMATCH',
                    reasonCode: 'ID_DATA_INCONSISTENT',
                    mismatchFields: ['birthPlaceCode'],
                    explanation: `Fiscal Region mismatch. CPF indicates region ${sanitized[8]}, but metadata says ${metadata.birthPlaceCode}.`
                };
            }
            return { 
                isValid: true, 
                status: 'VALID', 
                isOfficialMatch: true, 
                explanation: type === 'ANY'
                    ? 'Format valid for Individuals (CPF). Note: This identifier is not valid for legal Entities.'
                    : decodeBrazilTIN(sanitized) 
            };
        } else {
            return { isValid: false, status: 'INVALID_CHECKSUM', explanation: 'Failed Brazilian CPF checksum validation.' };
        }
    }

    // Entity (CNPJ): 14 digits
    if (sanitized.length === 14 && /^[0-9]{14}$/.test(sanitized)) {
        if (type === 'INDIVIDUAL') {
            return { 
                isValid: false, 
                status: 'MISMATCH', 
                reasonCode: 'ENTITY_TYPE_MISMATCH',
                explanation: 'The detected format (14 digits) corresponds to a Brazilian CNPJ, which is exclusive to legal entities.'
            };
        }
        return { 
            isValid: true, 
            status: 'VALID', 
            isOfficialMatch: true, 
            explanation: type === 'ANY'
                ? 'Format valid for Entities (CNPJ). Note: This format is invalid if the holder is an Individual.'
                : decodeBrazilCNPJ(sanitized)
        };
    }

    return { 
        isValid: false, 
        status: 'INVALID_FORMAT',
        explanation: 'Value does not match Brazilian CPF (11 digits) or CNPJ (14 digits) format.'
    };
};

function decodeBrazilTIN(tin: string): string {
    const regionCode = tin[8];
    const regionMap: Record<string, string> = {
        '1': 'DF, GO, MS, MT, TO',
        '2': 'AC, AM, AP, PA, RO, RR',
        '3': 'CE, MA, PI',
        '4': 'AL, PB, PE, RN',
        '5': 'BA, SE',
        '6': 'MG',
        '7': 'ES, RJ',
        '8': 'SP',
        '9': 'PR, SC',
        '0': 'RS'
    };
    const region = regionMap[regionCode] || 'Unknown Region';
    return `CPF: Issued in Region ${regionCode} (${region}). Verified via checksum.`;
}

function decodeBrazilCNPJ(tin: string): string {
    const branchCode = tin.substring(8, 12);
    const type = branchCode === '0001' ? 'Headquarters (Matriz)' : `Branch (Filial) #${branchCode}`;
    return `CNPJ: ${type}. Verified via structure.`;
}

function validateCPFChecksum(cpf: string): boolean {
    let sum = 0;
    for (let i = 0; i < 9; i++) sum += parseInt(cpf[i]) * (10 - i);
    let check1 = 11 - (sum % 11);
    if (check1 > 9) check1 = 0;
    if (check1 !== parseInt(cpf[9])) return false;

    sum = 0;
    for (let i = 0; i < 10; i++) sum += parseInt(cpf[i]) * (11 - i);
    let check2 = 11 - (sum % 11);
    if (check2 > 9) check2 = 0;
    return check2 === parseInt(cpf[10]);
}

/**
 * APPENDIX: FORENSIC CRITERIA
 * Brazil's Receita Federal uses CPF (individuals) and CNPJ (entities).
 * 1. CPF (11 digits): 
 *    - 9th digit: Indicates the Fiscal Region of origin (e.g., 8 = São Paulo).
 *    - Last 2 digits: Verification checksum (Modulo 11).
 * 2. CNPJ (14 digits):
 *    - Digits 9-12: The 'Mil-Contra' (e.g., 0001 for main office, 0002+ for branches).
 * 3. Validation: Both systems use custom Modulo 11 algorithms for the final 2 digits.
 * 4. Residency: Centered on the 183-day physical presence rule within 12 months.
 */
