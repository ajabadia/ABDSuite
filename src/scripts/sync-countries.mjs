
import fs from 'fs';
import path from 'path';

const abdfatcacrs_path = 'd:\\desarrollos\\ABDFATCACRS\\src\\lib\\constants.ts';
const abdfnsuite_path = 'd:\\desarrollos\\ABDFNSuite\\src\\lib\\regulatory\\plugins\\index.ts';
const notin_path = 'd:\\desarrollos\\ABDFNSuite\\src\\lib\\regulatory\\plugins\\no-tin-map.ts';

// 1. Get full list of countries from ABDFATCACRS
const constantsContent = fs.readFileSync(abdfatcacrs_path, 'utf8');
const countriesMatch = constantsContent.match(/export const COUNTRIES = (\[[\s\S]*?\]);/);
const countries = eval(countriesMatch[1]);

// 2. Get plugins list
const indexContent = fs.readFileSync(abdfnsuite_path, 'utf8');
const pluginImports = indexContent.match(/import \{ .* \} from '\.\/(.*)-tin'/g) || [];
const pluginCodes = pluginImports.map(imp => {
    const match = imp.match(/'\.\/(.*)-tin'/);
    return match[1].toUpperCase();
});
// Add special cases (GB/UK)
if (pluginCodes.includes('GB')) pluginCodes.push('UK');

// 3. Get NO_TIN list
const notinContent = fs.readFileSync(notin_path, 'utf8');
const notinCodes = Array.from(notinContent.matchAll(/'([A-Z]{2})':/g)).map(m => m[1]);

const allPlugins = new Set([...pluginCodes, ...notinCodes]);

// 4. Generate COUNTRIES_MASTER
const master = countries.map(c => ({
    id: c.code,
    name: c.name,
    hasPlugin: allPlugins.has(c.code)
}));

// Sort by name
master.sort((a, b) => a.name.localeCompare(b.name));

const output = `/**
 * Maestra de Países ABDFN Suite - Era 6
 * Consolidado desde ABDFATCACRS:constants.ts y Plugins RegTech
 */

export interface CountryMetadata {
  id: string; // ISO2
  name: string;
  hasPlugin: boolean;
  residencyRules?: string;
}

export const COUNTRIES_MASTER: CountryMetadata[] = ${JSON.stringify(master, null, 2)};
`;

fs.writeFileSync('d:\\desarrollos\\ABDFNSuite\\src\\data\\countries_master.ts', output);
console.log('Generated COUNTRIES_MASTER with ' + master.length + ' countries.');
