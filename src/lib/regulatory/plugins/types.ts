
import { TinRequirement } from './i18n';

export type TinValidationType = 'INDIVIDUAL' | 'ENTITY' | 'ANY';

/**
 * Resultado de validación enriquecido (Era 6)
 */
export interface TinValidationResult {
    isValid: boolean;
    status: 'VALID' | 'INVALID_FORMAT' | 'MISMATCH' | 'VALID_UNOFFICIAL' | 'INVALID_CHECKSUM';
    reasonCode?: string; // Ej: 'DOB_MISMATCH'
    mismatchFields?: string[]; // Ej: ['birthDate']
    message?: string;
    isOfficialMatch?: boolean; // True if passed official check
    isUnofficialMatch?: boolean; // True if passed unofficial check
    explanation?: string; // Information for the user
    errorDetails?: string; // Detailed diagnostic info
}

export interface HolderMetadata {
    firstName?: string;
    lastName?: string;
    birthDate?: Date | string; // YYYY-MM-DD
    gender?: 'M' | 'F';
    birthPlaceCode?: string; // e.g. 'H501' for Rome (Italy) or ISO for country
    birthPlaceName?: string; // e.g. 'Roma'
    isEntity?: boolean;
}

export interface TinValidationParams {
    country: string; // ISO 2-letter country code
    value: string;
    type?: TinValidationType;
    metadata?: HolderMetadata;
}

export interface FiscalResidenceInfo {
    individual: string;
    entity: string;
    notes?: string;
}

export interface CountryRegulatoryInfo {
    name: string;
    authority: string;
    compliance: {
        crsStatus: string;
        crsDate?: string;
        fatcaStatus?: string;
    };
    residency: FiscalResidenceInfo;
}

export interface TinInfo {
    name?: string; // Nombre del Impuesto (opcional pero recomendado)
    description: string;
    placeholder: string;
    officialLink?: string;
    isOfficial: boolean;
    lastUpdated: string; // ISO Date YYYY-MM-DD
    source: string; // e.g. 'OECD Portal'
    entityDifferentiation?: {
        logic: string;
        individualDescription: string;
        businessDescription: string;
    };
}
