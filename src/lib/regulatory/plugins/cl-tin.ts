
import { HolderMetadata, TinValidationResult, CountryRegulatoryInfo, TinInfo, TinRequirement } from './index';

/**
 * TIN Validation for Chile (CL)
 * RUN / RUT (8 to 9 digits: 12.345.678-K)
 */

/**
 * TIN Requirements for Chile
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
 * Country Metadata for Chile
 */
export const COUNTRY_INFO: CountryRegulatoryInfo = {
    name: 'Chile',
    authority: 'Servicio de Impuestos Internos (SII)',
    compliance: {
        crsStatus: 'Participating',
        crsDate: 'September 2017',
        fatcaStatus: 'Model 1 (In Force)'
    },
    residency: {
        individual: 'Se considera residente si permanece en Chile más de 183 días en un periodo de 12 meses.',
        entity: 'Se considera residente si está constituida en Chile.',
        notes: 'Criterio de permanencia física o constitución legal.'
    }
};

/**
 * TIN Metadata for Chile (Era 6.3)
 */
export const TIN_INFO: TinInfo = {
    name: 'RUN / RUT',
    description: 'Chilean RUN (Individuals) or RUT (Entities) issued by the Civil Registry or SII.',
    placeholder: '12.345.678-K',
    officialLink: 'https://www.sii.cl',
    isOfficial: true,
    lastUpdated: '2026-04-24',
    source: 'OECD Portal / SII',
    entityDifferentiation: {
        logic: 'Numeric range analysis.',
        individualDescription: 'RUN typically assigned to citizens/residents (usually < 50,000,000).',
        businessDescription: 'RUT assigned to entities and foreign taxpayers (usually > 50,000,000).'
    }
};

/**
 * Chile TIN Validator - Era 6.3
 */
export const validateCLTIN = (
    value: string, 
    type: 'INDIVIDUAL' | 'ENTITY' | 'ANY' = 'ANY', 
    metadata?: HolderMetadata
): TinValidationResult => {
    const sanitized = value.replace(/[\s.-]/g, '').toUpperCase();

    if (sanitized.length >= 8 && sanitized.length <= 9 && /^[0-9]+[0-9K]$/.test(sanitized)) {
        if (validateRUTChecksum(sanitized)) {
            const numPart = parseInt(sanitized.substring(0, sanitized.length - 1));
            const isEntity = numPart >= 50000000; // General heuristic: Entities > 50M
            
            if (isEntity && type === 'INDIVIDUAL') {
                return { 
                    isValid: false, 
                    status: 'MISMATCH', 
                    reasonCode: 'ENTITY_TYPE_MISMATCH',
                    explanation: 'The detected number (RUT > 50,000,000) corresponds to a Chilean Legal Entity or Foreign Resident.'
                };
            }
            if (!isEntity && type === 'ENTITY') {
                return { 
                    isValid: false, 
                    status: 'MISMATCH', 
                    reasonCode: 'ENTITY_TYPE_MISMATCH',
                    explanation: 'The detected number (RUN < 50,000,000) corresponds to a Chilean Individual (Citizen).'
                };
            }

            return { 
                isValid: true, 
                status: 'VALID', 
                isOfficialMatch: true, 
                explanation: type === 'ANY'
                    ? (isEntity 
                        ? 'Format valid for Entities (RUT > 50M). Note: This identifier is not valid for local Individuals.'
                        : 'Format valid for Individuals (RUN < 50M). Note: This identifier is not valid for legal Entities.')
                    : (isEntity ? 'Matches official Chilean RUT (Entity) format and checksum.' : 'Matches official Chilean RUN (Individual) format and checksum.')
            };
        } else {
            return { isValid: false, status: 'INVALID_CHECKSUM', explanation: 'Failed Chilean RUT checksum validation.' };
        }
    }

    return { 
        isValid: false, 
        status: 'INVALID_FORMAT',
        explanation: 'Value does not match Chilean RUN/RUT format (8-9 digits + check digit).'
    };
};

function validateRUTChecksum(rut: string): boolean {
    const body = rut.substring(0, rut.length - 1);
    const dv = rut.substring(rut.length - 1);
    
    let sum = 0;
    let multiplier = 2;
    for (let i = body.length - 1; i >= 0; i--) {
        sum += parseInt(body[i]) * multiplier;
        multiplier = multiplier === 7 ? 2 : multiplier + 1;
    }
    
    const res = 11 - (sum % 11);
    let expected: string;
    if (res === 11) expected = '0';
    else if (res === 10) expected = 'K';
    else expected = res.toString();
    
    return expected === dv;
}

/**
 * APPENDIX: FORENSIC CRITERIA
 * Chile uses a unified identification system: RUN for citizens and RUT for tax purposes.
 * 1. RUN (Rol Único Nacional): Personal ID assigned at birth. 
 * 2. RUT (Rol Único Tributario): Tax ID for legal entities and foreigners. 
 * 3. Calculation: Modulo 11 check digit algorithm.
 *    - Multiply digits by weights (2,3,4,5,6,7) from right to left.
 *    - 11 - (Sum % 11) results in 1-9, '0' (for 11), or 'K' (for 10).
 * 4. Entity Logic: Numbers above 50,000,000 are predominantly legal entities 
 *    (usually starting at 60M, 70M, 80M, or 90M blocks).
 */

