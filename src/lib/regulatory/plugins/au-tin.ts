
import { HolderMetadata, TinValidationResult, CountryRegulatoryInfo, TinInfo, TinRequirement } from './index';

/**
 * TIN Validation for Australia (AU)
 * TFN (8 or 9 digits)
 * ABN (11 digits)
 */

/**
 * TIN Requirements for Australia
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
 * Country Metadata for Australia
 */
export const COUNTRY_INFO: CountryRegulatoryInfo = {
    name: 'Australia',
    authority: 'Australian Taxation Office (ATO)',
    compliance: {
        crsStatus: 'Participating',
        crsDate: 'September 2017',
        fatcaStatus: 'Model 1 (In Force)'
    },
    residency: {
        individual: 'Se considera residente si cumple la prueba de residencia (resides test), la prueba de domicilio (domicile test) o la prueba de 183 días, a menos que su hogar habitual esté fuera de Australia.',
        entity: 'Se considera residente si está incorporada en Australia, o si realiza negocios en Australia y tiene allí su gestión central y control.',
        notes: 'Criterio de residencia habitual o gestión central.'
    }
};

/**
 * TIN Metadata for Australia (Era 6.3)
 */
export const TIN_INFO: TinInfo = {
    name: 'TFN / ABN',
    description: 'Australian Tax File Number (TFN) or Business Number (ABN) issued by the ATO.',
    placeholder: '123 456 789 / 12 345 678 901',
    officialLink: 'https://www.ato.gov.au',
    isOfficial: true,
    lastUpdated: '2026-04-24',
    source: 'OECD Portal / ATO',
    entityDifferentiation: {
        logic: 'Identifier length.',
        individualDescription: 'Tax File Number (TFN) of 8 or 9 digits for individuals.',
        businessDescription: 'Australian Business Number (ABN) of 11 digits for entities.'
    }
};

/**
 * Australia TIN Validator - Era 6.3
 */
export const validateAUTIN = (
    value: string, 
    type: 'INDIVIDUAL' | 'ENTITY' | 'ANY' = 'ANY', 
    metadata?: HolderMetadata
): TinValidationResult => {
    const sanitized = value.replace(/[\s-]/g, '');

    // TFN: 8 or 9 digits
    if ((sanitized.length === 8 || sanitized.length === 9) && /^[0-9]+$/.test(sanitized)) {
        
        // 1. Mismatch Block (Only for the impossible case)
        if (type === 'ENTITY' && sanitized.length === 8) {
            return { 
                isValid: false, 
                status: 'MISMATCH', 
                reasonCode: 'ENTITY_TYPE_MISMATCH',
                explanation: 'The detected format (8 digits) corresponds to an Australian TFN for individuals.'
            };
        }
        
        // 2. Success Block (For Individual, ANY or 9-digit Entity)
        return { 
            isValid: true, 
            status: 'VALID', 
            isOfficialMatch: true, 
            explanation: type === 'ANY'
                ? (sanitized.length === 8 
                    ? 'TIN validated successfully for individuals (8-digit TFN). Not valid for entities.'
                    : 'TIN validated successfully (9-digit TFN). Usually assigned to individuals.')
                : 'Matches official Australian TFN format.' 
        };
    }

    // ABN: 11 digits
    if (sanitized.length === 11 && /^[0-9]{11}$/.test(sanitized)) {
        if (type === 'INDIVIDUAL') {
            return { 
                isValid: false, 
                status: 'MISMATCH', 
                reasonCode: 'ENTITY_TYPE_MISMATCH',
                explanation: 'The detected format (11 digits) corresponds to an Australian Business Number (ABN), which is exclusive to entities.'
            };
        }
        return { 
            isValid: true, 
            status: 'VALID', 
            isOfficialMatch: true, 
            explanation: type === 'ANY'
                ? 'Format valid for Entities (ABN). Note: This identifier is not valid for Individuals.'
                : 'Matches official Australian ABN format.' 
        };
    }

    return { 
        isValid: false, 
        status: 'INVALID_FORMAT',
        explanation: 'Value does not match Australian TFN (8/9 digits) or ABN (11 digits) format.'
    };
};

/**
 * APPENDIX: FORENSIC CRITERIA
 * Australia uses TFN for personal tax and ABN for business identification.
 * 1. TFN (Tax File Number): 8 or 9 digits. Issued to individuals, companies, 
 *    trusts, etc. Validation involves a weighted sum Modulo 11 check.
 * 2. ABN (Australian Business Number): 11 digits. First 2 digits are check digits 
 *    derived from the following 9. 
 * 3. Calculation: (ABN[0]-1)*10 + ABN[1]*1 + ABN[2]*3 + ... weighted sum Modulo 89.
 * 4. Residency: Multi-test approach (resides, domicile, 183-day, superannuation).
 */

