
import { validateJurisdictionalTIN } from './index';

const testCases = [
    { country: 'KZ', value: '123456789012', expected: true, label: 'Kazakhstan IIN/BIN' },
    { country: 'UZ', value: '123456789', expected: true, label: 'Uzbekistan TIN' },
    { country: 'AZ', value: '1234567890', expected: true, label: 'Azerbaijan VÖEN' },
    { country: 'AM', value: '12345678', expected: true, label: 'Armenia TIN' },
    { country: 'GE', value: '123456789', expected: true, label: 'Georgia 9-digit' },
    { country: 'GE', value: '12345678901', expected: true, label: 'Georgia 11-digit' }
];

console.log('--- WAVE 17 VERIFICATION ---');
testCases.forEach(tc => {
    const result = validateJurisdictionalTIN({ country: tc.country, value: tc.value });
    const status = result.isValid === tc.expected ? '✅' : '❌';
    console.log(`${status} [${tc.country}] ${tc.label}: ${result.isValid ? 'Valid' : 'Invalid'} - ${result.explanation || result.message}`);
});
