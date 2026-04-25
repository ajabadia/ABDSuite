import { HolderMetadata, TinValidationResult, CountryRegulatoryInfo, TinInfo, TinRequirement } from './index';
import { ITALIAN_CITIES, FOREIGN_COUNTRIES } from './it-locations';

/**
 * TIN Validation for Italy (IT)
 * Codice Fiscale (16 characters)
 * Partita IVA (11 digits)
 */

const MONTH_CODES: Record<number, string> = {
    1: 'A', 2: 'B', 3: 'C', 4: 'D', 5: 'E', 6: 'H',
    7: 'L', 8: 'M', 9: 'P', 10: 'R', 11: 'S', 12: 'T'
};

/**
 * TIN Requirements for Italy
 */
export const TIN_REQUIREMENTS_INFO = [
    'Codice Fiscale for individuals (16 alphanumeric characters).',
    'Partita IVA for businesses and self-employed individuals (11 digits).'
];

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
    { key: 'firstName', label: 'firstName', type: 'text', scope: 'INDIVIDUAL' },
    { key: 'lastName', label: 'lastName', type: 'text', scope: 'INDIVIDUAL' },
    { key: 'birthDate', label: 'birthDate', type: 'date', scope: 'INDIVIDUAL' },
    { key: 'gender', label: 'gender', type: 'select', scope: 'INDIVIDUAL', options: [
        { value: 'M', label: 'male' },
        { value: 'F', label: 'female' }
    ]},
    { key: 'birthPlaceName', label: 'birthPlaceName', type: 'text', scope: 'INDIVIDUAL', suggestions: ['Roma', 'Milano', 'Napoli', 'Torino', 'Palermo', 'Genova', 'Bologna', 'Firenze', 'Bari', 'Catania', 'Venezia', 'Verona', 'Messina', 'Padova', 'Trieste'] }
];

/**
 * Country Metadata for Italy
 */
export const COUNTRY_INFO: CountryRegulatoryInfo = {
    name: 'Italia',
    authority: 'Agenzia delle Entrate',
    compliance: {
        crsStatus: 'Participating',
        crsDate: 'September 2017',
        fatcaStatus: 'Model 1 (In Force)'
    },
    residency: {
        individual: 'Se considera residente si está inscrito en el registro de la población residente o tiene su domicilio o residencia en Italia durante la mayor parte del año fiscal.',
        entity: 'Se considera residente si tiene su sede legal, sede administrativa o su actividad principal en Italia durante la mayor parte del año fiscal.',
        notes: 'Criterio de presencia física o registro formal.'
    }
};

/**
 * TIN Metadata for Italy (Era 6.3)
 */
export const TIN_INFO: TinInfo = {
    name: 'Codice Fiscale / Partita IVA',
    description: 'Italian Codice Fiscale (Individuals) or Partita IVA (Entities) issued by Agenzia delle Entrate.',
    placeholder: 'RSSMRA80A01H501U / 12345678901',
    officialLink: 'https://www.agenziaentrate.gov.it',
    isOfficial: true,
    lastUpdated: '2026-04-24',
    source: 'OECD Portal / Agenzia delle Entrate',
    entityDifferentiation: {
        logic: 'Structure and characters.',
        individualDescription: '16 characters (Codice Fiscale).',
        businessDescription: '11 digits (Partita IVA).'
    }
};

/**
 * Italy TIN Validator - Era 6.3
 */
