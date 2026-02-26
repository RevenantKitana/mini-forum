import { z } from 'zod';

/**
 * Vote type enum
 */
export const VoteTypeEnum = z.enum(['up', 'down']);
export type VoteType = z.infer<typeof VoteTypeEnum>;

/**
 * Vote target enum
 */
export const VoteTargetEnum = z.enum(['POST', 'COMMENT']);
export type VoteTargetType = z.infer<typeof VoteTargetEnum>;

/**
 * Schema for creating/updating a vote
 */
export const voteSchema = z.object({
  voteType: VoteTypeEnum,
});

export type VoteInput = z.infer<typeof voteSchema>;







