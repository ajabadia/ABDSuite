import { regulatoryOrchestrator } from '../logic/RegulatoryOrchestrator';
import * as PluginSystem from './plugins/index';
import { TinValidatorPlugin } from '../types/regulatory.types';

/**
 * Regulatory Engine Bootstrapper (ERA 6)
 * Initializes all jurisdictional plugins dynamically from the plugins index.
 */
export const initializeRegulatoryEngine = () => {
    console.log('Initializing Regulatory Engine (Sync-Plug)...');
    
    // Register all plugins defined in the TIN_INFO_MAP
    Object.keys(PluginSystem.TIN_INFO_MAP).forEach(iso => {
        const info = PluginSystem.TIN_INFO_MAP[iso] as any;
        const countryInfo = PluginSystem.COUNTRY_INFO_MAP[iso] as any;
        const requirements = (PluginSystem.REQUIREMENTS_MAP[iso] || []) as any;
        
        const plugin: TinValidatorPlugin = {
            countryCode: iso,
            info: {
                name: info.name || iso,
                description: info.description,
                placeholder: info.placeholder,
                officialLink: info.officialLink,
                entityDifferentiation: info.entityDifferentiation
            },
            countryInfo: countryInfo,
            requirements: requirements,
            validate: (value, type, metadata) => {
                // Dispatch to the jurisdictional validator
                const result = PluginSystem.validateJurisdictionalTIN({
                    country: iso,
                    value,
                    type,
                    metadata
                });

                // Map to TinValidationPluginResponse (compatibility layer)
                return {
                    isValid: result.isValid,
                    status: result.status as any,
                    message: result.message,
                    explanation: result.explanation,
                    errorDetails: result.errorDetails,
                    reasonCode: result.reasonCode,
                    mismatchFields: result.mismatchFields
                };
            }
        };

        regulatoryOrchestrator.registerPlugin(plugin);
        console.log(`[REGTECH] Registered plugin for: ${iso}`);
    });
};

// Initialize on import
initializeRegulatoryEngine();
