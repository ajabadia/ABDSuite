/**
 * @purpose Proporciona un bloque CSS optimizado para personalizar Tailwind CSS y propiedades CSS estándar según la configuración del tema proporcionada.
 * @purpose_en Generates an optimized CSS block for customizing Tailwind CSS and standard CSS properties based on provided theme configuration.
 * @refactorable true (contains too many state variables and UI parts)
 * @classification Helper Utility
 * @complexity Medium
 * @fingerprint exports:1,imports:2,sig:1npffn3
 * @lastUpdated 2026-06-23T23:26:39.467Z
 */

import { hexToHslComponents, getContrastColor, adjustColor } from '../utils/color-utils.js';
import { themeSchema, type TenantThemeConfig } from '../validation/branding-schema.js';

/**
 * Generates an optimized, highly robust CSS injection block to customize
 * Tailwind CSS v4 and standard CSS custom properties.
 * 
 * Safely parses the inputs, checks for accessibility contrasts (YIQ),
 * shifts colors for dark-mode harmony, and configures borders.
 * 
 * @param config - Theme configuration to render
 * @returns A safe, raw CSS string block to be injected directly in layout heads.
 */
export function generateTenantCss(config: unknown): string {
  // Validate and parse schema safely with defaults
  let parsed: TenantThemeConfig;
  try {
    parsed = themeSchema.parse(config);
  } catch (err) {
    console.error('[ABDStyles] Invalid theme configuration provided. Falling back to Tech-Noir defaults.', err);
    // If validation fails, fall back to safe industrial defaults (Tech-Noir Cyan)
    parsed = {
      primary: '#06b6d4', // cyan-500
      secondary: '#1e293b', // slate-800
      rounded: true,
      radius: '0.15rem'
    };
  }

  const primaryHex = parsed.primary;
  const primaryHsl = hexToHslComponents(primaryHex);
  const primaryFgHex = getContrastColor(primaryHex);
  const primaryFgHsl = hexToHslComponents(primaryFgHex);
  
  // Calculate secondary values if present
  let secondaryCss = '';
  if (parsed.secondary) {
    const secHex = parsed.secondary;
    const secHsl = hexToHslComponents(secHex);
    const secFgHex = getContrastColor(secHex);
    const secFgHsl = hexToHslComponents(secFgHex);
    secondaryCss = `
    --secondary: ${secHsl} !important;
    --secondary-foreground: ${secFgHsl} !important;`;
  }

  // Calculate accent values if present
  let accentCss = '';
  let accentDarkCss = '';
  if (parsed.accent) {
    const accHex = parsed.accent;
    const accHsl = hexToHslComponents(accHex);
    const accFgHex = getContrastColor(accHex);
    const accFgHsl = hexToHslComponents(accFgHex);
    accentCss = `
    --accent: ${accHsl} !important;
    --accent-foreground: ${accFgHsl} !important;`;

    const accDarkHex = adjustColor(accHex, 15);
    const accDarkHsl = hexToHslComponents(accDarkHex);
    const accDarkFgHex = getContrastColor(accDarkHex);
    const accDarkFgHsl = hexToHslComponents(accDarkFgHex);
    accentDarkCss = `
  --accent: ${accDarkHsl} !important;
  --accent-foreground: ${accDarkFgHsl} !important;`;
  }

  // Calculate background overrides if present
  let bgCss = '';
  if (parsed.background) {
    const bgHex = parsed.background;
    const bgHsl = hexToHslComponents(bgHex);
    const bgFgHex = getContrastColor(bgHex);
    const bgFgHsl = hexToHslComponents(bgFgHex);
    bgCss = `
    --background: ${bgHsl} !important;
    --foreground: ${bgFgHsl} !important;`;
  }

  // Shift primary color for dark-mode adaptation (lighten primary slightly for deep tech-noir canvas contrast)
  const primaryDarkHex = adjustColor(primaryHex, 15);
  const primaryDarkHsl = hexToHslComponents(primaryDarkHex);
  const primaryDarkFgHex = getContrastColor(primaryDarkHex);
  const primaryDarkFgHsl = hexToHslComponents(primaryDarkFgHex);

  // Border-radius calculation
  let radiusValue = '0px';
  if (parsed.rounded) {
    radiusValue = parsed.radius || '0.75rem';
  }

  return `/* ABDStyles Dynamic Multi-Tenant Injection Gateway */
:root {
  --primary: hsl(${primaryHsl}) !important;
  --primary-foreground: hsl(${primaryFgHsl}) !important;
  --ring: hsl(${primaryHsl}) !important;
  --radius: ${radiusValue} !important;${secondaryCss ? secondaryCss.replace(/--secondary: (.*?)( !important)/g, '--secondary: hsl($1)$2').replace(/--secondary-foreground: (.*?)( !important)/g, '--secondary-foreground: hsl($1)$2') : ''}${accentCss ? accentCss.replace(/--accent: (.*?)( !important)/g, '--accent: hsl($1)$2').replace(/--accent-foreground: (.*?)( !important)/g, '--accent-foreground: hsl($1)$2') : ''}${bgCss ? bgCss.replace(/--background: (.*?)( !important)/g, '--background: hsl($1)$2').replace(/--foreground: (.*?)( !important)/g, '--foreground: hsl($1)$2') : ''}
}

.dark {
  --primary: hsl(${primaryDarkHsl}) !important;
  --primary-foreground: hsl(${primaryDarkFgHsl}) !important;
  --ring: hsl(${primaryDarkHsl}) !important;${accentDarkCss ? accentDarkCss.replace(/--accent: (.*?)( !important)/g, '--accent: hsl($1)$2').replace(/--accent-foreground: (.*?)( !important)/g, '--accent-foreground: hsl($1)$2') : ''}
}`;
}
