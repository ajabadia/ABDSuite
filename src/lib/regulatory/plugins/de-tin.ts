import { HolderMetadata, TinValidationResult, CountryRegulatoryInfo, TinInfo, TinRequirement } from './index';

/**
 * TIN Validation for Germany (DE)
 * Steuer-Identifikationsnummer (11 digits)
 * Steuernummer (13 digits)
 */

/**
 * TIN Requirements for Germany
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
 * Country Metadata for Germany
 */
export const COUNTRY_INFO: CountryRegulatoryInfo = {
    name: 'Alemania',
    authority: 'Bundeszentralamt für Steuern (BZSt)',
    compliance: {
        crsStatus: 'Participating',
        crsDate: 'September 2017',
        fatcaStatus: 'Model 1 (In Force)'
    },
    residency: {
        individual: 'Se considera residente si tiene su domicilio o residencia habitual en Alemania.',
        entity: 'Se considera residente si tiene su sede legal o lugar de administración efectiva en Alemania.',
        notes: 'Criterio de domicilio (Wohnsitz) o estancia habitual (gewöhnlicher Aufenthalt).'
    }
};

/**
 * TIN Metadata for Germany (Era 6.3)
 */
export const TIN_INFO: TinInfo = {
    name: 'IdNr / Steuernummer',
    description: 'German Steuer-ID (Individuals) or Steuernummer (Business) issued by the BZSt.',
    placeholder: '01 234 567 890',
    officialLink: 'https://www.bzst.de',
    isOfficial: true,
    lastUpdated: '2026-04-24',
    source: 'OECD Portal / BZSt',
    entityDifferentiation: {
        logic: 'Number length and system.',
        individualDescription: '11 digits (IdNr).',
        businessDescription: '13 digits (Steuernummer) or the new W-IdNr format.'
    }
};

/**
 * Germany TIN Validator - Era 6.3
 */
export const validateDETIN = (
    value: string, 
    type: 'INDIVIDUAL' | 'ENTITY' | 'ANY' = 'ANY', 
    metadata?: HolderMetadata
): TinValidationResult => {
    const sanitized = value.replace(/[\s/]/g, '');

    // Individual (IdNr): 11 digits
    if (sanitized.length === 11 && /^[0-9]{11}$/.test(sanitized)) {
        if (type === 'ENTITY') {
            return { 
                isValid: false, 
                status: 'MISMATCH', 
                reasonCode: 'ENTITY_TYPE_MISMATCH',
                explanation: 'The detected format (11 digits) corresponds to a German IdNr, which is exclusive to individuals.'
            };
        }
        return { 
            isValid: true, 
            status: 'VALID', 
            isOfficialMatch: true, 
            explanation: type === 'ANY' 
                ? 'TIN validated successfully for individuals (IdNr). Not valid for entities.'
                : 'Matches official German Steuer-Identifikationsnummer (IdNr) format.' 
        };
    }

    // Business (Steuernummer): 13 digits
    if (sanitized.length === 13 && /^[0-9]{13}$/.test(sanitized)) {
        if (type === 'INDIVIDUAL') {
            return { 
                isValid: false, 
                status: 'MISMATCH', 
                reasonCode: 'ENTITY_TYPE_MISMATCH',
                explanation: 'The detected format (13 digits) corresponds to a German Steuernummer, which is used for business entities.'
            };
        }
        return { 
            isValid: true, 
            status: 'VALID', 
            isOfficialMatch: true, 
            explanation: type === 'ANY' 
                ? 'TIN validated successfully for entities (Steuernummer). Not valid for individuals.'
                : decodeGermanTIN(sanitized)
        };
    }

    // Economic ID (W-IdNr): DE + 9 digits + 5 digits
    if (/^DE[0-9]{14}$/.test(sanitized)) {
        if (type === 'INDIVIDUAL') {
            return { 
                isValid: false, 
                status: 'MISMATCH', 
                reasonCode: 'ENTITY_TYPE_MISMATCH',
                explanation: 'The detected format (W-IdNr) is a business identifier and does not apply to individuals.'
            };
        }
        return {
            isValid: true,
            status: 'VALID',
            isOfficialMatch: true,
            explanation: type === 'ANY'
                ? 'TIN validated successfully for entities (W-IdNr). Not valid for individuals.'
                : decodeGermanTIN(sanitized)
        };
    }

    return { 
        isValid: false, 
        status: 'INVALID_FORMAT',
        explanation: 'Value does not match German IdNr (11 digits), Steuernummer (13 digits) or W-IdNr format.'
    };
};

function decodeGermanTIN(tin: string): string {
    if (tin.length === 13) {
        const stateCode = tin.substring(0, 2);
        const districtCode = tin.substring(2, 5);
        return `Steuernummer: State Code ${stateCode}, District ${districtCode}. Verified via structure.`;
    }
    if (tin.startsWith('DE')) {
        return `W-IdNr: Business Identification Number. Verified via prefix.`;
    }
    return 'German Tax Identifier. Verified via structure.';
}

/**
 * APPENDIX: FORENSIC CRITERIA
 * Germany is transitioning from the regional Steuernummer (13 digits) to a permanent 
 * national identifier, the IdNr (11 digits) for individuals.
 * 1. IdNr: 11 digits, strictly numeric. Permanent from birth to death.
 * 2. Steuernummer: 13 digits, encoded with regional (State/Länder) identifiers. 
 *    Subject to change if the taxpayer moves.
 * 3. W-IdNr: New business identifier following the DE + 14 digits format.
 */

