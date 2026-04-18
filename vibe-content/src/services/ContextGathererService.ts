import { createRequire } from 'module';
import config from '../config/index.js';
import {
  BotUser, Category, Tag, GenerationContext,
  CommentContext, VoteContext, PostTarget, CommentTarget, PersonalityInfo, PostReadContext,
} from '../types/index.js';
import logger from '../utils/logger.js';
import { withTimeout } from '../utils/withTimeout.js';
import { ContextMetricsCollector } from '../tracking/ContextMetricsCollector.js';

const require = createRequire(import.meta.url);
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const POST_CONTEXT_TTL_MS = 5 * 60 * 1000; // 5 minutes
const CONTEXT_FETCH_TIMEOUT_MS = 5_000;    // hard timeout for each PostReadContext fetch

// Basic Vietnamese sentiment heuristic
const POSITIVE_WORDS = ['hay', 'tốt', 'tuyệt', 'thú vị', 'đồng ý', 'cảm ơn', 'hữu ích', 'đúng', 'xuất sắc', 'chính xác'];
const NEGATIVE_WORDS = ['tệ', 'kém', 'không đồng ý', 'sai', 'vô lý', 'thất vọng', 'dở', 'tệ hại', 'bực mình'];

function detectSentiment(text: string): 'positive' | 'negative' | 'neutral' {
  const lower = text.toLowerCase();
  const pos = POSITIVE_WORDS.filter((w) => lower.includes(w)).length;
  const neg = NEGATIVE_WORDS.filter((w) => lower.includes(w)).length;
  return pos > neg ? 'positive' : neg > pos ? 'negative' : 'neutral';
}

export class ContextGathererService {
  private postContextCache = new Map<number, { data: PostReadContext; expiresAt: number }>();
  private metrics = new ContextMetricsCollector();

  /** Expose aggregated context metrics for the /status endpoint. */
  getMetricsSnapshot() {
    return this.metrics.getSnapshot();
  }

  /**
   * Record the rule-based relevance score for a comment that was just posted.
   * Called by ContentGeneratorService after a successful comment API call.
   */
  recordCommentRelevance(
    postId: number,
    comment: string,
    readContext: PostReadContext,
  ): number {
    const score = ContextMetricsCollector.computeRelevanceScore(
      comment,
      readContext.title,
      readContext.tags,
      readContext.body,
    );
    this.metrics.recordCommentRelevance(postId, comment, score);
    return score;
  }

  async getPostReadContext(postId: number): Promise<PostReadContext> {
    const cached = this.postContextCache.get(postId);
    if (cached && cached.expiresAt > Date.now()) {
      return cached.data;
    }

    const fetchStart = Date.now();
    let post: any;
    let rawComments: any[];

    try {
      [post, rawComments] = await withTimeout(
        Promise.all([
          prisma.posts.findUniqueOrThrow({
            where: { id: postId },
            select: {
              id: true,
              title: true,
              content: true,
              excerpt: true,
              post_tags: { select: { tags: { select: { name: true } } } },
            },
          }),
          prisma.comments.findMany({
            where: { post_id: postId, status: 'VISIBLE', parent_id: null },
            orderBy: { created_at: 'desc' },
            take: 5,
            select: {
              content: true,
              users: { select: { display_name: true } },
            },
          }),
        ]),
        CONTEXT_FETCH_TIMEOUT_MS,
        `getPostReadContext(${postId})`,
      );
    } catch (err: any) {
      const latencyMs = Date.now() - fetchStart;
      this.metrics.recordContextFetch({
        postId,
        success: false,
        latencyMs,
        tokenSize: 0,
        fallback: true,
        reason: err.message,
        timestamp: Date.now(),
      });
      logger.warn(`[context_fetch] postId=${postId} failed in ${latencyMs}ms — ${err.message}`);
      throw err; // re-throw tagged so RetryQueue classifies it correctly
    }

    const body = (post.content || post.excerpt || '').substring(0, 400);
    const tags: string[] = (post.post_tags || []).slice(0, 5)
      .map((pt: any) => pt.tags?.name).filter(Boolean);
    const recentComments = rawComments.map((c: any) => ({
      authorName: c.users?.display_name || 'Unknown',
      content: (c.content as string).substring(0, 150),
    }));

    const allText = body + ' ' + recentComments.map((c: any) => c.content).join(' ');
    const sentimentHint = detectSentiment(allText);

    const data: PostReadContext = {
      postId,
      title: post.title.substring(0, 150),
      body,
      tags,
      recentComments,
      sentimentHint,
    };

    // Estimate token size (chars / 4 is a common approximation)
    const totalChars = data.title.length + data.body.length
      + data.tags.join(' ').length
      + data.recentComments.reduce((s, c) => s + c.content.length, 0);
    const tokenSize = Math.round(totalChars / 4);
    const latencyMs = Date.now() - fetchStart;

    this.metrics.recordContextFetch({
      postId,
      success: true,
      latencyMs,
      tokenSize,
      fallback: false,
      timestamp: Date.now(),
    });

    logger.info(
      `[context_fetch] postId=${postId} ok — latency=${latencyMs}ms ` +
      `tokens≈${tokenSize} comments=${recentComments.length} tags=${tags.length} sentiment=${sentimentHint}`,
    );

    this.postContextCache.set(postId, { data, expiresAt: Date.now() + POST_CONTEXT_TTL_MS });
    return data;
  }

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
          status: 'VISIBLE',
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

