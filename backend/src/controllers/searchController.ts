import { Request, Response, NextFunction } from 'express';
import * as searchService from '../services/searchService.js';
import { sendSuccess, sendPaginated } from '../utils/response.js';
import { searchQuerySchema, SearchQuery } from '../validations/searchValidation.js';
import { AuthRequest } from '../middlewares/authMiddleware.js';

/**
 * GET /api/v1/search
 * Search posts
 */
export async function searchPosts(req: Request, res: Response, next: NextFunction) {
  try {
    const query = searchQuerySchema.parse(req.query) as SearchQuery;
    const authReq = req as AuthRequest;
    const result = await searchService.searchPosts(query, authReq.user?.role);
    return sendPaginated(
      res,
      result.data,
      result.pagination,
      `Found ${result.pagination.total} results for "${result.query}"`
    );
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/v1/search/users
 * Search users
 */
export async function searchUsers(req: Request, res: Response, next: NextFunction) {
  try {
    const q = req.query.q as string;
    const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 10;

    if (!q) {
      return res.status(400).json({
        success: false,
        message: 'Search query is required',
      });
    }

    const result = await searchService.searchUsers(q, page, limit);
    return sendPaginated(res, result.data, result.pagination, 'Users found');
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/v1/search/suggestions
 * Get search suggestions
 */
export async function getSearchSuggestions(req: Request, res: Response, next: NextFunction) {
  try {
    const q = req.query.q as string;
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 5;

    if (!q || q.length < 2) {
      return sendSuccess(res, { posts: [], tags: [] }, 'Search suggestions');
    }

    const authReq = req as AuthRequest;
    const suggestions = await searchService.getSearchSuggestions(q, limit, authReq.user?.role);
    return sendSuccess(res, suggestions, 'Search suggestions');
  } catch (error) {
    next(error);
  }
}







