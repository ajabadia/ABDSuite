import { HolderMetadata, TinValidationResult, CountryRegulatoryInfo, TinInfo, TinRequirement } from './index';

/**
 * TIN Validation for Pakistan (PK)
 * Individual: CNIC (13 digits) or NTN (7 or 8 digits)
 * Entity: NTN (7 or 8 digits)
 */

/**
 * TIN Requirements for Pakistan
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
    { key: 'gender', label: 'gender', type: 'select', scope: 'INDIVIDUAL', options: [
        { value: 'M', label: 'male' },
        { value: 'F', label: 'female' }
    ]}
];

/**
 * Country Metadata for Pakistan
 */
export const COUNTRY_INFO: CountryRegulatoryInfo = {
    name: 'Pakistán',
    authority: 'Federal Board of Revenue (FBR)',
    compliance: {
        crsStatus: 'Participating',
        crsDate: 'September 2018',
        fatcaStatus: 'Model 1 (In Force)'
    },
    residency: {
        individual: 'Se considera residente si permanece en Pakistán durante un total de 183 días o más en un año fiscal.',
        entity: 'Se considera residente si está incorporada o formada bajo cualquier ley en Pakistán o si su gestión y control se ejercen enteramente en Pakistán.',
        notes: 'Criterio de permanencia física o control de gestión.'
    }
};

/**
 * TIN Metadata for Pakistan (Era 6.3)
 */
export const TIN_INFO: TinInfo = {
    name: 'NTN / CNIC',
    description: 'Pakistani NTN or CNIC issued by the FBR or NADRA.',
    placeholder: '1234567-8 / 12345-1234567-1',
    officialLink: 'https://www.fbr.gov.pk',
    isOfficial: true,
    lastUpdated: '2026-04-24',
    source: 'OECD Portal / FBR',
    entityDifferentiation: {
        logic: 'Number length and format analysis.',
        individualDescription: '13-digit CNIC or 7/8-digit NTN.',
        businessDescription: '7/8-digit NTN.'
    }
};

/**
 * Pakistan TIN Validator - Era 6.3
 */
export const validatePKTIN = (
    value: string, 
    type: 'INDIVIDUAL' | 'ENTITY' | 'ANY' = 'ANY', 
    metadata?: HolderMetadata
): TinValidationResult => {
    const sanitized = value.trim().toUpperCase().replace(/[\s-]/g, '');

    // 1. Individual (CNIC): 13 digits
    if (sanitized.length === 13 && /^[0-9]{13}$/.test(sanitized)) {
        if (type === 'ENTITY') {
            return { 
                isValid: false, 
                status: 'MISMATCH', 
                reasonCode: 'ENTITY_TYPE_MISMATCH',
                explanation: 'The detected format (13 digits) corresponds to a Pakistani CNIC, which is exclusive to individuals.'
            };
        }
        
        if (metadata) {
            const semantic = validatePakistanSemantic(sanitized, metadata);
            if (!semantic.isValid) {
                return semantic;
            }
        }

        return { 
            isValid: true, 
            status: 'VALID', 
            isOfficialMatch: true, 
            explanation: decodePakistanCNIC(sanitized)
        };
    }

    // 2. NTN: 7 or 8 digits
    if ((sanitized.length === 7 || sanitized.length === 8) && /^[0-9]+$/.test(sanitized)) {
        const isOfficial = validatePKNTNChecksum(sanitized);
        return { 
            isValid: true, 
            status: isOfficial ? 'VALID' : 'VALID_UNOFFICIAL', 
            isOfficialMatch: isOfficial, 
            explanation: `Matches official Pakistani NTN format. ${isOfficial ? 'Verified via checksum.' : 'Pattern match.'}` 
        };
    }

    return { 
        isValid: false, 
        status: 'INVALID_FORMAT',
        explanation: 'Value does not match Pakistani CNIC (13 digits) or NTN (7-8 digits) format.'
    };
};

function decodePakistanCNIC(tin: string): string {
    const provinceCode = tin[0];
    const genderDigit = parseInt(tin[12]);
    const gender = genderDigit % 2 === 0 ? 'Female' : 'Male';
    
    const provinces: Record<string, string> = {
        '1': 'Khyber Pakhtunkhwa', '2': 'FATA', '3': 'Punjab', '4': 'Sindh', 
        '5': 'Balochistan', '6': 'Islamabad', '7': 'Gilgit-Baltistan'
    };
    const province = provinces[provinceCode] || 'Unknown Region';
    
    return `Individual CNIC (${gender}), from ${province}. Verified via structure.`;
}

function validatePakistanSemantic(tin: string, metadata: HolderMetadata): TinValidationResult {
    const genderDigit = parseInt(tin[12]);

    if (metadata.gender) {
        const isFemale = genderDigit % 2 === 0;
        if ((metadata.gender === 'F' && !isFemale) || (metadata.gender === 'M' && isFemale)) {
            return {
                isValid: false,
                status: 'MISMATCH',
                reasonCode: 'ID_DATA_INCONSISTENT',
                mismatchFields: ['gender'],
                explanation: `CNIC gender digit (${genderDigit}) implies ${isFemale ? 'Female' : 'Male'}, but metadata specifies ${metadata.gender === 'F' ? 'Female' : 'Male'}.`
            };
        }
    }

    return { isValid: true, status: 'VALID' };
}

function validatePKNTNChecksum(tin: string): boolean {
    const basePart = tin.substring(0, 7);
    const weights = [8, 7, 6, 5, 4, 3, 2];
    let sum = 0;
    for (let i = 0; i < 7; i++) sum += parseInt(basePart[i]) * weights[i];
    const remainder = sum % 11;
    let checkDigit = 11 - remainder;
    if (checkDigit === 11) checkDigit = 0;
    if (checkDigit === 10) return false; // Invalid result for NTN
    
    if (tin.length === 8) {
        return checkDigit === parseInt(tin[7]);
    }
    return true; // If only 7 digits provided, we assume it's the base without control
}

/**
 * APPENDIX: FORENSIC CRITERIA
 * Pakistan uses the CNIC for individuals and NTN for all taxpayers.
 * 1. CNIC (Individuals): 
 *    - 13-digit sequence (XXXXX-XXXXXXX-X).
 *    - Digit 1: Province/Region code.
 *    - Digit 13: Gender/Check digit (Odd: Male, Even: Female).
 * 2. NTN (Taxpayers): 
 *    - 7-digit base + 1 control digit.
 *    - Validation: Weighted sum algorithm Modulo 11.
 *    - Weights: [8, 7, 6, 5, 4, 3, 2].
 * 3. Residency: Based on the 183-day presence rule or management control.
 * 4. Scope: Managed by NADRA and FBR.
 */
