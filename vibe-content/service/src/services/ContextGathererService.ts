import { createRequire } from 'module';
import config from '../config/index.js';
import {
  BotUser, Category, Tag, GenerationContext,
  CommentContext, VoteContext, PostTarget, CommentTarget, PersonalityInfo,
} from '../types/index.js';

const require = createRequire(import.meta.url);
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

export class ContextGathererService {
  async getAllBotUsers(): Promise<BotUser[]> {
    const users = await prisma.users.findMany({
      where: { role: 'BOT', is_active: true },
      select: {
        id: true,
        username: true,
        email: true,
        display_name: true,
        bio: true,
        avatar_url: true,
      },
    });
    return users;
  }

  async getPersonality(userId: number): Promise<PersonalityInfo | null> {
    const ctx = await prisma.user_content_context.findUnique({
      where: { user_id: userId },
      select: { personality: true },
    });
    return ctx?.personality ?? null;
  }

  async gatherPostContext(userId: number): Promise<GenerationContext> {
    // 1. Get user info
    const user = await prisma.users.findUniqueOrThrow({
      where: { id: userId },
      select: {
        id: true,
        username: true,
        email: true,
        display_name: true,
        bio: true,
        avatar_url: true,
      },
    });

    // 2. Pick a random category the user (BOT treated as MEMBER) can post in
    const categories = await prisma.categories.findMany({
      where: {
        is_active: true,
        post_permission: { in: ['ALL', 'MEMBER'] },
      },
      select: { id: true, name: true, slug: true, description: true },
    });

    if (categories.length === 0) {
      throw new Error('No available categories for posting');
    }

    const category: Category = categories[Math.floor(Math.random() * categories.length)];

    // 3. Get available tags
    const tags: Tag[] = await prisma.tags.findMany({
      where: { is_active: true },
      select: { id: true, name: true, slug: true },
    });

    // 4. Get recent posts by this user (to avoid repetition)
    const recentPosts = await prisma.posts.findMany({
      where: { author_id: userId },
      orderBy: { created_at: 'desc' },
      take: 3,
      select: { title: true, excerpt: true },
    });

    return {
      user: user as BotUser,
      category,
      availableTags: tags,
      recentPosts: recentPosts.map((p: any) => ({
        title: p.title,
        excerpt: p.excerpt || '',
      })),
    };
  }

  async gatherCommentContext(userId: number): Promise<CommentContext> {
    const user = await prisma.users.findUniqueOrThrow({
      where: { id: userId },
      select: {
        id: true, username: true, email: true,
        display_name: true, bio: true, avatar_url: true,
      },
    });

    // Pick a recent published post NOT by this bot user
    const posts = await prisma.posts.findMany({
      where: {
        status: 'PUBLISHED',
        author_id: { not: userId },
        is_locked: false,
      },
      orderBy: { created_at: 'desc' },
      take: 20,
      select: {
        id: true,
        title: true,
        excerpt: true,
        users: { select: { display_name: true } },
        categories: { select: { name: true } },
      },
    });

    if (posts.length === 0) {
      throw new Error('No posts available for commenting');
    }

    const post = posts[Math.floor(Math.random() * posts.length)];

    const targetPost: PostTarget = {
      id: post.id,
      title: post.title,
      excerpt: post.excerpt || '',
      authorName: post.users?.display_name || 'Unknown',
      categoryName: post.categories?.name || '',
    };

    // 50% chance to reply to an existing comment instead of top-level
    let parentComment: CommentTarget | undefined;
    if (Math.random() < 0.5) {
      const comments = await prisma.comments.findMany({
        where: {
          post_id: post.id,
          author_id: { not: userId },
          is_deleted: false,
          parent_id: null, // only top-level comments as reply targets
        },
        orderBy: { created_at: 'desc' },
        take: 10,
        select: {
          id: true,
          content: true,
          users: { select: { display_name: true } },
          post_id: true,
        },
      });

      if (comments.length > 0) {
        const comment = comments[Math.floor(Math.random() * comments.length)];
        parentComment = {
          id: comment.id,
          content: comment.content.substring(0, 200),
          authorName: comment.users?.display_name || 'Unknown',
          postId: comment.post_id,
          postTitle: post.title,
        };
      }
    }

    return { user: user as BotUser, targetPost, parentComment };
  }

  async gatherVoteContext(userId: number): Promise<VoteContext | null> {
    const user = await prisma.users.findUniqueOrThrow({
      where: { id: userId },
      select: {
        id: true, username: true, email: true,
        display_name: true, bio: true, avatar_url: true,
      },
    });

    const personality = await this.getPersonality(userId);

    // Decide to vote on post (60%) or comment (40%)
    const voteOnPost = Math.random() < 0.6;

    if (voteOnPost) {
      // Find a recent post this user hasn't voted on
      const posts = await prisma.posts.findMany({
        where: {
          status: 'PUBLISHED',
          author_id: { not: userId },
        },
        orderBy: { created_at: 'desc' },
        take: 50, // fetch more, will filter by votes
        select: {
          id: true,
          title: true,
          excerpt: true,
          content: true,
          users: { select: { display_name: true } },
          categories: { select: { name: true } },
        },
      });

      if (posts.length === 0) return null;

      // Filter out posts this user has already voted on
      let selectedPost = null;
      for (const post of posts) {
        const existingVote = await prisma.votes.findUnique({
          where: {
            userId_targetType_targetId: {
              userId,
              targetType: 'POST',
              targetId: post.id,
            },
          },
        });
        if (!existingVote) {
          selectedPost = post;
          break;
        }
      }

      if (!selectedPost) return null;

      return {
        user: user as BotUser,
        personality,
        targetType: 'post',
        targetId: selectedPost.id,
        targetTitle: selectedPost.title,
        targetContent: (selectedPost.excerpt || selectedPost.content || '').substring(0, 300),
        targetAuthor: selectedPost.users?.display_name || 'Unknown',
        targetCategory: selectedPost.categories?.name || '',
      };
    } else {
      // Find a recent comment this user hasn't voted on
      const comments = await prisma.comments.findMany({
        where: {
          is_deleted: false,
          author_id: { not: userId },
        },
        orderBy: { created_at: 'desc' },
        take: 50, // fetch more, will filter by votes
        select: {
          id: true,
          content: true,
          users: { select: { display_name: true } },
          post: {
            select: {
              title: true,
              categories: { select: { name: true } },
            },
          },
        },
      });

      if (comments.length === 0) return null;

      // Filter out comments this user has already voted on
      let selectedComment = null;
      for (const comment of comments) {
        const existingVote = await prisma.votes.findUnique({
          where: {
            userId_targetType_targetId: {
              userId,
              targetType: 'COMMENT',
              targetId: comment.id,
            },
          },
        });
        if (!existingVote) {
          selectedComment = comment;
          break;
        }
      }

      if (!selectedComment) return null;

      return {
        user: user as BotUser,
        personality,
        targetType: 'comment',
        targetId: selectedComment.id,
        targetTitle: selectedComment.post?.title || '',
        targetContent: selectedComment.content.substring(0, 300),
        targetAuthor: selectedComment.users?.display_name || 'Unknown',
        targetCategory: selectedComment.post?.categories?.name || '',
      };
    }
  }

  async disconnect(): Promise<void> {
    await prisma.$disconnect();
  }
}
