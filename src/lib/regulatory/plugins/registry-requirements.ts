
import { TinRequirement } from './i18n';
// Note: We'll import individual requirements from index or their files
// For now, to avoid circular deps, we'll need to be careful.
// Actually, it's better if index.ts imports these.
// So this file will just export the maps.

export type RequirementsRegistry = Record<string, TinRequirement[]>;

export function buildRequirementsMap(baseRequirements: RequirementsRegistry): RequirementsRegistry {
    const map = { ...baseRequirements };

    // Inheritance Logic for Territories
    const followers: Record<string, string[]> = {
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

    for (const [parent, children] of Object.entries(followers)) {
        if (map[parent]) {
            children.forEach(child => {
                map[child] = map[parent];
            });
        }
    }

    return map;
}
