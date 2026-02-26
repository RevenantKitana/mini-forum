import { Request, Response, NextFunction } from 'express';
import * as userService from '../services/userService.js';
import { sendSuccess, sendPaginated } from '../utils/response.js';
import { UpdateProfileInput, ChangeUsernameInput, ChangePasswordInput, userContentQuerySchema } from '../validations/userValidation.js';
import { AuthRequest } from '../middlewares/authMiddleware.js';

/**
 * GET /api/v1/users/:id
 * Get user profile by ID
 */
export async function getUserById(req: Request, res: Response, next: NextFunction) {
  try {
    const id = parseInt(req.params.id as string, 10);
    const authReq = req as AuthRequest;
    const user = await userService.getUserById(id, authReq.user?.userId);
    return sendSuccess(res, user, 'User profile retrieved successfully');
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/v1/users/username/:username
 * Get user profile by username
 */
export async function getUserByUsername(req: Request, res: Response, next: NextFunction) {
  try {
    const username = req.params.username as string;
    const authReq = req as AuthRequest;
    const user = await userService.getUserByUsername(username, authReq.user?.userId);
    return sendSuccess(res, user, 'User profile retrieved successfully');
  } catch (error) {
    next(error);
  }
}

/**
 * PUT /api/v1/users/:id
 * Update user profile
 */
export async function updateProfile(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const id = parseInt(req.params.id as string, 10);
    
    // Check if user is updating their own profile
    if (id !== req.user!.userId) {
      return res.status(403).json({
        success: false,
        message: 'You can only update your own profile',
      });
    }

    const data: UpdateProfileInput = req.body;
    const user = await userService.updateProfile(id, data);
    return sendSuccess(res, user, 'Profile updated successfully');
  } catch (error) {
    next(error);
  }
}

/**
 * PATCH /api/v1/users/:id/username
 * Change username
 */
export async function changeUsername(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const id = parseInt(req.params.id as string, 10);
    
    if (id !== req.user!.userId) {
      return res.status(403).json({
        success: false,
        message: 'You can only change your own username',
      });
    }

    const data: ChangeUsernameInput = req.body;
    const user = await userService.changeUsername(id, data);
    return sendSuccess(res, user, 'Username changed successfully');
  } catch (error) {
    next(error);
  }
}

/**
 * PATCH /api/v1/users/:id/password
 * Change password
 */
export async function changePassword(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const id = parseInt(req.params.id as string, 10);
    
    if (id !== req.user!.userId) {
      return res.status(403).json({
        success: false,
        message: 'You can only change your own password',
      });
    }

    const data: ChangePasswordInput = req.body;
    const result = await userService.changePassword(id, data);
    return sendSuccess(res, result, 'Password changed successfully');
  } catch (error) {
    next(error);
  }
}

/**
 * PATCH /api/v1/users/:id/avatar
 * Update avatar URL
 */
export async function updateAvatar(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const id = parseInt(req.params.id as string, 10);
    
    if (id !== req.user!.userId) {
      return res.status(403).json({
        success: false,
        message: 'You can only update your own avatar',
      });
    }

    const { avatar_url } = req.body;
    if (!avatar_url) {
      return res.status(400).json({
        success: false,
        message: 'Avatar URL is required',
      });
    }

    const user = await userService.updateAvatar(id, avatar_url);
    return sendSuccess(res, user, 'Avatar updated successfully');
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/v1/users/:id/posts
 * Get user's posts
 */
export async function getUserPosts(req: Request, res: Response, next: NextFunction) {
  try {
    const id = parseInt(req.params.id as string, 10);
    const query = userContentQuerySchema.parse(req.query);
    const authReq = req as AuthRequest;
    const result = await userService.getUserPosts(id, query.page, query.limit, authReq.user?.userId);
    return sendPaginated(res, result.data, result.pagination, 'User posts retrieved successfully');
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/v1/users/:id/comments
 * Get user's comments
 */
export async function getUserComments(req: Request, res: Response, next: NextFunction) {
  try {
    const id = parseInt(req.params.id as string, 10);
    const query = userContentQuerySchema.parse(req.query);
    const authReq = req as AuthRequest;
    const result = await userService.getUserComments(id, query.page, query.limit, authReq.user?.userId);
    return sendPaginated(res, result.data, result.pagination, 'User comments retrieved successfully');
  } catch (error) {
    next(error);
  }
}







