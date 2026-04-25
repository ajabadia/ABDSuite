import { HolderMetadata, TinValidationResult, CountryRegulatoryInfo, TinInfo, TinRequirement } from './index';

/**
 * TIN Validation for Finland (FI)
 * HETU (11 characters: DDMMYY-XXXX)
 * Business ID (8 or 9 digits)
 */

/**
 * TIN Requirements for Finland
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
 * Country Metadata for Finland
 */
export const COUNTRY_INFO: CountryRegulatoryInfo = {
    name: 'Finlandia',
    authority: 'Finnish Tax Administration (Vero Skatt)',
    compliance: {
        crsStatus: 'Participating',
        crsDate: 'September 2017',
        fatcaStatus: 'Model 1 (In Force)'
    },
    residency: {
        individual: 'Se considera residente si tiene su residencia principal en Finlandia o si permanece allí durante más de 6 meses.',
        entity: 'Se considera residente si está incorporada en Finlandia o si tiene su sede administrativa efectiva allí.',
        notes: 'Criterio de residencia principal o estancia de 6 meses.'
    }
};

/**
 * TIN Metadata for Finland (Era 6.3)
 */
export const TIN_INFO: TinInfo = {
    name: 'HETU / Business ID',
    description: 'Finnish HETU (Individuals) or Business ID (Entities) issued by the Digital and Population Data Services Agency or Vero Skatt.',
    placeholder: '010180-123X / 1234567-8',
    officialLink: 'https://www.vero.fi',
    isOfficial: true,
    lastUpdated: '2026-04-24',
    source: 'OECD Portal / Vero Skatt',
    entityDifferentiation: {
        logic: 'Structure and characters analysis.',
        individualDescription: 'HETU of 11 characters (including birth date and separator).',
        businessDescription: 'Business ID of 8 digits (often displayed as XXXXXXX-X).'
    }
};

/**
 * Finland TIN Validator - Era 6.3
 */
export const validateFITIN = (
    value: string, 
    type: 'INDIVIDUAL' | 'ENTITY' | 'ANY' = 'ANY', 
    metadata?: HolderMetadata
): TinValidationResult => {
    const sanitized = value.trim().toUpperCase();

    // HETU: 11 characters
    if (sanitized.length === 11 && /^[0-9]{6}[-+ABCDEFYXUWV][0-9]{3}[0-9A-Z]$/.test(sanitized)) {
        if (type === 'ENTITY') {
            return { 
                isValid: false, 
                status: 'MISMATCH', 
                reasonCode: 'ENTITY_TYPE_MISMATCH',
                explanation: 'The detected format (11 characters) corresponds to a Finnish HETU, exclusive to individuals.'
            };
        }
        
        if (validateHETUChecksum(sanitized)) {
            // High-Fidelity Semantic Check (Era 6.3)
            if (metadata) {
                const dd = sanitized.substring(0, 2);
                const mm = sanitized.substring(2, 4);
                const yy = sanitized.substring(4, 6);
                const individualPart = parseInt(sanitized.substring(7, 10));
                
                if (metadata.birthDate) {
                    const bDate = new Date(metadata.birthDate);
                    const bDay = String(bDate.getDate()).padStart(2, '0');
                    const bMonth = String(bDate.getMonth() + 1).padStart(2, '0');
                    const bYearShort = String(bDate.getFullYear()).substring(2);
                    
                    if (dd !== bDay || mm !== bMonth || yy !== bYearShort) {
                        return { 
                            isValid: false, 
                            status: 'MISMATCH', 
                            reasonCode: 'METADATA_MISMATCH',
                            explanation: `HETU birth date part (${dd}${mm}${yy}) does not match provided birth date (${bDay}${bMonth}${bYearShort}).`
                        };
                    }
                }
                
                if (metadata.gender) {
                    const expectedEven = metadata.gender === 'F';
                    const isEven = individualPart % 2 === 0;
                    if (expectedEven !== isEven) {
                        return { 
                            isValid: false, 
                            status: 'MISMATCH', 
                            reasonCode: 'METADATA_MISMATCH',
                            explanation: `HETU individual part (${individualPart}) implies ${isEven ? 'Female' : 'Male'}, but metadata specifies ${metadata.gender === 'F' ? 'Female' : 'Male'}.`
                        };
                    }
                }
            }

            const explanation = decodeFinlandTIN(sanitized);
            return { 
                isValid: true, 
                status: 'VALID', 
                isOfficialMatch: true, 
                explanation: type === 'ANY'
                    ? 'Format valid for Individuals (HETU). Note: This identifier is not valid for legal Entities.'
                    : explanation
            };
        } else {
            return { isValid: false, status: 'INVALID_CHECKSUM', explanation: 'Failed Finnish HETU checksum validation.' };
        }
    }

    // Business ID: 8 digits (excluding hyphen) or 9 digits (including hyphen)
    const cleanBusinessID = sanitized.replace(/-/g, '');
    if (cleanBusinessID.length === 8 && /^[0-9]{8}$/.test(cleanBusinessID)) {
        if (type === 'INDIVIDUAL') {
            return { 
                isValid: false, 
                status: 'MISMATCH', 
                reasonCode: 'ENTITY_TYPE_MISMATCH',
                explanation: 'The detected format (8 digits) corresponds to a Finnish Business ID, which applies only to entities.'
            };
        }
        return { 
            isValid: true, 
            status: 'VALID', 
            isOfficialMatch: true, 
            explanation: type === 'ANY'
                ? 'Format valid for Entities (Business ID). Note: This format is invalid if the holder is an Individual.'
                : 'Matches official Finnish Business ID (8 digits) format.' 
        };
    }

    return { 
        isValid: false, 
        status: 'INVALID_FORMAT',
        explanation: 'Value does not match Finnish HETU (11 chars) or Business ID (8 digits) format.'
    };
};

