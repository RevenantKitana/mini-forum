import { Router } from 'express';
import * as tagController from '../controllers/tagController.js';
import { authMiddleware } from '../middlewares/authMiddleware.js';
import { requireRole } from '../middlewares/roleMiddleware.js';
import { validate } from '../middlewares/validateMiddleware.js';
import { createTagSchema, updateTagSchema } from '../validations/tagValidation.js';

const router = Router();

// Public routes
router.get('/', tagController.getAllTags);
router.get('/popular', tagController.getPopularTags);
router.get('/search', tagController.searchTags);
router.get('/slug/:slug', tagController.getTagBySlug);
router.get('/:id', tagController.getTagById);

// Moderator/Admin routes
router.post(
  '/',
  authMiddleware,
  requireRole('MODERATOR', 'ADMIN'),
  validate(createTagSchema),
  tagController.createTag
);

// Admin only routes
router.put(
  '/:id',
  authMiddleware,
  requireRole('ADMIN'),
  validate(updateTagSchema),
  tagController.updateTag
);

router.delete(
  '/:id',
  authMiddleware,
  requireRole('ADMIN'),
  tagController.deleteTag
);

export default router;






