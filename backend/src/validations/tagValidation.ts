import { z } from 'zod';

/**
 * Create tag request schema
 */
export const createTagSchema = z.object({
  name: z
    .string()
    .min(2, 'Tag name must be at least 2 characters')
    .max(50, 'Tag name must be at most 50 characters'),
  slug: z
    .string()
    .min(2, 'Slug must be at least 2 characters')
    .max(50, 'Slug must be at most 50 characters')
    .regex(/^[a-z0-9-]+$/, 'Slug can only contain lowercase letters, numbers, and hyphens')
    .optional(),
  description: z
    .string()
    .max(200, 'Description must be at most 200 characters')
    .optional(),
});

/**
 * Update tag request schema
 */
export const updateTagSchema = z.object({
  name: z
    .string()
    .min(2, 'Tag name must be at least 2 characters')
    .max(50, 'Tag name must be at most 50 characters')
    .optional(),
  description: z
    .string()
    .max(200, 'Description must be at most 200 characters')
    .optional(),
});

// Export types
export type CreateTagInput = z.infer<typeof createTagSchema>;
export type UpdateTagInput = z.infer<typeof updateTagSchema>;






