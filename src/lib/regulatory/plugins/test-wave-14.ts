
import { validateJurisdictionalTIN } from './index';

const testCases = [
    { country: 'PY', value: '1234567-1', expected: true, label: 'Paraguay 7+1' },
    { country: 'BO', value: '123456789', expected: true, label: 'Bolivia 9-digit' },
    { country: 'GT', value: '12345678', expected: true, label: 'Guatemala 8-digit' },
    { country: 'HN', value: '12345678901234', expected: true, label: 'Honduras 14-digit' },
    { country: 'CR', value: '123456789', expected: true, label: 'Costa Rica 9-digit' }
];

console.log('--- WAVE 14 VERIFICATION ---');
testCases.forEach(tc => {
    const result = validateJurisdictionalTIN({ country: tc.country, value: tc.value });
    const status = result.isValid === tc.expected ? '✅' : '❌';
    console.log(`${status} [${tc.country}] ${tc.label}: ${result.isValid ? 'Valid' : 'Invalid'} - ${result.explanation || result.message}`);
});
