import { Router, RequestHandler } from 'express';
import * as blockReportController from '../controllers/blockReportController.js';
import { authMiddleware } from '../middlewares/authMiddleware.js';
import { requireRoles } from '../middlewares/roleMiddleware.js';
import { validate } from '../middlewares/validateMiddleware.js';
import { createReportSchema, updateReportStatusSchema } from '../validations/reportValidation.js';
import { ROLES } from '../constants/roles.js';

const router = Router();

// All routes require authentication
router.use(authMiddleware);

// Block routes
router.get('/users/me/blocked', blockReportController.getBlockedUsers as RequestHandler);
router.get('/users/:id/block', blockReportController.isUserBlocked as RequestHandler);
router.post('/users/:id/block', blockReportController.blockUser as RequestHandler);
router.delete('/users/:id/block', blockReportController.unblockUser as RequestHandler);

// Report routes (user actions)
router.post('/posts/:id/report', validate(createReportSchema), blockReportController.reportPost as RequestHandler);
router.post('/comments/:id/report', validate(createReportSchema), blockReportController.reportComment as RequestHandler);
router.post('/users/:id/report', validate(createReportSchema), blockReportController.reportUser as RequestHandler);

// Report management routes (Admin/Mod only)
router.get('/reports', requireRoles(ROLES.MODERATOR, ROLES.ADMIN), blockReportController.getReports as RequestHandler);
router.get('/reports/pending/count', requireRoles(ROLES.MODERATOR, ROLES.ADMIN), blockReportController.getPendingReportsCount as RequestHandler);
router.get('/reports/:id', requireRoles(ROLES.MODERATOR, ROLES.ADMIN), blockReportController.getReportById as RequestHandler);
router.patch(
  '/reports/:id/status',
  requireRoles(ROLES.MODERATOR, ROLES.ADMIN),
  validate(updateReportStatusSchema),
  blockReportController.updateReportStatus as RequestHandler
);

export default router;






