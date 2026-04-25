import prisma from '../config/database.js';
import { NotFoundError, BadRequestError, ForbiddenError } from '../utils/errors.js';
import { UpdateProfileInput, ChangeUsernameInput, ChangePasswordInput } from '../validations/userValidation.js';
import bcrypt from 'bcrypt';
import { isUserBlocked } from './blockService.js';

const USERNAME_CHANGE_COOLDOWN_DAYS = 30;

/**
 * User select fields for public profile
 */
const publicUserSelect = {
  id: true,
  username: true,
  display_name: true,
  avatar_preview_url: true,
  avatar_standard_url: true,
  bio: true,
  role: true,
  reputation: true,
  is_verified: true,
  created_at: true,
  last_active_at: true,
};

/**
 * User select fields for own profile (includes private data)
 */
const privateUserSelect = {
  ...publicUserSelect,
  email: true,
  date_of_birth: true,
  gender: true,
  is_active: true,
  username_changed_at: true,
  updated_at: true,
};

/**
 * Get user profile by ID
 */
export async function getUserById(id: number, requestingUserId?: number) {
  const user = await prisma.users.findUnique({
    where: { id },
    select: requestingUserId === id ? privateUserSelect : publicUserSelect,
  });

  if (!user) {
    throw new NotFoundError('User not found');
  }

  // Add post count and comment count
  const [post_count, comment_count] = await Promise.all([
    prisma.posts.count({
      where: { author_id: id, status: 'PUBLISHED' },
    }),
    prisma.comments.count({
      where: { author_id: id, status: 'VISIBLE' },
    }),
  ]);

  // Check block status between requesting user and this profile
  let isBlockedByMe = false;
  let hasBlockedMe = false;
  if (requestingUserId && requestingUserId !== id) {
    [isBlockedByMe, hasBlockedMe] = await Promise.all([
      isUserBlocked(requestingUserId, id),
      isUserBlocked(id, requestingUserId),
    ]);
  }

  return {
    ...user,
    post_count,
    comment_count,
    isBlockedByMe,
    hasBlockedMe,
  };
}

/**
 * Get user profile by username
 */
export async function getUserByUsername(username: string, requestingUserId?: number) {
  const user = await prisma.users.findUnique({
    where: { username },
    select: { id: true },
  });

  if (!user) {
    throw new NotFoundError('User not found');
  }

  return getUserById(user.id, requestingUserId);
}

/**
 * Update user profile
 */
export async function updateProfile(userId: number, data: UpdateProfileInput) {
  const updateData: Record<string, any> = {};

  if (data.display_name !== undefined) {
    updateData.display_name = data.display_name;
  }
  if (data.bio !== undefined) {
    updateData.bio = data.bio;
  }
  if (data.date_of_birth !== undefined) {
    updateData.date_of_birth = data.date_of_birth ? new Date(data.date_of_birth) : null;
  }
  if (data.gender !== undefined) {
    updateData.gender = data.gender;
  }

  const user = await prisma.users.update({
    where: { id: userId },
    select: privateUserSelect,
    data: updateData,
  });

  return user;
}

/**
 * Change username
 */
