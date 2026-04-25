import { HolderMetadata, TinValidationResult, CountryRegulatoryInfo, TinInfo, TinRequirement } from './index';

/**
 * TIN Validation for Indonesia (ID)
 * NPWP (15 or 16 digits)
 */

/**
 * TIN Requirements for Indonesia
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
 * Country Metadata for Indonesia
 */
export const COUNTRY_INFO: CountryRegulatoryInfo = {
    name: 'Indonesia',
    authority: 'Directorate General of Taxes (DGT)',
    compliance: {
        crsStatus: 'Participating',
        crsDate: 'September 2018',
        fatcaStatus: 'Model 1 (In Force)'
    },
    residency: {
        individual: 'Se considera residente si reside en Indonesia, si permanece en Indonesia por más de 183 días en 12 meses, o si tiene intención de residir allí.',
        entity: 'Se considera residente si está establecida o domiciliada en Indonesia.',
        notes: 'Criterio de permanencia física o intención de residencia.'
    }
};

/**
 * TIN Metadata for Indonesia (Era 6.3)
 */
export const TIN_INFO: TinInfo = {
    name: 'NPWP',
    description: 'Indonesian NPWP (Tax Identification Number) issued by the DGT.',
    placeholder: '12.345.678.9-012.000',
    officialLink: 'https://www.pajak.go.id',
    isOfficial: true,
    lastUpdated: '2026-04-24',
    source: 'OECD Portal / DGT',
    entityDifferentiation: {
        logic: 'Prefix analysis.',
        individualDescription: 'NPWP starting with 01, 04, 06-09 or 16-digit NIK.',
        businessDescription: 'NPWP starting with 01-03 (Companies), 02 (Government), etc.'
    }
};

/**
 * Indonesia TIN Validator - Era 6.3
 */
export const validateIDTIN = (
    value: string, 
    type: 'INDIVIDUAL' | 'ENTITY' | 'ANY' = 'ANY', 
    metadata?: HolderMetadata
): TinValidationResult => {
    const sanitized = value.replace(/[\s.-]/g, '');

    if ((sanitized.length === 15 || sanitized.length === 16) && /^[0-9]+$/.test(sanitized)) {
        if (sanitized.length === 15) {
            const taxpayerType = sanitized.substring(0, 2);
            const isEntityPrefix = ['01', '02', '03', '07', '08'].includes(taxpayerType);
            const isIndividualPrefix = ['04', '06', '09'].includes(taxpayerType);

            if (isEntityPrefix && type === 'INDIVIDUAL') {
                return {
                    isValid: false,
                    status: 'MISMATCH',
                    reasonCode: 'ENTITY_TYPE_MISMATCH',
                    explanation: `The Indonesian NPWP prefix '${taxpayerType}' is reserved for Companies or Government Institutions.`
                };
            }

            if (isIndividualPrefix && type === 'ENTITY') {
                return {
                    isValid: false,
                    status: 'MISMATCH',
                    reasonCode: 'ENTITY_TYPE_MISMATCH',
                    explanation: `The Indonesian NPWP prefix '${taxpayerType}' is reserved for Individual Taxpayers.`
                };
            }
        }

        return { 
            isValid: true, 
            status: 'VALID', 
            isOfficialMatch: true, 
            explanation: decodeIndonesiaTIN(sanitized)
        };
    }

    return { 
        isValid: false, 
        status: 'INVALID_FORMAT',
        explanation: 'Value does not match Indonesian NPWP (15 or 16 digits) format.'
    };
};

function decodeIndonesiaTIN(tin: string): string {
    if (tin.length === 15) {
        const taxpayerType = tin.substring(0, 2);
        const kppCode = tin.substring(9, 12);
        const branchCode = tin.substring(12, 15);
        const isHeadOffice = branchCode === '000';
        
        const types: Record<string, string> = {
            '01': 'Corporate Taxpayer',
            '02': 'Government Institution',
            '03': 'Corporate Taxpayer (Other)',
            '04': 'Individual Taxpayer',
            '06': 'Foreign Individual',
            '07': 'Corporate Taxpayer (Foreign)',
            '08': 'Corporate Taxpayer (Special)',
            '09': 'Individual Taxpayer (Special)'
        };
        
        const typeDesc = types[taxpayerType] || 'Standard Taxpayer';
        const branchType = isHeadOffice ? 'Head Office' : `Branch #${branchCode}`;
        
        return `NPWP: ${typeDesc}, ${branchType}. Registered at Tax Office (KPP) ${kppCode}.`;
    }
    
    if (tin.length === 16) {
        return 'Indonesian NPWP (New 16-digit format / NIK-based).';
    }
    
    return 'Indonesian Tax Identification Number.';
}

/**
 * APPENDIX: FORENSIC CRITERIA
 * Indonesia uses the NPWP (Nomor Pokok Wajib Pajak) for all taxpayers.
 * 1. Old Structure (15 digits): XX.XXX.XXX.X-XXX.XXX.
 *    - Digits 1-2: Taxpayer type (e.g., 01 for Corporate, 04 for Individual).
 *    - Digits 3-8: Taxpayer identification sequence.
 *    - Digit 9: Check digit.
 *    - Digits 10-12: KPP (Tax Office) code.
 *    - Digits 13-15: Branch code (000 for Head Office).
 * 2. New Structure (16 digits): 
 *    - For individuals, this is identical to the NIK (National ID Number).
 * 3. Validation: Structural verification based on length and taxpayer type prefix.
 * 4. Residency: 183-day rule or intention to reside in Indonesia.
 */
