
import { validateJurisdictionalTIN } from './index';

const testCases = [
    { country: 'GH', value: 'GHA-123456789-0', expected: true, label: 'Ghana Modern' },
    { country: 'GH', value: '12345678901', expected: true, label: 'Ghana Legacy' },
    { country: 'AI', value: '1234567890', type: 'INDIVIDUAL', expected: true, label: 'Anguilla Individual' },
    { country: 'AI', value: '2234567890', type: 'ENTITY', expected: true, label: 'Anguilla Entity' },
    { country: 'AG', value: '123456', expected: true, label: 'Antigua TIN' },
    { country: 'AG', value: '12345678', expected: true, label: 'Antigua TAN' },
    { country: 'DM', value: '123456789', expected: true, label: 'Dominica 9-digit' },
    { country: 'CK', value: '12345', expected: true, label: 'Cook Islands 5-digit' }
];

console.log('--- WAVE 10 VERIFICATION ---');
testCases.forEach(tc => {
    const result = validateJurisdictionalTIN({ country: tc.country, value: tc.value, type: tc.type as any });
    const status = result.isValid === tc.expected ? '✅' : '❌';
    console.log(`${status} [${tc.country}] ${tc.label}: ${result.isValid ? 'Valid' : 'Invalid'} - ${result.explanation || result.message}`);
});
