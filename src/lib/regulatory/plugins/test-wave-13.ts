
import { validateJurisdictionalTIN } from './index';

const testCases = [
    { country: 'PE', value: '10123456789', type: 'INDIVIDUAL', expected: true, label: 'Peru RUC Ind' },
    { country: 'PE', value: '20123456789', type: 'ENTITY', expected: true, label: 'Peru RUC Ent' },
    { country: 'UY', value: '123456789012', expected: true, label: 'Uruguay RUT' },
    { country: 'ZA', value: '1234567890', expected: true, label: 'South Africa 10-digit' },
    { country: 'IL', value: '123456789', expected: true, label: 'Israel 9-digit' },
    { country: 'QA', value: '12345678901', expected: true, label: 'Qatar 11-digit' }
];

console.log('--- WAVE 13 VERIFICATION ---');
testCases.forEach(tc => {
    const result = validateJurisdictionalTIN({ country: tc.country, value: tc.value, type: tc.type as any });
    const status = result.isValid === tc.expected ? '✅' : '❌';
    console.log(`${status} [${tc.country}] ${tc.label}: ${result.isValid ? 'Valid' : 'Invalid'} - ${result.explanation || result.message}`);
});
