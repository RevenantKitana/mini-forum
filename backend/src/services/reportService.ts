import prisma from '../config/database.js';
import { NotFoundError, BadRequestError } from '../utils/errors.js';
import { CreateReportInput, ReportQuery, UpdateReportStatusInput } from '../validations/reportValidation.js';

type ReportTarget = 'USER' | 'POST' | 'COMMENT';
type ReportStatus = 'PENDING' | 'REVIEWING' | 'RESOLVED' | 'DISMISSED';

/**
 * Transform raw Prisma report to clean API response shape.
 * Renames Prisma relation fields:
 *   users_reports_reporterIdTousers → reporter
 *   users_reports_reviewedByTousers → reviewer
 */
function transformReport(report: any): any {
  if (!report) return report;
  const {
    users_reports_reporter_idTousers,
    users_reports_reviewed_byTousers,
    ...rest
  } = report;
  return {
    ...rest,
    reporter: users_reports_reporter_idTousers || undefined,
    reviewer: users_reports_reviewed_byTousers || undefined,
  };
}

/**
 * Create a report
 */
async function createReport(
  reporterId: number,
  targetType: ReportTarget,
  targetId: number,
  data: CreateReportInput
) {
  // Validate target exists
  let targetExists = false;
  switch (targetType) {
    case 'USER':
      targetExists = !!(await prisma.users.findUnique({ where: { id: targetId } }));
      break;
    case 'POST':
      targetExists = !!(await prisma.posts.findUnique({ where: { id: targetId } }));
      break;
    case 'COMMENT':
      targetExists = !!(await prisma.comments.findUnique({ where: { id: targetId } }));
      break;
  }

  if (!targetExists) {
    throw new NotFoundError(`${targetType.toLowerCase()} not found`);
  }

  // Check for duplicate report
  const existingReport = await prisma.reports.findFirst({
    where: {
      reporter_id: reporterId,
      target_type: targetType,
      target_id: targetId,
      status: 'PENDING',
    },
  });

  if (existingReport) {
    throw new BadRequestError('You have already reported this content');
  }

  return prisma.reports.create({
    data: {
      reporter_id: reporterId,
      target_type: targetType,
      target_id: targetId,
      reason: data.reason,
      description: data.description,
      updated_at: new Date(),
    },
  });
}

/**
 * Report a post
 */
export async function reportPost(reporterId: number, postId: number, data: CreateReportInput) {
  return createReport(reporterId, 'POST', postId, data);
}

/**
 * Report a comment
 */
export async function reportComment(reporterId: number, commentId: number, data: CreateReportInput) {
  return createReport(reporterId, 'COMMENT', commentId, data);
}

/**
 * Report a user
 */
export async function reportUser(reporterId: number, userId: number, data: CreateReportInput) {
  // Can't report yourself
  if (reporterId === userId) {
    throw new BadRequestError("You can't report yourself");
  }
  return createReport(reporterId, 'USER', userId, data);
}

/**
 * Get reports (Admin/Moderator only)
 */
export async function getReports(query: ReportQuery) {
  const { page, limit, status, target_type } = query;
  const skip = (page - 1) * limit;

  const where: Record<string, any> = {};
  if (status) where.status = status;
  if (target_type) where.target_type = target_type;

  const [reports, total] = await Promise.all([
    prisma.reports.findMany({
      where,
      include: {
        users_reports_reporter_idTousers: {
          select: {
            id: true,
            username: true,
            display_name: true,
            avatar_preview_url: true,
            avatar_standard_url: true,
          },
        },
      },
      orderBy: { created_at: 'desc' },
      skip,
      take: limit,
    }),
    prisma.reports.count({ where }),
  ]);

  return {
    data: reports.map(transformReport),
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

/**
 * Get report by ID
 */
export async function getReportById(id: number) {
  const report = await prisma.reports.findUnique({
    where: { id },
    include: {
      users_reports_reporter_idTousers: {
        select: {
          id: true,
          username: true,
          display_name: true,
          avatar_preview_url: true,
          avatar_standard_url: true,
        },
      },
    },
  });

  if (!report) {
    throw new NotFoundError('Report not found');
  }

  return transformReport(report);
}

/**
 * Update report status (Admin/Moderator only)
 */
export async function updateReportStatus(
  reportId: number,
  reviewerId: number,
  data: UpdateReportStatusInput
) {
  const report = await prisma.reports.findUnique({
    where: { id: reportId },
  });

  if (!report) {
    throw new NotFoundError('Report not found');
  }

  return prisma.reports.update({
    where: { id: reportId },
    data: {
      status: data.status as any,
      reviewed_by: reviewerId,
      reviewed_at: new Date(),
    },
  });
}

/**
 * Get pending reports count
 */
export async function getPendingReportsCount(): Promise<number> {
  return prisma.reports.count({
    where: { status: 'PENDING' },
  });
}







