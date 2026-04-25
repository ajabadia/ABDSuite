import { HolderMetadata, TinValidationResult, CountryRegulatoryInfo, TinInfo, TinRequirement } from './index';

/**
 * TIN Validation for Qatar (QA)
 * QID / TIN (11 digits)
 */

/**
 * TIN Requirements for Qatar
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
 * Country Metadata for Qatar
 */
export const COUNTRY_INFO: CountryRegulatoryInfo = {
    name: 'Qatar',
    authority: 'General Tax Authority (GTA)',
    compliance: {
        crsStatus: 'Participating',
        crsDate: 'September 2018',
        fatcaStatus: 'Model 1 (In Force)'
    },
    residency: {
        individual: 'Se considera residente si tiene una residencia permanente en Qatar o si permanece allí 183 días en el año fiscal.',
        entity: 'Se considera residente si está incorporada en Qatar o si su gestión y control se ejercen allí.',
        notes: 'Criterio de residencia permanente o estancia de 183 días.'
    }
};

/**
 * TIN Metadata for Qatar (Era 6.3)
 */
export const TIN_INFO: TinInfo = {
    name: 'QID / TIN',
    description: 'Qatar ID (Individuals) or TIN (Entities) issued by the Ministry of Interior or GTA.',
    placeholder: '28063412345',
    officialLink: 'https://www.gta.gov.qa',
    isOfficial: true,
    lastUpdated: '2026-04-24',
    source: 'OECD Portal / GTA',
    entityDifferentiation: {
        logic: 'Numeric sequence analysis.',
        individualDescription: '11-digit Qatar ID (QID). Starts with century (2 for 19xx, 3 for 20xx).',
        businessDescription: '11-digit Tax Identification Number (TIN).'
    }
};

/**
 * Qatar TIN Validator - Era 6.3
 */
export const validateQATIN = (
    value: string, 
    type: 'INDIVIDUAL' | 'ENTITY' | 'ANY' = 'ANY', 
    metadata?: HolderMetadata
): TinValidationResult => {
    const sanitized = value.trim().replace(/[\s-]/g, '');

    if (sanitized.length === 11 && /^[0-9]{11}$/.test(sanitized)) {
        return { 
            isValid: true, 
            status: 'VALID', 
            isOfficialMatch: true, 
            explanation: decodeQatarTIN(sanitized, metadata)
        };
    }

    return { 
        isValid: false, 
        status: 'INVALID_FORMAT',
        explanation: 'Value does not match Qatari 11-digit format.'
    };
};

function decodeQatarTIN(tin: string, metadata?: HolderMetadata): string {
    const centuryDigit = parseInt(tin[0]);
    const yy = tin.substring(1, 3);
    const nationalityCode = tin.substring(3, 6);
    
    const century = centuryDigit === 2 ? '19' : (centuryDigit === 3 ? '20' : '??');
    const isQatari = nationalityCode === '634';
    const nationality = isQatari ? 'Qatari Citizen' : `Foreign National (Code: ${nationalityCode})`;
    
    let explanation = `Qatar ID/TIN, ${nationality}, born in ${century}${yy}.`;
    
    if (metadata?.birthDate) {
        const dob = new Date(metadata.birthDate);
        const expectedYY = dob.getFullYear().toString().slice(-2);
        if (yy !== expectedYY) {
            explanation += ` [WARNING: Birth year mismatch with ${expectedYY}].`;
        }
    }
    
    return explanation;
}

/**
 * APPENDIX: FORENSIC CRITERIA
 * Qatar uses the QID (Qatar ID) and TIN systems.
 * 1. QID (Individuals): 
 *    - Position 1: Century (2 = 1900-1999, 3 = 2000-2099).
 *    - Positions 2-3: Year of birth.
 *    - Positions 4-6: Nationality ISO code (634 for Qatar).
 *    - Positions 7-11: Unique sequence.
 * 2. TIN (Entities): 
 *    - 11-digit sequence managed by Dhareeba (GTA system).
 * 3. Validation: Structural pattern match. 
 * 4. Residency: Centered on the 183-day presence rule or permanent home.
 */
