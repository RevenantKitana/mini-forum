import prisma from '../config/database.js';
import { NotFoundError, ForbiddenError, BadRequestError } from '../utils/errors.js';
import * as imagekitService from './imagekitService.js';

const MAX_MEDIA_PER_POST = 10;

/**
 * Add one or more image files to a post.
 * Validates ownership, max-media limit, then uploads each file to ImageKit
 * and creates the corresponding post_media records.
 * Optional blockId: if provided, links media to a specific post_blocks entry.
 */
export async function addMediaToPost(
  postId: number,
  userId: number,
  userRole: string,
  files: Express.Multer.File[],
  blockId?: number,
) {
  const post = await prisma.posts.findUnique({
    where: { id: postId },
    select: {
      author_id: true,
      _count: { select: { post_media: true } },
    },
  });

  if (!post) throw new NotFoundError('Post not found');

  const isOwner = post.author_id === userId;
  const isModOrAdmin = userRole === 'MODERATOR' || userRole === 'ADMIN';
  if (!isOwner && !isModOrAdmin) {
    throw new ForbiddenError('You do not have permission to add media to this post');
  }

  const existingCount = post._count.post_media;
  if (existingCount + files.length > MAX_MEDIA_PER_POST) {
    throw new BadRequestError(
      `Maximum ${MAX_MEDIA_PER_POST} images per post. Post already has ${existingCount}, trying to add ${files.length}.`,
    );
  }

  // Validate block_id if provided
  if (blockId !== undefined) {
    const block = await prisma.post_blocks.findUnique({ where: { id: blockId } });
    if (!block || block.post_id !== postId) {
      throw new BadRequestError(`Block ${blockId} does not belong to post ${postId}`);
    }
  }

  // Determine starting sort_order to append after existing media
  const agg = existingCount > 0
    ? await prisma.post_media.aggregate({
        where: { post_id: postId },
        _max: { sort_order: true },
      })
    : null;
  const baseOrder = (agg?._max.sort_order ?? -1) + 1;

  const results = [];
  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const fileName = `post_${postId}_${Date.now()}_${i}`;
    const uploaded = await imagekitService.uploadImage(file.buffer, fileName, '/posts');

    const preview_url = imagekitService.getTransformedUrl(uploaded.filePath, 'preview');
    const standard_url = imagekitService.getTransformedUrl(uploaded.filePath, 'standard');

    const media = await prisma.post_media.create({
      data: {
        post_id: postId,
        imagekit_file_id: uploaded.fileId,
        preview_url,
        standard_url,
        sort_order: baseOrder + i,
        ...(blockId !== undefined ? { block_id: blockId } : {}),
      },
    });
    results.push(media);
  }

  return results;
}

/**
 * Remove a single media item from a post.
 * Deletes the ImageKit file and the DB record.
 */
export async function removeMediaFromPost(
  postId: number,
  mediaId: number,
  userId: number,
  userRole: string,
) {
  const media = await prisma.post_media.findUnique({
    where: { id: mediaId },
    include: { posts: { select: { author_id: true } } },
  });

  if (!media) throw new NotFoundError('Media not found');
  if (media.post_id !== postId) throw new NotFoundError('Media does not belong to this post');

  const isOwner = media.posts.author_id === userId;
  const isModOrAdmin = userRole === 'MODERATOR' || userRole === 'ADMIN';
  if (!isOwner && !isModOrAdmin) {
    throw new ForbiddenError('You do not have permission to delete this media');
  }

  // Delete the ImageKit file first (non-blocking on failure — DB record still removed)
  try {
    await imagekitService.deleteImage(media.imagekit_file_id);
  } catch (err) {
    console.warn(
      `[removeMediaFromPost] Failed to delete ImageKit file ${media.imagekit_file_id}:`,
      err,
    );
  }

  await prisma.post_media.delete({ where: { id: mediaId } });
}

/**
 * Reorder all media items for a post.
 * orderedIds must contain every media ID that belongs to the post — no partial reorders.
 */
export async function reorderPostMedia(
  postId: number,
  orderedIds: number[],
  userId: number,
  userRole: string,
) {
  const post = await prisma.posts.findUnique({
    where: { id: postId },
    select: {
      author_id: true,
      post_media: { select: { id: true } },
    },
  });

  if (!post) throw new NotFoundError('Post not found');

  const isOwner = post.author_id === userId;
  const isModOrAdmin = userRole === 'MODERATOR' || userRole === 'ADMIN';
  if (!isOwner && !isModOrAdmin) {
    throw new ForbiddenError('You do not have permission to reorder media for this post');
  }

  const existingIds = new Set(post.post_media.map((m) => m.id));

  if (orderedIds.length !== existingIds.size) {
    throw new BadRequestError(
      `orderedIds must contain all ${existingIds.size} media IDs for this post`,
    );
  }

  for (const id of orderedIds) {
    if (!existingIds.has(id)) {
      throw new BadRequestError(`Media ID ${id} does not belong to post ${postId}`);
    }
  }

  // Batch update sort_order inside a transaction
  await prisma.$transaction(
    orderedIds.map((id, index) =>
      prisma.post_media.update({
        where: { id },
        data: { sort_order: index },
      }),
    ),
  );

  return prisma.post_media.findMany({
    where: { post_id: postId },
    select: {
      id: true,
      preview_url: true,
      standard_url: true,
      sort_order: true,
    },
    orderBy: { sort_order: 'asc' },
  });
}

/**
 * Delete all media belonging to a post from both ImageKit and the DB.
 * Called by deletePost before (soft-)deleting the post.
 */
export async function deleteAllPostMedia(postId: number): Promise<void> {
  const mediaList = await prisma.post_media.findMany({
    where: { post_id: postId },
    select: { id: true, imagekit_file_id: true },
  });

  if (mediaList.length === 0) return;

  // Remove DB records first so orphan references are never served
  await prisma.post_media.deleteMany({ where: { post_id: postId } });

  // Delete ImageKit files (non-blocking per file)
  for (const media of mediaList) {
    imagekitService.deleteImage(media.imagekit_file_id).catch((err: unknown) => {
      console.warn(
        `[deleteAllPostMedia] Failed to delete ImageKit file ${media.imagekit_file_id}:`,
        err,
      );
    });
  }
}
