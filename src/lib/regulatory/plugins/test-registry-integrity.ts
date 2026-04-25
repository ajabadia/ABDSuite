
import { VALIDATORS, TIN_INFO_MAP, COUNTRY_INFO_MAP, REQUIREMENTS_MAP } from './jurisdictions-registry';

/**
 * Registry Integrity Test - Era 6.3
 * Validates that all industrial-grade plugins are properly registered and accessible.
 */

console.log('--- REGISTRY INTEGRITY AUDIT (Era 6.3) ---');

const allKeys = new Set([
    ...Object.keys(VALIDATORS),
    ...Object.keys(TIN_INFO_MAP),
    ...Object.keys(COUNTRY_INFO_MAP),
    ...Object.keys(REQUIREMENTS_MAP)
]);

let total = 0;
let passed = 0;
let failures: string[] = [];

allKeys.forEach(iso2 => {
    if (iso2 === 'UK') return; // Alias for GB

    total++;
    const hasValidator = !!VALIDATORS[iso2];
    const hasInfo = !!TIN_INFO_MAP[iso2];
    const hasCountry = !!COUNTRY_INFO_MAP[iso2];
    const hasReqs = !!REQUIREMENTS_MAP[iso2];

    if (hasValidator && hasInfo && hasCountry && hasReqs) {
        passed++;
    } else {
        const missing = [];
        if (!hasValidator) missing.push('Validator');
        if (!hasInfo) missing.push('Info');
        if (!hasCountry) missing.push('CountryInfo');
        if (!hasReqs) missing.push('Requirements');
        failures.push(`${iso2}: Missing [${missing.join(', ')}]`);
    }
});

console.log(`Total Jurisdictions: ${total}`);
console.log(`Fully Operational: ${passed} ✅`);

if (failures.length > 0) {
    console.error(`Incomplete Registrations: ${failures.length} ❌`);
    failures.forEach(f => console.log(`  - ${f}`));
} else {
    console.log('Integrity Check: PASSED 🚀');
}

// Check for broken imports by trying to call one validator
try {
    const testResult = VALIDATORS['ES']('12345678Z', 'INDIVIDUAL');
    console.log(`Plugin Execution Test (ES): ${testResult.isValid ? 'OK' : 'FAIL'}`);
} catch (e: any) {
    console.error(`Plugin Execution Test Failed: ${e.message}`);
}
