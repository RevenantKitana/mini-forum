import { Response, NextFunction } from 'express';
import { z } from 'zod';
import * as postMediaService from '../services/postMediaService.js';
import { sendCreated, sendNoContent, sendSuccess } from '../utils/response.js';
import { AuthRequest } from '../middlewares/authMiddleware.js';

const reorderSchema = z.object({
  orderedIds: z.array(z.number().int().positive()).min(1),
});

/**
 * POST /api/v1/posts/:id/media
 * Upload one or more images for a post (multipart/form-data, field name: "files").
 * Optional: block_id in the request body to associate media with a specific block.
 */
export async function uploadPostMedia(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const postId = parseInt(req.params.id as string, 10);
    const files = req.files as Express.Multer.File[] | undefined;

    if (!files || files.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No files uploaded. Send images via multipart/form-data with field name "files".',
      });
    }

    // Optional block_id to associate uploaded images with a specific block
    const blockId = req.body?.block_id != null ? parseInt(req.body.block_id as string, 10) : undefined;

    const media = await postMediaService.addMediaToPost(
      postId,
      req.user.userId,
      req.user.role,
      files,
      blockId,
    );

    return sendCreated(res, media, 'Media uploaded successfully');
  } catch (error) {
    next(error);
  }
}

/**
 * DELETE /api/v1/posts/:id/media/:mediaId
 * Delete a single media item from a post.
 */
export async function deletePostMedia(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const postId = parseInt(req.params.id as string, 10);
    const mediaId = parseInt(req.params.mediaId as string, 10);

    await postMediaService.removeMediaFromPost(
      postId,
      mediaId,
      req.user.userId,
      req.user.role,
    );

    return sendNoContent(res);
  } catch (error) {
    next(error);
  }
}

/**
 * PATCH /api/v1/posts/:id/media/reorder
 * Update sort_order for all media items of a post.
 * Body: { orderedIds: number[] }  — must include all media IDs for the post.
 */
export async function reorderPostMedia(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const postId = parseInt(req.params.id as string, 10);
    const { orderedIds } = reorderSchema.parse(req.body);

    const media = await postMediaService.reorderPostMedia(
      postId,
      orderedIds,
      req.user.userId,
      req.user.role,
    );

    return sendSuccess(res, media, 'Media reordered successfully');
  } catch (error) {
    next(error);
  }
}
