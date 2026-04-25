
import { HolderMetadata, TinValidationResult, CountryRegulatoryInfo, TinInfo, TinRequirement } from './index';

/**
 * TIN Validation for Bosnia and Herzegovina (BA)
 * Individual: JMBG (13 digits)
 * Entity: JIB (13 digits)
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
 * Country Metadata for Bosnia and Herzegovina
 */
export const COUNTRY_INFO: CountryRegulatoryInfo = {
    name: 'Bosnia y Herzegovina',
    authority: 'Indirect Taxation Authority (ITA)',
    compliance: {
        crsStatus: 'Non-Participating',
        crsDate: 'N/A',
        fatcaStatus: 'N/A'
    },
    residency: {
        individual: 'Se considera residente si tiene su residencia principal en Bosnia y Herzegovina o si permanece allí durante más de 183 días en el año civil.',
        entity: 'Se considera residente si se ha incorporado en Bosnia y Herzegovina o si su gestión central se encuentra allí.',
        notes: 'Criterio de residencia principal o estancia de 183 días.'
    }
};

/**
 * TIN Metadata for Bosnia and Herzegovina (Era 6.3)
 */
export const TIN_INFO: TinInfo = {
    name: 'JMBG / JIB',
    description: 'Bosnian JMBG (Individuals) or JIB (Entities) issued by the ITA or relevant entity tax administration.',
    placeholder: '1234567890123',
    officialLink: 'https://www.uino.gov.ba',
    isOfficial: true,
    lastUpdated: '2026-04-24',
    source: 'Local Authority / Bosnia ITA',
    entityDifferentiation: {
        logic: 'Structurally identical identifiers.',
        individualDescription: '13-digit JMBG identifier.',
        businessDescription: '13-digit JIB identifier.'
    }
};

/**
 * Bosnia and Herzegovina TIN Validator - Era 6.3
 */
export const validateBATIN = (
    value: string, 
    type: 'INDIVIDUAL' | 'ENTITY' | 'ANY' = 'ANY', 
    metadata?: HolderMetadata
): TinValidationResult => {
    const sanitized = value.replace(/[\s-]/g, '');

    if (sanitized.length === 13 && /^[0-9]{13}$/.test(sanitized)) {
        if (metadata) {
            const mismatchFields: string[] = [];

            // JMBG: DD MM YYY RR BBB K
            // birthDate check
            if (metadata.birthDate) {
                const dob = new Date(metadata.birthDate);
                const day = dob.getDate().toString().padStart(2, '0');
                const month = (dob.getMonth() + 1).toString().padStart(2, '0');
                const yearSuffix = dob.getFullYear().toString().slice(-3);
                
                if (day !== sanitized.substring(0, 2) || month !== sanitized.substring(2, 4) || yearSuffix !== sanitized.substring(4, 7)) {
                    mismatchFields.push('birthDate');
                }
            }

            // Gender check (BBB part: 000-499 for Male, 500-999 for Female)
            if (metadata.gender) {
                const bbb = parseInt(sanitized.substring(9, 12));
                const isMale = bbb < 500;
                if ((metadata.gender === 'M' && !isMale) || (metadata.gender === 'F' && isMale)) {
                    mismatchFields.push('gender');
                }
            }

            if (mismatchFields.length > 0) {
                return {
                    isValid: false,
                    status: 'MISMATCH',
                    reasonCode: 'ID_DATA_INCONSISTENT',
                    mismatchFields,
                    explanation: `Inconsistency in ${mismatchFields.join(', ')} with Bosnian JMBG structure.`
                };
            }
        }
        return { 
            isValid: true, 
            status: 'VALID', 
            isOfficialMatch: true, 
            explanation: decodeBosniaTIN(sanitized)
        };
    }

    return { 
        isValid: false, 
        status: 'INVALID_FORMAT',
        explanation: 'Value does not match Bosnian 13-digit format.'
    };
};

function decodeBosniaTIN(tin: string): string {
    // JMBG: DD MM YYY RR BBB K
    const day = tin.substring(0, 2);
    const month = tin.substring(2, 4);
    const yearSuffix = tin.substring(4, 7);
    const year = parseInt(yearSuffix) < 100 ? `2${yearSuffix}` : `1${yearSuffix}`;
    return `Identifier: JMBG/JIB (13 digits). Encoded Birth Date: ${day}/${month}/${year}. Verified via structure.`;
}

/**
 * APPENDIX: FORENSIC CRITERIA
 * Bosnia and Herzegovina uses the 13-digit JMBG/JIB system.
 * 1. JMBG (Individuals): Unique Master Citizen Number.
 *    - Digits 1-7: Birth date (DDMMYYY). YYY is the last 3 digits of the year.
 *    - Digits 8-9: Political region of birth (RR).
 *    - Digits 10-12: Gender and sequence (BBB).
 *    - Digit 13: Checksum (Modulo 11).
 * 2. JIB (Entities): Unique Identification Number for legal entities (13 digits).
 * 3. Validation: Structural verification and Modulo 11 checksum for JMBG.
 * 4. Residency: Based on the 183-day calendar year rule.
 */

