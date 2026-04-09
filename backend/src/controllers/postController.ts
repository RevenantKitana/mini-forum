import { Request, Response, NextFunction } from 'express';
import * as postService from '../services/postService.js';
import { sendSuccess, sendCreated, sendNoContent, sendPaginated } from '../utils/response.js';
import { CreatePostInput, UpdatePostInput, UpdatePostStatusInput, ListPostsQuery, listPostsQuerySchema } from '../validations/postValidation.js';
import { AuthRequest } from '../middlewares/authMiddleware.js';

/**
 * GET /api/v1/posts
 * Get posts with pagination and filters
 */
export async function getPosts(req: Request, res: Response, next: NextFunction) {
  try {
    const query = listPostsQuerySchema.parse(req.query) as ListPostsQuery;
    const authReq = req as AuthRequest;
    const result = await postService.getPosts(query, authReq.user?.userId, authReq.user?.role);
    return sendPaginated(res, result.data, result.pagination, 'Posts retrieved successfully');
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/v1/posts/featured
 * Get featured posts
 */
export async function getFeaturedPosts(req: Request, res: Response, next: NextFunction) {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 5;
    const authReq = req as AuthRequest;
    const posts = await postService.getFeaturedPosts(limit, authReq.user?.role);
    return sendSuccess(res, posts, 'Featured posts retrieved successfully');
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/v1/posts/latest
 * Get latest posts
 */
export async function getLatestPosts(req: Request, res: Response, next: NextFunction) {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 10;
    const authReq = req as AuthRequest;
    const posts = await postService.getLatestPosts(limit, authReq.user?.role);
    return sendSuccess(res, posts, 'Latest posts retrieved successfully');
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/v1/posts/:id
 * Get post by ID
 */
export async function getPostById(req: Request, res: Response, next: NextFunction) {
  try {
    const id = parseInt(req.params.id as string, 10);
    const authReq = req as AuthRequest;
    const post = await postService.getPostById(id, true, authReq.user?.userId, authReq.user?.role);
    return sendSuccess(res, post, 'Post retrieved successfully');
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/v1/posts
 * Create new post
 */
export async function createPost(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const data: CreatePostInput = req.body;
    const post = await postService.createPost(data, req.user!.userId, req.user!.role);
    return sendCreated(res, post, 'Post created successfully');
  } catch (error) {
    next(error);
  }
}

/**
 * PUT /api/v1/posts/:id
 * Update post
 */
export async function updatePost(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const id = parseInt(req.params.id as string, 10);
    const data: UpdatePostInput = req.body;
    const post = await postService.updatePost(id, data, req.user!.userId, req.user!.role);
    return sendSuccess(res, post, 'Post updated successfully');
  } catch (error) {
    next(error);
  }
}

/**
 * DELETE /api/v1/posts/:id
 * Delete post
 */
export async function deletePost(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const id = parseInt(req.params.id as string, 10);
    await postService.deletePost(id, req.user!.userId, req.user!.role);
    return sendNoContent(res);
  } catch (error) {
    next(error);
  }
}

/**
 * PATCH /api/v1/posts/:id/status
 * Update post status
 */
export async function updatePostStatus(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const id = parseInt(req.params.id as string, 10);
    const data: UpdatePostStatusInput = req.body;
    const post = await postService.updatePostStatus(id, data, req.user!.userId, req.user!.role);
    return sendSuccess(res, post, 'Post status updated successfully');
  } catch (error) {
    next(error);
  }
}

/**
 * PATCH /api/v1/posts/:id/pin
 * Toggle post pin status (Mod/Admin only)
 */
export async function togglePostPin(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const id = parseInt(req.params.id as string, 10);
    const post = await postService.togglePostPin(id);
    return sendSuccess(res, post, post.is_pinned ? 'Post pinned successfully' : 'Post unpinned successfully');
  } catch (error) {
    next(error);
  }
}

/**
 * PATCH /api/v1/posts/:id/lock
 * Toggle post lock status (Mod/Admin only)
 */
export async function togglePostLock(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const id = parseInt(req.params.id as string, 10);
    const post = await postService.togglePostLock(id);
    return sendSuccess(res, post, post.is_locked ? 'Post locked successfully' : 'Post unlocked successfully');
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/v1/users/:username/posts
 * Get posts by author
 */
export async function getPostsByAuthor(req: Request, res: Response, next: NextFunction) {
  try {
    const username = req.params.username as string;
    const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 10;
    const authReq = req as AuthRequest;
    const result = await postService.getPostsByAuthor(username, page, limit, authReq.user?.role);
    return sendPaginated(res, result.data, result.pagination, 'Posts retrieved successfully');
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/v1/posts/:id/related
 * Get related posts for a given post
 */
export async function getRelatedPosts(req: Request, res: Response, next: NextFunction) {
  try {
    const id = parseInt(req.params.id as string, 10);
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 8;
    const authReq = req as AuthRequest;
    const posts = await postService.getRelatedPosts(id, limit, 3, authReq.user?.role);
    return sendSuccess(res, posts, 'Related posts retrieved successfully');
  } catch (error) {
    next(error);
  }
}






