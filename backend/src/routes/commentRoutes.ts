import { Router, RequestHandler } from 'express';
import * as commentController from '../controllers/commentController.js';
import { authMiddleware } from '../middlewares/authMiddleware.js';
import { requireRole } from '../middlewares/roleMiddleware.js';
import { validate } from '../middlewares/validateMiddleware.js';
import { createCommentSchema, updateCommentSchema } from '../validations/commentValidation.js';

const router = Router();

// Get comment by ID
router.get('/:id', commentController.getCommentById);

// Get replies to a comment
router.get('/:id/replies', commentController.getCommentReplies);

// Update comment (requires auth)
router.put(
  '/:id',
  authMiddleware,
  validate(updateCommentSchema),
  commentController.updateComment as RequestHandler
);

// Delete comment (requires auth)
router.delete(
  '/:id',
  authMiddleware,
  commentController.deleteComment as RequestHandler
);

// Hide comment (Mod/Admin only)
router.patch(
  '/:id/hide',
  authMiddleware,
  requireRole('MODERATOR', 'ADMIN'),
  commentController.hideComment as RequestHandler
);

export default router;






