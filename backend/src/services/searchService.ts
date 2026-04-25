import prisma from '../config/database.js';
import { SearchQuery } from '../validations/searchValidation.js';
import { Prisma } from '@prisma/client';

/**
 * Minimum similarity threshold for typo-tolerant search (0..1)
 */
const SIMILARITY_THRESHOLD = 0.15;

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
 * Search posts with full-text search + typo tolerance via pg_trgm
 */
export async function searchPosts(query: SearchQuery, requestingUserRole?: string) {
  const { q, category, tag, author, page, limit, sort } = query;
  const skip = (page - 1) * limit;

  // Build where clause with fuzzy matching
  const where: Record<string, any> = {
    status: 'PUBLISHED',
  };

  // For exact/contains search, keep the original behaviour;
  // for relevance sort, we add trigram similarity in post-processing
  where.OR = [
    { title: { contains: q, mode: 'insensitive' } },
    { content: { contains: q, mode: 'insensitive' } },
  ];

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
      // For relevance, we'll sort in-memory after computing similarity
      orderBy = [{ created_at: 'desc' }];
      break;
  }

  // Try fuzzy search if exact match returns few results
  let [posts, total] = await Promise.all([
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

  // If exact search returned no results, try fuzzy/trigram search
  if (total === 0 && q.length >= 3) {
    try {
      const fuzzyIds = await prisma.$queryRaw<Array<{ id: number; similarity: number }>>`
        SELECT id, GREATEST(
          similarity(title, ${q}),
          similarity(COALESCE(content, ''), ${q})
        ) AS similarity
        FROM posts
        WHERE status = 'PUBLISHED'
          AND (
            similarity(title, ${q}) > ${SIMILARITY_THRESHOLD}
            OR similarity(COALESCE(content, ''), ${q}) > ${SIMILARITY_THRESHOLD}
          )
        ORDER BY similarity DESC
        LIMIT ${limit}
        OFFSET ${skip}
      `;

      if (fuzzyIds.length > 0) {
        const ids = fuzzyIds.map(r => r.id);
        const fuzzyTotal = await prisma.$queryRaw<Array<{ count: bigint }>>`
          SELECT COUNT(*)::bigint AS count FROM posts
          WHERE status = 'PUBLISHED'
            AND (
              similarity(title, ${q}) > ${SIMILARITY_THRESHOLD}
              OR similarity(COALESCE(content, ''), ${q}) > ${SIMILARITY_THRESHOLD}
            )
        `;
        total = Number(fuzzyTotal[0]?.count || 0);

        posts = await prisma.posts.findMany({
          where: { id: { in: ids } },
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
        });

        // Re-order by similarity
        const simMap = new Map(fuzzyIds.map(r => [r.id, r.similarity]));
        posts.sort((a: any, b: any) => (simMap.get(b.id) || 0) - (simMap.get(a.id) || 0));
      }
    } catch {
      // pg_trgm might not be available, fall back to empty results
    }
  }

  // For relevance sort with results, compute title-boost scoring
  if (sort === 'relevance' && posts.length > 0 && total > 0) {
    const qLower = q.toLowerCase();
    posts.sort((a: any, b: any) => {
      const aTitle = a.title?.toLowerCase() || '';
      const bTitle = b.title?.toLowerCase() || '';
      const aTitleExact = aTitle.includes(qLower) ? 2 : 0;
      const bTitleExact = bTitle.includes(qLower) ? 2 : 0;
      const aStart = aTitle.startsWith(qLower) ? 1 : 0;
      const bStart = bTitle.startsWith(qLower) ? 1 : 0;
      return (bTitleExact + bStart) - (aTitleExact + aStart);
    });
  }

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
 * Search users with fuzzy matching
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

  let [users, total] = await Promise.all([
    prisma.users.findMany({
      where,
      select: {
        id: true,
        username: true,
        display_name: true,
        avatar_preview_url: true,
        avatar_standard_url: true,
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

  // If no results, try fuzzy search
  if (total === 0 && q.length >= 2) {
    try {
      const fuzzyUsers = await prisma.$queryRaw<Array<{ id: number }>>`
        SELECT id FROM users
        WHERE is_active = true
          AND (
            similarity(username, ${q}) > ${SIMILARITY_THRESHOLD}
            OR similarity(COALESCE(display_name, ''), ${q}) > ${SIMILARITY_THRESHOLD}
          )
        ORDER BY GREATEST(
          similarity(username, ${q}),
          similarity(COALESCE(display_name, ''), ${q})
        ) DESC
        LIMIT ${limit} OFFSET ${skip}
      `;

      if (fuzzyUsers.length > 0) {
        const ids = fuzzyUsers.map(r => r.id);
        const fuzzyCount = await prisma.$queryRaw<Array<{ count: bigint }>>`
          SELECT COUNT(*)::bigint AS count FROM users
          WHERE is_active = true
            AND (
              similarity(username, ${q}) > ${SIMILARITY_THRESHOLD}
              OR similarity(COALESCE(display_name, ''), ${q}) > ${SIMILARITY_THRESHOLD}
            )
        `;
        total = Number(fuzzyCount[0]?.count || 0);
        users = await prisma.users.findMany({
          where: { id: { in: ids } },
          select: {
            id: true,
            username: true,
            display_name: true,
            avatar_preview_url: true,
            avatar_standard_url: true,
            role: true,
            reputation: true,
            created_at: true,
          },
        });
      }
    } catch {
      // pg_trgm not available, return empty
    }
  }

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
 * Get search suggestions (autocomplete) with fuzzy matching
 */
export async function getSearchSuggestions(q: string, limit = 5, requestingUserRole?: string) {
  const viewPermissionFilter = buildViewPermissionFilter(requestingUserRole);
  const categoryFilter = viewPermissionFilter ? { categories: viewPermissionFilter } : {};

  const [posts, tags] = await Promise.all([
    prisma.posts.findMany({
      where: {
        status: 'PUBLISHED',
        title: { contains: q, mode: 'insensitive' },
        ...categoryFilter,
      },
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
        OR: [
          { name: { contains: q, mode: 'insensitive' } },
          { slug: { contains: q, mode: 'insensitive' } },
        ],
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

  // If no suggestions found, try fuzzy match for tags
  let fuzzyTags = tags;
  if (tags.length === 0 && q.length >= 2) {
    try {
      const fuzzyTagIds = await prisma.$queryRaw<Array<{ id: number }>>`
        SELECT id FROM tags
        WHERE similarity(name, ${q}) > ${SIMILARITY_THRESHOLD}
        ORDER BY similarity(name, ${q}) DESC
        LIMIT ${limit}
      `;
      if (fuzzyTagIds.length > 0) {
        fuzzyTags = await prisma.tags.findMany({
          where: { id: { in: fuzzyTagIds.map(t => t.id) } },
          select: { id: true, name: true, slug: true, usage_count: true },
        });
      }
    } catch {
      // pg_trgm not available
    }
  }

  return {
    posts,
    tags: fuzzyTags,
  };
}








