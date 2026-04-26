import { z } from 'zod';

/**
 * Regulatory Validation Schemas (ERA 6.1)
 * Enforces strict input validation for the RegTech Engine.
 */

export const TinValidationTypeSchema = z.enum(['INDIVIDUAL', 'ENTITY', 'ANY']);

export const HolderMetadataSchema = z.object({
    firstName: z.string().optional(),
    lastName: z.string().optional(),
    birthDate: z.union([z.date(), z.string()]).optional(),
    gender: z.enum(['M', 'F']).optional(),
    birthPlaceCode: z.string().optional(),
    birthPlaceName: z.string().optional(),
    isEntity: z.boolean().optional(),
}).optional();

export const TinInputSchema = z.object({
    country: z.string().length(2).toUpperCase(),
    value: z.string().min(2).max(50).trim(),
    type: TinValidationTypeSchema.default('ANY'),
    metadata: HolderMetadataSchema
});

export type TinInput = z.infer<typeof TinInputSchema>;
