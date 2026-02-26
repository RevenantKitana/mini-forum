import { z } from 'zod';

/**
 * Notification type enum - matches database enum values
 */
export const NotificationTypeEnum = z.enum([
  'COMMENT',
  'REPLY',
  'MENTION',
  'UPVOTE',
  'SYSTEM',
]);

/**
 * Schema for creating a notification
 */
export const createNotificationSchema = z.object({
  userId: z.number().int().positive(),
  type: NotificationTypeEnum,
  content: z.string().min(1).max(500),
  referenceType: z.string().optional(),
  referenceId: z.number().int().positive().optional(),
});

export type CreateNotificationInput = z.infer<typeof createNotificationSchema>;

/**
 * Query params for notifications list
 * Note: z.coerce.boolean() does Boolean(value) which makes "false" → true
 * because Boolean("false") = true. Use z.preprocess to properly handle string booleans.
 */
const stringToBoolean = z.preprocess(
  (val) => val === 'true' || val === '1' || val === true,
  z.boolean()
);

export const notificationQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(50).default(20),
  unreadOnly: stringToBoolean.default(false),
  includeDeleted: stringToBoolean.default(false),
});

export type NotificationQuery = z.infer<typeof notificationQuerySchema>;






