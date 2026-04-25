
import { HolderMetadata, TinValidationResult, TinInfo, CountryRegulatoryInfo, TinRequirement } from './index';

/**
 * TIN Requirements for Morocco
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
 * Country Metadata for Morocco
 */
export const COUNTRY_INFO: CountryRegulatoryInfo = {
    name: 'Marruecos',
    authority: 'Direction Générale des Impôts (DGI)',
    compliance: {
        crsStatus: 'Participating',
        crsDate: 'September 2022',
        fatcaStatus: 'Model 1 (In Force)'
    },
    residency: {
        individual: 'Se considera residente si permanece más de 183 días en cualquier periodo de 12 meses o si tiene su residencia habitual.',
        entity: 'Se considera residente si se ha incorporado bajo las leyes de Marruecos.',
        notes: 'Criterio de permanencia física o residencia habitual.'
    }
};

/**
 * TIN Metadata for Morocco (Era 6.3)
 */
export const TIN_INFO: TinInfo = {
    name: 'Identifiant Fiscal (IF) / ICE',
    description: 'Unique identifier issued by the Direction Générale des Impôts.',
    placeholder: '12345678 / 123456789000081',
    officialLink: 'https://www.tax.gov.ma/',
    isOfficial: true,
    lastUpdated: '2026-04-24',
    source: 'OECD Portal / Direction Générale des Impôts du Maroc',
    entityDifferentiation: {
        logic: 'Length analysis. 8 digits (IF) vs 15 digits (ICE).',
        individualDescription: 'Typically uses 8-digit Identifiant Fiscal (IF).',
        businessDescription: 'Typically uses 15-digit Identifiant Commun de l’Entreprise (ICE).'
    }
};

/**
 * Morocco TIN Validator (8 or 15 digits) - Era 6.3
 */
export const validateMATIN = (
    value: string, 
    type: 'INDIVIDUAL' | 'ENTITY' | 'ANY' = 'ANY', 
    metadata?: HolderMetadata
): TinValidationResult => {
    const cleanValue = value.trim().replace(/-/g, '');
    
    if (/^\d{8}$/.test(cleanValue)) {
        return {
            isValid: true,
            status: 'VALID',
            isOfficialMatch: true,
            explanation: 'Matches official 8-digit Morocco Identifiant Fiscal (IF) format.'
        };
    }

    if (/^\d{15}$/.test(cleanValue)) {
        return {
            isValid: true,
            status: 'VALID',
            isOfficialMatch: true,
            explanation: decodeMoroccoTIN(cleanValue)
        };
    }

    return {
        isValid: false,
        status: 'INVALID_FORMAT',
        explanation: 'Morocco TINs (IF/ICE) are numeric codes of 8 or 15 digits.'
    };
};

function decodeMoroccoTIN(tin: string): string {
    const establishment = tin.substring(9, 13);
    const isHead = establishment === '0000';
    const type = isHead ? 'Main Headquarters' : `Branch Office (#${establishment})`;
    
    return `ICE: Legal Unit ${tin.substring(0, 9)}, ${type}. Verified via structure.`;
}

/**
 * APPENDIX: FORENSIC CRITERIA
 * Morocco uses two parallel systems: the IF (Identifiant Fiscal) for legacy tax records 
 * and the ICE (Identifiant Commun de l’Entreprise) for unified business registration.
 * The ICE's suffix (positions 10-13) is critical for distinguishing the main unit (0000) 
 * from secondary establishments (0001, 0002, etc.).
 */

