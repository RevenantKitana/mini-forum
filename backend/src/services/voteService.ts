import prisma from '../config/database.js';
import { NotFoundError, BadRequestError } from '../utils/errors.js';
import * as notificationService from './notificationService.js';

type VoteTarget = 'POST' | 'COMMENT';

/**
 * Get user's vote on a target
 */
export async function getUserVote(userId: number, targetType: VoteTarget, targetId: number) {
  return prisma.votes.findUnique({
    where: {
      user_id_target_type_target_id: {
        user_id: userId,
        target_type: targetType,
        target_id: targetId,
      },
    },
  });
}

/**
 * Vote on a post
 */
export async function votePost(postId: number, userId: number, voteType: 'up' | 'down') {
  // Check if post exists
  const post = await prisma.posts.findUnique({
    where: { id: postId },
    select: { id: true, author_id: true },
  });

  if (!post) {
    throw new NotFoundError('Post not found');
  }

  // Prevent self-voting
  if (post.author_id === userId) {
    throw new BadRequestError('You cannot vote on your own post');
  }

  const voteValue = voteType === 'up' ? 1 : -1;
  const existingVote = await getUserVote(userId, 'POST', postId);

  // Get voter info for notification (only for upvotes)
  let voterName = 'Someone';
  if (voteType === 'up' && post.author_id !== userId) {
    const voter = await prisma.users.findUnique({
      where: { id: userId },
      select: { display_name: true, username: true },
    });
    voterName = voter?.display_name || voter?.username || 'Someone';
  }

  if (existingVote) {
    if (existingVote.value === voteValue) {
      // Same vote type - remove vote
      await prisma.$transaction([
        prisma.votes.delete({
          where: { id: existingVote.id },
        }),
        prisma.posts.update({
          where: { id: postId },
          data: {
            upvote_count: voteType === 'up' ? { decrement: 1 } : undefined,
            downvote_count: voteType === 'down' ? { decrement: 1 } : undefined,
          },
        }),
        // Update author reputation
        prisma.users.update({
          where: { id: post.author_id },
          data: {
            reputation: { decrement: voteValue },
          },
        }),
      ]);
      return { action: 'removed', voteType: null };
    } else {
      // Different vote type - update vote
      await prisma.$transaction([
        prisma.votes.update({
          where: { id: existingVote.id },
          data: { value: voteValue },
        }),
        prisma.posts.update({
          where: { id: postId },
          data: {
            upvote_count: voteType === 'up' ? { increment: 1 } : { decrement: 1 },
            downvote_count: voteType === 'down' ? { increment: 1 } : { decrement: 1 },
          },
        }),
        // Update author reputation (double because switching from one to other)
        prisma.users.update({
          where: { id: post.author_id },
          data: {
            reputation: { increment: voteValue * 2 },
          },
        }),
      ]);

      // Send notification for upvote (changed from down to up)
      if (voteType === 'up' && post.author_id !== userId) {
        notificationService.notifyVote(post.author_id, voterName, 'POST', 'up', postId)
          .catch(err => console.error('Failed to send vote notification:', err));
      }

      return { action: 'changed', voteType };
    }
  } else {
    // Create new vote
    await prisma.$transaction([
      prisma.votes.create({
        data: {
          user_id: userId,
          target_type: 'POST',
          target_id: postId,
          value: voteValue,
          updated_at: new Date(),
        },
      }),
      prisma.posts.update({
        where: { id: postId },
        data: {
          upvote_count: voteType === 'up' ? { increment: 1 } : undefined,
          downvote_count: voteType === 'down' ? { increment: 1 } : undefined,
        },
      }),
      // Update author reputation
      prisma.users.update({
        where: { id: post.author_id },
        data: {
          reputation: { increment: voteValue },
        },
      }),
    ]);

    // Send notification for new upvote
    if (voteType === 'up' && post.author_id !== userId) {
      notificationService.notifyVote(post.author_id, voterName, 'POST', 'up', postId)
        .catch(err => console.error('Failed to send vote notification:', err));
    }

    return { action: 'created', voteType };
  }
}

/**
 * Remove vote from a post
 */
