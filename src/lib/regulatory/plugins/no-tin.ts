import { HolderMetadata, TinValidationResult, CountryRegulatoryInfo, TinInfo, TinRequirement } from './index';

/**
 * TIN Validation for Norway (NO)
 * Individual: F-number / D-number (11 digits)
 * Entity: Organisation Number (9 digits)
 */

/**
 * TIN Requirements for Norway
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
 * Country Metadata for Norway
 */
export const COUNTRY_INFO: CountryRegulatoryInfo = {
    name: 'Noruega',
    authority: 'Norwegian Tax Administration (Skatteetaten)',
    compliance: {
        crsStatus: 'Participating',
        crsDate: 'September 2017',
        fatcaStatus: 'Model 1 (In Force)'
    },
    residency: {
        individual: 'Se considera residente si permanece en Noruega durante más de 183 días en un periodo de 12 meses, o más de 270 días en 36 meses.',
        entity: 'Se considera residente si tiene su sede legal en Noruega o si su gestión central se encuentra allí.',
        notes: 'Criterio de permanencia física o gestión central.'
    }
};

/**
 * TIN Metadata for Norway (Era 6.3)
 */
export const TIN_INFO: TinInfo = {
    name: 'F-number / Org-nr',
    description: 'Norwegian F-number/D-number (Individuals) or Organisation Number (Entities) issued by Skatteetaten.',
    placeholder: '010180 12345 / 123 456 789',
    officialLink: 'https://www.skatteetaten.no',
    isOfficial: true,
    lastUpdated: '2026-04-24',
    source: 'OECD Portal / Skatteetaten',
    entityDifferentiation: {
        logic: 'Number length analysis.',
        individualDescription: '11-digit F-number or D-number.',
        businessDescription: '9-digit Organisation Number.'
    }
};

/**
 * Norway TIN Validator - Era 6.3
 */
export const validateNOTIN = (
    value: string, 
    type: 'INDIVIDUAL' | 'ENTITY' | 'ANY' = 'ANY', 
    metadata?: HolderMetadata
): TinValidationResult => {
    const sanitized = value.replace(/[\s-]/g, '');

    // Individual (F-number): 11 digits
    if (sanitized.length === 11 && /^[0-9]{11}$/.test(sanitized)) {
        if (type === 'ENTITY') {
            return { 
                isValid: false, 
                status: 'MISMATCH', 
                reasonCode: 'ENTITY_TYPE_MISMATCH',
                explanation: 'The detected format (11 digits) corresponds to a Norwegian F-number/D-number, which is exclusive to individuals.'
            };
        }
        
        const isOfficial = validateNorwayChecksum(sanitized);
        if (isOfficial && metadata) {
            const mismatchFields: string[] = [];

            // Birth Date Check (DDMMYY)
            if (metadata.birthDate) {
                const dob = new Date(metadata.birthDate);
                const firstDigit = parseInt(sanitized[0]);
                const isDNumber = firstDigit >= 4;
                let day = parseInt(sanitized.substring(0, 2));
                if (isDNumber) day -= 40;
                
                const mm = parseInt(sanitized.substring(2, 4));
                const yy = parseInt(sanitized.substring(4, 6));

                if (day !== dob.getDate() || mm !== (dob.getMonth() + 1) || yy !== (dob.getFullYear() % 100)) {
                    mismatchFields.push('birthDate');
                }
            }

            // Gender Check (9th digit: Even = Female, Odd = Male)
            if (metadata.gender) {
                const genderDigit = parseInt(sanitized[8]);
                const isFemale = genderDigit % 2 === 0;
                if ((metadata.gender === 'F' && !isFemale) || (metadata.gender === 'M' && isFemale)) {
                    mismatchFields.push('gender');
                }
            }

            if (mismatchFields.length > 0) {
                return {
                    isValid: false,
                    status: 'MISMATCH',
                    reasonCode: 'ID_DATA_INCONSISTENT',
                    mismatchFields,
                    explanation: `Inconsistency in ${mismatchFields.join(', ')} with Norwegian identifier structure.`
                };
            }
        }

        return { 
            isValid: true, 
            status: isOfficial ? 'VALID' : 'VALID_UNOFFICIAL', 
            isOfficialMatch: isOfficial, 
            explanation: type === 'ANY'
                ? 'Format valid for Individuals (F-number/D-number). Note: This identifier is not valid for legal Entities.'
                : decodeNorwayTIN(sanitized) 
        };
    }

    // Business (Org-nr): 9 digits
    if (sanitized.length === 9 && /^[0-9]{9}$/.test(sanitized)) {
        if (type === 'INDIVIDUAL') {
            return { 
                isValid: false, 
                status: 'MISMATCH', 
                reasonCode: 'ENTITY_TYPE_MISMATCH',
                explanation: 'The detected format (9 digits) corresponds to a Norwegian Organisation Number, which applies only to entities.'
            };
        }
        const isOfficial = validateOrgChecksum(sanitized);
        return { 
            isValid: true, 
            status: isOfficial ? 'VALID' : 'VALID_UNOFFICIAL', 
            isOfficialMatch: isOfficial, 
            explanation: type === 'ANY'
                ? 'Format valid for Entities (Organisation Number). Note: This format is invalid if the holder is an Individual.'
                : `Matches official Norwegian Organisation Number (9 digits) format. ${isOfficial ? 'Verified via checksum.' : 'Pattern match.'}` 
        };
    }

    return { 
        isValid: false, 
        status: 'INVALID_FORMAT',
        explanation: 'Value does not match Norwegian F-number (11 digits) or Org-nr (9 digits) format.'
    };
};

