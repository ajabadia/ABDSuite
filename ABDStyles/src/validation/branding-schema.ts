/**
 * @purpose Valida las configuraciones de marca de inquilino utilizando esquemas de Zod.
 * @purpose_en Validates tenant branding configurations using Zod schemas.
 * @refactorable false
 * @classification Type Definition
 * @complexity Low
 * @fingerprint exports:5,imports:1,sig:u482ts
 * @lastUpdated 2026-06-23T23:26:52.857Z
 */

import { z } from 'zod';

/**
 * Zod validation schema for individual color hex codes.
 * Ensures the color is a valid 6-character hex code starting with a hash.
 * This is crucial for preventing CSS injection in custom style tags.
 */
export const hexColorSchema = z
  .string()
  .regex(/^#[0-9a-fA-F]{6}$/, {
    message: "Must be a valid 6-digit hex color starting with '#' (e.g., '#ef4444')"
  });

/**
 * Zod validation schema for theme configurations.
 */
export const themeSchema = z.object({
  primary: hexColorSchema,
  secondary: hexColorSchema.optional(),
  accent: hexColorSchema.optional(),
  background: hexColorSchema.optional(),
  rounded: z.boolean().optional().default(true),
  radius: z.string().regex(/^[0-9.]+(rem|px|em|%)$/).optional()
});

/**
 * Zod validation schema for complete tenant branding models.
 */
export const brandingSchema = z.object({
  logoUrl: z
    .string()
    .url({ message: "Logo URL must be a valid HTTPS absolute URL" })
    .regex(/^https:\/\/([a-zA-Z0-9-]+\.)+([a-zA-Z0-9-]+)(\/[a-zA-Z0-9_.-]+)*\.(png|jpg|jpeg|svg|webp)(\?.*)?$/, {
      message: "Logo must be a secure image URL (png, jpg, jpeg, svg, webp)"
    })
    .optional()
    .or(z.literal(''))
    .or(z.null()),
  theme: themeSchema
});

// Infer TypeScript types from schemas
export type TenantThemeConfig = z.infer<typeof themeSchema>;
export type TenantBrandingConfig = z.infer<typeof brandingSchema>;
