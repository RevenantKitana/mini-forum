import { Router, RequestHandler } from 'express';
import * as searchController from '../controllers/searchController.js';
import { searchLimiter } from '../middlewares/securityMiddleware.js';

const router = Router();

// Apply search rate limiter to all search routes
router.use(searchLimiter);

// All search routes are public
router.get('/', searchController.searchPosts as RequestHandler);
router.get('/users', searchController.searchUsers as RequestHandler);
router.get('/suggestions', searchController.getSearchSuggestions as RequestHandler);

export default router;






