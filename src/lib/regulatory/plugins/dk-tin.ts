import { HolderMetadata, TinValidationResult, CountryRegulatoryInfo, TinInfo, TinRequirement } from './index';

/**
 * TIN Validation for Denmark (DK)
 * CPR (10 digits: DDMMYYXXXX)
 * CVR (8 digits)
 */

/**
 * TIN Requirements for Denmark
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
 * Country Metadata for Denmark
 */
export const COUNTRY_INFO: CountryRegulatoryInfo = {
    name: 'Dinamarca',
    authority: 'Danish Tax Agency (Skattestyrelsen)',
    compliance: {
        crsStatus: 'Participating',
        crsDate: 'September 2017',
        fatcaStatus: 'Model 1 (In Force)'
    },
    residency: {
        individual: 'Se considera residente si tiene domicilio en Dinamarca o si permanece más de 6 meses consecutivos.',
        entity: 'Se considera residente si está incorporada en Dinamarca o si su gestión central y control se encuentran allí.',
        notes: 'Criterio de domicilio o estancia de 6 meses.'
    }
};

/**
 * TIN Metadata for Denmark (Era 6.3)
 */
export const TIN_INFO: TinInfo = {
    name: 'CPR / CVR',
    description: 'Danish CPR (Individuals) or CVR (Entities) issued by the Danish Tax Agency.',
    placeholder: '010180-1234 / 12345678',
    officialLink: 'https://skat.dk',
    isOfficial: true,
    lastUpdated: '2026-04-24',
    source: 'OECD Portal / SKAT',
    entityDifferentiation: {
        logic: 'Number length analysis.',
        individualDescription: 'CPR number of 10 digits (including birth date).',
        businessDescription: 'CVR number of 8 digits.'
    }
};

/**
 * Denmark TIN Validator - Era 6.3
 */
export const validateDKTIN = (
    value: string, 
    type: 'INDIVIDUAL' | 'ENTITY' | 'ANY' = 'ANY', 
    metadata?: HolderMetadata
): TinValidationResult => {
    const sanitized = value.replace(/[\s-]/g, '');

    // Individual (CPR): 10 digits
    if (sanitized.length === 10 && /^[0-9]{10}$/.test(sanitized)) {
        if (type === 'ENTITY') {
            return { 
                isValid: false, 
                status: 'MISMATCH', 
                reasonCode: 'ENTITY_TYPE_MISMATCH',
                explanation: 'The detected format (10 digits) corresponds to a Danish CPR number, which is exclusive to individuals.'
            };
        }
        
        const isOfficial = validateCPRChecksum(sanitized);

        // High-Fidelity Semantic Check (Era 6.3)
        if (metadata) {
            const dd = sanitized.substring(0, 2);
            const mm = sanitized.substring(2, 4);
            const yy = sanitized.substring(4, 6);
            const lastDigit = parseInt(sanitized[9]);
            
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
                        explanation: `CPR birth date part (${dd}${mm}${yy}) does not match provided birth date (${bDay}${bMonth}${bYearShort}).`
                    };
                }
            }
            
            if (metadata.gender) {
                const expectedEven = metadata.gender === 'F';
                const isEven = lastDigit % 2 === 0;
                if (expectedEven !== isEven) {
                    return { 
                        isValid: false, 
                        status: 'MISMATCH', 
                        reasonCode: 'METADATA_MISMATCH',
                        explanation: `CPR gender digit (${lastDigit}) implies ${isEven ? 'Female' : 'Male'}, but metadata specifies ${metadata.gender === 'F' ? 'Female' : 'Male'}.`
                    };
                }
            }
        }

        return { 
            isValid: true, 
            status: isOfficial ? 'VALID' : 'VALID_UNOFFICIAL', 
            isOfficialMatch: isOfficial, 
            explanation: type === 'ANY'
                ? 'Format valid for Individuals (CPR). Note: This identifier is not valid for legal Entities.'
                : decodeDenmarkTIN(sanitized)
        };
    }

    // Business (CVR): 8 digits
    if (sanitized.length === 8 && /^[0-9]{8}$/.test(sanitized)) {
        if (type === 'INDIVIDUAL') {
            return { 
                isValid: false, 
                status: 'MISMATCH', 
                reasonCode: 'ENTITY_TYPE_MISMATCH',
                explanation: 'The detected format (8 digits) corresponds to a Danish CVR number, which applies only to entities.'
            };
        }
        return { 
            isValid: true, 
            status: 'VALID', 
            isOfficialMatch: true, 
            explanation: type === 'ANY'
                ? 'Format valid for Entities (CVR). Note: This format is invalid if the holder is an Individual.'
                : 'Matches official Danish CVR (8 digits) format.' 
        };
    }

    return { 
        isValid: false, 
        status: 'INVALID_FORMAT',
        explanation: 'Value does not match Danish CPR (10 digits) or CVR (8 digits) format.'
    };
};

function decodeDenmarkTIN(tin: string): string {
    const dd = tin.substring(0, 2);
    const mm = tin.substring(2, 4);
    const yy = tin.substring(4, 6);
    const seventhDigit = parseInt(tin[6]);
    const lastDigit = parseInt(tin[9]);
    
    // Century logic based on 7th digit
    let century = '19';
    if ([0, 1, 2, 3].includes(seventhDigit)) century = '19';
    else if (seventhDigit === 4 || (seventhDigit === 9 && parseInt(yy) <= 36)) century = '20';
    else if ([5, 6, 7, 8].includes(seventhDigit)) {
        century = parseInt(yy) <= 57 ? '20' : '18';
    }
    
    const gender = lastDigit % 2 === 0 ? 'Female' : 'Male';
    return `CPR (${gender}), born on ${dd}/${mm}/${century}${yy}.`;
}

function validateCPRChecksum(tin: string): boolean {
    const weights = [4, 3, 2, 7, 6, 5, 4, 3, 2, 1];
    let sum = 0;
    for (let i = 0; i < 10; i++) sum += parseInt(tin[i]) * weights[i];
    return sum % 11 === 0;
}

/**
 * APPENDIX: FORENSIC CRITERIA
 * Denmark uses the CPR (Central Person Register) for individuals and CVR for entities.
 * 1. CPR Number (10 digits): 
 *    - Format: DDMMYY-XXXX. 
 *    - Century logic: Determined by the 7th digit (encoding 1800s, 1900s, 2000s). 
 *    - Gender: The 10th digit is even for females and odd for males.
 *    - Validation: Weighted sum algorithm Modulo 11 (Note: New CPR numbers may 
 *      skip the Modulo 11 check since 2007).
 * 2. CVR Number (8 digits): 
 *    - Mandatory for all businesses in Denmark. 
 * 3. Residency: Based on domicile or consecutive stay of more than 6 months.
 */
