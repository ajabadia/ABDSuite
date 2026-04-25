
import { HolderMetadata, TinValidationResult, CountryRegulatoryInfo, TinInfo, TinRequirement } from './index';

/**
 * TIN Validation for Afghanistan (AF)
 * TIN (10 digits)
 */

/**
 * TIN Requirements for Afghanistan
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
 * Country Metadata for Afghanistan
 */
export const COUNTRY_INFO: CountryRegulatoryInfo = {
    name: 'Afganistán',
    authority: 'Afghanistan Revenue Department (ARD)',
    compliance: {
        crsStatus: 'Non-Participating',
        crsDate: 'N/A',
        fatcaStatus: 'N/A'
    },
    residency: {
        individual: 'Se considera residente si permanece en Afganistán durante más de 183 días en el año solar.',
        entity: 'Se considera residente si está incorporada en Afganistán.',
        notes: 'Criterio de permanencia física o constitución legal.'
    }
};

/**
 * TIN Metadata for Afghanistan (Era 6.3)
 */
export const TIN_INFO: TinInfo = {
    name: 'TIN',
    description: 'Afghan TIN issued by the ARD.',
    placeholder: '1234567890',
    officialLink: 'https://ard.gov.af',
    isOfficial: true,
    lastUpdated: '2026-04-24',
    source: 'Local Authority / Afghanistan ARD',
    entityDifferentiation: {
        logic: 'Structurally identical identifiers.',
        individualDescription: '10-digit TIN identifier.',
        businessDescription: '10-digit TIN identifier.'
    }
};

/**
 * Afghanistan TIN Validator - Era 6.3
 */
export const validateAFTIN = (
    value: string, 
    type: 'INDIVIDUAL' | 'ENTITY' | 'ANY' = 'ANY', 
    metadata?: HolderMetadata
): TinValidationResult => {
    const sanitized = value.replace(/[\s-]/g, '');

    if (sanitized.length === 10 && /^[0-9]{10}$/.test(sanitized)) {
        return { 
            isValid: true, 
            status: 'VALID', 
            isOfficialMatch: true, 
            explanation: 'Matches official Afghan TIN (10 digits) format.' 
        };
    }

    return { 
        isValid: false, 
        status: 'INVALID_FORMAT',
        explanation: 'Value does not match Afghan TIN (10 digits) format.'
    };
};

/**
 * APPENDIX: FORENSIC CRITERIA
 * Afghanistan's Tax Identification Number (TIN) is a mandatory 10-digit numeric code.
 * 1. Scope: Issued to both individuals and entities for all tax-related activities.
 * 2. Structure: Numeric sequence of 10 digits without encoded biographical data.
 * 3. Validation: Structural verification against the 10-digit length.
 * 4. Residency: Primarily based on the 183-day presence rule within the Solar Year.
 */

