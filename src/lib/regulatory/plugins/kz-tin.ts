
import { HolderMetadata, TinValidationResult, CountryRegulatoryInfo, TinInfo, TinRequirement } from './index';

/**
 * TIN Validation for Kazakhstan (KZ)
 * Individual: Individual Identification Number (IIN) (12 digits)
 * Entity: Business Identification Number (BIN) (12 digits)
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
 * Country Metadata for Kazakhstan
 */
export const COUNTRY_INFO: CountryRegulatoryInfo = {
    name: 'Kazajistán',
    authority: 'State Revenue Committee',
    compliance: {
        crsStatus: 'Participating',
        crsDate: 'September 2020',
        fatcaStatus: 'Model 1 (In Force)'
    },
    residency: {
        individual: 'Se considera residente si permanece en Kazajistán durante más de 182 días en cualquier periodo de 12 meses consecutivos.',
        entity: 'Se considera residente si está incorporada en Kazajistán o si su gestión central se encuentra allí.',
        notes: 'Criterio de permanencia física o gestión central.'
    }
};

/**
 * TIN Metadata for Kazakhstan (Era 6.3)
 */
export const TIN_INFO: TinInfo = {
    name: 'IIN / BIN',
    description: 'Kazakhstani IIN (Individuals) or BIN (Entities) issued by the State Revenue Committee.',
    placeholder: '123456789012',
    officialLink: 'https://www.kgd.gov.kz',
    isOfficial: true,
    lastUpdated: '2026-04-24',
    source: 'OECD Portal / Kazakhstan KGD',
    entityDifferentiation: {
        logic: 'Prefix analysis.',
        individualDescription: '12-digit Individual Identification Number (IIN).',
        businessDescription: '12-digit Business Identification Number (BIN).'
    }
};

/**
 * Kazakhstan TIN Validator - Era 6.3
 */
export const validateKZTIN = (
    value: string, 
    type: 'INDIVIDUAL' | 'ENTITY' | 'ANY' = 'ANY', 
    metadata?: HolderMetadata
): TinValidationResult => {
    const sanitized = value.replace(/[\s-]/g, '');

    if (sanitized.length === 12 && /^[0-9]{12}$/.test(sanitized)) {
        if (validateIINChecksum(sanitized)) {
            return { 
                isValid: true, 
                status: 'VALID', 
                isOfficialMatch: true, 
                explanation: decodeKazakhstanTIN(sanitized)
            };
        } else {
            return { isValid: false, status: 'INVALID_CHECKSUM', explanation: 'Failed Kazakhstani IIN/BIN checksum validation.' };
        }
    }

    return { 
        isValid: false, 
        status: 'INVALID_FORMAT',
        explanation: 'Value does not match Kazakhstani IIN/BIN (12 digits) format.'
    };
};

function decodeKazakhstanTIN(tin: string): string {
    const yy = tin.substring(0, 2);
    const mm = tin.substring(2, 4);
    const dd = tin.substring(4, 6);
    const s = parseInt(tin[6]);
    
    // 7th digit (S): Century/Gender
    const centuryMap: Record<number, string> = {
        1: '18', 2: '18',
        3: '19', 4: '19',
        5: '20', 6: '20'
    };
    const century = centuryMap[s] || '19';
    const gender = s % 2 === 0 ? 'Female' : 'Male';
    
    // BIN (Entities) often start with year/month, but nature is different. 
    // Usually IIN/BIN are structurally similar but differ in the 5th digit or series.
    // For simplicity, we decode as biological if s is 1-6.
    
    if (s >= 1 && s <= 6) {
        return `Kazakhstani IIN (${gender}), born on ${dd}/${mm}/${century}${yy}. [NOTE: Formula-Identity; legal gender transition requires a new TIN].`;
    }
    
    return `Identification Number (BIN/Other). Verified via checksum.`;
}

function validateIINChecksum(tin: string): boolean {
    const w1 = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
    let sum = 0;
    for (let i = 0; i < 11; i++) sum += parseInt(tin[i]) * w1[i];
    let check = sum % 11;
    
    if (check === 10) {
        const w2 = [3, 4, 5, 6, 7, 8, 9, 10, 11, 1, 2];
        sum = 0;
        for (let i = 0; i < 11; i++) sum += parseInt(tin[i]) * w2[i];
        check = sum % 11;
    }
    
    return check === parseInt(tin[11]);
}
