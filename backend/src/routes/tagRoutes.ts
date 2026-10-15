import { Router } from 'express';
import * as tagController from '../controllers/tagController.js';
import { authMiddleware } from '../middlewares/authMiddleware.js';
import { requireRole } from '../middlewares/roleMiddleware.js';
import { validate } from '../middlewares/validateMiddleware.js';
import { createTagSchema, updateTagSchema } from '../validations/tagValidation.js';
import { publicCache, purgeCacheOnSuccess } from '../middlewares/cacheMiddleware.js';

const router = Router();

// Public routes (Cached 60s in-memory & Cloudflare Edge)
router.get('/', publicCache(60), tagController.getAllTags);
router.get('/popular', publicCache(60), tagController.getPopularTags);
router.get('/search', publicCache(30), tagController.searchTags);
router.get('/slug/:slug', publicCache(60), tagController.getTagBySlug);
router.get('/:id', publicCache(60), tagController.getTagById);

// Moderator/Admin routes (Purges tags cache on changes)
router.post(
  '/',
  authMiddleware,
  requireRole('MODERATOR', 'ADMIN'),
  validate(createTagSchema),
  purgeCacheOnSuccess('/tags'),
  tagController.createTag
);

// Admin only routes
router.put(
  '/:id',
  authMiddleware,
  requireRole('ADMIN'),
  validate(updateTagSchema),
  purgeCacheOnSuccess('/tags'),
  tagController.updateTag
);

router.delete(
  '/:id',
  authMiddleware,
  requireRole('ADMIN'),
  purgeCacheOnSuccess('/tags'),
  tagController.deleteTag
);

export default router;