export async function removePostVote(postId: number, userId: number) {
  const existingVote = await getUserVote(userId, 'POST', postId);

  if (!existingVote) {
    throw new NotFoundError('Vote not found');
  }

  const post = await prisma.posts.findUnique({
    where: { id: postId },
    select: { author_id: true },
  });

  if (!post) {
    throw new NotFoundError('Post not found');
  }

  await prisma.$transaction([
    prisma.votes.delete({
      where: { id: existingVote.id },
    }),
    prisma.posts.update({
      where: { id: postId },
      data: {
        upvote_count: existingVote.value === 1 ? { decrement: 1 } : undefined,
        downvote_count: existingVote.value === -1 ? { decrement: 1 } : undefined,
      },
    }),
    // Update author reputation
    prisma.users.update({
      where: { id: post.author_id },
      data: {
        reputation: { decrement: existingVote.value },
      },
    }),
  ]);

  return { action: 'removed' };
}

/**
 * Vote on a comment
 */
export async function voteComment(commentId: number, userId: number, voteType: 'up' | 'down') {
  // Check if comment exists
  const comment = await prisma.comments.findUnique({
    where: { id: commentId },
    select: { id: true, author_id: true },
  });

  if (!comment) {
    throw new NotFoundError('Comment not found');
  }

  // Prevent self-voting
  if (comment.author_id === userId) {
    throw new BadRequestError('You cannot vote on your own comment');
  }

  const voteValue = voteType === 'up' ? 1 : -1;
  const existingVote = await getUserVote(userId, 'COMMENT', commentId);

  // Get voter info for notification (only for upvotes)
  let voterName = 'Someone';
  if (voteType === 'up' && comment.author_id !== userId) {
    const voter = await prisma.users.findUnique({
      where: { id: userId },
      select: { display_name: true, username: true },
    });
    voterName = voter?.display_name || voter?.username || 'Someone';
  }

  if (existingVote) {
    if (existingVote.value === voteValue) {
      // Same vote type - remove vote
      await prisma.$transaction([
        prisma.votes.delete({
          where: { id: existingVote.id },
        }),
        prisma.comments.update({
          where: { id: commentId },
          data: {
            upvote_count: voteType === 'up' ? { decrement: 1 } : undefined,
            downvote_count: voteType === 'down' ? { decrement: 1 } : undefined,
          },
        }),
        // Update author reputation
        prisma.users.update({
          where: { id: comment.author_id },
          data: {
            reputation: { decrement: voteValue },
          },
        }),
      ]);
      return { action: 'removed', voteType: null };
    } else {
      // Different vote type - update vote
      await prisma.$transaction([
        prisma.votes.update({
          where: { id: existingVote.id },
          data: { value: voteValue },
        }),
        prisma.comments.update({
          where: { id: commentId },
          data: {
            upvote_count: voteType === 'up' ? { increment: 1 } : { decrement: 1 },
            downvote_count: voteType === 'down' ? { increment: 1 } : { decrement: 1 },
          },
        }),
        // Update author reputation
        prisma.users.update({
          where: { id: comment.author_id },
          data: {
            reputation: { increment: voteValue * 2 },
          },
        }),
      ]);

      // Send notification for upvote (changed from down to up)
      if (voteType === 'up' && comment.author_id !== userId) {
        notificationService.notifyVote(comment.author_id, voterName, 'COMMENT', 'up', commentId)
          .catch(err => console.error('Failed to send vote notification:', err));
      }

      return { action: 'changed', voteType };
    }
  } else {
    // Create new vote
    await prisma.$transaction([
      prisma.votes.create({
        data: {
          user_id: userId,
          target_type: 'COMMENT',
          target_id: commentId,
          value: voteValue,
          updated_at: new Date(),
        },
      }),
      prisma.comments.update({
        where: { id: commentId },
        data: {
          upvote_count: voteType === 'up' ? { increment: 1 } : undefined,
          downvote_count: voteType === 'down' ? { increment: 1 } : undefined,
        },
      }),
      // Update author reputation
      prisma.users.update({
        where: { id: comment.author_id },
        data: {
          reputation: { increment: voteValue },
        },
      }),
    ]);

    // Send notification for new upvote
    if (voteType === 'up' && comment.author_id !== userId) {
      notificationService.notifyVote(comment.author_id, voterName, 'COMMENT', 'up', commentId)
        .catch(err => console.error('Failed to send vote notification:', err));
    }

    return { action: 'created', voteType };
  }
}

/**
 * Remove vote from a comment
 */
