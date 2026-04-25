import { HolderMetadata, TinValidationResult, CountryRegulatoryInfo, TinInfo, TinRequirement } from './index';

/**
 * TIN Validation for Costa Rica (CR)
 * Cédula de Identidad (9 digits)
 * Cédula Jurídica (10 digits)
 */

/**
 * TIN Requirements for Costa Rica
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
    { 
        key: 'birthPlaceCode', 
        label: 'province', 
        type: 'select', 
        scope: 'INDIVIDUAL',
        options: [
            { value: '1', label: 'San José' },
            { value: '2', label: 'Alajuela' },
            { value: '3', label: 'Cartago' },
            { value: '4', label: 'Heredia' },
            { value: '5', label: 'Guanacaste' },
            { value: '6', label: 'Puntarenas' },
            { value: '7', label: 'Limón' },
            { value: '8', label: 'Foreign Resident (DIMEX)' },
            { value: '9', label: 'Special Cases / Born Abroad' }
        ]
    }
];

/**
 * Country Metadata for Costa Rica
 */
export const COUNTRY_INFO: CountryRegulatoryInfo = {
    name: 'Costa Rica',
    authority: 'Ministerio de Hacienda (Dirección General de Tributación)',
    compliance: {
        crsStatus: 'Participating',
        crsDate: 'September 2018',
        fatcaStatus: 'Model 1 (In Force)'
    },
    residency: {
        individual: 'Se considera residente si permanece en Costa Rica durante más de 183 días en el año fiscal.',
        entity: 'Se considera residente si está incorporada en Costa Rica.',
        notes: 'Criterio de permanencia física o constitución legal.'
    }
};

/**
 * TIN Metadata for Costa Rica (Era 6.4)
 */
export const TIN_INFO: TinInfo = {
    name: 'Cédula',
    description: 'Costa Rican Cédula de Identidad (Individuals) or Cédula Jurídica (Entities) issued by the TSE or Registry.',
    placeholder: '1-2345-6789 / 3-101-234567',
    officialLink: 'https://www.hacienda.go.cr',
    isOfficial: true,
    lastUpdated: '2026-04-24',
    source: 'Local Authority / Costa Rica Tax',
    entityDifferentiation: {
        logic: 'Number length analysis.',
        individualDescription: '9-digit Cédula de Identidad.',
        businessDescription: '10-digit Cédula Jurídica.'
    }
};

/**
 * Costa Rica TIN Validator - Era 6.4
 */
export const validateCRTIN = (
    value: string, 
    type: 'INDIVIDUAL' | 'ENTITY' | 'ANY' = 'ANY', 
    metadata?: HolderMetadata
): TinValidationResult => {
    const sanitized = value.replace(/[\s-]/g, '');

    // Individual (Cédula de Identidad): 9 digits
    if (sanitized.length === 9 && /^[0-9]{9}$/.test(sanitized)) {
        if (type === 'ENTITY') {
             return { isValid: false, status: 'MISMATCH', reasonCode: 'ENTITY_TYPE_MISMATCH' };
        }

        if (metadata?.birthPlaceCode && sanitized[0] !== metadata.birthPlaceCode) {
            return {
                isValid: false,
                status: 'MISMATCH',
                reasonCode: 'ID_DATA_INCONSISTENT',
                mismatchFields: ['birthPlaceCode'],
                explanation: `Cédula province digit (${sanitized[0]}) does not match provided province (${metadata.birthPlaceCode}).`
            };
        }

        return { 
            isValid: true, 
            status: 'VALID', 
            isOfficialMatch: true, 
            explanation: type === 'ANY'
                ? 'Format valid for Individuals (Cédula). Note: This identifier is not valid for legal Entities.'
                : decodeCostaRicaTIN(sanitized)
        };
    }

    // Business (Cédula Jurídica): 10 digits
    if (sanitized.length === 10 && /^[0-9]{10}$/.test(sanitized)) {
        if (type === 'INDIVIDUAL') {
             return { isValid: false, status: 'MISMATCH', reasonCode: 'ENTITY_TYPE_MISMATCH' };
        }
        return { 
            isValid: true, 
            status: 'VALID', 
            isOfficialMatch: true, 
            explanation: type === 'ANY'
                ? 'Format valid for Entities (Cédula Jurídica). Note: This format is invalid if the holder is an Individual.'
                : decodeCostaRicaTIN(sanitized)
        };
    }

    return { 
        isValid: false, 
        status: 'INVALID_FORMAT',
        explanation: 'Value does not match Costa Rican Cédula (9 digits) or Cédula Jurídica (10 digits) format.'
    };
};

function decodeCostaRicaTIN(tin: string): string {
    if (tin.length === 9) {
        const prefix = tin[0];
        const provinces: Record<string, string> = {
            '1': 'San José', '2': 'Alajuela', '3': 'Cartago', '4': 'Heredia',
            '5': 'Guanacaste', '6': 'Puntarenas', '7': 'Limón',
            '8': 'Foreign Resident (DIMEX)', '9': 'Special Cases'
        };
        const province = provinces[prefix] || `Region ${prefix}`;
        return `Cédula de Identidad, issued in ${province}. Verified via format.`;
    }
    
    if (tin.length === 10) {
        const classDigit = tin[2];
        const classes: Record<string, string> = {
            '0': 'Commercial (SA/SRL)',
            '1': 'Sociedad Anónima',
            '2': 'Sociedad de Responsabilidad Limitada',
            '7': 'Foreign Entity'
        };
        const entityClass = classes[classDigit] || 'Other Legal Entity';
        return `Cédula Jurídica, Class: ${entityClass}. Verified via format.`;
    }
    
    return 'Matches official Costa Rican Cédula format.';
}

/**
 * APPENDIX: FORENSIC CRITERIA
 * Costa Rica uses a 9-digit system for individuals and a 10-digit system for entities.
 * 1. Cédula de Identidad (9 digits):
 *    - Digit 1: Province of registration (1: San José, 2: Alajuela, etc.). 
 *    - Digit 1 = '8': Foreigners with residency (DIMEX). 
 *    - Digit 1 = '9': Born abroad or special cases.
 * 2. Cédula Jurídica (10 digits): 
 *    - Format: X-XXX-XXXXXX. 
 *    - First Digit: Usually '3' for most legal entities. 
 *    - Class Digit (3rd digit): Defines the type (01: SA, 02: SRL, 07: Foreign).
 * 3. Residency: Based on the 183-day presence rule in a fiscal year.
 */

