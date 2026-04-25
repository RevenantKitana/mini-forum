import { Request, Response, NextFunction } from 'express';
import * as userService from '../services/userService.js';
import * as imagekitService from '../services/imagekitService.js';
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
 * POST /api/v1/users/:id/avatar/upload
 * Upload a new avatar image (multipart/form-data, field name: "file").
 * Replaces the previous ImageKit file and updates avatar_preview_url / avatar_standard_url.
 */
export async function uploadAvatar(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const id = parseInt(req.params.id as string, 10);

    if (id !== req.user!.userId) {
      return res.status(403).json({
        success: false,
        message: 'You can only update your own avatar',
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded. Send an image via multipart/form-data with field name "file".',
      });
    }

    // Fetch existing fileId so we can delete it after the new upload succeeds
    const oldFileId = await userService.getAvatarImagekitFileId(id);

    // Upload to ImageKit
    const fileName = `avatar_${id}_${Date.now()}`;
    const uploaded = await imagekitService.uploadImage(req.file.buffer, fileName, '/avatars');

    // Build transformed CDN URLs
    const avatar_preview_url = imagekitService.getTransformedUrl(uploaded.filePath, 'preview');
    const avatar_standard_url = imagekitService.getTransformedUrl(uploaded.filePath, 'standard');

    // Persist to DB
    const user = await userService.uploadAvatarToImageKit(id, {
      avatar_imagekit_file_id: uploaded.fileId,
      avatar_preview_url,
      avatar_standard_url,
    });

    // Delete old ImageKit file (non-blocking; failure should not roll back the update)
    if (oldFileId) {
      imagekitService.deleteImage(oldFileId).catch((err: unknown) => {
        console.warn(`[uploadAvatar] Failed to delete old ImageKit file ${oldFileId}:`, err);
      });
    }

    return sendSuccess(res, user, 'Avatar uploaded successfully');
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







