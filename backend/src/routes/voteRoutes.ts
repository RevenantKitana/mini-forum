import { Router, RequestHandler } from 'express';
import * as voteController from '../controllers/voteController.js';
import { authMiddleware } from '../middlewares/authMiddleware.js';
import { validate } from '../middlewares/validateMiddleware.js';
import { voteSchema } from '../validations/voteValidation.js';
import { voteLimiter } from '../middlewares/securityMiddleware.js';

const router = Router();

// All vote routes require authentication
router.use(authMiddleware);

// Note: User's own vote history (/users/me/votes) is now defined in routes/index.ts
// to avoid route conflict with userRoutes

// Post vote routes
router.get('/posts/:id/vote', voteController.getPostVote as RequestHandler);
router.post('/posts/:id/vote', voteLimiter, validate(voteSchema), voteController.votePost as RequestHandler);
router.delete('/posts/:id/vote', voteController.removePostVote as RequestHandler);

// Comment vote routes
router.get('/comments/:id/vote', voteController.getCommentVote as RequestHandler);
router.post('/comments/:id/vote', voteLimiter, validate(voteSchema), voteController.voteComment as RequestHandler);
router.delete('/comments/:id/vote', voteController.removeCommentVote as RequestHandler);

export default router;






