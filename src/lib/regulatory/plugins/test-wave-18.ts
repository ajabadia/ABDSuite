
import { validateJurisdictionalTIN } from './index';

const testCases = [
    { country: 'EG', value: '123456789', expected: true, label: 'Egypt 9-digit' },
    { country: 'NG', value: '1234567890', expected: true, label: 'Nigeria 10-digit' },
    { country: 'NG', value: '123456789012', expected: true, label: 'Nigeria 12-digit' },
    { country: 'KE', value: 'A123456789B', expected: true, label: 'Kenya KRA PIN' },
    { country: 'MA', value: '12345678', expected: true, label: 'Morocco 8-digit' },
    { country: 'TN', value: '12345678A', expected: true, label: 'Tunisia 8+1' }
];

console.log('--- WAVE 18 VERIFICATION (Era 6.3) ---');
testCases.forEach(tc => {
    const result = validateJurisdictionalTIN({ country: tc.country, value: tc.value });
    const status = result.isValid === tc.expected ? '✅' : '❌';
    console.log(`${status} [${tc.country}] ${tc.label}: ${result.isValid ? 'Valid' : 'Invalid'} - ${result.explanation || result.message}`);
});
