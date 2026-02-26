import prisma from '../config/database.js';
import { SearchQuery } from '../validations/searchValidation.js';

/**
 * Author select fields
 */
const authorSelect = {
  id: true,
  username: true,
  display_name: true,
  avatar_url: true,
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
 * Search posts with full-text search
 */
export async function searchPosts(query: SearchQuery, requestingUserRole?: string) {
  const { q, category, tag, author, page, limit, sort } = query;
  const skip = (page - 1) * limit;

  // Build where clause
  const where: Record<string, any> = {
    status: 'PUBLISHED',
    OR: [
      { title: { contains: q, mode: 'insensitive' } },
      { content: { contains: q, mode: 'insensitive' } },
    ],
  };

  // Filter by category view_permission based on user role
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

  // Tag filter
  if (tag) {
    where.post_tags = {
      some: {
        tags: { slug: tag },
      },
    };
  }

  // Author filter
  if (author) {
    where.users = { username: author };
  }

  // Build order by
  let orderBy: any[] = [];
  switch (sort) {
    case 'popular':
      orderBy = [{ upvote_count: 'desc' }, { created_at: 'desc' }];
      break;
    case 'trending':
      orderBy = [{ view_count: 'desc' }, { comment_count: 'desc' }];
      break;
    case 'oldest':
      orderBy = [{ created_at: 'asc' }];
      break;
    case 'latest':
      orderBy = [{ created_at: 'desc' }];
      break;
    case 'relevance':
    default:
      // For relevance, we prioritize title matches
      orderBy = [{ created_at: 'desc' }];
      break;
  }

  // Get posts with count
  const [posts, total] = await Promise.all([
    prisma.posts.findMany({
      where,
      select: {
        id: true,
        title: true,
        slug: true,
        excerpt: true,
        view_count: true,
        upvote_count: true,
        downvote_count: true,
        comment_count: true,
        status: true,
        is_pinned: true,
        is_locked: true,
        created_at: true,
        users: { select: authorSelect },
        categories: { select: categorySelect },
        post_tags: { select: tagSelect },
      },
      orderBy,
      skip,
      take: limit,
    }),
    prisma.posts.count({ where }),
  ]);

  // Transform tags and relation names
  const data = posts.map((post: any) => ({
    ...post,
    author: post.users,
    users: undefined,
    category: post.categories,
    categories: undefined,
    tags: post.post_tags.map((pt: any) => pt.tags),
    post_tags: undefined,
  }));

  return {
    data,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
    query: q,
  };
}

/**
 * Search users
 */
export async function searchUsers(q: string, page = 1, limit = 10) {
  const skip = (page - 1) * limit;

  const where = {
    is_active: true,
    OR: [
      { username: { contains: q, mode: 'insensitive' as const } },
      { display_name: { contains: q, mode: 'insensitive' as const } },
    ],
  };

  const [users, total] = await Promise.all([
    prisma.users.findMany({
      where,
      select: {
        id: true,
        username: true,
        display_name: true,
        avatar_url: true,
        role: true,
        reputation: true,
        created_at: true,
      },
      orderBy: { reputation: 'desc' },
      skip,
      take: limit,
    }),
    prisma.users.count({ where }),
  ]);

  return {
    data: users,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

/**
 * Get search suggestions (autocomplete)
 */
export async function getSearchSuggestions(q: string, limit = 5, requestingUserRole?: string) {
  const viewPermissionFilter = buildViewPermissionFilter(requestingUserRole);
  const categoryFilter = viewPermissionFilter ? { categories: viewPermissionFilter } : {};

  const [posts, tags] = await Promise.all([
    prisma.posts.findMany({
      where: {
        status: 'PUBLISHED',
        title: { contains: q, mode: 'insensitive' },
        ...categoryFilter,      },
      select: {
        id: true,
        title: true,
        slug: true,
      },
      take: limit,
      orderBy: { view_count: 'desc' },
    }),
    prisma.tags.findMany({
      where: {
        name: { contains: q, mode: 'insensitive' },
      },
      select: {
        id: true,
        name: true,
        slug: true,
        usage_count: true,
      },
      take: limit,
      orderBy: { usage_count: 'desc' },
    }),
  ]);

  return {
    posts,
    tags,
  };
}








