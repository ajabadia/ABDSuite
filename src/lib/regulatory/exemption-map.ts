/**
 * Tin Exemption Map (v2025)
 * Based on OECD/IRS Jurisdictional Lists.
 * Defines jurisdictions that do not issue TINs or have specific exemptions.
 */

export interface TinExemptionInfo {
    iso2: string;
    reason: 'NO_TIN_ISSUED' | 'ADMINISTRATIVE_EXEMPTION' | 'NON_RECIPROCAL' | 'CONDITIONAL';
    comment: string;
    entityRequired?: boolean;
}

export const EXEMPTION_MAP: Record<string, TinExemptionInfo> = {
    'BS': { iso2: 'BS', reason: 'NO_TIN_ISSUED', comment: 'Bahamas does not issue TINs.' },
    'BM': { iso2: 'BM', reason: 'NO_TIN_ISSUED', comment: 'Bermuda does not issue TINs.' },
    'KY': { iso2: 'KY', reason: 'NO_TIN_ISSUED', comment: 'Cayman Islands do not issue TINs.' },
    'TC': { iso2: 'TC', reason: 'NO_TIN_ISSUED', comment: 'Turks and Caicos do not issue TINs.' },
    'VG': { iso2: 'VG', reason: 'NO_TIN_ISSUED', comment: 'British Virgin Islands do not issue TINs.' },
    'MC': { iso2: 'MC', reason: 'NO_TIN_ISSUED', comment: 'Monaco does not issue TINs.' },
    'MS': { iso2: 'MS', reason: 'NO_TIN_ISSUED', comment: 'Montserrat does not issue TINs.' },
    'AE': { 
        iso2: 'AE', 
        reason: 'ADMINISTRATIVE_EXEMPTION', 
        comment: 'UAE does not issue TINs for individuals.',
        entityRequired: true 
    },
    'BH': { iso2: 'BH', reason: 'NON_RECIPROCAL', comment: 'Bahrain does not require TIN for AEOI exchange.' },
    'AI': { iso2: 'AI', reason: 'CONDITIONAL', comment: 'Anguilla: Issued only upon registration for specific activities.' },
    'AG': { iso2: 'AG', reason: 'CONDITIONAL', comment: 'Antigua and Barbuda: Issued only to tax-return obligors.' },
    'BZ': { iso2: 'BZ', reason: 'CONDITIONAL', comment: 'Belize: Issued only to employed or business persons.' },
    'DM': { iso2: 'DM', reason: 'CONDITIONAL', comment: 'Dominica: TINs are not automatically assigned.' },
    'WS': { iso2: 'WS', reason: 'CONDITIONAL', comment: 'Samoa: Issued only for economic activities.' },
    'KN': { iso2: 'KN', reason: 'CONDITIONAL', comment: 'St. Kitts and Nevis: Not automatically assigned to residents.' }
};