function decodeNorwayTIN(tin: string): string {
    const firstDigit = parseInt(tin[0]);
    const isDNumber = firstDigit >= 4;
    let day = parseInt(tin.substring(0, 2));
    if (isDNumber) day -= 40;
    
    const mm = tin.substring(2, 4);
    const yy = tin.substring(4, 6);
    const genderDigit = parseInt(tin[8]);
    const gender = genderDigit % 2 === 0 ? 'Female' : 'Male';
    
    return `${isDNumber ? 'D-number' : 'F-number'} (${gender}), born on ${day.toString().padStart(2, '0')}/${mm}/${yy}. Verified via checksum.`;
}

function validateNorwayChecksum(tin: string): boolean {
    const k1Weights = [3, 7, 6, 1, 8, 9, 4, 5, 2];
    const k2Weights = [5, 4, 3, 2, 7, 6, 5, 4, 3, 2];
    
    let sum1 = 0;
    for (let i = 0; i < 9; i++) sum1 += parseInt(tin[i]) * k1Weights[i];
    let k1 = 11 - (sum1 % 11);
    if (k1 === 11) k1 = 0;
    if (k1 === 10 || k1 !== parseInt(tin[9])) return false;
    
    let sum2 = 0;
    for (let i = 0; i < 10; i++) sum2 += parseInt(tin[i]) * k2Weights[i];
    let k2 = 11 - (sum2 % 11);
    if (k2 === 11) k2 = 0;
    if (k2 === 10 || k2 !== parseInt(tin[10])) return false;
    
    return true;
}

function validateOrgChecksum(tin: string): boolean {
    const weights = [3, 2, 7, 6, 5, 4, 3, 2];
    let sum = 0;
    for (let i = 0; i < 8; i++) sum += parseInt(tin[i]) * weights[i];
    const remainder = sum % 11;
    let checkDigit = 11 - remainder;
    if (checkDigit === 11) checkDigit = 0;
    return checkDigit === parseInt(tin[8]);
}

/**
 * APPENDIX: FORENSIC CRITERIA
 * Norway uses the F-number/D-number for individuals and Org.nr for entities.
 * 1. F-number (Born in Norway): 
 *    - 11-digit sequence (DDMMYY NNN CC).
 *    - Validation: Double Modulo 11 checksum (K1 and K2 control digits).
 * 2. D-number (Foreigners): 
 *    - 11-digit sequence starting with Day + 40.
 *    - Validation: Shares the F-number checksum logic.
 * 3. Organisation Number (9 digits):
 *    - Validation: Weighted sum algorithm Modulo 11.
 * 4. Residency: Based on 183-day (12 months) or 270-day (36 months) presence.
 * 5. Scope: Managed by the Skatteetaten and Brønnøysundregistrene.
 */