export async function changeUsername(userId: number, data: ChangeUsernameInput) {
  const user = await prisma.users.findUnique({
    where: { id: userId },
    select: { username: true, username_changed_at: true },
  });

  if (!user) {
    throw new NotFoundError('User not found');
  }

  // Check cooldown
  if (user.username_changed_at) {
    const cooldownEnd = new Date(user.username_changed_at);
    cooldownEnd.setDate(cooldownEnd.getDate() + USERNAME_CHANGE_COOLDOWN_DAYS);

    if (new Date() < cooldownEnd) {
      const daysRemaining = Math.ceil(
        (cooldownEnd.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
      );
      throw new BadRequestError(
        `You can change your username again in ${daysRemaining} days`
      );
    }
  }

  // Check if new username is same as old
  if (user.username === data.username) {
    throw new BadRequestError('New username must be different from current username');
  }

  // Check if username is taken
  const existingUser = await prisma.users.findUnique({
    where: { username: data.username },
  });

  if (existingUser) {
    throw new BadRequestError('Username is already taken');
  }

  const updatedUser = await prisma.users.update({
    where: { id: userId },
    select: privateUserSelect,
    data: {
      username: data.username,
      username_changed_at: new Date(),
    },
  });

  return updatedUser;
}

/**
 * Change password
 */
export async function changePassword(userId: number, data: ChangePasswordInput) {
  const user = await prisma.users.findUnique({
    where: { id: userId },
    select: { password_hash: true },
  });

  if (!user) {
    throw new NotFoundError('User not found');
  }

  // Verify current password
  const isValidPassword = await bcrypt.compare(data.currentPassword, user.password_hash);
  if (!isValidPassword) {
    throw new BadRequestError('Current password is incorrect');
  }

  // Hash new password
  const newPasswordHash = await bcrypt.hash(data.newPassword, 12);

  await prisma.users.update({
    where: { id: userId },
    data: { password_hash: newPasswordHash },
  });

  // Optionally: invalidate all refresh tokens
  await prisma.refresh_tokens.deleteMany({
    where: { user_id: userId },
  });

  return { message: 'Password changed successfully' };
}

/**
 * Update user record with ImageKit avatar fields after a successful upload.
 * Called by uploadAvatar controller after uploading to ImageKit.
 */
export async function uploadAvatarToImageKit(
  userId: number,
  data: {
    avatar_imagekit_file_id: string;
    avatar_preview_url: string;
    avatar_standard_url: string;
  },
) {
  const user = await prisma.users.update({
    where: { id: userId },
    select: privateUserSelect,
    data,
  });

  return user;
}

/**
 * Get avatar_imagekit_file_id for a user (used to delete the old file before uploading a new one).
 */
export async function getAvatarImagekitFileId(userId: number): Promise<string | null> {
  const user = await prisma.users.findUnique({
    where: { id: userId },
    select: { avatar_imagekit_file_id: true },
  });
  return user?.avatar_imagekit_file_id ?? null;
}

/**
 * Get user's posts
 */
export async function getUserPosts(userId: number, page = 1, limit = 10, requestingUserId?: number) {
  const skip = (page - 1) * limit;

  // Build where clause - show all posts for owner, only published for others
  const where = {
    author_id: userId,
    ...(requestingUserId === userId ? {} : { status: 'PUBLISHED' as const }),
  };

  const [posts, total] = await Promise.all([
    prisma.posts.findMany({
      where,
      select: {
        id: true,
        title: true,
        excerpt: true,
        view_count: true,
        upvote_count: true,
        downvote_count: true,
        comment_count: true,
        status: true,
        is_pinned: true,
        is_locked: true,
        created_at: true,
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
      orderBy: { created_at: 'desc' },
      skip,
      take: limit,
    }),
    prisma.posts.count({ where }),
  ]);

  // Transform tags
  const data = posts.map((post: any) => ({
    ...post,
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
  };
}

/**
 * Get user's comments
 */
export async function getUserComments(userId: number, page = 1, limit = 10, requestingUserId?: number) {
  const skip = (page - 1) * limit;

  // Build where clause - show all comments for owner, only visible for others
  const where = {
    author_id: userId,
    ...(requestingUserId === userId ? {} : { status: 'VISIBLE' as const }),
  };

  const [comments, total] = await Promise.all([
    prisma.comments.findMany({
      where,
      select: {
        id: true,
        content: true,
        upvote_count: true,
        downvote_count: true,
        status: true,
        created_at: true,
        posts: {
          select: {
            id: true,
            title: true,
          },
        },
      },
      orderBy: { created_at: 'desc' },
      skip,
      take: limit,
    }),
    prisma.comments.count({ where }),
  ]);

  return {
    data: comments.map((comment: any) => ({
      ...comment,
      post: comment.posts,
      posts: undefined,
    })),
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

/**
 * Update last active timestamp
 */
export async function updateLastActive(userId: number) {
  await prisma.users.update({
    where: { id: userId },
    data: { last_active_at: new Date() },
  });
}








