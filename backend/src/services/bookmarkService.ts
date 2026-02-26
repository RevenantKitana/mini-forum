import prisma from '../config/database.js';
import { NotFoundError, BadRequestError } from '../utils/errors.js';

/**
 * Build view permission filter for category based on user role
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
 * Get user's bookmarks with pagination
 */
export async function getUserBookmarks(userId: number, page = 1, limit = 10, userRole?: string) {
  const skip = (page - 1) * limit;
  const viewPermissionFilter = buildViewPermissionFilter(userRole);

  const [bookmarks, total] = await Promise.all([
    prisma.bookmarks.findMany({
      where: { 
        userId,
        posts: {
          categories: viewPermissionFilter || {},
        },
      },
      include: {
        posts: {
          include: {
            users: {
              select: {
                id: true,
                username: true,
                display_name: true,
                avatar_url: true,
              },
            },
            categories: {
              select: {
                id: true,
                name: true,
                slug: true,
                color: true,
              },
            },
            post_tags: {
              select: {
                tags: {
                  select: {
                    id: true,
                    name: true,
                    slug: true,
                  },
                },
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.bookmarks.count({ 
      where: { 
        userId,
        posts: {
          categories: viewPermissionFilter || {},
        },
      },
    }),
  ]);

  // Transform tags
  const data = bookmarks.map((bookmark: any) => ({
    ...bookmark.posts,
    author: bookmark.posts.users,
    users: undefined,
    category: bookmark.posts.categories,
    categories: undefined,
    tags: bookmark.posts.post_tags.map((pt: any) => pt.tags),
    post_tags: undefined,
    bookmarkedAt: bookmark.createdAt,
  }));

  return {
    data,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

/**
 * Check if a post is bookmarked by user
 */
export async function isPostBookmarked(userId: number, postId: number): Promise<boolean> {
  const bookmark = await prisma.bookmarks.findUnique({
    where: {
      userId_postId: {
        userId,
        postId,
      },
    },
  });
  return !!bookmark;
}

/**
 * Add bookmark
 */
export async function addBookmark(userId: number, postId: number) {
  // Check if post exists
  const post = await prisma.posts.findUnique({
    where: { id: postId },
    select: { id: true, status: true },
  });

  if (!post) {
    throw new NotFoundError('Post not found');
  }

  if (post.status !== 'PUBLISHED') {
    throw new BadRequestError('Cannot bookmark a non-published post');
  }

  // Check if already bookmarked
  const existing = await prisma.bookmarks.findUnique({
    where: {
      userId_postId: { userId, postId },
    },
  });

  if (existing) {
    throw new BadRequestError('Post already bookmarked');
  }

  return prisma.bookmarks.create({
    data: {
      userId,
      postId,
    },
  });
}

/**
 * Remove bookmark
 */
export async function removeBookmark(userId: number, postId: number) {
  const existing = await prisma.bookmarks.findUnique({
    where: {
      userId_postId: { userId, postId },
    },
  });

  if (!existing) {
    throw new NotFoundError('Bookmark not found');
  }

  return prisma.bookmarks.delete({
    where: {
      userId_postId: { userId, postId },
    },
  });
}

/**
 * Toggle bookmark (add if not exists, remove if exists)
 */
export async function toggleBookmark(userId: number, postId: number) {
  // Check if post exists
  const post = await prisma.posts.findUnique({
    where: { id: postId },
    select: { id: true, status: true },
  });

  if (!post) {
    throw new NotFoundError('Post not found');
  }

  const existing = await prisma.bookmarks.findUnique({
    where: {
      userId_postId: { userId, postId },
    },
  });

  if (existing) {
    await prisma.bookmarks.delete({
      where: {
        userId_postId: { userId, postId },
      },
    });
    return { bookmarked: false };
  } else {
    if (post.status !== 'PUBLISHED') {
      throw new BadRequestError('Cannot bookmark a non-published post');
    }
    await prisma.bookmarks.create({
      data: { userId, postId },
    });
    return { bookmarked: true };
  }
}

/**
 * Get bookmark status for multiple posts
 */
export async function getBookmarkStatusForPosts(userId: number, postIds: number[]) {
  const bookmarks = await prisma.bookmarks.findMany({
    where: {
      userId,
      postId: { in: postIds },
    },
    select: { postId: true },
  });

  return bookmarks.reduce((acc, bookmark) => {
    acc[bookmark.postId] = true;
    return acc;
  }, {} as Record<number, boolean>);
}








