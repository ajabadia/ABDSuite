
/**
 * Jurisdictions that do not issue TINs or have restricted issuance
 * Based on OECD AEOI portal and user-provided detailed list (2025)
 */

export interface JurisdictionExemption {
    status: 'NO_TIN' | 'CONDITIONAL' | 'NON_RECIPROCAL';
    details: string;
    entityRequired?: boolean;
}

export const NO_TIN_JURISDICTIONS: Record<string, JurisdictionExemption> = {
    'BM': { status: 'NO_TIN', details: 'Bermuda does not issue TINs' },
    'KY': { status: 'NO_TIN', details: 'Cayman Islands do not issue TINs' },
    'TC': { status: 'NO_TIN', details: 'Turks and Caicos do not issue TINs' },
    'VG': { status: 'NO_TIN', details: 'British Virgin Islands do not issue TINs' },
    'MC': { status: 'NO_TIN', details: 'Monaco does not issue TINs' },
    'MS': { status: 'NO_TIN', details: 'Montserrat does not issue TINs' },
    'BS': { status: 'NO_TIN', details: 'Bahamas does not issue TINs for residents' },
    'AE': { status: 'NO_TIN', details: 'UAE does not issue TINs for individuals. VAT registration number used for entities.', entityRequired: true },
    'BH': { status: 'NO_TIN', details: 'Bahrain does not issue TINs for individuals. VAT/CR number used for entities.', entityRequired: true },
    'AI': { status: 'CONDITIONAL', details: 'Anguilla: Issued only upon registration for specific activities' },
    'AG': { status: 'CONDITIONAL', details: 'Antigua and Barbuda: Issued only to tax-return obligors' },
    'DM': { status: 'CONDITIONAL', details: 'Dominica: TINs are not automatically assigned' },
    'KN': { status: 'CONDITIONAL', details: 'St. Kitts and Nevis: Not automatically assigned to residents' },
    'QA': { status: 'CONDITIONAL', details: 'Qatar: Issued primarily to legal entities and taxpayers with specific obligations' },
    'OM': { status: 'CONDITIONAL', details: 'Oman: Issued primarily to business entities and for VAT purposes' },
    'LK': { status: 'CONDITIONAL', details: 'Sri Lanka: Issued upon registration; not universal for all residents' },
    'AQ': { status: 'NO_TIN', details: 'Antarctica does not issue TINs' },
    'KP': { status: 'NO_TIN', details: 'North Korea (No AEOI exchange/TIN format documented)' }
};
