import { Request, Response, NextFunction } from 'express';
import * as tagService from '../services/tagService.js';
import { sendSuccess, sendCreated, sendNoContent } from '../utils/response.js';
import { CreateTagInput, UpdateTagInput } from '../validations/tagValidation.js';

/**
 * GET /api/v1/tags
 * Get all tags
 */
export async function getAllTags(req: Request, res: Response, next: NextFunction) {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : undefined;
    const tags = await tagService.getAllTags(limit);
    return sendSuccess(res, tags, 'Tags retrieved successfully');
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/v1/tags/popular
 * Get popular tags
 */
export async function getPopularTags(req: Request, res: Response, next: NextFunction) {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 10;
    const tags = await tagService.getPopularTags(limit);
    return sendSuccess(res, tags, 'Popular tags retrieved successfully');
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/v1/tags/search
 * Search tags
 */
export async function searchTags(req: Request, res: Response, next: NextFunction) {
  try {
    const query = req.query.q as string || '';
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 10;
    const tags = await tagService.searchTags(query, limit);
    return sendSuccess(res, tags, 'Tags search completed');
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/v1/tags/:id
 * Get tag by ID
 */
export async function getTagById(req: Request, res: Response, next: NextFunction) {
  try {
    const id = parseInt(req.params.id as string, 10);
    const tag = await tagService.getTagById(id);
    return sendSuccess(res, tag, 'Tag retrieved successfully');
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/v1/tags/slug/:slug
 * Get tag by slug
 */
export async function getTagBySlug(req: Request, res: Response, next: NextFunction) {
  try {
    const slug = req.params.slug as string;
    const tag = await tagService.getTagBySlug(slug);
    return sendSuccess(res, tag, 'Tag retrieved successfully');
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/v1/tags
 * Create new tag (Moderator/Admin only)
 */
export async function createTag(req: Request, res: Response, next: NextFunction) {
  try {
    const data: CreateTagInput = req.body;
    const tag = await tagService.createTag(data);
    return sendCreated(res, tag, 'Tag created successfully');
  } catch (error) {
    next(error);
  }
}

/**
 * PUT /api/v1/tags/:id
 * Update tag (Admin only)
 */
export async function updateTag(req: Request, res: Response, next: NextFunction) {
  try {
    const id = parseInt(req.params.id as string, 10);
    const data: UpdateTagInput = req.body;
    const tag = await tagService.updateTag(id, data);
    return sendSuccess(res, tag, 'Tag updated successfully');
  } catch (error) {
    next(error);
  }
}

/**
 * DELETE /api/v1/tags/:id
 * Delete tag (Admin only)
 */
export async function deleteTag(req: Request, res: Response, next: NextFunction) {
  try {
    const id = parseInt(req.params.id as string, 10);
    await tagService.deleteTag(id);
    return sendNoContent(res);
  } catch (error) {
    next(error);
  }
}







