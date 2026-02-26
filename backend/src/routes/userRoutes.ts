import { Router, RequestHandler } from 'express';
import * as userController from '../controllers/userController.js';
import { authMiddleware, optionalAuthMiddleware } from '../middlewares/authMiddleware.js';
import { validate } from '../middlewares/validateMiddleware.js';
import { updateProfileSchema, changeUsernameSchema, changePasswordSchema } from '../validations/userValidation.js';

const router = Router();

// Route by username MUST come before :id to avoid conflict
router.get('/username/:username', optionalAuthMiddleware, userController.getUserByUsername as RequestHandler);

// Routes with numeric :id
router.get('/:id(\\d+)', optionalAuthMiddleware, userController.getUserById as RequestHandler);
router.get('/:id(\\d+)/posts', optionalAuthMiddleware, userController.getUserPosts as RequestHandler);
router.get('/:id(\\d+)/comments', optionalAuthMiddleware, userController.getUserComments as RequestHandler);

// Protected routes
router.put('/:id(\\d+)', authMiddleware, validate(updateProfileSchema), userController.updateProfile as RequestHandler);
router.patch('/:id(\\d+)/username', authMiddleware, validate(changeUsernameSchema), userController.changeUsername as RequestHandler);
router.patch('/:id(\\d+)/password', authMiddleware, validate(changePasswordSchema), userController.changePassword as RequestHandler);
router.patch('/:id(\\d+)/avatar', authMiddleware, userController.updateAvatar as RequestHandler);

export default router;