export async function removeCommentVote(commentId: number, userId: number) {
  const existingVote = await getUserVote(userId, 'COMMENT', commentId);

  if (!existingVote) {
    throw new NotFoundError('Vote not found');
  }

  const comment = await prisma.comments.findUnique({
    where: { id: commentId },
    select: { author_id: true },
  });

  if (!comment) {
    throw new NotFoundError('Comment not found');
  }

  await prisma.$transaction([
    prisma.votes.delete({
      where: { id: existingVote.id },
    }),
    prisma.comments.update({
      where: { id: commentId },
      data: {
        upvote_count: existingVote.value === 1 ? { decrement: 1 } : undefined,
        downvote_count: existingVote.value === -1 ? { decrement: 1 } : undefined,
      },
    }),
    // Update author reputation
    prisma.users.update({
      where: { id: comment.author_id },
      data: {
        reputation: { decrement: existingVote.value },
      },
    }),
  ]);

  return { action: 'removed' };
}

/**
 * Get user's votes for multiple posts
 */
export async function getUserVotesForPosts(userId: number, post_ids: number[]) {
  const votes = await prisma.votes.findMany({
    where: {
      user_id: userId,
      target_type: 'POST',
      target_id: { in: post_ids },
    },
    select: {
      target_id: true,
      value: true,
    },
  });

  return votes.reduce((acc, vote) => {
    acc[vote.target_id] = vote.value;
    return acc;
  }, {} as Record<number, number>);
}

/**
 * Get user's votes for multiple comments
 */
export async function getUserVotesForComments(userId: number, commentIds: number[]) {
  const votes = await prisma.votes.findMany({
    where: {
      user_id: userId,
      target_type: 'COMMENT',
      target_id: { in: commentIds },
    },
    select: {
      target_id: true,
      value: true,
    },
  });

  return votes.reduce((acc, vote) => {
    acc[vote.target_id] = vote.value;
    return acc;
  }, {} as Record<number, number>);
}

/**
 * Get user's vote history with pagination (private - only for own profile)
 */
export async function getUserVoteHistory(
  userId: number, 
  options: { 
    page?: number; 
    limit?: number; 
    targetType?: 'POST' | 'COMMENT';
    voteType?: 'up' | 'down';
  } = {}
) {
  const { page = 1, limit = 10, targetType, voteType } = options;
  const skip = (page - 1) * limit;

  const where: any = { user_id: userId };
  if (targetType) {
    where.target_type = targetType;
  }
  if (voteType) {
    where.value = voteType === 'up' ? 1 : -1;
  }

  const [votes, total] = await Promise.all([
    prisma.votes.findMany({
      where,
      orderBy: { created_at: 'desc' },
      skip,
      take: limit,
    }),
    prisma.votes.count({ where }),
  ]);

  // Separate post and comment IDs
  const post_ids = votes.filter(v => v.target_type === 'POST').map(v => v.target_id);
  const commentIds = votes.filter(v => v.target_type === 'COMMENT').map(v => v.target_id);

  // Fetch post details
  const posts = post_ids.length > 0 ? await prisma.posts.findMany({
    where: { id: { in: post_ids } },
    select: {
      id: true,
      title: true,
      author_id: true,
      users: {
        select: {
          id: true,
          username: true,
          display_name: true,
          avatar_url: true,
        }
      }
    }
  }) : [];

  // Fetch comment details with post info
  const comments = commentIds.length > 0 ? await prisma.comments.findMany({
    where: { id: { in: commentIds } },
    select: {
      id: true,
      content: true,
      author_id: true,
      post_id: true,
      users: {
        select: {
          id: true,
          username: true,
          display_name: true,
          avatar_url: true,
        }
      },
      posts: {
        select: {
          id: true,
          title: true,
        }
      }
    }
  }) : [];

  // Create lookup maps
  const postMap = new Map(posts.map(p => [p.id, p]));
  const commentMap = new Map(comments.map(c => [c.id, c]));

  // Enrich votes with target details
  const enrichedVotes = votes.map(vote => {
    const voteTypeLabel = vote.value === 1 ? 'upvote' : 'downvote';
    
    if (vote.target_type === 'POST') {
      const post = postMap.get(vote.target_id);
      return {
        id: vote.id,
        target_type: vote.target_type,
        target_id: vote.target_id,
        voteTypeLabel,
        created_at: vote.created_at,
        target: post ? {
          title: post.title,
          author: post.users,
        } : null,
      };
    } else {
      const comment = commentMap.get(vote.target_id);
      return {
        id: vote.id,
        target_type: vote.target_type,
        target_id: vote.target_id,
        voteTypeLabel,
        created_at: vote.created_at,
        target: comment ? {
          content: comment.content ? (comment.content.length > 100 ? comment.content.substring(0, 100) + '...' : comment.content) : '',
          author: comment.users,
          post: comment.posts,
        } : null,
      };
    }
  });

  return {
    data: enrichedVotes,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}









