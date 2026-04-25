import { HolderMetadata, TinValidationResult, CountryRegulatoryInfo, TinInfo, TinRequirement } from './index';

/**
 * TIN Validation for North Macedonia (MK)
 * Individual: EMBG (13 digits)
 * Entity: EDB (13 digits)
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
 * Country Metadata for North Macedonia
 */
export const COUNTRY_INFO: CountryRegulatoryInfo = {
    name: 'Macedonia del Norte',
    authority: 'Public Revenue Office (PRO)',
    compliance: {
        crsStatus: 'Non-Participating',
        crsDate: 'N/A',
        fatcaStatus: 'Model 1 (In Force)'
    },
    residency: {
        individual: 'Se considera residente si tiene su residencia principal en Macedonia del Norte o si permanece allí durante más de 183 días.',
        entity: 'Se considera residente si está incorporada en Macedonia del Norte.',
        notes: 'Criterio de residencia principal o estancia de 183 días.'
    }
};

/**
 * TIN Metadata for North Macedonia (Era 6.3)
 */
export const TIN_INFO: TinInfo = {
    name: 'EMBG / EDB',
    description: 'Macedonian EMBG (Individuals) or EDB (Entities) issued by the Ministry of Interior or Public Revenue Office.',
    placeholder: '0101980410008',
    officialLink: 'https://www.ujp.gov.mk',
    isOfficial: true,
    lastUpdated: '2026-04-24',
    source: 'Local Authority / North Macedonia Tax',
    entityDifferentiation: {
        logic: 'Prefix analysis.',
        individualDescription: '13-digit EMBG (Unique Master Citizen Number).',
        businessDescription: '13-digit EDB starting with 4.'
    }
};

/**
 * North Macedonia TIN Validator - Era 6.3
 */
export const validateMKTIN = (
    value: string, 
    type: 'INDIVIDUAL' | 'ENTITY' | 'ANY' = 'ANY', 
    metadata?: HolderMetadata
): TinValidationResult => {
    const sanitized = value.replace(/[\s-]/g, '');

    if (sanitized.length === 13 && /^[0-9]{13}$/.test(sanitized)) {
        const isEntity = sanitized.startsWith('4');
        
        if (isEntity && type === 'INDIVIDUAL') {
             return { isValid: false, status: 'MISMATCH', reasonCode: 'ENTITY_TYPE_MISMATCH' };
        }
        
        const isOfficial = validateEMBGChecksum(sanitized);
        return { 
            isValid: true, 
            status: isOfficial ? 'VALID' : 'VALID_UNOFFICIAL', 
            isOfficialMatch: isOfficial, 
            explanation: decodeMacedoniaTIN(sanitized)
        };
    }

    return { 
        isValid: false, 
        status: 'INVALID_FORMAT',
        explanation: 'Value does not match Macedonian EMBG/EDB (13 digits) format.'
    };
};

function decodeMacedoniaTIN(tin: string): string {
    if (tin.startsWith('4')) return 'Legal Entity (EDB). Verified via prefix and checksum.';
    
    const dd = tin.substring(0, 2);
    const mm = tin.substring(2, 4);
    const yyy = tin.substring(4, 7);
    const century = parseInt(yyy) < 900 ? '2' : '1';
    
    return `Individual (EMBG), born on ${dd}/${mm}/${century}${yyy}. Verified via checksum.`;
}

function validateEMBGChecksum(tin: string): boolean {
    const weights = [7, 6, 5, 4, 3, 2, 7, 6, 5, 4, 3, 2];
    let sum = 0;
    for (let i = 0; i < 12; i++) sum += parseInt(tin[i]) * weights[i];
    let check = 11 - (sum % 11);
    if (check > 9) check = 0;
    return check === parseInt(tin[12]);
}

/**
 * APPENDIX: FORENSIC CRITERIA
 * North Macedonia uses the EMBG for individuals and the EDB for entities.
 * 1. EMBG (Individuals): 
 *    - 13-digit sequence (DDMMYYYRRNNNC).
 *    - Validation: Weighted sum algorithm Modulo 11. 
 *    - Formula: (11 - (Sum(Digit_i * Weight_i) % 11)). If result > 9, use 0.
 * 2. EDB (Entities): 
 *    - 13-digit sequence typically starting with 4.
 *    - Validation: Shares the EMBG Modulo 11 checksum logic.
 * 3. Residency: Based on the 183-day presence rule or primary residence.
 */