export const validateITTIN = (
    value: string, 
    type: 'INDIVIDUAL' | 'ENTITY' | 'ANY' = 'ANY', 
    metadata?: HolderMetadata
): TinValidationResult => {
    const sanitized = value.replace(/[\s-]/g, '').toUpperCase();

    // 1. Structural Checks
    const isCodiceFiscale = /^[A-Z]{6}[A-Z0-9]{2}[A-Z][A-Z0-9]{2}[A-Z][A-Z0-9]{3}[A-Z]$/.test(sanitized);
    const isPartitaIVA = /^[0-9]{11}$/.test(sanitized);

    if (!isCodiceFiscale && !isPartitaIVA) {
        return { 
            isValid: false, 
            status: 'INVALID_FORMAT',
            explanation: 'Value does not match Italian Codice Fiscale (16 chars) or Partita IVA (11 digits) format.'
        };
    }

    if (isCodiceFiscale && type === 'ENTITY') {
        return { 
            isValid: false, 
            status: 'MISMATCH', 
            reasonCode: 'ENTITY_TYPE_MISMATCH',
            explanation: 'The detected format (16 chars) corresponds to an Italian Codice Fiscale, which is exclusive to individuals.'
        };
    }
    
    if (isPartitaIVA && type === 'INDIVIDUAL') {
        return { 
            isValid: false, 
            status: 'MISMATCH', 
            reasonCode: 'ENTITY_TYPE_MISMATCH',
            explanation: 'The detected format (11 digits) corresponds to an Italian Partita IVA, which applies to legal entities and self-employed businesses.'
        };
    }

    // 2. Semantic Check for Codice Fiscale
    if (isCodiceFiscale && metadata) {
        const mismatchFields: string[] = [];

        // Birth Date Check (Characters 7-11)
        if (metadata.birthDate) {
            const d = new Date(metadata.birthDate);
            if (!isNaN(d.getTime())) {
                const yy = d.getFullYear().toString().slice(-2);
                const mm = MONTH_CODES[d.getMonth() + 1];
                let dd = d.getDate();
                if (metadata.gender === 'F') dd += 40;
                const expectedBirthPart = yy + mm + dd.toString().padStart(2, '0');
                const actualBirthPart = sanitized.substring(6, 11);
                
                if (expectedBirthPart !== actualBirthPart) {
                    mismatchFields.push('birthDate');
                    if (metadata.gender) mismatchFields.push('gender');
                }
            }
        }

        // Birth Place Check (Characters 12-15)
        let resolvedCode = metadata.birthPlaceCode?.toUpperCase();
        
        // If code is missing, try to resolve from name
        if (!resolvedCode && metadata.birthPlaceName) {
            const name = metadata.birthPlaceName.toUpperCase().trim();
            // Search in Italian cities
            const city = ITALIAN_CITIES.find(c => c.n.toUpperCase() === name);
            if (city) {
                resolvedCode = city.c;
            } else {
                // Search in foreign countries (direct match or key)
                const countryEntry = Object.entries(FOREIGN_COUNTRIES).find(([code, cName]) => cName === name);
                if (countryEntry) {
                    resolvedCode = countryEntry[0];
                }
            }
        }

        if (resolvedCode) {
            if (resolvedCode !== sanitized.substring(11, 15)) {
                mismatchFields.push(metadata.birthPlaceCode ? 'birthPlaceCode' : 'birthPlaceName');
            }
        }

        // LastName Check
        if (metadata.lastName) {
            const expectedLastNamePart = extractCFLastNameCode(metadata.lastName);
            if (expectedLastNamePart !== sanitized.substring(0, 3)) {
                mismatchFields.push('lastName');
            }
        }

        // FirstName Check
        if (metadata.firstName) {
            const expectedFirstNamePart = extractCFFirstNameCode(metadata.firstName);
            if (expectedFirstNamePart !== sanitized.substring(3, 6)) {
                mismatchFields.push('firstName');
            }
        }
        
        if (mismatchFields.length > 0) {
            const details = decodeItalianTIN(sanitized);
            return {
                isValid: false,
                status: 'MISMATCH',
                reasonCode: 'ID_DATA_INCONSISTENT',
                mismatchFields,
                explanation: `Inconsistency in ${mismatchFields.join(', ')}. TIN details: ${details}`
            };
        }
    }

    if (isCodiceFiscale) {
        if (validateItalianChecksum(sanitized)) {
            return { 
                isValid: true, 
                status: 'VALID', 
                isOfficialMatch: true, 
                explanation: type === 'ANY'
                    ? 'Format valid for Individuals (Codice Fiscale). Note: This identifier is not valid for legal Entities.'
                    : decodeItalianTIN(sanitized)
            };
        } else {
            return { isValid: false, status: 'INVALID_CHECKSUM', explanation: 'Failed Italian Codice Fiscale checksum validation.' };
        }
    }

    return { 
        isValid: true, 
        status: 'VALID', 
        isOfficialMatch: true, 
        explanation: type === 'ANY'
            ? 'Format valid for Entities (Partita IVA). Not valid for Individuals.'
            : 'Matches official Italian Partita IVA format.' 
    };
};

