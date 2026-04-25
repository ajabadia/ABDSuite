
import { validateJurisdictionalTIN } from './index';

const testCases = [
    // Lote 14 (S-Z) Industrializado
    { country: 'VE', value: 'V123456782', expected: true, label: 'Venezuela RIF (V) Valid Modulo 11' },
    { country: 'VE', value: 'J123456782', expected: true, label: 'Venezuela RIF (J) Valid Modulo 11' },
    { country: 'VN', value: '1234567890', expected: true, label: 'Vietnam TIN 10-digit' },
    { country: 'VN', value: '001200123456', expected: true, label: 'Vietnam CCCD 12-digit (Hanoi, Male, 2000s)' },
    { country: 'ZA', value: '1234567890', expected: true, label: 'South Africa Tax Ref 10-digit' },
    { country: 'ZA', value: '8001015000081', expected: true, label: 'South Africa ID 13-digit (Luhn)' },
    { country: 'VA', value: '123456789', expected: true, label: 'Vatican City TIN 9-digit' },
    { country: 'WF', value: '123456782', expected: true, label: 'Wallis and Futuna SIREN 9-digit (Luhn)' },
    { country: 'YT', value: '123456782', expected: true, label: 'Mayotte SIREN 9-digit (Luhn)' },
    { country: 'ZW', value: '123456789', expected: true, label: 'Zimbabwe BP 9-digit' },
    { country: 'US', value: '123-45-6789', expected: true, label: 'USA SSN (Sanitized)' },
    { country: 'UA', value: '12345678', expected: true, label: 'Ukraine EDRPOU 8-digit' }
];

console.log('--- REGRESSION WAVE 19 (S-Z Block Industrialization) ---');
let passed = 0;
testCases.forEach(tc => {
    const result = validateJurisdictionalTIN({ country: tc.country, value: tc.value });
    const isSuccess = result.isValid === tc.expected;
    const status = isSuccess ? '✅' : '❌';
    if (isSuccess) passed++;
    console.log(`${status} [${tc.country}] ${tc.label}: ${result.isValid ? 'Valid' : 'Invalid'} - ${result.explanation || result.message}`);
});

console.log(`\nFinal Score: ${passed}/${testCases.length}`);
if (passed === testCases.length) {
    console.log('SYS_READY: All jurisdictional plugins in Wave 19 are operational.');
} else {
    console.log('SYS_FAULT: Regression detected in industrialization wave.');
    process.exit(1);
}
