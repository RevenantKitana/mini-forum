import { Request, Response, NextFunction } from 'express';
import * as bookmarkService from '../services/bookmarkService.js';
import { sendSuccess, sendCreated, sendNoContent, sendPaginated } from '../utils/response.js';
import { AuthRequest } from '../middlewares/authMiddleware.js';

/**
 * GET /api/v1/users/:id/bookmarks
 * Get user's bookmarks
 */
export async function getUserBookmarks(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const userId = parseInt(req.params.id as string, 10);
    const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 10;

    // Users can only view their own bookmarks
    if (userId !== req.user!.userId) {
      return res.status(403).json({
        success: false,
        message: 'You can only view your own bookmarks',
      });
    }

    const result = await bookmarkService.getUserBookmarks(userId, page, limit, req.user!.role);
    return sendPaginated(res, result.data, result.pagination, 'Bookmarks retrieved successfully');
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/v1/posts/:id/bookmark
 * Check if post is bookmarked
 */
export async function checkBookmark(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const postId = parseInt(req.params.id as string, 10);
    const isBookmarked = await bookmarkService.isPostBookmarked(req.user!.userId, postId);
    return sendSuccess(res, { bookmarked: isBookmarked }, 'Bookmark status retrieved successfully');
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/v1/posts/:id/bookmark
 * Add bookmark to a post
 */
export async function addBookmark(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const postId = parseInt(req.params.id as string, 10);
    await bookmarkService.addBookmark(req.user!.userId, postId);
    return sendCreated(res, { bookmarked: true }, 'Post bookmarked successfully');
  } catch (error) {
    next(error);
  }
}

/**
 * DELETE /api/v1/posts/:id/bookmark
 * Remove bookmark from a post
 */
export async function removeBookmark(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const postId = parseInt(req.params.id as string, 10);
    await bookmarkService.removeBookmark(req.user!.userId, postId);
    return sendNoContent(res);
  } catch (error) {
    next(error);
  }
}

/**
 * PATCH /api/v1/posts/:id/bookmark
 * Toggle bookmark on a post
 */
export async function toggleBookmark(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const postId = parseInt(req.params.id as string, 10);
    const result = await bookmarkService.toggleBookmark(req.user!.userId, postId);
    return sendSuccess(
      res,
      result,
      result.bookmarked ? 'Post bookmarked successfully' : 'Bookmark removed successfully'
    );
  } catch (error) {
    next(error);
  }
}







