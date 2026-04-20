import { Request, Response, NextFunction } from 'express';
import prisma from '../config/database.js';
import { sendSuccess, sendPaginated } from '../utils/response.js';
import { NotFoundError, BadRequestError } from '../utils/errors.js';
import { AuthRequest } from '../middlewares/authMiddleware.js';
import bcrypt from 'bcrypt';
import * as auditLogService from '../services/auditLogService.js';
import { generateSlug } from '../utils/slug.js';
import { getSnapshot } from '../services/metricsService.js';
import { logger } from '../utils/logger.js';

/**
 * GET /api/v1/admin/dashboard
 * Get admin dashboard statistics
 */
export async function getDashboardStats(req: Request, res: Response, next: NextFunction) {
  try {
    // Parse date range parameters
    const startDateParam = req.query.startDate as string;
    const endDateParam = req.query.endDate as string;
    
    // Default to today if no dates provided
    let startDate: Date;
    let endDate: Date;
    
    if (startDateParam) {
      startDate = new Date(startDateParam);
      startDate.setHours(0, 0, 0, 0);
    } else {
      startDate = new Date();
      startDate.setHours(0, 0, 0, 0);
    }
    
    if (endDateParam) {
      endDate = new Date(endDateParam);
      endDate.setHours(23, 59, 59, 999);
    } else {
      endDate = new Date();
      endDate.setHours(23, 59, 59, 999);
    }

    // Get all counts in parallel
    const [
      totalUsers,
      totalPosts,
      totalComments,
      newUsersInRange,
      newPostsInRange,
      newCommentsInRange,
      pendingReports,
      activeUsers,
      publishedPosts,
      pinnedPosts,
      recentActivities,
      topCategories,
      usersByRole,
    ] = await Promise.all([
      // Total counts
      prisma.users.count(),
      prisma.posts.count(),
      prisma.comments.count(),
      
      // Counts in date range
      prisma.users.count({
        where: { created_at: { gte: startDate, lte: endDate } },
      }),
      prisma.posts.count({
        where: { created_at: { gte: startDate, lte: endDate } },
      }),
      prisma.comments.count({
        where: { created_at: { gte: startDate, lte: endDate } },
      }),
      
      // Pending reports
      prisma.reports.count({
        where: { status: 'PENDING' },
      }),
      
      // Active users (last 30 days)
      prisma.users.count({
        where: {
          is_active: true,
          last_active_at: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          },
        },
      }),
      
      // Published posts
      prisma.posts.count({
        where: { status: 'PUBLISHED' },
      }),
      
      // Pinned posts count
      prisma.posts.count({
        where: { is_pinned: true, status: 'PUBLISHED' },
      }),
      
      // Recent activities (last 10 posts, comments, registrations)
      getRecentActivities(),
      
      // Top categories by post count
      prisma.categories.findMany({
        select: {
          id: true,
          name: true,
          slug: true,
          post_count: true,
          color: true,
        },
        orderBy: { post_count: 'desc' },
        take: 5,
      }),
      
      // Users by role
      prisma.users.groupBy({
        by: ['role'],
        _count: { role: true },
      }),
    ]);

    // Format user roles
    const rolesMap: Record<string, number> = {
      MEMBER: 0,
      MODERATOR: 0,
      ADMIN: 0,
      BOT: 0,
    };
    usersByRole.forEach((item) => {
      rolesMap[item.role] = item._count.role;
    });

    const stats = {
      overview: {
        totalUsers,
        totalPosts,
        totalComments,
        publishedPosts,
        activeUsers,
        pendingReports,
        pinnedPostsCount: pinnedPosts,
      },
      dateRange: {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        newUsers: newUsersInRange,
        newPosts: newPostsInRange,
        newComments: newCommentsInRange,
      },
      usersByRole: rolesMap,
      topCategories,
      recentActivities,
    };

    return sendSuccess(res, stats, 'Dashboard statistics retrieved');
  } catch (error) {
    next(error);
  }
}

/**
 * Helper function to get recent activities
 */
async function getRecentActivities() {
  const [recentUsers, recentPosts, recentComments] = await Promise.all([
    prisma.users.findMany({
      select: {
        id: true,
        username: true,
        display_name: true,
        avatar_url: true,
        created_at: true,
      },
      orderBy: { created_at: 'desc' },
      take: 5,
    }),
    prisma.posts.findMany({
      select: {
        id: true,
        title: true,
        created_at: true,
        users: {
          select: {
            id: true,
            username: true,
            display_name: true,
            avatar_url: true,
          },
        },
      },
      orderBy: { created_at: 'desc' },
      take: 5,
    }),
    prisma.comments.findMany({
      select: {
        id: true,
        content: true,
        created_at: true,
        users: {
          select: {
            id: true,
            username: true,
            display_name: true,
            avatar_url: true,
          },
        },
        posts: {
          select: {
            id: true,
            title: true,
          },
        },
      },
      orderBy: { created_at: 'desc' },
      take: 5,
    }),
  ]);

  // Combine and sort by date
  const activities = [
    ...recentUsers.map((user) => ({
      type: 'USER_REGISTERED' as const,
      data: user,
      created_at: user.created_at,
    })),
    ...recentPosts.map((post) => ({
      type: 'POST_CREATED' as const,
      data: {
        ...post,
        author: (post as any).users,
        users: undefined,
      },
      created_at: post.created_at,
    })),
    ...recentComments.map((comment) => ({
      type: 'COMMENT_CREATED' as const,
      data: {
        ...comment,
        author: (comment as any).users,
        users: undefined,
        post: (comment as any).posts,
        posts: undefined,
        content: comment.content.substring(0, 100) + (comment.content.length > 100 ? '...' : ''),
      },
      created_at: comment.created_at,
    })),
  ];

  return activities.sort((a, b) => b.created_at.getTime() - a.created_at.getTime()).slice(0, 10);
}

/**
 * GET /api/v1/admin/users
 * Get paginated list of users
 */
