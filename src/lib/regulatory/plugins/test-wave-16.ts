
import { validateJurisdictionalTIN } from './index';

const testCases = [
    { country: 'TH', value: '1234567890123', expected: true, label: 'Thailand PIN' },
    { country: 'VN', value: '1234567890', expected: true, label: 'Vietnam 10-digit' },
    { country: 'VN', value: '1234567890123', expected: true, label: 'Vietnam 13-digit' },
    { country: 'PH', value: '123456789', expected: true, label: 'Philippines 9-digit' },
    { country: 'WS', value: '123456789', expected: true, label: 'Samoa 9-digit' },
    { country: 'PG', value: '123456789', expected: true, label: 'PNG 9-digit' }
];

console.log('--- WAVE 16 VERIFICATION ---');
testCases.forEach(tc => {
    const result = validateJurisdictionalTIN({ country: tc.country, value: tc.value });
    const status = result.isValid === tc.expected ? '✅' : '❌';
    console.log(`${status} [${tc.country}] ${tc.label}: ${result.isValid ? 'Valid' : 'Invalid'} - ${result.explanation || result.message}`);
});
