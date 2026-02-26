import { Request, Response, NextFunction } from 'express';
import * as blockService from '../services/blockService.js';
import * as reportService from '../services/reportService.js';
import { sendSuccess, sendCreated, sendNoContent, sendPaginated } from '../utils/response.js';
import { CreateReportInput, reportQuerySchema, UpdateReportStatusInput } from '../validations/reportValidation.js';
import { AuthRequest } from '../middlewares/authMiddleware.js';

// ==================== Block Controller ====================

/**
 * POST /api/v1/users/:id/block
 * Block a user
 */
export async function blockUser(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const blockedId = parseInt(req.params.id as string, 10);
    const result = await blockService.blockUser(req.user!.userId, blockedId);
    return sendCreated(res, result, `User ${result.username} blocked successfully`);
  } catch (error) {
    next(error);
  }
}

/**
 * DELETE /api/v1/users/:id/block
 * Unblock a user
 */
export async function unblockUser(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const blockedId = parseInt(req.params.id as string, 10);
    await blockService.unblockUser(req.user!.userId, blockedId);
    return sendNoContent(res);
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/v1/users/:id/block
 * Check if user is blocked
 */
export async function isUserBlocked(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const blockedId = parseInt(req.params.id as string, 10);
    const isBlocked = await blockService.isUserBlocked(req.user!.userId, blockedId);
    return sendSuccess(res, {  isBlocked }, 'Block status retrieved');
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/v1/users/me/blocked
 * Get list of blocked users
 */
export async function getBlockedUsers(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 20;
    const result = await blockService.getBlockedUsers(req.user!.userId, page, limit);
    return sendPaginated(res, result.data, result.pagination, 'Blocked users retrieved');
  } catch (error) {
    next(error);
  }
}

// ==================== Report Controller ====================

/**
 * POST /api/v1/posts/:id/report
 * Report a post
 */
export async function reportPost(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const postId = parseInt(req.params.id as string, 10);
    const data: CreateReportInput = req.body;
    const report = await reportService.reportPost(req.user!.userId, postId, data);
    return sendCreated(res, report, 'Post reported successfully');
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/v1/comments/:id/report
 * Report a comment
 */
export async function reportComment(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const commentId = parseInt(req.params.id as string, 10);
    const data: CreateReportInput = req.body;
    const report = await reportService.reportComment(req.user!.userId, commentId, data);
    return sendCreated(res, report, 'Comment reported successfully');
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/v1/users/:id/report
 * Report a user
 */
export async function reportUser(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const userId = parseInt(req.params.id as string, 10);
    const data: CreateReportInput = req.body;
    const report = await reportService.reportUser(req.user!.userId, userId, data);
    return sendCreated(res, report, 'User reported successfully');
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/v1/reports (Admin/Mod only)
 * Get all reports
 */
export async function getReports(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const query = reportQuerySchema.parse(req.query);
    const result = await reportService.getReports(query);
    return sendPaginated(res, result.data, result.pagination, 'Reports retrieved');
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/v1/reports/:id (Admin/Mod only)
 * Get report by ID
 */
export async function getReportById(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const id = parseInt(req.params.id as string, 10);
    const report = await reportService.getReportById(id);
    return sendSuccess(res, report, 'Report retrieved');
  } catch (error) {
    next(error);
  }
}

/**
 * PATCH /api/v1/reports/:id/status (Admin/Mod only)
 * Update report status
 */
export async function updateReportStatus(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const id = parseInt(req.params.id as string, 10);
    const data: UpdateReportStatusInput = req.body;
    const report = await reportService.updateReportStatus(id, req.user!.userId, data);
    return sendSuccess(res, report, 'Report status updated');
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/v1/reports/pending/count (Admin/Mod only)
 * Get pending reports count
 */
export async function getPendingReportsCount(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const count = await reportService.getPendingReportsCount();
    return sendSuccess(res, { count }, 'Pending reports count retrieved');
  } catch (error) {
    next(error);
  }
}








