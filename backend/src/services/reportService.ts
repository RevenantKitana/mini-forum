import prisma from '../config/database.js';
import { NotFoundError, BadRequestError } from '../utils/errors.js';
import { CreateReportInput, ReportQuery, UpdateReportStatusInput } from '../validations/reportValidation.js';

type ReportTarget = 'USER' | 'POST' | 'COMMENT';
type ReportStatus = 'PENDING' | 'REVIEWED' | 'RESOLVED' | 'REJECTED';

/**
 * Transform raw Prisma report to clean API response shape.
 * Renames Prisma relation fields:
 *   users_reports_reporterIdTousers → reporter
 *   users_reports_reviewedByTousers → reviewer
 */
function transformReport(report: any): any {
  if (!report) return report;
  const {
    users_reports_reporterIdTousers,
    users_reports_reviewedByTousers,
    ...rest
  } = report;
  return {
    ...rest,
    reporter: users_reports_reporterIdTousers || undefined,
    reviewer: users_reports_reviewedByTousers || undefined,
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
      reporterId,
      targetType,
      targetId,
      status: 'PENDING',
    },
  });

  if (existingReport) {
    throw new BadRequestError('You have already reported this content');
  }

  return prisma.reports.create({
    data: {
      reporterId,
      targetType,
      targetId,
      reason: data.reason,
      description: data.description,
      updatedAt: new Date(),
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
  const { page, limit, status, targetType } = query;
  const skip = (page - 1) * limit;

  const where: Record<string, any> = {};
  if (status) where.status = status;
  if (targetType) where.targetType = targetType;

  const [reports, total] = await Promise.all([
    prisma.reports.findMany({
      where,
      include: {
        users_reports_reporterIdTousers: {
          select: {
            id: true,
            username: true,
            display_name: true,
            avatar_url: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
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
      users_reports_reporterIdTousers: {
        select: {
          id: true,
          username: true,
          display_name: true,
          avatar_url: true,
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
      reviewedBy: reviewerId,
      reviewedAt: new Date(),
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







