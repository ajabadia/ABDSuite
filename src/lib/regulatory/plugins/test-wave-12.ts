
import { validateJurisdictionalTIN } from './index';

const testCases = [
    { country: 'MU', value: '12345678', expected: true, label: 'Mauritius 8-digit' },
    { country: 'KE', value: 'P123456789X', expected: true, label: 'Kenya P+9d+L' },
    { country: 'NG', value: '123456789012', expected: true, label: 'Nigeria 12-digit' },
    { country: 'OM', value: '12345678', expected: true, label: 'Oman 8-digit' },
    { country: 'JM', value: '123456789', expected: true, label: 'Jamaica 9-digit' }
];

console.log('--- WAVE 12 VERIFICATION ---');
testCases.forEach(tc => {
    const result = validateJurisdictionalTIN({ country: tc.country, value: tc.value });
    const status = result.isValid === tc.expected ? '✅' : '❌';
    console.log(`${status} [${tc.country}] ${tc.label}: ${result.isValid ? 'Valid' : 'Invalid'} - ${result.explanation || result.message}`);
});
