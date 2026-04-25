import prisma from '../config/database.js';
import { NotFoundError, ForbiddenError, BadRequestError } from '../utils/errors.js';
import { CreatePostInput, UpdatePostInput, UpdatePostStatusInput, ListPostsQuery } from '../validations/postValidation.js';
import { generateSlug } from '../utils/slug.js';
import { PostStatus } from '@prisma/client';
import { getBlockedUserIds } from './blockService.js';
import { deleteAllPostMedia } from './postMediaService.js';
import { validateBlocks } from './blockValidationService.js';

/**
 * Generate unique slug
 */
async function generateUniqueSlug(title: string): Promise<string> {
  const baseSlug = generateSlug(title, 100);
  let slug = baseSlug;
  let counter = 1;

  while (await prisma.posts.findUnique({ where: { slug } })) {
    slug = `${baseSlug}-${counter}`;
    counter++;
  }

  return slug;
}

/**
 * Generate excerpt from content
 */
function generateExcerpt(content: string, maxLength = 200): string {
  return content
    .replace(/[#*`\n\r]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .substring(0, maxLength)
    .trim() + (content.length > maxLength ? '...' : '');
}

/**
 * Author select fields
 */
const authorSelect = {
  id: true,
  username: true,
  display_name: true,
  avatar_preview_url: true,
  avatar_standard_url: true,
  role: true,
  reputation: true,
};

/**
 * Category select fields
 */
const categorySelect = {
  id: true,
  name: true,
  slug: true,
  color: true,
  view_permission: true,
  post_permission: true,
  comment_permission: true,
};

/**
 * Tag select fields
 */
const tagSelect = {
  tags: {
    select: {
      id: true,
      name: true,
      slug: true,
    },
  },
};

/**
 * Media select fields (shared across list and detail)
 */
const mediaSelect = {
  id: true,
  preview_url: true,
  standard_url: true,
  sort_order: true,
  block_id: true,
};

/**
 * Post select fields for list
 * Only the first (lowest sort_order) media item is fetched for feed performance.
 * _count: aggregation to get total media count for UC-01 (newsfeed image display)
 */
const postListSelect = {
  id: true,
  title: true,
  excerpt: true,
  author_id: true,
  category_id: true,
  view_count: true,
  upvote_count: true,
  downvote_count: true,
  comment_count: true,
  status: true,
  is_pinned: true,
  pin_type: true,
  is_locked: true,
  use_block_layout: true,
  created_at: true,
  updated_at: true,
  users: { select: authorSelect },
  categories: { select: categorySelect },
  post_tags: { select: tagSelect },
  post_media: {
    select: mediaSelect,
    orderBy: { sort_order: 'asc' as const },
    take: 3,
  },
  _count: {
    select: {
      post_media: true,
    },
  },
};

/**
 * Post select fields for detail
 * Full media list ordered by sort_order.
 * Includes post_blocks for block-layout posts.
 */
const postDetailSelect = {
  ...postListSelect,
  content: true,
  post_media: {
    select: mediaSelect,
    orderBy: { sort_order: 'asc' as const },
  },
  post_blocks: {
    select: {
      id: true,
      type: true,
      content: true,
      sort_order: true,
      post_media: {
        select: mediaSelect,
        orderBy: { sort_order: 'asc' as const },
      },
    },
    orderBy: { sort_order: 'asc' as const },
  },
};

/**
 * Transform post from Prisma shape into API shape:
 * - rename relation keys to friendly names
 * - flatten nested tag structure
 * - expose media array
 * - add mediaCount from aggregation (Phase 1: UC-01 newsfeed image display)
 * - expose blocks array (Phase 3: block layout)
 */
function transformPostTags(post: any) {
  // Validate mediaCount is a non-negative integer
  const mediaCount = post._count?.post_media || 0;
  if (!Number.isInteger(mediaCount) || mediaCount < 0) {
    throw new Error(`Invalid mediaCount value: ${mediaCount}`);
  }

  // Transform blocks: rename post_media inside each block to "media"
  const blocks = (post.post_blocks || []).map((block: any) => ({
    id: block.id,
    type: block.type,
    content: block.content ?? null,
    sort_order: block.sort_order,
    media: block.post_media || [],
  }));

  return {
    ...post,
    author: post.users,
    category: post.categories,
    users: undefined,
    categories: undefined,
    tags: post.post_tags?.map((pt: any) => pt.tags) || [],
    post_tags: undefined,
    media: post.post_media || [],
    post_media: undefined,
    post_blocks: undefined,
    blocks,
    mediaCount,
    _count: undefined,
  };
}

/**
 * Build view permission filter for category based on user role
 * Returns a Prisma where clause for category view_permission
 */
function buildViewPermissionFilter(userRole?: string): Record<string, any> | null {
  if (!userRole) {
    // Guest user: can only see posts from categories with view_permission = 'ALL'
    return { view_permission: 'ALL' };
  }
  
  const role = userRole.toUpperCase();
  
  if (role === 'ADMIN') {
    // Admin can see all posts
    return null;
  }
  
  if (role === 'MODERATOR') {
    // Moderator can see ALL, MEMBER, MODERATOR
    return { view_permission: { in: ['ALL', 'MEMBER', 'MODERATOR'] } };
  }
  
  // MEMBER can see ALL, MEMBER
  return { view_permission: { in: ['ALL', 'MEMBER'] } };
}

/**
 * Get posts list with pagination and filters
 */
export async function getPosts(query: ListPostsQuery, requestingUserId?: number, requestingUserRole?: string) {
  const { page, limit, category, tag, tags, author, sort, status, search, dateFrom, dateTo } = query;
  const skip = (page - 1) * limit;

  // Get blocked user IDs to filter out their posts
  const blockedIds = requestingUserId ? await getBlockedUserIds(requestingUserId) : [];

  // Build where clause
  const where: Record<string, any> = {
    // Only show published posts to non-authors
    ...(status ? { status: status as PostStatus } : { status: 'PUBLISHED' }),
    // Filter out posts from blocked users
    ...(blockedIds.length > 0 && { author_id: { notIn: blockedIds } }),
  };

  // Filter by category view_permission based on user role
  // Guest users can only see posts from categories with view_permission = 'ALL'
  // Logged-in users see based on their role level
  const viewPermissionFilter = buildViewPermissionFilter(requestingUserRole);
  if (viewPermissionFilter) {
    where.categories = {
      ...viewPermissionFilter,
    };
  }

  // Category filter
  if (category) {
    where.categories = { ...(where.categories || {}), slug: category };
  }

  // Tag filter - support both single tag (legacy) and multiple tags
  const tagSlugs: string[] = [];
  if (tag) {
    tagSlugs.push(tag);
  }
  if (tags) {
    tagSlugs.push(...tags.split(',').map(t => t.trim()).filter(Boolean));
  }
  
  if (tagSlugs.length > 0) {
    // Filter posts that have ALL specified tags (AND condition)
    where.AND = tagSlugs.map(slug => ({
      post_tags: {
        some: {
          tags: { slug },
        },
      },
    }));
  }

  // Author filter
  if (author) {
    where.users = { username: author };
  }

  // Search filter
  if (search) {
    where.OR = [
      { title: { contains: search, mode: 'insensitive' } },
      { content: { contains: search, mode: 'insensitive' } },
    ];
  }

  // Date range filter
  if (dateFrom || dateTo) {
    where.created_at = {};
    if (dateFrom) {
      where.created_at.gte = new Date(dateFrom);
    }
    if (dateTo) {
      where.created_at.lte = new Date(dateTo);
    }
  }

  // Build order by - no pin preference in DB sort
  // Will handle pin prioritization in application code
  let orderBy: any[] = [];
  
  switch (sort) {
    case 'popular':
      orderBy.push({ upvote_count: 'desc' });
      break;
    case 'unpopular':
      orderBy.push({ upvote_count: 'asc' });
      break;
    case 'trending':
      orderBy.push({ view_count: 'desc' });
      orderBy.push({ comment_count: 'desc' });
      break;
    case 'least_trending':
      orderBy.push({ view_count: 'asc' });
      orderBy.push({ comment_count: 'asc' });
      break;
    case 'oldest':
    case 'oldest_first':
      orderBy.push({ created_at: 'asc' });
      break;
    case 'latest':
    default:
      orderBy.push({ created_at: 'desc' });
  }

  // Get posts with count
  const [postsList, total] = await Promise.all([
    prisma.posts.findMany({
      where,
      select: postListSelect,
      orderBy,
      skip,
      take: limit,
    }),
    prisma.posts.count({ where }),
  ]);

  // Apply pin-based sorting for category view
  // When viewing a specific category: prioritize CATEGORY-pinned posts at the top
  // (sidebar already shows GLOBAL pinned posts, so we don't need them in the main list)
  if (category) {
    postsList.sort((a, b) => {
      const aIsCategoryPin = a.pin_type === 'CATEGORY';
      const bIsCategoryPin = b.pin_type === 'CATEGORY';
      
      // Prioritize CATEGORY pins: they come first
      if (aIsCategoryPin !== bIsCategoryPin) {
        return aIsCategoryPin ? -1 : 1;
      }
      
      // For posts with same pin status, maintain the sort order from orderBy
      // (already sorted by created_at or other sort param)
      return 0;
    });
  }

  const posts = postsList;

  return {
    data: posts.map(transformPostTags),
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

/**
 * Get featured posts (global pinned + high engagement)
 * Only shows GLOBAL pinned posts, not CATEGORY pinned posts
 */
export async function getFeaturedPosts(limit = 5, userRole?: string) {
  const viewPermissionFilter = buildViewPermissionFilter(userRole);
  const categoryFilter = viewPermissionFilter ? { categories: viewPermissionFilter } : {};

  const posts = await prisma.posts.findMany({
    where: {
      status: 'PUBLISHED',
      ...categoryFilter,
      OR: [
        { is_pinned: true, pin_type: 'GLOBAL' },
        { upvote_count: { gte: 10 } },
      ],
    },
    select: postListSelect,
    orderBy: [
      { is_pinned: 'desc' },
      { upvote_count: 'desc' },
    ],
    take: limit,
  });

  return posts.map(transformPostTags);
}

/**
 * Get latest posts
 */
export async function getLatestPosts(limit = 10, userRole?: string) {
  const viewPermissionFilter = buildViewPermissionFilter(userRole);
  const categoryFilter = viewPermissionFilter ? { categories: viewPermissionFilter } : {};

  const posts = await prisma.posts.findMany({
    where: { 
      status: 'PUBLISHED',
      ...categoryFilter,
    },
    select: postListSelect,
    orderBy: { created_at: 'desc' },
    take: limit,
  });


  return posts.map(transformPostTags);
}

/**
 * Get post by ID
 */
export async function getPostById(id: number, incrementView = true, requestingUserId?: number, requestingUserRole?: string) {
  const post = await prisma.posts.findUnique({
    where: { id },
    select: postDetailSelect,
  });

  if (!post) {
    throw new NotFoundError('Post not found');
  }

  // Check category view permission
  const viewPermissionFilter = buildViewPermissionFilter(requestingUserRole);
  if (viewPermissionFilter) {
    const hasPermission = viewPermissionFilter.view_permission === 'ALL' 
      ? post.categories.view_permission === 'ALL'
      : (viewPermissionFilter.view_permission?.in || []).includes(post.categories.view_permission);
    
    if (!hasPermission) {
      throw new ForbiddenError('You do not have permission to view this post');
    }
  }

  // Increment view count
  if (incrementView && post.status === 'PUBLISHED') {
    await prisma.posts.update({
      where: { id },
      data: { view_count: { increment: 1 } },
    });
  }
  return transformPostTags(post);
}

/**
 * Check if user role meets the required permission level
 */
function checkPermission(userRole: string, requiredLevel: string): boolean {
  if (!requiredLevel || requiredLevel === 'ALL') return true;
  
  const roleHierarchy = ['MEMBER', 'MODERATOR', 'ADMIN'];
  const effectiveRole = userRole.toUpperCase() === 'BOT' ? 'MEMBER' : userRole.toUpperCase();
  const userLevel = roleHierarchy.indexOf(effectiveRole);
  const requiredLevelIndex = roleHierarchy.indexOf(requiredLevel);
  
  return userLevel >= requiredLevelIndex;
}

/**
 * Create new post
 */
export async function createPost(data: CreatePostInput, author_id: number, userRole: string = 'MEMBER') {
  // Verify category exists and get its permissions
  const category = await prisma.categories.findUnique({
    where: { id: data.category_id },
    select: {
      id: true,
      name: true,
      is_active: true,
      post_permission: true,
    },
  });

  if (!category) {
    throw new BadRequestError('Category not found');
  }

  // Check if category is active
  if (!category.is_active) {
    throw new ForbiddenError('This category is not available for posting');
  }

  // Check user's permission to post in this category
  if (!checkPermission(userRole, category.post_permission)) {
    throw new ForbiddenError(`You do not have permission to post in category "${category.name}". Required: ${category.post_permission}`);
  }

  // Check tag permissions - validate existing tags have appropriate permissions
  if (data.tags.length > 0) {
    const existingTags = await prisma.tags.findMany({
      where: {
        slug: { in: data.tags.map(tagName => generateSlug(tagName)) },
      },
      select: {
        slug: true,
        name: true,
        use_permission: true,
        is_active: true,
      },
    });

    for (const tag of existingTags) {
      // Check if tag is active
      if (!tag.is_active) {
        throw new ForbiddenError(`Tag "${tag.name}" is not available for use`);
      }
      // Check if user has permission to use this tag
      if (!checkPermission(userRole, tag.use_permission)) {
        throw new ForbiddenError(`You do not have permission to use tag "${tag.name}". Required: ${tag.use_permission}`);
      }
    }
  }

  // Determine blocks to create — always use block layout.
  // If client sends explicit blocks, use those; otherwise auto-wrap content into a TEXT block.
  const blocksToCreate =
    data.blocks && data.blocks.length > 0
      ? data.blocks
      : [{ type: 'TEXT' as const, content: data.content || '', sort_order: 1 }];

  validateBlocks(blocksToCreate);

  // Generate unique slug
  const slug = await generateUniqueSlug(data.title);

  // Generate excerpt from first TEXT block
  const firstTextBlock = blocksToCreate.find((b) => b.type === 'TEXT');
  const contentForExcerpt = firstTextBlock?.content || data.content || '';
  const excerpt = generateExcerpt(contentForExcerpt);

  // Prepare tag creation data (to reuse for both code paths)
  const tagCreateData = data.tags.length > 0
    ? await Promise.all(
        data.tags.map(async (tagName) => {
          const tagSlug = generateSlug(tagName);
          const tag = await prisma.tags.upsert({
            where: { slug: tagSlug },
            update: { usage_count: { increment: 1 } },
            create: { name: tagName, slug: tagSlug, usage_count: 1 },
          });
          return { tag_id: tag.id };
        })
      )
    : [];

  // Create post with blocks (always block layout)
  const post = await prisma.posts.create({
    data: {
      title: data.title,
      slug,
      content: data.content || '',
      excerpt,
      author_id,
      category_id: data.category_id,
      status: data.status as PostStatus,
      use_block_layout: true,
      post_tags: tagCreateData.length > 0 ? { create: tagCreateData } : undefined,
      post_blocks: {
        create: blocksToCreate.map((block) => ({
          type: block.type as 'TEXT' | 'IMAGE',
          content: block.type === 'TEXT' ? (block.content ?? null) : null,
          sort_order: block.sort_order,
        })),
      },
    },
    select: postDetailSelect,
  });

  // Update category post count
  await prisma.categories.update({
    where: { id: data.category_id },
    data: { post_count: { increment: 1 } },
  });

  return transformPostTags(post);
}

/**
 * Update post
 */
export async function updatePost(id: number, data: UpdatePostInput, userId: number, userRole: string) {
  const post = await prisma.posts.findUnique({
    where: { id },
    include: { post_tags: true },
  });

  if (!post) {
    throw new NotFoundError('Post not found');
  }

  // Check permission
  const isOwner = post.author_id === userId;
  const isModOrAdmin = userRole === 'MODERATOR' || userRole === 'ADMIN';

  if (!isOwner && !isModOrAdmin) {
    throw new ForbiddenError('You do not have permission to edit this post');
  }

  // Prepare update data
  const updateData: Record<string, any> = {};

  if (data.title) {
    updateData.title = data.title;
    updateData.slug = await generateUniqueSlug(data.title);
  }

  // Validate blocks if provided
  const hasBlocks = data.blocks !== undefined && data.blocks.length > 0;
  if (hasBlocks && data.blocks) {
    validateBlocks(data.blocks);
  }

  if (data.content !== undefined) {
    updateData.content = data.content;
    // Update excerpt from first text block if provided, otherwise use content
    if (hasBlocks && data.blocks) {
      const firstTextBlock = data.blocks.find((b) => b.type === 'TEXT');
      updateData.excerpt = generateExcerpt(firstTextBlock?.content || '');
    } else {
      updateData.excerpt = generateExcerpt(data.content);
    }
  }

  // Always keep block layout enabled
  updateData.use_block_layout = true;

  if (data.category_id && data.category_id !== post.category_id) {
    // Verify new category exists
    const category = await prisma.categories.findUnique({
      where: { id: data.category_id },
    });

    if (!category) {
      throw new BadRequestError('Category not found');
    }

    updateData.categories = { connect: { id: data.category_id } };

    // Update category counts
    await prisma.categories.update({
      where: { id: post.category_id },
      data: { post_count: { decrement: 1 } },
    });
    await prisma.categories.update({
      where: { id: data.category_id },
      data: { post_count: { increment: 1 } },
    });
  }

  // Handle tags update
  if (data.tags !== undefined) {
    // Decrement old tag usage counts
    const oldTagIds = post.post_tags.map((pt: { tag_id: number }) => pt.tag_id);
    if (oldTagIds.length > 0) {
      await prisma.tags.updateMany({
        where: { id: { in: oldTagIds } },
        data: { usage_count: { decrement: 1 } },
      });
    }

    // Delete existing post tags
    await prisma.post_tags.deleteMany({
      where: { post_id: id },
    });

    // Create new tags
    if (data.tags.length > 0) {
      for (const tagName of data.tags) {
        const tagSlug = generateSlug(tagName);
        const tag = await prisma.tags.upsert({
          where: { slug: tagSlug },
          update: { usage_count: { increment: 1 } },
          create: { name: tagName, slug: tagSlug, usage_count: 1 },
        });
        await prisma.post_tags.create({
          data: { post_id: id, tag_id: tag.id },
        });
      }
    }
  }

  // Handle blocks update: replace all blocks for the post
  if (data.blocks !== undefined) {
    // Delete all existing blocks (cascades post_media block_id to NULL via SetNull)
    await prisma.post_blocks.deleteMany({ where: { post_id: id } });

    // Create new blocks
    if (data.blocks.length > 0) {
      for (const block of data.blocks) {
        const created = await prisma.post_blocks.create({
          data: {
            post_id: id,
            type: block.type as 'TEXT' | 'IMAGE',
            content: block.type === 'TEXT' ? (block.content ?? null) : null,
            sort_order: block.sort_order,
          },
        });
        // Re-associate existing media IDs with this block (for IMAGE blocks in edit mode)
        if (block.type === 'IMAGE' && block.mediaIds && block.mediaIds.length > 0) {
          await prisma.post_media.updateMany({
            where: {
              id: { in: block.mediaIds },
              post_id: id, // security: only allow media belonging to this post
            },
            data: { block_id: created.id },
          });
        }
      }
    }
  }

  const updatedPost = await prisma.posts.update({
    where: { id },
    data: updateData,
    select: postDetailSelect,
  });

  return transformPostTags(updatedPost);
}

/**
 * Update post status
 */
export async function updatePostStatus(id: number, data: UpdatePostStatusInput, userId: number, userRole: string) {
  const post = await prisma.posts.findUnique({
    where: { id },
  });

  if (!post) {
    throw new NotFoundError('Post not found');
  }

  // Check permission
  const isOwner = post.author_id === userId;
  const isModOrAdmin = userRole === 'MODERATOR' || userRole === 'ADMIN';

  // Owner can only change between DRAFT and PUBLISHED
  if (isOwner && !isModOrAdmin) {
    if (data.status === 'HIDDEN' || data.status === 'DELETED') {
      throw new ForbiddenError('Only moderators can hide or delete posts');
    }
  } else if (!isModOrAdmin) {
    throw new ForbiddenError('You do not have permission to change post status');
  }

  const updatedPost = await prisma.posts.update({
    where: { id },
    data: { status: data.status as PostStatus },
    select: postDetailSelect,
  });

  return transformPostTags(updatedPost);
}

/**
 * Delete post (soft delete by changing status)
 */
export async function deletePost(id: number, userId: number, userRole: string) {
  const post = await prisma.posts.findUnique({
    where: { id },
  });

  if (!post) {
    throw new NotFoundError('Post not found');
  }

  // Check permission
  const isOwner = post.author_id === userId;
  const isModOrAdmin = userRole === 'MODERATOR' || userRole === 'ADMIN';

  if (!isOwner && !isModOrAdmin) {
    throw new ForbiddenError('You do not have permission to delete this post');
  }

  // Delete all ImageKit files and post_media records before soft-deleting the post
  await deleteAllPostMedia(id);

  // Soft delete - change status to DELETED
  await prisma.posts.update({
    where: { id },
    data: { status: 'DELETED' },
  });

  // Update category post count
  await prisma.categories.update({
    where: { id: post.category_id },
    data: { post_count: { decrement: 1 } },
  });
}

/**
 * Toggle post pin status (Mod/Admin only)
 */
export async function togglePostPin(id: number) {
  const post = await prisma.posts.findUnique({
    where: { id },
  });

  if (!post) {
    throw new NotFoundError('Post not found');
  }

  const updatedPost = await prisma.posts.update({
    where: { id },
    data: { is_pinned: !post.is_pinned },
    select: postDetailSelect,
  });

  return transformPostTags(updatedPost);
}

/**
 * Toggle post lock status (Mod/Admin only)
 */
export async function togglePostLock(id: number) {
  const post = await prisma.posts.findUnique({
    where: { id },
  });

  if (!post) {
    throw new NotFoundError('Post not found');
  }

  const updatedPost = await prisma.posts.update({
    where: { id },
    data: { is_locked: !post.is_locked },
    select: postDetailSelect,
  });

  return transformPostTags(updatedPost);
}

/**
 * Get posts by author
 */
export async function getPostsByAuthor(username: string, page = 1, limit = 10, requestingUserRole?: string) {
  const author = await prisma.users.findUnique({
    where: { username },
  });

  if (!author) {
    throw new NotFoundError('User not found');
  }

  const skip = (page - 1) * limit;
  const viewPermissionFilter = buildViewPermissionFilter(requestingUserRole);

  const where: Record<string, any> = {
    author_id: author.id,
    status: 'PUBLISHED',
  };

  // Filter by category view_permission based on user role
  if (viewPermissionFilter) {
    where.categories = viewPermissionFilter;
  }

  const [posts, total] = await Promise.all([
    prisma.posts.findMany({
      where,
      select: postListSelect,
      orderBy: { created_at: 'desc' },
      skip,
      take: limit,
    }),
    prisma.posts.count({ where }),
  ]);

  return {
    data: posts.map(transformPostTags),
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

/**
 * Get related posts for a given post
 * Ranking: tag match count (DESC) → same category → newest
 * Falls back to random posts if results < minRelatedThreshold ("Bạn có thể thích")
 */
export async function getRelatedPosts(
  postId: number,
  limit = 8,
  minRelatedThreshold = 3,
  userRole?: string
) {
  // Step 1: Get source post's category + tag ids
  const sourcePost = await prisma.posts.findUnique({
    where: { id: postId },
    select: {
      category_id: true,
      post_tags: { select: { tag_id: true } },
    },
  });

  if (!sourcePost) throw new NotFoundError('Post not found');

  const tagIds = sourcePost.post_tags.map(pt => pt.tag_id);
  const viewPermissionFilter = buildViewPermissionFilter(userRole);
  const categoryWhere: Record<string, any> = viewPermissionFilter ?? {};

  // Step 2: Build where clause - same category OR shared tags
  const candidateWhere: Record<string, any> = {
    id: { not: postId },
    status: 'PUBLISHED',
    ...(Object.keys(categoryWhere).length ? { categories: categoryWhere } : {}),
  };

  if (tagIds.length > 0) {
    candidateWhere.OR = [
      { category_id: sourcePost.category_id },
      { post_tags: { some: { tag_id: { in: tagIds } } } },
    ];
  } else {
    // No tags on source post → match by category only
    candidateWhere.category_id = sourcePost.category_id;
  }

  // Internal select that includes tag_id for in-memory scoring
  const candidateSelect = {
    ...postListSelect,
    post_tags: {
      select: {
        tag_id: true,
        tags: { select: { id: true, name: true, slug: true } },
      },
    },
  };

  // Fetch candidates with buffer for sorting
  const candidates = await prisma.posts.findMany({
    where: candidateWhere,
    select: candidateSelect,
    take: limit * 4,
  });

  // Step 3: Score each post and sort
  const scored = candidates
    .map(p => ({
      ...p,
      _tagMatchCount: tagIds.length > 0
        ? p.post_tags.filter((pt: any) => tagIds.includes(pt.tag_id)).length
        : 0,
      _sameCat: p.category_id === sourcePost.category_id,
    }))
    .sort((a, b) => {
      // 1. More tag matches → higher rank
      if (b._tagMatchCount !== a._tagMatchCount) return b._tagMatchCount - a._tagMatchCount;
      // 2. Same category → higher rank when tag count is tied
      if (a._sameCat !== b._sameCat) return a._sameCat ? -1 : 1;
      // 3. Newest first as tiebreaker
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });

  let result = scored.slice(0, limit);

  // Step 4: Fill with random posts if under threshold ("Bạn có thể thích")
  if (result.length < minRelatedThreshold) {
    const excludeIds = [postId, ...result.map(p => p.id)];
    const randomWhere: Record<string, any> = {
      id: { notIn: excludeIds },
      status: 'PUBLISHED',
      ...(Object.keys(categoryWhere).length ? { categories: categoryWhere } : {}),
    };

    const randomCandidates = await prisma.posts.findMany({
      where: randomWhere,
      select: candidateSelect,
      orderBy: { created_at: 'desc' },
      take: (limit - result.length) * 3,
    });

    // Fisher-Yates shuffle for true randomness
    for (let i = randomCandidates.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [randomCandidates[i], randomCandidates[j]] = [randomCandidates[j], randomCandidates[i]];
    }

    // Add internal scoring props to random candidates for consistent typing
    const scoredRandomCandidates = randomCandidates.slice(0, limit - result.length).map(p => ({
      ...p,
      _tagMatchCount: 0,
      _sameCat: p.category_id === sourcePost.category_id,
    }));

    result = [...result, ...scoredRandomCandidates];
  }

  // Strip internal scoring props then transform to public shape
  return result.map(({ _tagMatchCount, _sameCat, ...p }: any) => transformPostTags(p));
}







