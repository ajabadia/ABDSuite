import { describe, it, expect, vi } from 'vitest';
import { generateTenantCss } from './css-generator.js';

describe('generateTenantCss', () => {
  it('should fall back to Tech-Noir Cyan defaults if parsing fails or invalid input is provided', () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    
    const css = generateTenantCss({});

    // Verify fallback values (cyan-500 #06b6d4 HSL components: 189 94% 43%)
    expect(css).toContain('--primary: hsl(189 94% 43%) !important;');
    expect(css).toContain('--secondary: hsl(217 33% 17%) !important;'); // slate-800 #1e293b
    expect(css).toContain('--radius: 0.15rem !important;');
    expect(errorSpy).toHaveBeenCalled();

    errorSpy.mockRestore();
  });

  it('should generate valid CSS variables for primary and default foreground/radius values', () => {
    const theme = {
      primary: '#ef4444', // Red (HSL: 0 84% 60%)
    };

    const css = generateTenantCss(theme);

    expect(css).toContain('--primary: hsl(0 84% 60%) !important;');
    // Foreground YIQ contrast check: red should have white fg (0 0% 100% or similar)
    expect(css).toContain('--primary-foreground: hsl(0 0% 100%) !important;');
    expect(css).toContain('--radius: 0.75rem !important;'); // default radius
  });

  it('should inject secondary, accent, and background properties if specified', () => {
    const theme = {
      primary: '#3b82f6', // blue (217 91% 60%)
      secondary: '#10b981', // emerald (160 84% 39%)
      accent: '#f59e0b', // amber (38 92% 50%)
      background: '#09090b', // slate/zinc-950 (240 10% 4%)
    };

    const css = generateTenantCss(theme);

    expect(css).toContain('--primary: hsl(217 91% 60%) !important;');
    expect(css).toContain('--secondary: hsl(160 84% 39%) !important;');
    expect(css).toContain('--accent: hsl(38 92% 50%) !important;');
    expect(css).toContain('--background: hsl(240 10% 4%) !important;');
    expect(css).toContain('--foreground: hsl(0 0% 100%) !important;'); // white fg on dark bg
  });

  it('should force "--radius: 0px" when rounded is set to false', () => {
    const theme = {
      primary: '#3b82f6',
      rounded: false,
    };

    const css = generateTenantCss(theme);

    expect(css).toContain('--radius: 0px !important;');
  });

  it('should apply custom radius value when rounded is true and custom radius is provided', () => {
    const theme = {
      primary: '#3b82f6',
      rounded: true,
      radius: '10px',
    };

    const css = generateTenantCss(theme);

    expect(css).toContain('--radius: 10px !important;');
  });

  it('should calculate shifted primary and accent colors for dark mode selector (.dark)', () => {
    const theme = {
      primary: '#3b82f6', // original blue-500
      accent: '#f59e0b',
    };

    const css = generateTenantCss(theme);

    expect(css).toContain('.dark {');
    // Shifted primary (#3b82f6 lightened by 15% becomes #61a8ff, HSL: 213 100% 69%)
    expect(css).toContain('--primary: hsl(213 100% 69%) !important;');
    // Shifted accent (#f59e0b lightened by 15% becomes #ffc04d, HSL: 43 100% 60%)
    expect(css).toContain('--accent: hsl(43 100% 60%) !important;');
  });
});
