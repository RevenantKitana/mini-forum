import { Router } from 'express';
import * as categoryController from '../controllers/categoryController.js';
import { authMiddleware, optionalAuthMiddleware } from '../middlewares/authMiddleware.js';
import { requireRole } from '../middlewares/roleMiddleware.js';
import { validate } from '../middlewares/validateMiddleware.js';
import { createCategorySchema, updateCategorySchema } from '../validations/categoryValidation.js';
import { publicCache, purgeCacheOnSuccess } from '../middlewares/cacheMiddleware.js';

const router = Router();

// Public routes (Cached 60s in-memory & Cloudflare Edge)
router.get('/', publicCache(60), categoryController.getAllCategories);
router.get('/slug/:slug', publicCache(60), categoryController.getCategoryBySlug);
router.get('/:id', publicCache(60), categoryController.getCategoryById);
router.get('/:id/tags', publicCache(60), categoryController.getPopularTagsForCategory);

// Admin only routes (Purges categories cache on changes)
router.post(
  '/',
  authMiddleware,
  requireRole('ADMIN'),
  validate(createCategorySchema),
  purgeCacheOnSuccess('/categories'),
  categoryController.createCategory
);

router.put(
  '/:id',
  authMiddleware,
  requireRole('ADMIN'),
  validate(updateCategorySchema),
  purgeCacheOnSuccess('/categories'),
  categoryController.updateCategory
);

router.delete(
  '/:id',
  authMiddleware,
  requireRole('ADMIN'),
  purgeCacheOnSuccess('/categories'),
  categoryController.deleteCategory
);

export default router;






