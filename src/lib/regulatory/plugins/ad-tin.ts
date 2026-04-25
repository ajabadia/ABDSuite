
import { HolderMetadata, TinValidationResult, CountryRegulatoryInfo, TinInfo, TinRequirement } from './index';

/**
 * TIN Validation for Andorra (AD)
 * NRT (8 characters: L-000000-L)
 */

/**
 * TIN Requirements for Andorra
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
 * Country Metadata for Andorra
 */
export const COUNTRY_INFO: CountryRegulatoryInfo = {
    name: 'Andorra',
    authority: 'Departament de Tributs i de Fronteres',
    compliance: {
        crsStatus: 'Participating',
        crsDate: 'September 2018',
        fatcaStatus: 'Model 1 (In Force)'
    },
    residency: {
        individual: 'Se considera residente si reside habitualmente (más de 183 días) o si el centro de sus actividades o intereses económicos está en Andorra.',
        entity: 'Se considera residente si se ha constituido conforme a las leyes andorranas, tiene su sede social en Andorra o su sede de dirección efectiva.',
        notes: 'Criterio de permanencia o centro de intereses.'
    }
};

/**
 * TIN Metadata for Andorra (Era 6.3)
 */
export const TIN_INFO: TinInfo = {
    name: 'Número de Registre Tributari (NRT)',
    description: 'Andorran NRT (Tax Registration Number) issued by the Departament de Tributs i de Fronteres.',
    placeholder: 'U-123456-A',
    officialLink: 'https://www.imposts.ad',
    isOfficial: true,
    lastUpdated: '2026-04-24',
    source: 'OECD Portal / Tributs Andorra',
    entityDifferentiation: {
        logic: 'Initial letter code.',
        individualDescription: 'NRT starting with F (Andorran citizens) or L (Foreign residents).',
        businessDescription: 'NRT starting with U (Companies), G (Associations), etc.'
    }
};

/**
 * Andorra TIN Validator - Era 6.3
 */
export const validateADTIN = (
    value: string, 
    type: 'INDIVIDUAL' | 'ENTITY' | 'ANY' = 'ANY', 
    metadata?: HolderMetadata
): TinValidationResult => {
    const sanitized = value.replace(/[\s-]/g, '').toUpperCase();

    if (sanitized.length === 8 && /^[A-Z][0-9]{6}[A-Z]$/.test(sanitized)) {
        const prefix = sanitized[0];
        
        const isEntityPrefix = ['U', 'G', 'E', 'D'].includes(prefix);
        const isIndividualPrefix = ['F', 'L', 'A'].includes(prefix);

        if (isIndividualPrefix && type === 'ENTITY') {
             return { 
                 isValid: false, 
                 status: 'MISMATCH', 
                 reasonCode: 'ENTITY_TYPE_MISMATCH',
                 explanation: `The NRT prefix '${prefix}' corresponds to an individual (citizen or resident) and not a legal entity.`
             };
        }
        
        if (isEntityPrefix && type === 'INDIVIDUAL') {
             return { 
                 isValid: false, 
                 status: 'MISMATCH', 
                 reasonCode: 'ENTITY_TYPE_MISMATCH',
                 explanation: `The NRT prefix '${prefix}' corresponds to a legal entity (company or association) and not an individual.`
             };
        }

            const explanation = decodeAndorraTIN(sanitized);

            return { 
                isValid: true, 
                status: 'VALID', 
                isOfficialMatch: true, 
                explanation: type === 'ANY'
                    ? (isEntityPrefix 
                        ? 'Format valid for Entities (NRT). Note: This identifier is not valid for Individuals.'
                        : 'Format valid for Individuals (NRT). Note: This identifier is not valid for legal Entities.')
                    : explanation
            };
    }

    return { 
        isValid: false, 
        status: 'INVALID_FORMAT',
        explanation: 'Value does not match Andorran NRT (8 chars: LNNNNNNL) format.'
    };
};

function decodeAndorraTIN(tin: string): string {
    const prefix = tin[0];
    const nrtMap: Record<string, string> = {
        'F': 'Individual (Andorran Citizen)',
        'L': 'Individual (Foreign Resident)',
        'A': 'Individual (Non-Resident)',
        'U': 'Legal Entity (Company)',
        'G': 'Association / Other legal form',
        'E': 'Foreign Entity (Permanent Establishment)',
        'D': 'Diplomatic / International Organization'
    };
    
    const description = nrtMap[prefix] || 'Unknown Subject Type';
    return `NRT: ${description}. Verified via prefix.`;
}

/**
 * APPENDIX: FORENSIC CRITERIA
 * Andorra's NRT (Número de Registre Tributari) is an 8-character code.
 * 1. Prefixes:
 *    - F: Physical persons with Andorran nationality.
 *    - L: Foreign residents with residence permit.
 *    - A: Physical persons without residence permit.
 *    - U: Legal entities (companies, SL, SA).
 *    - G: Non-profit organizations and associations.
 * 2. Structure: Prefix + 6 digits + Control Character.
 * 3. Residency: Based on the 183-day rule or the 'Vital Interests' test.
 */

