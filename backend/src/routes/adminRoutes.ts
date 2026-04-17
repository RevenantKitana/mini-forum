import { Router, RequestHandler } from 'express';
import * as adminController from '../controllers/adminController.js';
import { authMiddleware, AuthRequest } from '../middlewares/authMiddleware.js';
import { requireRole } from '../middlewares/roleMiddleware.js';
import { ROLES } from '../constants/roles.js';
import { validateBody } from '../middlewares/validateMiddleware.js';
import { createCategorySchema, updateCategorySchema } from '../validations/categoryValidation.js';

const router = Router();

// All admin routes require authentication and at least moderator role
router.use(authMiddleware as RequestHandler);
router.use(requireRole(ROLES.ADMIN, ROLES.MODERATOR) as RequestHandler);

// Dashboard
router.get('/dashboard', adminController.getDashboardStats);

// User Management
router.get('/users', adminController.getUsers);
router.get('/users/:id', adminController.getUserDetail as RequestHandler);
router.patch('/users/:id/role', requireRole(ROLES.ADMIN) as RequestHandler, adminController.changeUserRole as RequestHandler);
router.patch('/users/:id/status', adminController.changeUserStatus as RequestHandler);
router.delete('/users/:id', requireRole(ROLES.ADMIN) as RequestHandler, adminController.deleteUser as RequestHandler);

// Report Management
router.get('/reports', adminController.getReports);
router.get('/reports/:id', adminController.getReportDetail);
router.patch('/reports/:id', adminController.updateReportStatus as RequestHandler);

// Post Management
router.get('/posts', adminController.getPosts);
router.get('/posts/pinned', adminController.getPinnedPosts);
router.patch('/posts/:id/status', adminController.updatePostStatus as RequestHandler);
router.patch('/posts/:id/pin', adminController.togglePostPin as RequestHandler);
router.patch('/posts/:id/pin-order', adminController.updatePinOrder as RequestHandler);
router.patch('/posts/:id/lock', adminController.togglePostLock as RequestHandler);
router.patch('/posts/reorder-pins', requireRole(ROLES.ADMIN) as RequestHandler, adminController.reorderPinnedPosts as RequestHandler);
router.delete('/posts/:id', adminController.deletePost as RequestHandler);

// Comment Management
router.get('/comments', adminController.getComments);
router.get('/comments/:id/content', adminController.viewMaskedCommentContent as RequestHandler);
router.patch('/comments/:id/status', adminController.updateCommentStatus as RequestHandler);
router.patch('/comments/:id/mask', adminController.toggleCommentMask as RequestHandler);
router.delete('/comments/:id', adminController.deleteComment as RequestHandler);

// Category Management
router.get('/categories', adminController.getCategories);
router.post('/categories', requireRole(ROLES.ADMIN) as RequestHandler, validateBody(createCategorySchema) as RequestHandler, adminController.createCategory as RequestHandler);
router.patch('/categories/:id', requireRole(ROLES.ADMIN) as RequestHandler, validateBody(updateCategorySchema) as RequestHandler, adminController.updateCategory as RequestHandler);
router.delete('/categories/:id', requireRole(ROLES.ADMIN) as RequestHandler, adminController.deleteCategory as RequestHandler);

// Tag Management
router.get('/tags', adminController.getTags);
router.post('/tags', requireRole(ROLES.ADMIN) as RequestHandler, adminController.createTag as RequestHandler);
router.patch('/tags/:id', requireRole(ROLES.ADMIN) as RequestHandler, adminController.updateTag as RequestHandler);
router.delete('/tags/:id', requireRole(ROLES.ADMIN) as RequestHandler, adminController.deleteTag as RequestHandler);

// Audit Logs
router.get('/audit-logs', requireRole(ROLES.ADMIN) as RequestHandler, adminController.getAuditLogs);

// Operational Metrics
router.get('/metrics', requireRole(ROLES.ADMIN) as RequestHandler, adminController.getMetrics as RequestHandler);

export default router;






