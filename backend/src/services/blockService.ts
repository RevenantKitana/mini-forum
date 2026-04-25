import prisma from '../config/database.js';
import { NotFoundError, BadRequestError } from '../utils/errors.js';

/**
 * Block a user
 */
export async function blockUser(blockerId: number, blockedId: number) {
  // Can't block yourself
  if (blockerId === blockedId) {
    throw new BadRequestError("You can't block yourself");
  }

  // Check if user exists
  const blockedUser = await prisma.users.findUnique({
    where: { id: blockedId },
    select: { id: true, username: true },
  });

  if (!blockedUser) {
    throw new NotFoundError('User not found');
  }

  // Check if already blocked
  const existingBlock = await prisma.user_blocks.findUnique({
    where: {
      blocker_id_blocked_id: { blocker_id: blockerId, blocked_id: blockedId },
    },
  });

  if (existingBlock) {
    throw new BadRequestError('User is already blocked');
  }

  await prisma.user_blocks.create({
    data: { blocker_id: blockerId, blocked_id: blockedId },
  });

  return { blocked: true, username: blockedUser.username };
}

/**
 * Unblock a user
 */
export async function unblockUser(blockerId: number, blockedId: number) {
  const existingBlock = await prisma.user_blocks.findUnique({
    where: {
      blocker_id_blocked_id: { blocker_id: blockerId, blocked_id: blockedId },
    },
  });

  if (!existingBlock) {
    throw new NotFoundError('User is not blocked');
  }

  await prisma.user_blocks.delete({
    where: {
      blocker_id_blocked_id: { blocker_id: blockerId, blocked_id: blockedId },
    },
  });

  return { blocked: false };
}

/**
 * Check if user is blocked
 */
export async function isUserBlocked(blockerId: number, blockedId: number): Promise<boolean> {
  const block = await prisma.user_blocks.findUnique({
    where: {
      blocker_id_blocked_id: { blocker_id: blockerId, blocked_id: blockedId },
    },
  });
  return !!block;
}

/**
 * Get list of blocked users
 */
export async function getBlockedUsers(userId: number, page = 1, limit = 20) {
  const skip = (page - 1) * limit;

  const [blocks, total] = await Promise.all([
    prisma.user_blocks.findMany({
      where: { blocker_id: userId },
      include: {
        users_user_blocks_blocked_idTousers: {
          select: {
            id: true,
            username: true,
            display_name: true,
            avatar_preview_url: true,
            avatar_standard_url: true,
          },
        },
      },
      orderBy: { created_at: 'desc' },
      skip,
      take: limit,
    }),
      prisma.user_blocks.count({ where: { blocker_id: userId } }),
  ]);

  const data = blocks.map((block) => ({
    ...block.users_user_blocks_blocked_idTousers,
    blockedAt: block.created_at,
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
 * Get IDs of users blocked by a user
 */
export async function getBlockedUserIds(userId: number): Promise<number[]> {
  const blocks = await prisma.user_blocks.findMany({
    where: { blocker_id: userId },
    select: { blocked_id: true },
  });
  return blocks.map((b) => b.blocked_id);
}








