import { Router, Request, Response, RequestHandler } from 'express';
import authRoutes from './authRoutes.js';
import categoryRoutes from './categoryRoutes.js';
import tagRoutes from './tagRoutes.js';
import postRoutes from './postRoutes.js';
import commentRoutes from './commentRoutes.js';
import userRoutes from './userRoutes.js';
import voteRoutes from './voteRoutes.js';
import bookmarkRoutes from './bookmarkRoutes.js';
import searchRoutes from './searchRoutes.js';
import notificationRoutes from './notificationRoutes.js';
import blockReportRoutes from './blockReportRoutes.js';
import adminRoutes from './adminRoutes.js';
import * as commentController from '../controllers/commentController.js';
import * as postController from '../controllers/postController.js';
import * as voteController from '../controllers/voteController.js';
import { authMiddleware } from '../middlewares/authMiddleware.js';
import { validate } from '../middlewares/validateMiddleware.js';
import { createCommentSchema } from '../validations/commentValidation.js';
import { createContentLimiter } from '../middlewares/securityMiddleware.js';

const router = Router();

// Health check
router.get('/health', (_req: Request, res: Response) => {
  res.json({
    success: true,
    message: 'API is running',
    timestamp: new Date().toISOString(),
  });
});

// API routes
router.use('/auth', authRoutes);
router.use('/categories', categoryRoutes);
router.use('/tags', tagRoutes);
router.use('/posts', postRoutes);
router.use('/comments', commentRoutes);

// User's own vote history - MUST be before /users routes to avoid conflict
router.get('/users/me/votes', authMiddleware, voteController.getMyVoteHistory as RequestHandler);

router.use('/users', userRoutes);
router.use('/search', searchRoutes);
router.use('/notifications', notificationRoutes);
router.use('/admin', adminRoutes);

// Vote routes (mounted at root because they use /posts/:id/vote and /comments/:id/vote)
router.use(voteRoutes);

// Bookmark routes (mounted at root because they use /posts/:id/bookmark and /users/:id/bookmarks)
router.use(bookmarkRoutes);

// Block and Report routes
router.use(blockReportRoutes);

// Nested routes for comments under posts
router.get('/posts/:postId/comments', commentController.getCommentsByPostId);
router.post(
  '/posts/:postId/comments',
  authMiddleware,
  createContentLimiter,
  validate(createCommentSchema),
  commentController.createComment as RequestHandler
);

// User posts route
router.get('/users/:username/posts', postController.getPostsByAuthor);

export default router;






