import { Request, Response, NextFunction } from 'express';
import * as categoryService from '../services/categoryService.js';
import { sendSuccess, sendCreated, sendNoContent } from '../utils/response.js';
import { CreateCategoryInput, UpdateCategoryInput } from '../validations/categoryValidation.js';

/**
 * GET /api/v1/categories
 * Get all categories
 */
export async function getAllCategories(req: Request, res: Response, next: NextFunction) {
  try {
    const includeInactive = req.query.includeInactive === 'true';
    const includeTags = req.query.includeTags === 'true';
    
    let categories;
    if (includeTags) {
      const tagLimit = parseInt(req.query.tagLimit as string, 10) || 5;
      categories = await categoryService.getAllCategoriesWithTags(includeInactive, tagLimit);
    } else {
      categories = await categoryService.getAllCategories(includeInactive);
    }
    
    return sendSuccess(res, categories, 'Categories retrieved successfully');
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/v1/categories/:id
 * Get category by ID
 */
export async function getCategoryById(req: Request, res: Response, next: NextFunction) {
  try {
    const id = parseInt(req.params.id as string, 10);
    const category = await categoryService.getCategoryById(id);
    return sendSuccess(res, category, 'Category retrieved successfully');
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/v1/categories/slug/:slug
 * Get category by slug
 */
export async function getCategoryBySlug(req: Request, res: Response, next: NextFunction) {
  try {
    const slug = req.params.slug as string;
    const category = await categoryService.getCategoryBySlug(slug);
    return sendSuccess(res, category, 'Category retrieved successfully');
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/v1/categories
 * Create new category (Admin only)
 */
export async function createCategory(req: Request, res: Response, next: NextFunction) {
  try {
    const data: CreateCategoryInput = req.body;
    const category = await categoryService.createCategory(data);
    return sendCreated(res, category, 'Category created successfully');
  } catch (error) {
    next(error);
  }
}

/**
 * PUT /api/v1/categories/:id
 * Update category (Admin only)
 */
export async function updateCategory(req: Request, res: Response, next: NextFunction) {
  try {
    const id = parseInt(req.params.id as string, 10);
    const data: UpdateCategoryInput = req.body;
    const category = await categoryService.updateCategory(id, data);
    return sendSuccess(res, category, 'Category updated successfully');
  } catch (error) {
    next(error);
  }
}

/**
 * DELETE /api/v1/categories/:id
 * Delete category (Admin only)
 */
export async function deleteCategory(req: Request, res: Response, next: NextFunction) {
  try {
    const id = parseInt(req.params.id as string, 10);
    await categoryService.deleteCategory(id);
    return sendNoContent(res);
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/v1/categories/:id/tags
 * Get popular tags for a category
 */
export async function getPopularTagsForCategory(req: Request, res: Response, next: NextFunction) {
  try {
    const category_id = parseInt(req.params.id as string, 10);
    const limit = parseInt(req.query.limit as string, 10) || 5;
    const tags = await categoryService.getPopularTagsForCategory(category_id, limit);
    return sendSuccess(res, tags, 'Popular tags for category retrieved successfully');
  } catch (error) {
    next(error);
  }
}







