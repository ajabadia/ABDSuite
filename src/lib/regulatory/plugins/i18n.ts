
/**
 * I18n Dictionary for Jurisdictional Metadata
 * Provides professional labels for biographic requirements.
 * Era 6: Key-based dynamic translation.
 */

export const TIN_LABELS = {
    birthDate: { en: 'Birth Date', es: 'Fecha de Nacimiento' },
    gender: { en: 'Gender', es: 'Género' },
    firstName: { en: 'First Name', es: 'Nombre' },
    lastName: { en: 'Last Name', es: 'Apellidos' },
    birthPlaceCode: { en: 'Birth Place Code', es: 'Código Lugar de Nacimiento' },
    birthPlaceName: { en: 'Birth Place Name', es: 'Lugar de Nacimiento' },
    genderOptions: {
        male: { en: 'Male', es: 'Masculino' },
        female: { en: 'Female', es: 'Femenino' }
    }
};

/**
 * Standard TIN Denominations by ISO-3166
 * Fed to the Suite for dynamic display.
 */
export const TIN_NAMES: Record<string, { en: string; es: string }> = {
    ES: { en: 'NIF / NIE', es: 'NIF / NIE' },
    IT: { en: 'Codice Fiscale', es: 'Codice Fiscale' },
    FR: { en: 'Numéro Fiscal', es: 'Numéro Fiscal' },
    GB: { en: 'NINO / UTR', es: 'NINO / UTR' },
    BG: { en: 'EGN', es: 'EGN' },
    EE: { en: 'Isikukood', es: 'Isikukood' },
    CZ: { en: 'Rodné číslo', es: 'Rodné číslo' },
    SK: { en: 'Rodné číslo', es: 'Rodné číslo' },
    GR: { en: 'AFM', es: 'AFM' },
    HR: { en: 'OIB', es: 'OIB' },
    HU: { en: 'Tax ID', es: 'Tax ID' },
    SI: { en: 'Tax Number', es: 'Davčna številka' },
    LV: { en: 'Personal Code', es: 'Personal Code' },
    MT: { en: 'Identity / Tax No', es: 'ID / Tax No' },
    DO: { en: 'RNC / Cédula', es: 'RNC / Cédula' },
    GT: { en: 'NIT', es: 'NIT' },
    HN: { en: 'RTN', es: 'RTN' },
    NI: { en: 'RUC', es: 'RUC' },
    PY: { en: 'RUC', es: 'RUC' },
    SV: { en: 'NIT', es: 'NIT' },
    TT: { en: 'BIR Number', es: 'BIR Number' },
    GG: { en: 'TIN', es: 'TIN' },
    GI: { en: 'Tax Reference', es: 'Tax Reference' },
    MU: { en: 'TIN', es: 'TIN' },
    VN: { en: 'Tax Code', es: 'Tax Code' },
    PH: { en: 'TIN', es: 'TIN' },
    TW: { en: 'Unified ID', es: 'Unified ID' },
    MO: { en: 'Tax Number', es: 'Tax Number' },
    AZ: { en: 'VÖEN', es: 'VÖEN' },
    KZ: { en: 'IIN / BIN', es: 'IIN / BIN' },
    NG: { en: 'TIN', es: 'TIN' },
    KE: { en: 'KRA PIN', es: 'KRA PIN' },
    MA: { en: 'ICE', es: 'ICE' },
    OM: { en: 'Civil ID', es: 'Civil ID' },
    BB: { en: 'TAMIS TIN', es: 'TAMIS TIN' },
    LC: { en: 'Tax Identification Number', es: 'Tax Identification Number' },
    VC: { en: 'Tax Identification Number', es: 'Tax Identification Number' },
    GD: { en: 'Tax Identification Number', es: 'Tax Identification Number' },
    SX: { en: 'CRIB Number', es: 'CRIB Number' },
    AW: { en: 'Persoonsnummer', es: 'Persoonsnummer' },
    VU: { en: 'Tax Identification Number', es: 'Tax Identification Number' },
    CK: { en: 'RMD Number', es: 'RMD Number' },
    NU: { en: 'Tax Identification Number', es: 'Tax Identification Number' },
    'WS': { en: 'Tax Identification Number', es: 'Tax Identification Number' },
    'CW': { en: 'CRIB Number', es: 'CRIB Number' },
    'EC': { en: 'RUC / Cédula', es: 'RUC / Cédula' },
    'JO': { en: 'TIN', es: 'TIN' },
    'LB': { en: 'MOF Number', es: 'MOF Number' },
    'QA': { en: 'QID / TIN', es: 'QID / TIN' },
    'KW': { en: 'Civil ID / TIN', es: 'Civil ID / TIN' },
    'GH': { en: 'Ghana Card PIN', es: 'Ghana Card PIN' },
    'CR': { en: 'Cédula Identidad / Jurídica', es: 'Cédula Identidad / Jurídica' },
    'BS': { en: 'Tax Identification Number', es: 'Tax Identification Number' },
    'BZ': { en: 'Tax Identification Number', es: 'Tax Identification Number' },
    'SC': { en: 'Tax Identification Number', es: 'Tax Identification Number' },
    'JM': { en: 'Taxpayer Registration Number', es: 'Taxpayer Registration Number' },
    US: { en: 'SSN / ITIN / EIN', es: 'SSN / ITIN / EIN' },
    DE: { en: 'Steuer-ID / St.-Nr.', es: 'Steuer-ID / St.-Nr.' },
    MX: { en: 'RFC / CURP', es: 'RFC / CURP' },
    AR: { en: 'CUIT / CUIL', es: 'CUIT / CUIL' },
    BE: { en: 'NN / No. d’identification', es: 'NN / No. d’identification' },
    CA: { en: 'SIN / BN', es: 'SIN / BN' },
    CH: { en: 'AHV / UID', es: 'AHV / UID' },
    PL: { en: 'PESEL / NIP', es: 'PESEL / NIP' },
    ZA: { en: 'TIN / National ID', es: 'TIN / National ID' }
    // ... rest will be fed by iso3166 in the UI as fallback
};

export interface TinRequirement {
    key: 'birthDate' | 'gender' | 'firstName' | 'lastName' | 'birthPlaceCode' | 'birthPlaceName' | 'holderType';
    label: string; // Now used as a KEY for i18next in the Suite
    type: 'date' | 'select' | 'text';
    options?: { value: string; label: string }[];
    suggestions?: string[];
    scope?: 'INDIVIDUAL' | 'ENTITY' | 'BOTH';
    placeholder?: string;
}
