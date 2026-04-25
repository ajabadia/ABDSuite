
import { TinRequirement } from './i18n';
import { CountryRegulatoryInfo, TinInfo } from './types';

export type RequirementsRegistry = Record<string, TinRequirement[]>;
export type MetadataRegistry<T> = Record<string, T>;
export type ValidatorRegistry = Record<string, Function>;

// Territorial mappings (US, UK, FR, AU, etc.)
export const TERRITORY_FOLLOWERS: Record<string, string[]> = {
    'US': ['GU', 'FM', 'PW', 'PR', 'AS', 'MP', 'UM', 'VI'],
    'GB': ['SH', 'FK', 'GS', 'PN', 'IO'],
    'FR': ['GP', 'GF', 'MQ', 'PF', 'RE', 'BL', 'MF', 'PM', 'TF', 'WF', 'NC', 'YT'],
    'AU': ['NF', 'CC', 'CX', 'HM'],
    'FI': ['AX'],
    'NO': ['BV', 'SJ'],
    'NZ': ['TK'],
    'IT': ['VA'],
    'MA': ['EH']
};

export function buildRegistry<T>(base: Record<string, T>): Record<string, T> {
    const registry = { ...base };
    for (const [parent, children] of Object.entries(TERRITORY_FOLLOWERS)) {
        if (registry[parent]) {
            children.forEach(child => {
                registry[child] = registry[parent];
            });
        }
    }
    return registry;
}

export function buildMetadataRegistryWithDescription<T extends { description: string }>(
    base: Record<string, T>, 
    descriptions: Record<string, string>
): Record<string, T> {
    const registry = { ...base };
    for (const [parent, children] of Object.entries(TERRITORY_FOLLOWERS)) {
        if (registry[parent]) {
            children.forEach(child => {
                const desc = descriptions[child] || `Follows ${parent} system`;
                registry[child] = { ...registry[parent], description: desc };
            });
        }
    }
    return registry;
}