function validateItalianChecksum(tin: string): boolean {
    const oddValues: Record<string, number> = {
        '0':1,'1':0,'2':5,'3':7,'4':9,'5':13,'6':15,'7':17,'8':19,'9':21,
        'A':1,'B':0,'C':5,'D':7,'E':9,'F':13,'G':15,'H':17,'I':19,'J':21,
        'K':2,'L':4,'M':18,'N':20,'O':11,'P':3,'Q':6,'R':8,'S':12,'T':14,
        'U':16,'V':22,'W':20,'X':25,'Y':24,'Z':23
    };
    
    const evenValues: Record<string, number> = {
        '0':0,'1':1,'2':2,'3':3,'4':4,'5':5,'6':6,'7':7,'8':8,'9':9,
        'A':0,'B':1,'C':2,'D':3,'E':4,'F':5,'G':6,'H':7,'I':8,'J':9,
        'K':10,'L':11,'M':12,'N':13,'O':14,'P':15,'Q':16,'R':17,'S':18,'T':19,
        'U':20,'V':21,'W':22,'X':23,'Y':24,'Z':25
    };
    
    let sum = 0;
    for (let i = 0; i < 15; i++) {
        const char = tin[i];
        if ((i + 1) % 2 !== 0) {
            sum += oddValues[char] || 0;
        } else {
            sum += evenValues[char] || 0;
        }
    }
    
    const expectedChar = String.fromCharCode(65 + (sum % 26));
    return expectedChar === tin[15];
}

function decodeItalianTIN(tin: string): string {
    if (tin.length !== 16) return '';
    
    const surnamePart = tin.substring(0, 3);
    const namePart = tin.substring(3, 6);
    
    const yy = tin.substring(6, 8);
    const monthChar = tin[8];
    let dayNum = parseInt(tin.substring(9, 11));
    const gender = dayNum > 40 ? 'Female' : 'Male';
    if (dayNum > 40) dayNum -= 40;
    
    const dd = dayNum.toString().padStart(2, '0');
    const mmChar = tin[8];
    const mm = Object.keys(MONTH_CODES).find(k => MONTH_CODES[parseInt(k)] === mmChar)?.padStart(2, '0') || '??';
    
    const placeCode = tin.substring(11, 15);
    let placeName = 'Unknown';
    if (placeCode.startsWith('Z')) {
        placeName = FOREIGN_COUNTRIES[placeCode] || `Foreign Country (${placeCode})`;
    } else {
        const city = ITALIAN_CITIES.find(c => c.c === placeCode);
        placeName = city ? city.n : `Italian City (${placeCode})`;
    }
    
    return `Person (${gender}), born on ${dd}/${mm}/${yy} in ${placeName}. Name/Surname codes: ${surnamePart} ${namePart}.`;
}

function extractCFLastNameCode(lastName: string): string {
    const cleaned = lastName.toUpperCase().replace(/[^A-Z]/g, '');
    const consonants = cleaned.replace(/[AEIOU]/g, '');
    const vowels = cleaned.replace(/[^AEIOU]/g, '');
    return (consonants + vowels + 'XXX').substring(0, 3);
}

function extractCFFirstNameCode(firstName: string): string {
    const cleaned = firstName.toUpperCase().replace(/[^A-Z]/g, '');
    const consonants = cleaned.replace(/[AEIOU]/g, '');
    const vowels = cleaned.replace(/[^AEIOU]/g, '');
    
    // Specical rule for first name consonants
    if (consonants.length >= 4) {
        return consonants[0] + consonants[2] + consonants[3];
    }
    return (consonants + vowels + 'XXX').substring(0, 3);
}

/**
 * APPENDIX: FORENSIC CRITERIA
 * Italy's Codice Fiscale is a biographical identifier-formula.
 * 1. Omocodia: When two individuals share the same code, the Tax Authority replaces 
 *    numeric digits with letters according to a fixed mapping:
 *    0=L, 1=M, 2=N, 3=P, 4=Q, 5=R, 6=S, 7=T, 8=U, 9=V.
 * 2. Structure: 3 chars (Surname) + 3 chars (First Name) + 2 digits (Year) + 
 *    1 char (Month) + 2 digits (Day/Gender) + 4 chars (Municipality/Foreign Country) + 
 *    1 char (Check Digit).
 * 3. Gender: Females have 40 added to their birth day (e.g., Day 05 becomes 45).
 */

