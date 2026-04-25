
import { validateJurisdictionalTIN } from './index';

const testCases = [
    { country: 'KW', value: '123456789012', expected: true, label: 'Kuwait Civil ID' },
    { country: 'RS', value: '123456789', expected: true, label: 'Serbia PIB' },
    { country: 'ME', value: '1234567890123', expected: true, label: 'Montenegro JMBG' },
    { country: 'BA', value: '1234567890123', expected: true, label: 'Bosnia JMBG' },
    { country: 'MK', value: '1234567890123', expected: true, label: 'Macedonia EMBG' }
];

console.log('--- WAVE 15 VERIFICATION ---');
testCases.forEach(tc => {
    const result = validateJurisdictionalTIN({ country: tc.country, value: tc.value });
    const status = result.isValid === tc.expected ? '✅' : '❌';
    console.log(`${status} [${tc.country}] ${tc.label}: ${result.isValid ? 'Valid' : 'Invalid'} - ${result.explanation || result.message}`);
});
