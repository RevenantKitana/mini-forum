import { z } from 'zod';

/**
 * Schema for search query
 */
export const searchQuerySchema = z.object({
  q: z.string().min(1, 'Search query is required').max(100),
  category: z.string().optional(),
  tag: z.string().optional(),
  author: z.string().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(50).default(10),
  sort: z.enum(['latest', 'popular', 'trending', 'oldest', 'relevance']).default('relevance'),
});

export type SearchQuery = z.infer<typeof searchQuerySchema>;






