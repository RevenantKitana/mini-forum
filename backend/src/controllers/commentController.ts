import { Request, Response, NextFunction } from 'express';
import * as commentService from '../services/commentService.js';
import { sendSuccess, sendCreated, sendNoContent, sendPaginated } from '../utils/response.js';
import { CreateCommentInput, UpdateCommentInput, listCommentsQuerySchema } from '../validations/commentValidation.js';
import { AuthRequest } from '../middlewares/authMiddleware.js';

/**
 * GET /api/v1/posts/:postId/comments
 * Get comments for a post
 */
export async function getCommentsByPostId(req: Request, res: Response, next: NextFunction) {
  try {
    const postId = parseInt(req.params.postId as string, 10);
    const query = listCommentsQuerySchema.parse(req.query);
    const result = await commentService.getCommentsByPostId(postId, query);
    return res.json({
      success: true,
      message: 'Comments retrieved successfully',
      data: result.data,
      pagination: result.pagination,
      is_locked: result.is_locked,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/v1/comments/:id
 * Get comment by ID
 */
export async function getCommentById(req: Request, res: Response, next: NextFunction) {
  try {
    const id = parseInt(req.params.id as string, 10);
    const authReq = req as AuthRequest;
    const comment = await commentService.getCommentById(id, authReq.user?.role);
    return sendSuccess(res, comment, 'Comment retrieved successfully');
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/v1/comments/:id/replies
 * Get replies to a comment
 */
export async function getCommentReplies(req: Request, res: Response, next: NextFunction) {
  try {
    const id = parseInt(req.params.id as string, 10);
    const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 10;
    const authReq = req as AuthRequest;
    const result = await commentService.getCommentReplies(id, page, limit, authReq.user?.role);
    return sendPaginated(res, result.data, result.pagination, 'Replies retrieved successfully');
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/v1/posts/:postId/comments
 * Create a new comment
 */
export async function createComment(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const postId = parseInt(req.params.postId as string, 10);
    const data: CreateCommentInput = req.body;
    const comment = await commentService.createComment(postId, data, req.user!.userId, req.user!.role);
    return sendCreated(res, comment, 'Comment created successfully');
  } catch (error) {
    next(error);
  }
}

/**
 * PUT /api/v1/comments/:id
 * Update a comment
 */
export async function updateComment(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const id = parseInt(req.params.id as string, 10);
    const data: UpdateCommentInput = req.body;
    const comment = await commentService.updateComment(id, data, req.user!.userId, req.user!.role);
    return sendSuccess(res, comment, 'Comment updated successfully');
  } catch (error) {
    next(error);
  }
}

/**
 * DELETE /api/v1/comments/:id
 * Delete a comment
 */
export async function deleteComment(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const id = parseInt(req.params.id as string, 10);
    await commentService.deleteComment(id, req.user!.userId, req.user!.role);
    return sendNoContent(res);
  } catch (error) {
    next(error);
  }
}

/**
 * PATCH /api/v1/comments/:id/hide
 * Toggle hide status for a comment (Mod/Admin only)
 */
export async function hideComment(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const id = parseInt(req.params.id as string, 10);
    const comment = await commentService.hideComment(id);
    const message = comment.status === 'HIDDEN' ? 'Comment hidden successfully' : 'Comment unhidden successfully';
    return sendSuccess(res, comment, message);
  } catch (error) {
    next(error);
  }
}







