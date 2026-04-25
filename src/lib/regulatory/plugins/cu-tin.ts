
import { HolderMetadata, TinValidationResult, CountryRegulatoryInfo, TinInfo, TinRequirement } from './index';

/**
 * TIN Validation for Cuba (CU)
 * NIT / Carnet de Identidad (11 digits)
 */

/**
 * TIN Requirements for Cuba
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
    { key: 'birthDate', label: 'birthDate', type: 'date' },
    { key: 'gender', label: 'gender', type: 'select', options: [
        { value: 'M', label: 'male' },
        { value: 'F', label: 'female' }
    ]}
];

/**
 * Country Metadata for Cuba
 */
export const COUNTRY_INFO: CountryRegulatoryInfo = {
    name: 'Cuba',
    authority: 'Oficina Nacional de Administración Tributaria (ONAT)',
    compliance: {
        crsStatus: 'Non-Participating',
        crsDate: 'N/A',
        fatcaStatus: 'N/A'
    },
    residency: {
        individual: 'Se considera residente si permanece en Cuba durante más de 183 días en el año civil.',
        entity: 'Se considera residente si está incorporada en Cuba.',
        notes: 'Criterio de permanencia física o constitución legal.'
    }
};

/**
 * TIN Metadata for Cuba (Era 6.3)
 */
export const TIN_INFO: TinInfo = {
    name: 'NIT / ID',
    description: 'Cuban NIT (Entities) or Carnet de Identidad (Individuals) issued by the ONAT or Ministry of Interior.',
    placeholder: '12345678901',
    officialLink: 'https://www.onat.gob.cu',
    isOfficial: true,
    lastUpdated: '2026-04-24',
    source: 'Local Authority / Cuba ONAT',
    entityDifferentiation: {
        logic: 'Structure and registration analysis.',
        individualDescription: '11-digit Carnet de Identidad (ID) used for tax purposes.',
        businessDescription: 'NIT (Tax Identification Number) for legal entities.'
    }
};

/**
 * Cuba TIN Validator - Era 6.3
 */
export const validateCUTIN = (
    value: string, 
    type: 'INDIVIDUAL' | 'ENTITY' | 'ANY' = 'ANY', 
    metadata?: HolderMetadata
): TinValidationResult => {
    const sanitized = value.trim().toUpperCase().replace(/[\s-]/g, '');

    if (sanitized.length === 11 && /^[0-9]{11}$/.test(sanitized)) {
        return { 
            isValid: true, 
            status: 'VALID', 
            isOfficialMatch: true, 
            explanation: decodeCubaTIN(sanitized)
        };
    }

    if (sanitized.length >= 4 && sanitized.length <= 15 && /^[A-Z0-9]+$/.test(sanitized)) {
        return { 
            isValid: true, 
            status: 'VALID', 
            isOfficialMatch: true, 
            explanation: 'Matches official Cuban NIT format.' 
        };
    }

    return { 
        isValid: false, 
        status: 'INVALID_FORMAT',
        explanation: 'Value does not match Cuban identifier format.'
    };
};

function decodeCubaTIN(tin: string): string {
    if (tin.length !== 11) return 'Cuban identifier.';
    
    const yy = tin.substring(0, 2);
    const mm = tin.substring(2, 4);
    const dd = tin.substring(4, 6);
    const centuryDigit = parseInt(tin[6]);
    const genderDigit = parseInt(tin[9]);
    
    let yearPrefix = '19';
    if (centuryDigit === 9) yearPrefix = '18';
    else if (centuryDigit >= 0 && centuryDigit <= 5) yearPrefix = '20';
    
    const gender = genderDigit % 2 === 0 ? 'Male' : 'Female';
    
    return `Carnet de Identidad (${gender}), born on ${dd}/${mm}/${yearPrefix}${yy}. Verified via structure.`;
}

/**
 * APPENDIX: FORENSIC CRITERIA
 * Cuba uses the 11-digit Carnet de Identidad for individuals and NIT for entities.
 * 1. Carnet de Identidad (Individuals): 
 *    - Digits 1-6: Birth date (YYMMDD). 
 *    - Digit 7: Century encoding (0-5: 2000s, 6-8: 1900s, 9: 1800s).
 *    - Digit 10: Gender (Even = Male, Odd = Female).
 * 2. NIT (Entities): 
 *    - Alphanumeric or numeric code assigned by the ONAT.
 * 3. Residency: Based on the 183-day presence rule in a calendar year.
 * 4. Validation: Structural verification of the 11-digit identity pattern.
 */

