import { z } from 'zod';

/**
 * Report target enum
 */
export const ReportTargetEnum = z.enum(['USER', 'POST', 'COMMENT']);
export type ReportTargetType = z.infer<typeof ReportTargetEnum>;

/**
 * Report status enum
 */
export const ReportStatusEnum = z.enum(['PENDING', 'REVIEWING', 'RESOLVED', 'DISMISSED']);
export type ReportStatusType = z.infer<typeof ReportStatusEnum>;

/**
 * Schema for creating a report
 */
export const createReportSchema = z.object({
  reason: z.string().min(1, 'Reason is required').max(100),
  description: z.string().max(1000).optional(),
});

export type CreateReportInput = z.infer<typeof createReportSchema>;

/**
 * Schema for updating report status
 */
export const updateReportStatusSchema = z.object({
  status: ReportStatusEnum,
});

export type UpdateReportStatusInput = z.infer<typeof updateReportStatusSchema>;

/**
 * Query params for reports list
 */
export const reportQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(50).default(20),
  status: ReportStatusEnum.optional(),
  targetType: ReportTargetEnum.optional(),
});

export type ReportQuery = z.infer<typeof reportQuerySchema>;






