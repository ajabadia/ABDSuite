import { describe, it, expect } from 'vitest';
import { hexColorSchema, themeSchema, brandingSchema } from './branding-schema.js';

describe('branding-schema.ts', () => {
  describe('hexColorSchema', () => {
    it('should accept valid 6-digit hex colors starting with a hash', () => {
      const validColors = ['#ffffff', '#000000', '#1e293b', '#ef4444', '#ABCDEF', '#123456'];
      for (const color of validColors) {
        expect(hexColorSchema.safeParse(color).success).toBe(true);
      }
    });

    it('should reject invalid hex colors (including 3-digit hex, missing hash, or wrong chars)', () => {
      const invalidColors = [
        '#fff',         // 3-digit not allowed by regex
        'ffffff',       // Missing hash
        '#gggggg',      // Invalid characters
        '#12345',       // Too short
        '#1234567',      // Too long
        '#12 456',      // Spaces
        '#12345;',      // Injection attempts
      ];
      for (const color of invalidColors) {
        expect(hexColorSchema.safeParse(color).success).toBe(false);
      }
    });
  });

  describe('themeSchema', () => {
    it('should validate complete valid theme configurations', () => {
      const theme = {
        primary: '#3b82f6',
        secondary: '#10b981',
        accent: '#f59e0b',
        background: '#09090b',
        rounded: true,
        radius: '0.75rem',
      };
      
      const result = themeSchema.safeParse(theme);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(theme);
      }
    });

    it('should apply defaults for optional attributes when omitted', () => {
      const minimalTheme = {
        primary: '#3b82f6',
      };

      const result = themeSchema.safeParse(minimalTheme);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.rounded).toBe(true); // default rounded
        expect(result.data.radius).toBeUndefined();
      }
    });

    it('should validate and accept correct radius units', () => {
      const validRadii = ['0.5rem', '10px', '2em', '50%'];
      for (const rad of validRadii) {
        const theme = { primary: '#3b82f6', radius: rad };
        expect(themeSchema.safeParse(theme).success).toBe(true);
      }
    });

    it('should reject invalid radius units or plain numbers', () => {
      const invalidRadii = ['10', '0.5ex', '10empx', 'rem', ''];
      for (const rad of invalidRadii) {
        const theme = { primary: '#3b82f6', radius: rad };
        expect(themeSchema.safeParse(theme).success).toBe(false);
      }
    });
  });

  describe('brandingSchema', () => {
    it('should accept valid secure absolute logo URLs with supported extensions', () => {
      const validUrls = [
        'https://example.com/logo.png',
        'https://my-subdomain.tenant.com/assets/images/header-logo.jpg',
        'https://cdn.host.io/brand.svg',
        'https://host.com/nested/path/to/logo.webp',
        'https://host.com/logo.jpeg?v=1.2.3',
      ];

      for (const url of validUrls) {
        const config = {
          logoUrl: url,
          theme: { primary: '#3b82f6' },
        };
        expect(brandingSchema.safeParse(config).success).toBe(true);
      }
    });

    it('should accept empty string or null as valid fallbacks for logoUrl', () => {
      const emptyLogo = {
        logoUrl: '',
        theme: { primary: '#3b82f6' },
      };
      const nullLogo = {
        logoUrl: null,
        theme: { primary: '#3b82f6' },
      };

      expect(brandingSchema.safeParse(emptyLogo).success).toBe(true);
      expect(brandingSchema.safeParse(nullLogo).success).toBe(true);
    });

    it('should reject logo URLs using HTTP or non-image extensions', () => {
      const invalidConfigs = [
        { logoUrl: 'http://example.com/logo.png', theme: { primary: '#3b82f6' } }, // HTTP
        { logoUrl: 'https://example.com/logo.pdf', theme: { primary: '#3b82f6' } }, // PDF
        { logoUrl: 'https://example.com/logo', theme: { primary: '#3b82f6' } }, // No extension
        { logoUrl: 'ftp://example.com/logo.png', theme: { primary: '#3b82f6' } }, // FTP
      ];

      for (const config of invalidConfigs) {
        expect(brandingSchema.safeParse(config).success).toBe(false);
      }
    });
  });
});
