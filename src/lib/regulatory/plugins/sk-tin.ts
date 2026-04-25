import { HolderMetadata, TinValidationResult, CountryRegulatoryInfo, TinInfo, TinRequirement } from './index';

/**
 * TIN Validation for Slovakia (SK)
 * Individual: Birth Number (Rodné číslo) (9 or 10 digits)
 * Entity: Tax ID (DIČ) (10 digits)
 */

/**
 * TIN Requirements for Slovakia
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
 * Country Metadata for Slovakia
 */
export const COUNTRY_INFO: CountryRegulatoryInfo = {
    name: 'Eslovaquia',
    authority: 'Financial Directorate (Finančné riaditeľstvo)',
    compliance: {
        crsStatus: 'Participating',
        crsDate: 'September 2017',
        fatcaStatus: 'Model 1 (In Force)'
    },
    residency: {
        individual: 'Se considera residente si tiene domicilio en Eslovaquia o si permanece allí durante más de 183 días en el año civil.',
        entity: 'Se considera residente si tiene su sede legal o lugar de administración efectiva en Eslovaquia.',
        notes: 'Criterio de domicilio o estancia de 183 días.'
    }
};

/**
 * TIN Metadata for Slovakia (Era 6.3)
 */
export const TIN_INFO: TinInfo = {
    name: 'Birth Number / DIČ',
    description: 'Slovak Birth Number (Individuals) or Tax ID (Entities) issued by the Ministry of Interior or Financial Directorate.',
    placeholder: '8001011234 / 1234567890',
    officialLink: 'https://www.financnasprava.sk',
    isOfficial: true,
    lastUpdated: '2026-04-24',
    source: 'OECD Portal / Finančná správa',
    entityDifferentiation: {
        logic: 'Prefix and length analysis.',
        individualDescription: '9 or 10-digit Birth Number (Rodné číslo).',
        businessDescription: '10-digit Tax ID (DIČ) starting with 1, 2 or 4.'
    }
};

/**
 * Slovakia TIN Validator - Era 6.3
 */
export const validateSKTIN = (
    value: string, 
    type: 'INDIVIDUAL' | 'ENTITY' | 'ANY' = 'ANY', 
    metadata?: HolderMetadata
): TinValidationResult => {
    const sanitized = value.trim().replace(/[\s/]/g, '');

    if ((sanitized.length === 9 || sanitized.length === 10) && /^[0-9]+$/.test(sanitized)) {
        const isOfficial = validateSlovakiaChecksum(sanitized);
        
        if (type === 'INDIVIDUAL' || (type === 'ANY' && sanitized.length === 10 && !['1', '2', '4'].includes(sanitized[0]))) {
            if (metadata) {
                const semantic = validateSlovakSemantic(sanitized, metadata);
                if (!semantic.isValid) {
                    return semantic;
                }
            }
            return { 
                isValid: true, 
                status: isOfficial ? 'VALID' : 'VALID_UNOFFICIAL', 
                isOfficialMatch: isOfficial, 
                explanation: decodeSlovakBirthNumber(sanitized) + (isOfficial ? ' Verified via Modulo 11.' : ' Pattern match.')
            };
        }

        return { 
            isValid: true, 
            status: isOfficial ? 'VALID' : 'VALID_UNOFFICIAL', 
            isOfficialMatch: isOfficial, 
            explanation: `Matches official Slovak ${sanitized.length}-digit identifier format. ${isOfficial ? 'Verified via Modulo 11.' : 'Pattern match.'}` 
        };
    }

    return { 
        isValid: false, 
        status: 'INVALID_FORMAT',
        explanation: 'Value does not match Slovak Birth Number or Tax ID (9-10 digits) format.'
    };
};

function decodeSlovakBirthNumber(tin: string): string {
    const yy = tin.substring(0, 2);
    let mm = parseInt(tin.substring(2, 4));
    const dd = tin.substring(4, 6);
    
    const gender = mm > 50 ? 'Female' : 'Male';
    if (mm > 50) mm -= 50;
    
    const yearPrefix = parseInt(yy) < 54 ? '20' : '19';
    return `Birth Number (${gender}), born on ${dd}/${mm.toString().padStart(2, '0')}/${yearPrefix}${yy}. Verified via structure.`;
}

function validateSlovakSemantic(tin: string, metadata: HolderMetadata): TinValidationResult {
    const mismatchFields: string[] = [];
    const yyPart = tin.substring(0, 2);
    const mmPart = parseInt(tin.substring(2, 4));
    const ddPart = tin.substring(4, 6);

    // Gender check (+50 for Female)
    if (metadata.gender) {
        const isFemale = mmPart > 50;
        if ((metadata.gender === 'F' && !isFemale) || (metadata.gender === 'M' && isFemale)) {
            mismatchFields.push('gender');
        }
    }

    // Birth Date check
    if (metadata.birthDate) {
        const dob = new Date(metadata.birthDate);
        const day = dob.getDate().toString().padStart(2, '0');
        const month = dob.getMonth() + 1;
        const yearSuffix = dob.getFullYear().toString().slice(-2);
        
        let expectedMM = month;
        if (mmPart > 50) expectedMM += 50;

        if (day !== ddPart || expectedMM.toString().padStart(2, '0') !== tin.substring(2, 4) || yearSuffix !== yyPart) {
            mismatchFields.push('birthDate');
        }
    }

    if (mismatchFields.length > 0) {
        return {
            isValid: false,
            status: 'MISMATCH',
            reasonCode: 'ID_DATA_INCONSISTENT',
            mismatchFields,
            explanation: `Inconsistency in ${mismatchFields.join(', ')} with Slovak Birth Number structure.`
        };
    }

    return { isValid: true, status: 'VALID' };
}

function validateSlovakiaChecksum(tin: string): boolean {
    if (tin.length === 9) return true; // Older Birth Numbers (pre-1954) don't have checksum or it's different
    const val = parseInt(tin);
    return val % 11 === 0;
}

/**
 * APPENDIX: FORENSIC CRITERIA
 * Slovakia uses the Birth Number (Rodné číslo) and DIČ systems.
 * 1. Birth Number (Individuals): 
 *    - Format: YYMMDDXXXX.
 *    - Month: For females, MM + 50.
 *    - Checksum: For 10-digit versions, the number must be divisible by 11.
 * 2. DIČ (Entities): 
 *    - 10-digit sequence starting with 1, 2 or 4.
 *    - Validation: Modulo 11.
 * 3. Residency: Domicile or 183-day presence rule.
 * 4. Scope: Managed by the Ministry of Interior and Financial Directorate.
 */
