import { z } from 'zod';

/**
 * Create category request schema
 */
export const createCategorySchema = z.object({
  name: z
    .string()
    .min(2, 'Category name must be at least 2 characters')
    .max(100, 'Category name must be at most 100 characters'),
  slug: z
    .string()
    .min(2, 'Slug must be at least 2 characters')
    .max(100, 'Slug must be at most 100 characters')
    .regex(/^[a-z0-9-]+$/, 'Slug can only contain lowercase letters, numbers, and hyphens')
    .optional(),
  description: z
    .string()
    .max(500, 'Description must be at most 500 characters')
    .optional(),
  color: z.string().max(20).optional(),
  sort_order: z.number().int().min(0).max(1000).optional(),
  is_active: z.boolean().optional(),
  view_permission: z.enum(['ALL', 'MEMBER', 'MODERATOR', 'ADMIN']).optional(),
  post_permission: z.enum(['MEMBER', 'MODERATOR', 'ADMIN']).optional(),
  comment_permission: z.enum(['MEMBER', 'MODERATOR', 'ADMIN']).optional(),
});

/**
 * Update category request schema
 */
export const updateCategorySchema = z.object({
  name: z
    .string()
    .min(2, 'Category name must be at least 2 characters')
    .max(100, 'Category name must be at most 100 characters')
    .optional(),
  description: z
    .string()
    .max(500, 'Description must be at most 500 characters')
    .optional(),
  color: z.string().max(20).optional(),
  sort_order: z.number().int().min(0).max(1000).optional(),
  is_active: z.boolean().optional(),
  view_permission: z.enum(['ALL', 'MEMBER', 'MODERATOR', 'ADMIN']).optional(),
  post_permission: z.enum(['MEMBER', 'MODERATOR', 'ADMIN']).optional(),
  comment_permission: z.enum(['MEMBER', 'MODERATOR', 'ADMIN']).optional(),
});

// Export types
export type CreateCategoryInput = z.infer<typeof createCategorySchema>;
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>;