function decodeFinlandTIN(tin: string): string {
    const dd = tin.substring(0, 2);
    const mm = tin.substring(2, 4);
    const yy = tin.substring(4, 6);
    const separator = tin[6];
    
    let century = '19';
    if (separator === '+') century = '18';
    else if (separator === '-') century = '19';
    else if (separator === 'A') century = '20';
    else if (['B','C','D','E','F'].includes(separator)) century = '20'; // Modern separators
    else if (['Y','X','U','W','V'].includes(separator)) century = '20'; // Future/New separators
    
    const individualPart = parseInt(tin.substring(7, 10));
    const gender = individualPart % 2 === 0 ? 'Female' : 'Male';
    
    return `Finnish HETU (${gender}), born on ${dd}/${mm}/${century}${yy}. [Century separator: ${separator}].`;
}

function validateHETUChecksum(hetu: string): boolean {
    const base = hetu.substring(0, 6) + hetu.substring(7, 10);
    const checkMap = '0123456789ABCDEFHJKLMNPRSTUVWXY';
    const remainder = parseInt(base) % 31;
    return checkMap[remainder] === hetu[10];
}

/**
 * APPENDIX: FORENSIC CRITERIA
 * Finland uses the Personal Identity Code (HETU) for individuals and Business ID for entities.
 * 1. HETU (11 characters): 
 *    - Format: DDMMYYXSSSC. 
 *    - Century Separator (X): 
 *      '+' for 1800s, '-' for 1900s, 'A' to 'F' for 2000s (temporary/modern), 
 *      'Y', 'X', 'U', 'W', 'V' (future).
 *    - SSS (Sequential): Odd for males, Even for females. 
 *    - C (Check Character): Calculated using the remainder of (DDMMYYSSS % 31).
 * 2. Business ID (Y-tunnus): 
 *    - 8-digit numeric code (XXXXXXX-X). 
 * 3. Residency: Based on domicile or physical stay exceeding 6 months.
 * 4. Validation: Structural verification and Modulo 31 checksum for HETU.
 */
