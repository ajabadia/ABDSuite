/**
 * Regulatory Metadata & Logic Types (ERA 5)
 * Mirror of ABDFATCACRS for seamless "Plug & Play" integration.
 */

export type TinValidationType = 'INDIVIDUAL' | 'ENTITY' | 'ANY';

export interface HolderMetadata {
    firstName?: string;
    lastName?: string;
    birthDate?: Date | string; // YYYY-MM-DD
    gender?: 'M' | 'F';
    birthPlaceCode?: string;
    birthPlaceName?: string;
    isEntity?: boolean;
}

export type TinValidationStatus = 'VALID' | 'INVALID' | 'INVALID_FORMAT' | 'EXEMPTED' | 'MISMATCH' | 'NOT_APPLICABLE' | 'VALID_UNOFFICIAL' | 'INVALID_CHECKSUM';

export type TinMismatchReason = 
    | 'DOB_MISMATCH' 
    | 'GENDER_MISMATCH' 
    | 'CITY_MISMATCH' 
    | 'NAME_MISMATCH' 
    | 'UNKNOWN_MISMATCH';

export interface TinRequirement {
    key: string;
    label: string;
    type: 'date' | 'string' | 'select' | 'number' | 'text';
    options?: { value: string, label: string }[];
    suggestions?: string[];
    scope?: 'INDIVIDUAL' | 'ENTITY';
    placeholder?: string;
}

export type TinRequirementLegacy = string;
export type TinRequirementAny = TinRequirement | TinRequirementLegacy;

export interface TinValidationResult {
    isValid: boolean;
    status: TinValidationStatus;
    country: string;
    tinType?: string;
    reasonCode?: string; // e.j. 'DOB_MISMATCH' o 'NO_TIN_ISSUED'
    rawMismatchFields?: string[]; // ['dob', 'gender']
    message?: string;
    explanation?: string;
    errorDetails?: string;
    severity: 'ERROR' | 'WARNING' | 'INFO';
    missingData?: TinRequirement[];
}

export interface TinJurisdictionMetadata {
    name?: string;          // p.ej. "NINO", "Codice Fiscale"
    description?: string;
    placeholder?: string;
    officialLink?: string;
    source?: string;       // p.ej. "OECD", "IRS", "AEAT"
    isOfficial?: boolean;
    lastUpdated?: string;  // ISO Date
    entityDifferentiation?: {
        logic: string;
        individualDescription: string;
        businessDescription: string;
    };
}

export interface CountryRegulatoryInfo {
    name: string;
    authority: string;
    compliance: {
        crsStatus: string;
        crsDate?: string;
        fatcaStatus?: string;
    };
    residency: {
        individual: string;
        entity: string;
        notes?: string;
    };
}

export interface TinValidationPluginResult {
    isValid: boolean;
    status: 'VALID' | 'INVALID' | 'INVALID_FORMAT' | 'MISMATCH' | 'VALID_UNOFFICIAL' | 'INVALID_CHECKSUM';
    reasonCode?: string;
    mismatchFields?: string[];
    message?: string;
    explanation?: string;
    errorDetails?: string;
}

export type TinValidationPluginResponse = boolean | TinValidationPluginResult;

/**
 * Functional interface for TIN Validator Plugins (Unified Standard Era 6).
 */
export interface TinValidatorPlugin {
    countryCode: string;
    info?: TinJurisdictionMetadata;
    countryInfo?: CountryRegulatoryInfo;
    requirements?: TinRequirementAny[];
    validate: (value: string, type: TinValidationType, metadata?: HolderMetadata) => TinValidationPluginResponse;
}