    // Fetch post read context (degrade gracefully on error)
    let postReadContext = null;
    try {
      postReadContext = await this.getPostReadContext(post.id);
    } catch (err: any) {
      logger.warn(
        `[context_aware] fallback=true postId=${post.id} reason="${err.message}" — degrading to low_context_mode`,
      );
    }

    return { user: user as BotUser, targetPost, parentComment, postReadContext };
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

    // Decide to vote on post (40%) or comment (60%)
    const voteOnPost = Math.random() < 0.4;

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

      let postReadContext = null;
      try {
        postReadContext = await this.getPostReadContext(selectedPost.id);
      } catch (err: any) {
        logger.warn(
          `[context_aware] fallback=true postId=${selectedPost.id} reason="${err.message}" — degrading to low_context_mode`,
        );
      }

      return {
        user: user as BotUser,
        personality,
        targetType: 'post',
        targetId: selectedPost.id,
        targetTitle: selectedPost.title,
        targetContent: (selectedPost.excerpt || selectedPost.content || '').substring(0, 300),
        targetAuthor: selectedPost.users?.display_name || 'Unknown',
        targetCategory: selectedPost.categories?.name || '',
        postReadContext,
      };
    } else {
      // Find a recent comment this user hasn't voted on
      const comments = await prisma.comments.findMany({
        where: {
          status: 'VISIBLE',
          author_id: { not: userId },
        },
        orderBy: { created_at: 'desc' },
        take: 50, // fetch more, will filter by votes
        select: {
          id: true,
          content: true,
          users: { select: { display_name: true } },
          posts: {
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

      // For comment votes, we need the post id — fetch it via prisma
      let commentPostReadContext = null;
      try {
        const commentPost = await prisma.comments.findUnique({
          where: { id: selectedComment.id },
          select: { post_id: true },
        });
        if (commentPost?.post_id) {
          commentPostReadContext = await this.getPostReadContext(commentPost.post_id);
        }
      } catch (err: any) {
        logger.warn(
          `[context_aware] fallback=true commentId=${selectedComment.id} reason="${err.message}" — degrading to low_context_mode`,
        );
      }

      return {
        user: user as BotUser,
        personality,
        targetType: 'comment',
        targetId: selectedComment.id,
        targetTitle: selectedComment.posts?.title || '',
        targetContent: selectedComment.content.substring(0, 300),
        targetAuthor: selectedComment.users?.display_name || 'Unknown',
        targetCategory: selectedComment.posts?.categories?.name || '',
        postReadContext: commentPostReadContext,
      };
    }
  }

  async disconnect(): Promise<void> {
    await prisma.$disconnect();
  }
}
