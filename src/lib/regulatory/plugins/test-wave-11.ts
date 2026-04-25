
import { validateJurisdictionalTIN } from './index';

const testCases = [
    { country: 'BB', value: '1234567890123', expected: true, label: 'Barbados 13-digit' },
    { country: 'BZ', value: '1234567', expected: true, label: 'Belize 7-digit' },
    { country: 'VU', value: '12345678', expected: true, label: 'Vanuatu 8-digit' },
    { country: 'CW', value: '123456789', expected: true, label: 'Curaçao 9-digit' },
    { country: 'AW', value: '12345678', expected: true, label: 'Aruba 8-digit' }
];

console.log('--- WAVE 11 VERIFICATION ---');
testCases.forEach(tc => {
    const result = validateJurisdictionalTIN({ country: tc.country, value: tc.value });
    const status = result.isValid === tc.expected ? '✅' : '❌';
    console.log(`${status} [${tc.country}] ${tc.label}: ${result.isValid ? 'Valid' : 'Invalid'} - ${result.explanation || result.message}`);
});
