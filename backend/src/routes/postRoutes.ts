import { Router, RequestHandler } from 'express';
import * as postController from '../controllers/postController.js';
import { authMiddleware, optionalAuthMiddleware } from '../middlewares/authMiddleware.js';
import { requireRole } from '../middlewares/roleMiddleware.js';
import { validate } from '../middlewares/validateMiddleware.js';
import { createPostSchema, updatePostSchema, updatePostStatusSchema } from '../validations/postValidation.js';
import { createContentLimiter } from '../middlewares/securityMiddleware.js';

const router = Router();

// Public routes (with optional auth for permission-based filtering)
router.get('/', optionalAuthMiddleware, postController.getPosts);
router.get('/featured', optionalAuthMiddleware, postController.getFeaturedPosts);
router.get('/latest', optionalAuthMiddleware, postController.getLatestPosts);
router.get('/:id/related', optionalAuthMiddleware, postController.getRelatedPosts as RequestHandler);
router.get('/:id', optionalAuthMiddleware, postController.getPostById);

// Member routes (requires authentication)
router.post(
  '/',
  authMiddleware,
  createContentLimiter,
  validate(createPostSchema),
  postController.createPost as RequestHandler
);

router.put(
  '/:id',
  authMiddleware,
  validate(updatePostSchema),
  postController.updatePost as RequestHandler
);

router.delete(
  '/:id',
  authMiddleware,
  postController.deletePost as RequestHandler
);

// Owner/Mod/Admin routes
router.patch(
  '/:id/status',
  authMiddleware,
  validate(updatePostStatusSchema),
  postController.updatePostStatus as RequestHandler
);

// Mod/Admin only routes
router.patch(
  '/:id/pin',
  authMiddleware,
  requireRole('MODERATOR', 'ADMIN'),
  postController.togglePostPin as RequestHandler
);

router.patch(
  '/:id/lock',
  authMiddleware,
  requireRole('MODERATOR', 'ADMIN'),
  postController.togglePostLock as RequestHandler
);

export default router;






