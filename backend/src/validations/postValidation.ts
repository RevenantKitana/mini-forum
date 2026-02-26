import { z } from 'zod';

/**
 * Create post request schema
 */
export const createPostSchema = z.object({
  title: z
    .string()
    .min(10, 'Title must be at least 10 characters')
    .max(200, 'Title must be at most 200 characters'),
  content: z
    .string()
    .min(20, 'Content must be at least 20 characters')
    .max(50000, 'Content must be at most 50000 characters'),
  category_id: z
    .number()
    .int()
    .positive('Category ID must be a positive integer'),
  tags: z
    .array(z.string().max(50))
    .max(10, 'Maximum 10 tags allowed')
    .optional()
    .default([]),
  status: z
    .enum(['DRAFT', 'PUBLISHED'])
    .optional()
    .default('PUBLISHED'),
});

/**
 * Update post request schema
 */
export const updatePostSchema = z.object({
  title: z
    .string()
    .min(10, 'Title must be at least 10 characters')
    .max(200, 'Title must be at most 200 characters')
    .optional(),
  content: z
    .string()
    .min(20, 'Content must be at least 20 characters')
    .max(50000, 'Content must be at most 50000 characters')
    .optional(),
  category_id: z
    .number()
    .int()
    .positive('Category ID must be a positive integer')
    .optional(),
  tags: z
    .array(z.string().max(50))
    .max(10, 'Maximum 10 tags allowed')
    .optional(),
});

/**
 * Update post status schema
 */
export const updatePostStatusSchema = z.object({
  status: z.enum(['DRAFT', 'PUBLISHED', 'HIDDEN', 'DELETED']),
});

/**
 * List posts query schema
 */
export const listPostsQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().max(50).optional().default(10),
  category: z.string().optional(),
  tag: z.string().optional(), // Legacy single tag support
  tags: z.string().optional(), // Multiple tags comma-separated
  author: z.string().optional(),
  sort: z.enum(['latest', 'popular', 'trending', 'oldest', 'oldest_first', 'unpopular', 'least_trending']).optional().default('latest'),
  status: z.enum(['DRAFT', 'PUBLISHED', 'HIDDEN', 'DELETED']).optional(),
  search: z.string().optional(),
  dateFrom: z.string().optional(), // ISO date string for filtering posts from this date
  dateTo: z.string().optional(), // ISO date string for filtering posts until this date
});

// Export types
export type CreatePostInput = z.infer<typeof createPostSchema>;
export type UpdatePostInput = z.infer<typeof updatePostSchema>;
export type UpdatePostStatusInput = z.infer<typeof updatePostStatusSchema>;
export type ListPostsQuery = z.infer<typeof listPostsQuerySchema>;






