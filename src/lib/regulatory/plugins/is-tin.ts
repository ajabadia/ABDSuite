
import { HolderMetadata, TinValidationResult, CountryRegulatoryInfo, TinInfo, TinRequirement } from './index';

/**
 * TIN Validation for Iceland (IS)
 * Kennitala (10 digits: DDMMYYXXXX)
 */

/**
 * TIN Requirements for Iceland
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
    { key: 'birthDate', label: 'birthDate', type: 'date', scope: 'INDIVIDUAL' }
];

/**
 * Country Metadata for Iceland
 */
export const COUNTRY_INFO: CountryRegulatoryInfo = {
    name: 'Islandia',
    authority: 'Icelandic Tax Authority (Skatturinn)',
    compliance: {
        crsStatus: 'Participating',
        crsDate: 'September 2017',
        fatcaStatus: 'Model 1 (In Force)'
    },
    residency: {
        individual: 'Se considera residente si tiene domicilio permanente en Islandia o si permanece allí durante más de 183 días en el año civil.',
        entity: 'Se considera residente si tiene su sede legal en Islandia.',
        notes: 'Criterio de domicilio o estancia de 183 días.'
    }
};

/**
 * TIN Metadata for Iceland (Era 6.3)
 */
export const TIN_INFO: TinInfo = {
    name: 'Kennitala',
    description: 'Icelandic Kennitala issued by Registers Iceland or Skatturinn.',
    placeholder: '123456-7890',
    officialLink: 'https://www.skattur.is',
    isOfficial: true,
    lastUpdated: '2026-04-24',
    source: 'OECD Portal / Skatturinn',
    entityDifferentiation: {
        logic: 'Prefix analysis.',
        individualDescription: 'Kennitala starting with birth date (DDMMYY).',
        businessDescription: 'Kennitala starting with 4, 5, 6 or 7.'
    }
};

/**
 * Iceland TIN Validator - Era 6.3
 */
export const validateISTIN = (
    value: string, 
    type: 'INDIVIDUAL' | 'ENTITY' | 'ANY' = 'ANY', 
    metadata?: HolderMetadata
): TinValidationResult => {
    const sanitized = value.replace(/[\s-]/g, '');

    if (sanitized.length === 10 && /^[0-9]{10}$/.test(sanitized)) {
        const firstDigit = parseInt(sanitized[0]);
        const isIndividual = firstDigit <= 3;
        const isEntity = firstDigit >= 4;

        if (isIndividual && type === 'ENTITY') {
             return { 
                 isValid: false, 
                 status: 'MISMATCH', 
                 reasonCode: 'ENTITY_TYPE_MISMATCH',
                 explanation: 'The detected Kennitala prefix implies an individual taxpayer.'
             };
        }
        
        if (isEntity && type === 'INDIVIDUAL') {
             return { 
                 isValid: false, 
                 status: 'MISMATCH', 
                 reasonCode: 'ENTITY_TYPE_MISMATCH',
                 explanation: 'The detected Kennitala prefix implies a legal entity.'
             };
        }

        if (validateKennitalaChecksum(sanitized)) {
            // High-Fidelity Semantic Check (Era 6.3)
            if (isIndividual && metadata && metadata.birthDate) {
                const dd = sanitized.substring(0, 2);
                const mm = sanitized.substring(2, 4);
                const yy = sanitized.substring(4, 6);
                
                const bDate = new Date(metadata.birthDate);
                const bDay = String(bDate.getDate()).padStart(2, '0');
                const bMonth = String(bDate.getMonth() + 1).padStart(2, '0');
                const bYearShort = String(bDate.getFullYear()).substring(2);
                
                if (dd !== bDay || mm !== bMonth || yy !== bYearShort) {
                    return { 
                        isValid: false, 
                        status: 'MISMATCH', 
                        reasonCode: 'METADATA_MISMATCH',
                        explanation: `Kennitala birth date part (${dd}${mm}${yy}) does not match provided birth date (${bDay}${bMonth}${bYearShort}).`
                    };
                }
            }

            const isEntity = firstDigit >= 4;
            const explanation = decodeIcelandTIN(sanitized);

            return { 
                isValid: true, 
                status: 'VALID', 
                isOfficialMatch: true, 
                explanation: type === 'ANY'
                    ? (isEntity 
                        ? 'Format valid for Entities (Kennitala). Note: This format is invalid if the holder is an Individual.'
                        : 'Format valid for Individuals (Kennitala). Note: This identifier is not valid for legal Entities.')
                    : explanation
            };
        } else {
            return { isValid: false, status: 'INVALID_CHECKSUM', explanation: 'Failed Icelandic Kennitala checksum validation.' };
        }
    }

    return { 
        isValid: false, 
        status: 'INVALID_FORMAT',
        explanation: 'Value does not match Icelandic Kennitala (10 digits) format.'
    };
};

function decodeIcelandTIN(tin: string): string {
    const firstDigit = parseInt(tin[0]);
    const isEntity = firstDigit >= 4;
    
    if (isEntity) {
        return 'Legal Entity (Kennitala). Verified via prefix and checksum.';
    }
    
    const dd = tin.substring(0, 2);
    const mm = tin.substring(2, 4);
    const yy = tin.substring(4, 6);
    const centuryDigit = tin[9];
    
    const centuryMap: Record<string, string> = {
        '8': '18',
        '9': '19',
        '0': '20'
    };
    const century = centuryMap[centuryDigit] || '19';
    
    return `Individual, born on ${dd}/${mm}/${century}${yy}. Verified via checksum.`;
}

function validateKennitalaChecksum(tin: string): boolean {
    const weights = [3, 2, 7, 6, 5, 4, 3, 2];
    let sum = 0;
    for (let i = 0; i < 8; i++) sum += parseInt(tin[i]) * weights[i];
    let check = 11 - (sum % 11);
    if (check === 11) check = 0;
    return check === parseInt(tin[8]);
}