export async function getUsers(req: Request, res: Response, next: NextFunction) {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const search = req.query.search as string;
    const role = req.query.role as string;
    const status = req.query.status as string;
    const sortBy = (req.query.sortBy as string) || 'created_at';
    const sort_order = (req.query.sort_order as 'asc' | 'desc') || 'desc';

    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {};

    if (search) {
      where.OR = [
        { username: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { display_name: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (role) {
      where.role = role.toUpperCase();
    }

    if (status === 'active') {
      where.is_active = true;
    } else if (status === 'inactive') {
      where.is_active = false;
    } else if (status === 'verified') {
      where.is_verified = true;
    } else if (status === 'unverified') {
      where.is_verified = false;
    }

    // Build orderBy
    const orderBy: any = {};
    if (['created_at', 'username', 'email', 'reputation', 'role'].includes(sortBy)) {
      orderBy[sortBy] = sort_order;
    } else {
      orderBy.created_at = 'desc';
    }

    const [users, total] = await Promise.all([
      prisma.users.findMany({
        where,
        select: {
          id: true,
          email: true,
          username: true,
          display_name: true,
          avatar_url: true,
          role: true,
          reputation: true,
          is_verified: true,
          is_active: true,
          last_active_at: true,
          created_at: true,
          _count: {
            select: {
              posts: true,
              comments: true,
            },
          },
        },
        orderBy,
        skip,
        take: limit,
      }),
      prisma.users.count({ where }),
    ]);

    return sendPaginated(res, users, { page, limit, total }, 'Users retrieved successfully');
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/v1/admin/users/:id
 * Get user detail for admin
 */
export async function getUserDetail(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const id = parseInt(req.params.id as string, 10);
    const requestingUserRole = req.user?.role || 'MEMBER';

    const user = await prisma.users.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        username: true,
        display_name: true,
        avatar_url: true,
        bio: true,
        date_of_birth: true,
        gender: true,
        role: true,
        reputation: true,
        is_verified: true,
        is_active: true,
        last_active_at: true,
        username_changed_at: true,
        created_at: true,
        updated_at: true,
        _count: {
          select: {
            posts: true,
            comments: true,
            bookmarks: true,
            votes: true,
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundError('User not found');
    }

    // Mask email for Moderator (only Admin can see full email)
    const userResponse = {
      ...user,
      email: requestingUserRole === 'ADMIN' ? user.email : maskEmail(user.email),
    };

    return sendSuccess(res, userResponse, 'User detail retrieved');
  } catch (error) {
    next(error);
  }
}

/**
 * Helper function to mask email
 */
function maskEmail(email: string): string {
  const [localPart, domain] = email.split('@');
  if (!domain) return email;
  
  if (localPart.length <= 2) {
    return `${localPart[0]}***@${domain}`;
  }
  
  const visibleStart = localPart.slice(0, 2);
  const visibleEnd = localPart.slice(-1);
  return `${visibleStart}***${visibleEnd}@${domain}`;
}

/**
 * PATCH /api/v1/admin/users/:id/role
 * Change user role
 */
export async function changeUserRole(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const id = parseInt(req.params.id as string, 10);
    const { role } = req.body;

    // Validate role
    if (!['MEMBER', 'MODERATOR', 'ADMIN', 'BOT'].includes(role)) {
      throw new BadRequestError('Invalid role');
    }

    // Check user exists
    const user = await prisma.users.findUnique({
      where: { id },
      select: { id: true, role: true },
    });

    if (!user) {
      throw new NotFoundError('User not found');
    }

    // Prevent changing own role
    if (id === req.user!.userId) {
      throw new BadRequestError('Cannot change your own role');
    }

    // Prevent demoting other admins unless you're also an admin
    if (user.role === 'ADMIN' && req.user!.role !== 'ADMIN') {
      throw new BadRequestError('Only admins can demote other admins');
    }

    const updatedUser = await prisma.users.update({
      where: { id },
      data: { role },
      select: {
        id: true,
        username: true,
        display_name: true,
        role: true,
      },
    });

    await auditLogService.createAuditLog({
      userId: req.user!.userId,
      action: 'ROLE_CHANGE',
      targetType: 'USER',
      targetId: id,
      targetName: updatedUser.username,
      oldValue: { role: user.role },
      newValue: { role },
      ipAddress: auditLogService.getClientIp(req),
    });

    return sendSuccess(res, updatedUser, 'User role updated successfully');
  } catch (error) {
    next(error);
  }
}

/**
 * PATCH /api/v1/admin/users/:id/status
 * Activate or deactivate user
 */
export async function changeUserStatus(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const id = parseInt(req.params.id as string, 10);
    const { is_active } = req.body;

    if (typeof is_active !== 'boolean') {
      throw new BadRequestError('is_active must be a boolean');
    }

    const user = await prisma.users.findUnique({
      where: { id },
      select: { id: true, role: true },
    });

    if (!user) {
      throw new NotFoundError('User not found');
    }

    // Prevent deactivating yourself
    if (id === req.user!.userId) {
      throw new BadRequestError('Cannot change your own status');
    }

    // Prevent deactivating admins unless you're also an admin
    if (user.role === 'ADMIN' && req.user!.role !== 'ADMIN') {
      throw new BadRequestError('Only admins can deactivate other admins');
    }

    const updatedUser = await prisma.users.update({
      where: { id },
      data: { is_active },
      select: {
        id: true,
        username: true,
        display_name: true,
        is_active: true,
      },
    });

    logger.info('moderation.user_status_changed', {
      event: 'user_status_changed',
      targetUserId: id,
      isActive: is_active,
      actorUserId: req.user!.userId,
      requestId: (req as any).requestId,
    });

    await auditLogService.createAuditLog({
      userId: req.user!.userId,
      action: is_active ? 'UNBAN' : 'BAN',
      targetType: 'USER',
      targetId: id,
      targetName: updatedUser.username,
      oldValue: { is_active: !is_active },
      newValue: { is_active },
      ipAddress: auditLogService.getClientIp(req),
    });

    return sendSuccess(
      res,
      updatedUser,
      is_active ? 'User activated successfully' : 'User deactivated successfully'
    );
  } catch (error) {
    next(error);
  }
}

/**
 * DELETE /api/v1/admin/users/:id
 * Delete user (soft delete by deactivating)
 */
export async function deleteUser(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const id = parseInt(req.params.id as string, 10);

    const user = await prisma.users.findUnique({
      where: { id },
      select: { id: true, role: true },
    });

    if (!user) {
      throw new NotFoundError('User not found');
    }

    // Prevent deleting yourself
    if (id === req.user!.userId) {
      throw new BadRequestError('Cannot delete your own account');
    }

    // Prevent deleting admins
    if (user.role === 'ADMIN') {
      throw new BadRequestError('Cannot delete admin users');
    }

    // Soft delete - deactivate the user
    const deletedUser = await prisma.users.update({
      where: { id },
      data: { is_active: false },
      select: { id: true, username: true },
    });

    await auditLogService.createAuditLog({
      userId: req.user!.userId,
      action: 'DELETE',
      targetType: 'USER',
      targetId: id,
      targetName: deletedUser.username,
      oldValue: { is_active: true, role: user.role },
      newValue: { is_active: false },
      ipAddress: auditLogService.getClientIp(req),
    });

    return sendSuccess(res, null, 'User deleted successfully');
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/v1/admin/reports
 * Get paginated list of reports
 */
export async function getReports(req: Request, res: Response, next: NextFunction) {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const status = req.query.status as string;
    const targetType = req.query.targetType as string;

    const skip = (page - 1) * limit;

    const where: any = {};

    if (status) {
      where.status = status.toUpperCase();
    }

    if (targetType) {
      where.target_type = targetType.toUpperCase();
    }

    const [reports, total] = await Promise.all([
      prisma.reports.findMany({
        where,
        include: {
          users_reports_reporter_idTousers: {
            select: {
              id: true,
              username: true,
              display_name: true,
              avatar_url: true,
            },
          },
        },
        orderBy: { created_at: 'desc' },
        skip,
        take: limit,
      }),
      prisma.reports.count({ where }),
    ]);

    // Enrich reports with target info
    const enrichedReports = await Promise.all(
      reports.map(async (report) => {
        let target = null;

        switch (report.target_type) {
          case 'USER':
            target = await prisma.users.findUnique({
              where: { id: report.target_id },
              select: {
                id: true,
                username: true,
                display_name: true,
                avatar_url: true,
              },
            });
            break;
          case 'POST': {
            const postTarget = await prisma.posts.findUnique({
              where: { id: report.target_id },
              select: {
                id: true,
                title: true,
                users: {
                  select: {
                    id: true,
                    username: true,
                    display_name: true,
                    avatar_url: true,
                  },
                },
              },
            });
            if (postTarget) {
              const { users, ...postRest } = postTarget as any;
              target = { ...postRest, author: users };
            }
            break;
          }
          case 'COMMENT': {
            const commentTarget = await prisma.comments.findUnique({
              where: { id: report.target_id },
              select: {
                id: true,
                content: true,
                post_id: true,
                users: {
                  select: {
                    id: true,
                    username: true,
                    display_name: true,
                    avatar_url: true,
                  },
                },
              },
            });
            if (commentTarget) {
              const { users, ...commentRest } = commentTarget as any;
              target = { ...commentRest, author: users };
            }
            break;
          }
        }

        const { users_reports_reporter_idTousers, ...reportRest } = report;
        return {
          ...reportRest,
          reporter: users_reports_reporter_idTousers,
          target,
        };
      })
    );

    return sendPaginated(res, enrichedReports, { page, limit, total }, 'Reports retrieved');
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/v1/admin/reports/:id
 * Get report detail
 */
export async function getReportDetail(req: Request, res: Response, next: NextFunction) {
  try {
    const id = parseInt(req.params.id as string, 10);

    const report = await prisma.reports.findUnique({
      where: { id },
      include: {
        users_reports_reporter_idTousers: {
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

    // Get target info
    let target = null;

    switch (report.target_type) {
      case 'USER':
        target = await prisma.users.findUnique({
          where: { id: report.target_id },
          select: {
            id: true,
            username: true,
            display_name: true,
            avatar_url: true,
            email: true,
            role: true,
            is_active: true,
          },
        });
        break;
      case 'POST': {
        const postTarget = await prisma.posts.findUnique({
          where: { id: report.target_id },
          select: {
            id: true,
            title: true,
            content: true,
            status: true,
            users: {
              select: {
                id: true,
                username: true,
                display_name: true,
                avatar_url: true,
              },
            },
          },
        });
        if (postTarget) {
          const { users, ...postRest } = postTarget as any;
          target = { ...postRest, author: users };
        }
        break;
      }
      case 'COMMENT': {
        const commentTarget = await prisma.comments.findUnique({
          where: { id: report.target_id },
          select: {
            id: true,
            content: true,
            post_id: true,
            status: true,
            users: {
              select: {
                id: true,
                username: true,
                display_name: true,
                avatar_url: true,
              },
            },
            posts: {
              select: {
                id: true,
                title: true,
                slug: true,
              },
            },
          },
        });
        if (commentTarget) {
          const { users, posts: commentPosts, ...commentRest } = commentTarget as any;
          target = { ...commentRest, author: users, post: commentPosts };
        }
        break;
      }
    }

    // Get reviewer info if reviewed
    let reviewer = null;
    if (report.reviewed_by) {
      reviewer = await prisma.users.findUnique({
        where: { id: report.reviewed_by },
        select: {
          id: true,
          username: true,
          display_name: true,
        },
      });
    }

    const { users_reports_reporter_idTousers, ...reportRest } = report as any;
    return sendSuccess(
      res,
      { ...reportRest, reporter: users_reports_reporter_idTousers, target, reviewer },
      'Report detail retrieved'
    );
  } catch (error) {
    next(error);
  }
}

/**
 * PATCH /api/v1/admin/reports/:id
 * Update report status
 */
export async function updateReportStatus(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const id = parseInt(req.params.id as string, 10);
    const { status, action, review_note } = req.body;

    // Validate status
    if (!['PENDING', 'REVIEWING', 'RESOLVED', 'DISMISSED'].includes(status)) {
      throw new BadRequestError('Invalid status');
    }

    const report = await prisma.reports.findUnique({
      where: { id },
    });

    if (!report) {
      throw new NotFoundError('Report not found');
    }

    // Update report
    const updatedReport = await prisma.reports.update({
      where: { id },
      data: {
        status,
        reviewed_by: req.user!.userId,
        reviewed_at: new Date(),
        ...(review_note !== undefined && { review_note: review_note }),
      },
    });

    // Take action if specified
    if (action && status === 'RESOLVED') {
      switch (action) {
        case 'hide_content':
          if (report.target_type === 'POST') {
            await prisma.posts.update({
              where: { id: report.target_id },
              data: { status: 'HIDDEN' },
            });
          } else if (report.target_type === 'COMMENT') {
            await prisma.comments.update({
              where: { id: report.target_id },
              data: { status: 'HIDDEN' },
            });
          }
          break;
        case 'delete_content':
          if (report.target_type === 'POST') {
            await prisma.posts.update({
              where: { id: report.target_id },
              data: { status: 'DELETED' },
            });
          } else if (report.target_type === 'COMMENT') {
            await prisma.comments.update({
              where: { id: report.target_id },
              data: { status: 'DELETED' },
            });
          }
          break;
        case 'ban_user':
          if (report.target_type === 'USER') {
            await prisma.users.update({
              where: { id: report.target_id },
              data: { is_active: false },
            });
          }
          break;
      }
    }

    logger.info('moderation.report_resolved', {
      event: 'report_resolved',
      reportId: id,
      status,
      action: action ?? null,
      targetType: report.target_type,
      targetId: report.target_id,
      actorUserId: req.user!.userId,
      requestId: (req as any).requestId,
    });

    await auditLogService.createAuditLog({
      userId: req.user!.userId,
      action: 'UPDATE',
      targetType: 'REPORT',
      targetId: id,
      targetName: `Report #${id} (${report.target_type})`,
      oldValue: { status: report.status },
      newValue: { status, action: action ?? null },
      ipAddress: auditLogService.getClientIp(req),
    });

    return sendSuccess(res, updatedReport, 'Report updated successfully');
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/v1/admin/posts
 * Get all posts for admin management
 */
export async function getPosts(req: Request, res: Response, next: NextFunction) {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const search = req.query.search as string;
    const status = req.query.status as string;
    const category_id = req.query.category_id as string;

    const skip = (page - 1) * limit;

    const where: any = {};

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { content: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (status) {
      where.status = status.toUpperCase();
    }

    if (category_id) {
      where.category_id = parseInt(category_id, 10);
    }

    const [posts, total] = await Promise.all([
      prisma.posts.findMany({
        where,
        select: {
          id: true,
          title: true,
          status: true,
          is_pinned: true,
          pin_type: true,
          is_locked: true,
          view_count: true,
          upvote_count: true,
          downvote_count: true,
          comment_count: true,
          created_at: true,
          users: {
            select: {
              id: true,
              username: true,
              display_name: true,
              avatar_url: true,
            },
          },
          categories: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
        },
        orderBy: { created_at: 'desc' },
        skip,
        take: limit,
      }),
      prisma.posts.count({ where }),
    ]);

    // Transform posts: rename users -> author, categories -> category
    const transformedPosts = posts.map((post: any) => ({
      ...post,
      author: post.users,
      category: post.categories,
      users: undefined,
      categories: undefined,
    }));

    return sendPaginated(res, transformedPosts, { page, limit, total }, 'Posts retrieved');
  } catch (error) {
    next(error);
  }
}

/**
 * PATCH /api/v1/admin/posts/:id/status
 * Update post status
 */
export async function updatePostStatus(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const id = parseInt(req.params.id as string, 10);
    const { status } = req.body;

    if (!['DRAFT', 'PUBLISHED', 'HIDDEN', 'DELETED'].includes(status)) {
      throw new BadRequestError('Invalid status');
    }

    const post = await prisma.posts.findUnique({
      where: { id },
      select: { id: true, title: true, status: true },
    });

    if (!post) {
      throw new NotFoundError('Post not found');
    }

    const updatedPost = await prisma.posts.update({
      where: { id },
      data: { status },
      select: {
        id: true,
        title: true,
        status: true,
      },
    });

    const auditAction = status === 'HIDDEN' ? 'HIDE' : status === 'DELETED' ? 'DELETE' : status === 'PUBLISHED' ? 'SHOW' : 'UPDATE';
    await auditLogService.createAuditLog({
      userId: req.user!.userId,
      action: auditAction as any,
      targetType: 'POST',
      targetId: id,
      targetName: post.title,
      oldValue: { status: post.status },
      newValue: { status },
      ipAddress: auditLogService.getClientIp(req),
    });

    return sendSuccess(res, updatedPost, 'Post status updated');
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/v1/admin/comments
 * Get all comments for admin management
 */
export async function getComments(req: Request, res: Response, next: NextFunction) {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const status = req.query.status as string;

    const skip = (page - 1) * limit;

    const where: any = {};

    if (status) {
      where.status = status.toUpperCase();
    }

    const [comments, total] = await Promise.all([
      prisma.comments.findMany({
        where,
        select: {
          id: true,
          content: true,
          status: true,
          is_content_masked: true,
          upvote_count: true,
          downvote_count: true,
          created_at: true,
          users: {
            select: {
              id: true,
              username: true,
              display_name: true,
              avatar_url: true,
            },
          },
          posts: {
            select: {
              id: true,
              title: true,
              slug: true,
            },
          },
        },
        orderBy: { created_at: 'desc' },
        skip,
        take: limit,
      }),
      prisma.comments.count({ where }),
    ]);

    // Mask content for masked comments and transform relations
    const maskedComments = comments.map(comment => ({
      ...comment,
      author: (comment as any).users,
      post: (comment as any).posts,
      users: undefined,
      posts: undefined,
      content: comment.is_content_masked ? '[Nội dung đã được che]' : comment.content,
    }));

    return sendPaginated(res, maskedComments, { page, limit, total }, 'Comments retrieved');
  } catch (error) {
    next(error);
  }
}

/**
 * PATCH /api/v1/admin/comments/:id/status
 * Update comment status
 */
export async function updateCommentStatus(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const id = parseInt(req.params.id as string, 10);
    const { status } = req.body;

    if (!['VISIBLE', 'HIDDEN', 'DELETED'].includes(status)) {
      throw new BadRequestError('Invalid status');
    }

    const comment = await prisma.comments.findUnique({
      where: { id },
      select: { id: true, content: true, status: true },
    });

    if (!comment) {
      throw new NotFoundError('Comment not found');
    }

    const updatedComment = await prisma.comments.update({
      where: { id },
      data: { status },
      select: {
        id: true,
        content: true,
        status: true,
      },
    });

    const auditAction = status === 'HIDDEN' ? 'HIDE' : status === 'DELETED' ? 'DELETE' : 'SHOW';
    await auditLogService.createAuditLog({
      userId: req.user!.userId,
      action: auditAction as any,
      targetType: 'COMMENT',
      targetId: id,
      targetName: comment!.content.substring(0, 50),
      oldValue: { status: comment!.status },
      newValue: { status },
      ipAddress: auditLogService.getClientIp(req),
    });

    return sendSuccess(res, updatedComment, 'Comment status updated');
  } catch (error) {
    next(error);
  }
}

/**
 * PATCH /api/v1/admin/comments/:id/mask
 * Toggle comment content mask
 */
export async function toggleCommentMask(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const id = parseInt(req.params.id as string, 10);

    const comment = await prisma.comments.findUnique({
      where: { id },
      select: { id: true, content: true, is_content_masked: true },
    });

    if (!comment) {
      throw new NotFoundError('Comment not found');
    }

    const updatedComment = await prisma.comments.update({
      where: { id },
      data: { is_content_masked: !comment.is_content_masked },
      select: {
        id: true,
        is_content_masked: true,
      },
    });

    // Log audit
    await auditLogService.createAuditLog({
      userId: req.user!.userId,
      action: updatedComment.is_content_masked ? 'HIDE' : 'SHOW',
      targetType: 'COMMENT',
      targetId: id,
      targetName: `Mask Comment #${id}`,
      oldValue: { is_content_masked: comment.is_content_masked },
      newValue: { is_content_masked: updatedComment.is_content_masked },
      ipAddress: auditLogService.getClientIp(req),
    });

    return sendSuccess(
      res,
      updatedComment,
      updatedComment.is_content_masked ? 'Comment content masked' : 'Comment content unmasked'
    );
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/v1/admin/comments/:id/content
 * View comment content (with audit log for privacy/security)
 * All comment views are logged for audit purposes
 */
export async function viewMaskedCommentContent(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const id = parseInt(req.params.id as string, 10);

    const comment = await prisma.comments.findUnique({
      where: { id },
      select: {
        id: true,
        content: true,
        is_content_masked: true,
        users: {
          select: {
            id: true,
            username: true,
            display_name: true,
            avatar_url: true,
          },
        },
      },
    });

    if (!comment) {
      throw new NotFoundError('Comment not found');
    }

    // Always log audit when viewing comment content in admin panel for privacy/security
    await auditLogService.createAuditLog({
      userId: req.user!.userId,
      action: 'VIEW_MASKED_CONTENT',
      targetType: 'COMMENT',
      targetId: id,
      targetName: `View Comment #${id}${comment.is_content_masked ? ' (masked)' : ''}`,
      ipAddress: auditLogService.getClientIp(req),
    });

    return sendSuccess(res, { ...comment, author: (comment as any).users, users: undefined }, 'Comment content retrieved');
  } catch (error) {
    next(error);
  }
}

// ========================================
// POST PIN/LOCK/DELETE MANAGEMENT
// ========================================

/**
 * PATCH /api/v1/admin/posts/:id/pin
 * Toggle post pin status or set specific pin type
 */
export async function togglePostPin(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const id = parseInt(req.params.id as string, 10);
    const { pin_type } = req.body; // Optional: 'GLOBAL' | 'CATEGORY'

    const post = await prisma.posts.findUnique({
      where: { id },
      select: { id: true, title: true, is_pinned: true, pin_type: true },
    });

    if (!post) {
      throw new NotFoundError('Post not found');
    }

    // If pin_type is provided, pin with that type; otherwise toggle
    const newIsPinned = pin_type ? true : !post.is_pinned;
    const newPinType = pin_type ? pin_type : (newIsPinned ? 'GLOBAL' : null);

    const updatedPost = await prisma.posts.update({
      where: { id },
      data: { 
        is_pinned: newIsPinned,
        pin_type: newPinType,
      },
      select: {
        id: true,
        title: true,
        is_pinned: true,
        pin_type: true,
      },
    });

    // Log audit
    await auditLogService.createAuditLog({
      userId: req.user!.userId,
      action: updatedPost.is_pinned ? 'PIN' : 'UNPIN',
      targetType: 'POST',
      targetId: id,
      targetName: post.title,
      oldValue: { is_pinned: post.is_pinned, pin_type: post.pin_type },
      newValue: { is_pinned: updatedPost.is_pinned, pin_type: updatedPost.pin_type },
      ipAddress: auditLogService.getClientIp(req),
    });

    return sendSuccess(
      res,
      updatedPost,
      updatedPost.is_pinned ? 'Post pinned successfully' : 'Post unpinned successfully'
    );
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/v1/admin/posts/pinned
 * Get all pinned posts with order management
 */
export async function getPinnedPosts(req: Request, res: Response, next: NextFunction) {
  try {
    const pinnedPosts = await prisma.posts.findMany({
      where: { 
        is_pinned: true,
        status: 'PUBLISHED',
      },
      select: {
        id: true,
        title: true,
        pin_order: true,
        is_pinned: true,
        view_count: true,
        comment_count: true,
        created_at: true,
        users: {
          select: {
            id: true,
            username: true,
            display_name: true,
            avatar_url: true,
          },
        },
        categories: {
          select: {
            id: true,
            name: true,
            color: true,
          },
        },
      },
      orderBy: [
        { pin_order: 'asc' },
        { created_at: 'desc' },
      ],
    });

    // Transform posts: rename users -> author, categories -> category
    const transformedPosts = pinnedPosts.map((post: any) => ({
      ...post,
      author: post.users,
      category: post.categories,
      users: undefined,
      categories: undefined,
    }));

    return sendSuccess(res, transformedPosts, 'Pinned posts retrieved');
  } catch (error) {
    next(error);
  }
}

/**
 * PATCH /api/v1/admin/posts/:id/pin-order
 * Update pinned post order
 */
export async function updatePinOrder(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const id = parseInt(req.params.id as string, 10);
    const { pin_order } = req.body;

    if (typeof pin_order !== 'number') {
      throw new BadRequestError('pin_order must be a number');
    }

    const post = await prisma.posts.findUnique({
      where: { id },
      select: { id: true, title: true, is_pinned: true, pin_order: true },
    });

    if (!post) {
      throw new NotFoundError('Post not found');
    }

    if (!post.is_pinned) {
      throw new BadRequestError('Post is not pinned');
    }

    const updatedPost = await prisma.posts.update({
      where: { id },
      data: { pin_order },
      select: {
        id: true,
        title: true,
        pin_order: true,
        is_pinned: true,
      },
    });

    // Log audit
    await auditLogService.createAuditLog({
      userId: req.user!.userId,
      action: 'UPDATE',
      targetType: 'POST',
      targetId: id,
      targetName: `${post.title} - Pin Order`,
      oldValue: { pin_order: post.pin_order },
      newValue: { pin_order: updatedPost.pin_order },
      ipAddress: auditLogService.getClientIp(req),
    });

    return sendSuccess(res, updatedPost, 'Pin order updated successfully');
  } catch (error) {
    next(error);
  }
}

/**
 * PATCH /api/v1/admin/posts/reorder-pins
 * Reorder all pinned posts
 */
export async function reorderPinnedPosts(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { orders } = req.body;

    if (!Array.isArray(orders)) {
      throw new BadRequestError('orders must be an array of { id, pin_order }');
    }

    // Validate all posts exist and are pinned
    const postIds = orders.map((o: any) => o.id);
    const posts = await prisma.posts.findMany({
      where: { id: { in: postIds }, is_pinned: true },
      select: { id: true, title: true, pin_order: true },
    });

    if (posts.length !== postIds.length) {
      throw new BadRequestError('Some posts not found or not pinned');
    }

    // Update all posts in a transaction
    await prisma.$transaction(
      orders.map((order: { id: number; pin_order: number }) =>
        prisma.posts.update({
          where: { id: order.id },
          data: { pin_order: order.pin_order },
        })
      )
    );

    // Log audit
    await auditLogService.createAuditLog({
      userId: req.user!.userId,
      action: 'UPDATE',
      targetType: 'POST',
      targetName: 'Reorder Pinned Posts',
      oldValue: posts.map(p => ({ id: p.id, pin_order: p.pin_order })),
      newValue: orders,
      ipAddress: auditLogService.getClientIp(req),
    });

    return sendSuccess(res, null, 'Pinned posts reordered successfully');
  } catch (error) {
    next(error);
  }
}

/**
 * PATCH /api/v1/admin/posts/:id/lock
 * Toggle post lock status
 */
export async function togglePostLock(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const id = parseInt(req.params.id as string, 10);

    const post = await prisma.posts.findUnique({
      where: { id },
      select: { id: true, title: true, is_locked: true },
    });

    if (!post) {
      throw new NotFoundError('Post not found');
    }

    const updatedPost = await prisma.posts.update({
      where: { id },
      data: { is_locked: !post.is_locked },
      select: {
        id: true,
        title: true,
        is_locked: true,
      },
    });

    // Log audit
    await auditLogService.createAuditLog({
      userId: req.user!.userId,
      action: updatedPost.is_locked ? 'LOCK' : 'UNLOCK',
      targetType: 'POST',
      targetId: id,
      targetName: post.title,
      oldValue: { is_locked: post.is_locked },
      newValue: { is_locked: updatedPost.is_locked },
      ipAddress: auditLogService.getClientIp(req),
    });

    return sendSuccess(
      res,
      updatedPost,
      updatedPost.is_locked ? 'Post locked successfully' : 'Post unlocked successfully'
    );
  } catch (error) {
    next(error);
  }
}

/**
 * DELETE /api/v1/admin/posts/:id
 * Soft delete post
 */
export async function deletePost(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const id = parseInt(req.params.id as string, 10);

    const post = await prisma.posts.findUnique({
      where: { id },
      select: { id: true, title: true, status: true },
    });

    if (!post) {
      throw new NotFoundError('Post not found');
    }

    await prisma.posts.update({
      where: { id },
      data: { status: 'DELETED' },
    });

    // Log audit
    await auditLogService.createAuditLog({
      userId: req.user!.userId,
      action: 'DELETE',
      targetType: 'POST',
      targetId: id,
      targetName: post.title,
      oldValue: { status: post.status },
      newValue: { status: 'DELETED' },
      ipAddress: auditLogService.getClientIp(req),
    });

    return sendSuccess(res, null, 'Post deleted successfully');
  } catch (error) {
    next(error);
  }
}

/**
 * DELETE /api/v1/admin/comments/:id
 * Soft delete comment
 */
export async function deleteComment(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const id = parseInt(req.params.id as string, 10);

    const comment = await prisma.comments.findUnique({
      where: { id },
      select: { id: true, content: true, status: true },
    });

    if (!comment) {
      throw new NotFoundError('Comment not found');
    }

    await prisma.comments.update({
      where: { id },
      data: { status: 'DELETED' },
    });

    // Log audit
    await auditLogService.createAuditLog({
      userId: req.user!.userId,
      action: 'DELETE',
      targetType: 'COMMENT',
      targetId: id,
      targetName: comment.content.substring(0, 50),
      oldValue: { status: comment.status },
      newValue: { status: 'DELETED' },
      ipAddress: auditLogService.getClientIp(req),
    });

    return sendSuccess(res, null, 'Comment deleted successfully');
  } catch (error) {
    next(error);
  }
}

// ========================================
// CATEGORY MANAGEMENT
// ========================================

/**
 * GET /api/v1/admin/categories
 * Get all categories for admin
 */
export async function getCategories(req: Request, res: Response, next: NextFunction) {
  try {
    const includeInactive = req.query.includeInactive === 'true';
    
    const where = includeInactive ? {} : { is_active: true };
    
    const categories = await prisma.categories.findMany({
      where,
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        color: true,
        sort_order: true,
        post_count: true,
        is_active: true,
        view_permission: true,
        post_permission: true,
        comment_permission: true,
        created_at: true,
        updated_at: true,
        _count: {
          select: {
            posts: {
              where: { status: 'PUBLISHED' }
            }
          }
        }
      },
      orderBy: { sort_order: 'asc' },
    });

    // Return with accurate post_count from actual published posts
    const result = categories.map(category => ({
      ...category,
      actualPostCount: category._count.posts,
      _count: undefined,
    }));

    return sendSuccess(res, result, 'Categories retrieved');
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/v1/admin/categories
 * Create new category
 */
export async function createCategory(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { name, description, color, sort_order, is_active, view_permission, post_permission, comment_permission } = req.body;

    if (!name) {
      throw new BadRequestError('Category name is required');
    }

    const slug = generateSlug(name);

    // Check if slug already exists
    const existingCategory = await prisma.categories.findUnique({
      where: { slug },
    });

    if (existingCategory) {
      throw new BadRequestError('Category with this name already exists');
    }

    // Validate permissions if provided
    const validViewPermissions = ['ALL', 'MEMBER', 'MODERATOR', 'ADMIN'];
    const validPostCommentPermissions = ['MEMBER', 'MODERATOR', 'ADMIN'];
    
    if (view_permission && !validViewPermissions.includes(view_permission)) {
      throw new BadRequestError('Invalid view_permission value');
    }
    if (post_permission && !validPostCommentPermissions.includes(post_permission)) {
      throw new BadRequestError('Invalid post_permission value - must be MEMBER, MODERATOR, or ADMIN');
    }
    if (comment_permission && !validPostCommentPermissions.includes(comment_permission)) {
      throw new BadRequestError('Invalid comment_permission value - must be MEMBER, MODERATOR, or ADMIN');
    }

    const category = await prisma.categories.create({
      data: {
        name,
        slug,
        description: description || null,
        color: color || null,
        sort_order: sort_order ?? 0,
        is_active: is_active ?? true,
        view_permission: view_permission || 'ALL',
        post_permission: post_permission || 'MEMBER',
        comment_permission: comment_permission || 'MEMBER',
      },
    });

    // Log audit
    await auditLogService.createAuditLog({
      userId: req.user!.userId,
      action: 'CREATE',
      targetType: 'CATEGORY',
      targetId: category.id,
      targetName: category.name,
      newValue: category,
      ipAddress: auditLogService.getClientIp(req),
    });

    return sendSuccess(res, category, 'Category created successfully');
  } catch (error) {
    next(error);
  }
}

/**
 * PATCH /api/v1/admin/categories/:id
 * Update category
 */
export async function updateCategory(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const id = parseInt(req.params.id as string, 10);
    const { name, description, color, sort_order, is_active, view_permission, post_permission, comment_permission } = req.body;

    const category = await prisma.categories.findUnique({
      where: { id },
    });

    if (!category) {
      throw new NotFoundError('Category not found');
    }

    const oldValue = { ...category };

    const updateData: any = {};
    if (name !== undefined) {
      updateData.name = name;
      updateData.slug = generateSlug(name);
    }
    if (description !== undefined) updateData.description = description;
    if (color !== undefined) updateData.color = color;
    if (sort_order !== undefined) updateData.sort_order = sort_order;
    if (is_active !== undefined) updateData.is_active = is_active;
    if (view_permission !== undefined) {
      if (!['ALL', 'MEMBER', 'MODERATOR', 'ADMIN'].includes(view_permission)) {
        throw new BadRequestError('Invalid view_permission value');
      }
      updateData.view_permission = view_permission;
    }
    if (post_permission !== undefined) {
      if (!['MEMBER', 'MODERATOR', 'ADMIN'].includes(post_permission)) {
        throw new BadRequestError('Invalid post_permission value - must be MEMBER, MODERATOR, or ADMIN');
      }
      updateData.post_permission = post_permission;
    }
    if (comment_permission !== undefined) {
      if (!['MEMBER', 'MODERATOR', 'ADMIN'].includes(comment_permission)) {
        throw new BadRequestError('Invalid comment_permission value - must be MEMBER, MODERATOR, or ADMIN');
      }
      updateData.comment_permission = comment_permission;
    }

    const updatedCategory = await prisma.categories.update({
      where: { id },
      data: updateData,
    });

    // Log audit
    await auditLogService.createAuditLog({
      userId: req.user!.userId,
      action: 'UPDATE',
      targetType: 'CATEGORY',
      targetId: id,
      targetName: updatedCategory.name,
      oldValue,
      newValue: updatedCategory,
      ipAddress: auditLogService.getClientIp(req),
    });

    return sendSuccess(res, updatedCategory, 'Category updated successfully');
  } catch (error) {
    next(error);
  }
}

/**
 * DELETE /api/v1/admin/categories/:id
 * Delete category
 */
export async function deleteCategory(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const id = parseInt(req.params.id as string, 10);

    const category = await prisma.categories.findUnique({
      where: { id },
      include: { _count: { select: { posts: true } } },
    });

    if (!category) {
      throw new NotFoundError('Category not found');
    }

    if (category._count.posts > 0) {
      throw new BadRequestError('Cannot delete category with existing posts. Please move or delete posts first.');
    }

    await prisma.categories.delete({
      where: { id },
    });

    // Log audit
    await auditLogService.createAuditLog({
      userId: req.user!.userId,
      action: 'DELETE',
      targetType: 'CATEGORY',
      targetId: id,
      targetName: category.name,
      oldValue: category,
      ipAddress: auditLogService.getClientIp(req),
    });

    return sendSuccess(res, null, 'Category deleted successfully');
  } catch (error) {
    next(error);
  }
}

// ========================================
// TAG MANAGEMENT
// ========================================

/**
 * GET /api/v1/admin/tags
 * Get all tags for admin
 */
export async function getTags(req: Request, res: Response, next: NextFunction) {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;
    const search = req.query.search as string;

    const skip = (page - 1) * limit;
    const where: any = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { slug: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [tags, total] = await Promise.all([
      prisma.tags.findMany({
        where,
        select: {
          id: true,
          name: true,
          slug: true,
          description: true,
          usage_count: true,
          use_permission: true,
          is_active: true,
          created_at: true,
          updated_at: true,
          _count: {
            select: { post_tags: true }
          }
        },
        orderBy: { usage_count: 'desc' },
        skip,
        take: limit,
      }),
      prisma.tags.count({ where }),
    ]);

    const result = tags.map(tag => ({
      ...tag,
      actualUsageCount: tag._count.post_tags,
      _count: undefined,
    }));

    return sendPaginated(res, result, { page, limit, total }, 'Tags retrieved');
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/v1/admin/tags
 * Create new tag
 */
export async function createTag(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { name, description, use_permission, is_active } = req.body;

    if (!name) {
      throw new BadRequestError('Tag name is required');
    }

    const slug = generateSlug(name);

    // Check if slug already exists
    const existingTag = await prisma.tags.findUnique({
      where: { slug },
    });

    if (existingTag) {
      throw new BadRequestError('Tag with this name already exists');
    }

    // Validate use_permission if provided
    const validPermissions = ['ALL', 'MEMBER', 'MODERATOR', 'ADMIN'];
    if (use_permission && !validPermissions.includes(use_permission)) {
      throw new BadRequestError('Invalid use_permission value');
    }

    const tag = await prisma.tags.create({
      data: {
        name,
        slug,
        description: description || null,
        use_permission: use_permission || 'MEMBER',
        is_active: is_active ?? true,
      },
    });

    // Log audit
    await auditLogService.createAuditLog({
      userId: req.user!.userId,
      action: 'CREATE',
      targetType: 'TAG',
      targetId: tag.id,
      targetName: tag.name,
      newValue: tag,
      ipAddress: auditLogService.getClientIp(req),
    });

    return sendSuccess(res, tag, 'Tag created successfully');
  } catch (error) {
    next(error);
  }
}

/**
 * PATCH /api/v1/admin/tags/:id
 * Update tag
 */
export async function updateTag(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const id = parseInt(req.params.id as string, 10);
    const { name, description, use_permission, is_active } = req.body;

    const tag = await prisma.tags.findUnique({
      where: { id },
    });

    if (!tag) {
      throw new NotFoundError('Tag not found');
    }

    const oldValue = { ...tag };

    const updateData: any = {};
    if (name !== undefined) {
      updateData.name = name;
      updateData.slug = generateSlug(name);
    }
    if (description !== undefined) updateData.description = description;
    if (use_permission !== undefined) {
      if (!['ALL', 'MEMBER', 'MODERATOR', 'ADMIN'].includes(use_permission)) {
        throw new BadRequestError('Invalid use_permission value');
      }
      updateData.use_permission = use_permission;
    }
    if (is_active !== undefined) updateData.is_active = is_active;

    const updatedTag = await prisma.tags.update({
      where: { id },
      data: updateData,
    });

    // Log audit
    await auditLogService.createAuditLog({
      userId: req.user!.userId,
      action: 'UPDATE',
      targetType: 'TAG',
      targetId: id,
      targetName: updatedTag.name,
      oldValue,
      newValue: updatedTag,
      ipAddress: auditLogService.getClientIp(req),
    });

    return sendSuccess(res, updatedTag, 'Tag updated successfully');
  } catch (error) {
    next(error);
  }
}

/**
 * DELETE /api/v1/admin/tags/:id
 * Delete tag
 */
export async function deleteTag(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const id = parseInt(req.params.id as string, 10);

    const tag = await prisma.tags.findUnique({
      where: { id },
      include: { _count: { select: { post_tags: true } } },
    });

    if (!tag) {
      throw new NotFoundError('Tag not found');
    }

    // Delete tag (cascade will remove PostTag relations)
    await prisma.tags.delete({
      where: { id },
    });

    // Log audit
    await auditLogService.createAuditLog({
      userId: req.user!.userId,
      action: 'DELETE',
      targetType: 'TAG',
      targetId: id,
      targetName: tag.name,
      oldValue: { ...tag, post_count: tag._count.post_tags },
      ipAddress: auditLogService.getClientIp(req),
    });

    return sendSuccess(res, null, 'Tag deleted successfully');
  } catch (error) {
    next(error);
  }
}

// ========================================
// AUDIT LOG
// ========================================

/**
 * GET /api/v1/admin/audit-logs
 * Get audit logs
 */
export async function getAuditLogs(req: Request, res: Response, next: NextFunction) {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;
    const userId = req.query.userId ? parseInt(req.query.userId as string) : undefined;
    const action = req.query.action as any;
    const targetType = req.query.targetType as any;

    const result = await auditLogService.getAuditLogs({
      page,
      limit,
      userId,
      action,
      targetType,
    });

    return sendPaginated(res, result.logs, result.pagination, 'Audit logs retrieved');
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/v1/admin/metrics
 * Operational metrics snapshot (latency, throughput, error rate, LLM stats, alerts)
 */
export function getMetrics(_req: Request, res: Response): void {
  sendSuccess(res, getSnapshot(), 'Metrics retrieved');
}








