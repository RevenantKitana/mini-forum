import { Router, RequestHandler } from 'express';
import * as bookmarkController from '../controllers/bookmarkController.js';
import { authMiddleware } from '../middlewares/authMiddleware.js';

const router = Router();

// All bookmark routes require authentication
router.use(authMiddleware);

// Get user's bookmarks
router.get('/users/:id/bookmarks', bookmarkController.getUserBookmarks as RequestHandler);

// Post bookmark routes
router.get('/posts/:id/bookmark', bookmarkController.checkBookmark as RequestHandler);
router.post('/posts/:id/bookmark', bookmarkController.addBookmark as RequestHandler);
router.delete('/posts/:id/bookmark', bookmarkController.removeBookmark as RequestHandler);
router.patch('/posts/:id/bookmark', bookmarkController.toggleBookmark as RequestHandler);

export default router;






