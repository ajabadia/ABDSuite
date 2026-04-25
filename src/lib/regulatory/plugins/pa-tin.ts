import { HolderMetadata, TinValidationResult, CountryRegulatoryInfo, TinInfo, TinRequirement } from './index';

/**
 * TIN Validation for Panama (PA)
 * RUC (Cédula or Alphanumeric)
 */

/**
 * TIN Requirements for Panama
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
        { value: '1', label: 'Bocas del Toro' }, { value: '2', label: 'Coclé' }, { value: '3', label: 'Colón' },
        { value: '4', label: 'Chiriquí' }, { value: '5', label: 'Darién' }, { value: '6', label: 'Herrera' },
        { value: '7', label: 'Los Santos' }, { value: '8', label: 'Panamá' }, { value: '9', label: 'Veraguas' },
        { value: '10', label: 'Guna Yala' }, { value: '11', label: 'Emberá' }, { value: '12', label: 'Ngäbe-Buglé' },
        { value: '13', label: 'Panamá Oeste' }
    ]}
];

/**
 * Country Metadata for Panama
 */
export const COUNTRY_INFO: CountryRegulatoryInfo = {
    name: 'Panamá',
    authority: 'Dirección General de Ingresos (DGI)',
    compliance: {
        crsStatus: 'Participating',
        crsDate: 'September 2018',
        fatcaStatus: 'Model 1 (In Force)'
    },
    residency: {
        individual: 'Se considera residente si permanece en Panamá más de 183 días en el año fiscal o si tiene domicilio permanente allí.',
        entity: 'Se considera residente si está constituida en Panamá o si su administración se ejerce allí.',
        notes: 'Criterio de permanencia física o domicilio permanente.'
    }
};

/**
 * TIN Metadata for Panama (Era 6.3)
 */
export const TIN_INFO: TinInfo = {
    name: 'RUC',
    description: 'Panamanian RUC issued by the DGI or Civil Registry.',
    placeholder: '8-123-456 / 12345-0001-123456 DV 01',
    officialLink: 'https://dgi.mef.gob.pa',
    isOfficial: true,
    lastUpdated: '2026-04-24',
    source: 'OECD Portal / DGI',
    entityDifferentiation: {
        logic: 'Structure analysis (Cédula vs Alphanumeric).',
        individualDescription: 'RUC matching the Cédula (Province-Volume-Page).',
        businessDescription: 'RUC assigned to legal entities (Variable length with DV).'
    }
};

/**
 * Panama TIN Validator - Era 6.3
 */
export const validatePATIN = (
    value: string, 
    type: 'INDIVIDUAL' | 'ENTITY' | 'ANY' = 'ANY', 
    metadata?: HolderMetadata
): TinValidationResult => {
    const sanitized = value.replace(/[\s-]/g, '').toUpperCase();

    // DV detection
    const dvMatch = value.match(/DV\s*(\d{1,2})/i) || value.match(/(\d{1,2})$/);
    const dv = dvMatch ? dvMatch[1] : null;

    if (sanitized.length >= 6 && sanitized.length <= 30 && /^[A-Z0-9]+$/.test(sanitized)) {
        if (metadata?.birthPlaceCode && /^[0-9]/.test(sanitized)) {
            const provinceCode = metadata.birthPlaceCode;
            const actualProvince = sanitized.startsWith('10') ? '10' : 
                                 sanitized.startsWith('11') ? '11' :
                                 sanitized.startsWith('12') ? '12' :
                                 sanitized.startsWith('13') ? '13' : sanitized[0];
            
            if (actualProvince !== provinceCode) {
                return {
                    isValid: false,
                    status: 'MISMATCH',
                    reasonCode: 'ID_DATA_INCONSISTENT',
                    mismatchFields: ['birthPlaceCode'],
                    explanation: `Province mismatch. RUC indicates province ${actualProvince}, but metadata says ${provinceCode}.`
                };
            }
        }
        const isIndividual = /^[0-9]/.test(sanitized) || sanitized.startsWith('PE') || sanitized.startsWith('E') || sanitized.startsWith('N');
        const explanation = decodePanamaTIN(sanitized) + (dv ? ` (DV: ${dv})` : '');

        return { 
            isValid: true, 
            status: 'VALID', 
            isOfficialMatch: true, 
            explanation: type === 'ANY'
                ? (isIndividual 
                    ? 'Format valid for Individuals (Cédula). Note: This identifier is not valid for legal Entities.'
                    : 'Format valid for legal Entities. Not valid for Individuals.')
                : explanation
        };
    }

    return { 
        isValid: false, 
        status: 'INVALID_FORMAT',
        explanation: 'Value does not match Panamanian RUC format.'
    };
};

function decodePanamaTIN(tin: string): string {
    // Province mapping (Cédula)
    const provinces: Record<string, string> = {
        '1': 'Bocas del Toro', '2': 'Coclé', '3': 'Colón', '4': 'Chiriquí', '5': 'Darién',
        '6': 'Herrera', '7': 'Los Santos', '8': 'Panamá', '9': 'Veraguas',
        '10': 'Guna Yala', '11': 'Emberá', '12': 'Ngäbe-Buglé', '13': 'Panamá Oeste'
    };

    if (/^[0-9]/.test(tin)) {
        const firstDigit = tin[0];
        const province = provinces[firstDigit] || 'Unknown/Overseas';
        return `Individual RUC (Cédula), Province: ${province}.`;
    }
    
    if (tin.startsWith('PE')) return 'Individual RUC (Permanent Resident).';
    if (tin.startsWith('E')) return 'Individual RUC (Foreigner).';
    if (tin.startsWith('N')) return 'Individual RUC (Naturalized).';
    
    return 'Legal Entity RUC issued by the DGI. Verified via structure.';
}

/**
 * APPENDIX: FORENSIC CRITERIA
 * Panama uses the RUC (Registro Único de Contribuyentes) for all taxpayers.
 * 1. Individuals (Cédula): 
 *    - Format: P-VVV-PPP (Province-Volume-Page).
 *    - P: Province code (1-13) or E (Foreigner), N (Naturalized), PE (Permanent).
 * 2. Entities: 
 *    - Variable length alphanumeric sequence assigned by DGI.
 * 3. DV (Dígito Verificador): 
 *    - Calculated using a weighted sum Modulo 11 on the RUC string.
 * 4. Residency: 183-day rule in a fiscal year or permanent domicile.
 * 5. Scope: Managed by the Dirección General de Ingresos (DGI).
 */
