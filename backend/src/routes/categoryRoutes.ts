import { Router } from 'express';
import * as categoryController from '../controllers/categoryController.js';
import { authMiddleware, optionalAuthMiddleware } from '../middlewares/authMiddleware.js';
import { requireRole } from '../middlewares/roleMiddleware.js';
import { validate } from '../middlewares/validateMiddleware.js';
import { createCategorySchema, updateCategorySchema } from '../validations/categoryValidation.js';

const router = Router();

// Public routes
router.get('/', categoryController.getAllCategories);
router.get('/slug/:slug', categoryController.getCategoryBySlug);
router.get('/:id', categoryController.getCategoryById);
router.get('/:id/tags', categoryController.getPopularTagsForCategory);

// Admin only routes
router.post(
  '/',
  authMiddleware,
  requireRole('ADMIN'),
  validate(createCategorySchema),
  categoryController.createCategory
);

router.put(
  '/:id',
  authMiddleware,
  requireRole('ADMIN'),
  validate(updateCategorySchema),
  categoryController.updateCategory
);

router.delete(
  '/:id',
  authMiddleware,
  requireRole('ADMIN'),
  categoryController.deleteCategory
);

export default router;






