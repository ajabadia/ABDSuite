
import { HolderMetadata, TinValidationResult, CountryRegulatoryInfo, FiscalResidenceInfo, TinInfo } from './index';
import { TinRequirement } from './i18n';

/**
 * TIN Validation for Austria (AT)
 * 9 digits
 */

export const validateATTIN = (value: string, type: 'INDIVIDUAL' | 'ENTITY' | 'ANY' = 'ANY', metadata?: HolderMetadata): TinValidationResult => {
    const sanitized = value.replace(/[\s-]/g, '');

    if (sanitized.length === 9 && /^[0-9]{9}$/.test(sanitized)) {
        return { isValid: true, status: 'VALID' };
    }

    return { isValid: false, status: 'INVALID_FORMAT' };
};

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

export const COUNTRY_INFO: CountryRegulatoryInfo = {
    name: 'Austria',
    authority: 'Federal Ministry of Finance (BMF)',
    compliance: {
        crsStatus: 'Participating',
        crsDate: 'September 2017',
        fatcaStatus: 'Model 2 (In Force)'
    },
    residency: {
        individual: 'Residente si tiene domicilio (Wohnsitz) o residencia habitual (gewöhnlicher Aufenthalt - más de 6 meses) en Austria.',
        entity: 'Residentes si tienen su domicilio social (Sitz) o su lugar de dirección efectiva (Ort der Geschäftsleitung) en Austria.',
        notes: 'Criterio físico u organizativo según la Ley del Impuesto sobre la Renta (EStG).'
    }
};

export const TIN_INFO: TinInfo = {
    description: 'Austrian Tax Identification Number / Abgabenkontonummer (9 digits).',
    placeholder: '12-345/6789',
    officialLink: 'https://www.bmf.gv.at',
    isOfficial: true,
    lastUpdated: '2026-04-23',
    source: 'OECD Portal (DOCS/tin/TIN_by_country_es)',
    entityDifferentiation: {
        logic: 'Estructuralmente Idénticos',
        individualDescription: 'Abgabenkontonummer (9 dígitos).',
        businessDescription: 'Abgabenkontonummer (9 dígitos) idéntico formato para empresas.'
    }
};
