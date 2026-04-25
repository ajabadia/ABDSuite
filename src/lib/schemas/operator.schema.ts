import { z } from 'zod';

export const OperatorRoleSchema = z.enum(['ADMIN', 'TECH', 'OPERATOR']);

export const OperatorCreateSchema = z.object({
  username: z.string().min(3).max(20).regex(/^[a-zA-Z0-9_]+$/),
  displayName: z.string().min(1).max(50),
  role: OperatorRoleSchema,
  unitIds: z.array(z.string().uuid()).optional(),
});

export const OperatorUpdateSchema = OperatorCreateSchema.partial().extend({
  isActive: z.number().min(0).max(1),
  mfaEnabled: z.boolean().optional(),
});
