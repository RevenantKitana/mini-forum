import { z } from 'zod';

/**
 * Create comment request schema
 */
export const createCommentSchema = z.object({
  content: z
    .string()
    .min(1, 'Comment cannot be empty')
    .max(5000, 'Comment must be at most 5000 characters'),
  parent_id: z
    .number()
    .int()
    .positive()
    .optional(),
  quoted_comment_id: z
    .number()
    .int()
    .positive()
    .optional(),
}).superRefine((data, ctx) => {
  if (data.parent_id && data.quoted_comment_id && data.parent_id !== data.quoted_comment_id) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['quoted_comment_id'],
      message: 'quoted_comment_id must match parent_id for replies',
    });
  }
});

/**
 * Update comment request schema
 */
export const updateCommentSchema = z.object({
  content: z
    .string()
    .min(1, 'Comment cannot be empty')
    .max(5000, 'Comment must be at most 5000 characters'),
});

/**
 * List comments query schema
 */
export const listCommentsQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().max(100).optional().default(20),
  sort: z.enum(['latest', 'oldest', 'popular']).optional().default('oldest'),
});

// Export types
export type CreateCommentInput = z.infer<typeof createCommentSchema>;
export type UpdateCommentInput = z.infer<typeof updateCommentSchema>;
export type ListCommentsQuery = z.infer<typeof listCommentsQuerySchema>;






