import axios, { AxiosInstance } from 'axios';
import { createHash } from 'crypto';
import config from '../config/index.js';

/**
 * Generate a stable idempotency key from a set of identifying fields.
 * The key is a SHA-256 hex digest truncated to 32 chars (128-bit).
 * Same inputs always produce the same key — safe to resend on retry.
 */
function makeIdempotencyKey(...parts: (string | number | undefined)[]): string {
  const raw = parts.map(String).join(':');
  return createHash('sha256').update(raw).digest('hex').slice(0, 32);
}

interface TokenCache {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
}

export class APIExecutorService {
  private tokenCache = new Map<number, TokenCache>();
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: config.forumApiUrl,
      timeout: 15000,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  private async getToken(userId: number, email: string): Promise<string> {
    const cached = this.tokenCache.get(userId);
    // Use cached token if it has at least 2 minutes left
    if (cached && cached.expiresAt > Date.now() + 120_000) {
      return cached.accessToken;
    }

    // Try refresh first if we have a refresh token
    if (cached?.refreshToken) {
      try {
        const res = await this.client.post('/auth/refresh', {
          refreshToken: cached.refreshToken,
        });
        const tokens = res.data.data?.tokens || res.data.tokens;
        if (tokens?.accessToken) {
          this.tokenCache.set(userId, {
            accessToken: tokens.accessToken,
            refreshToken: tokens.refreshToken || cached.refreshToken,
            expiresAt: Date.now() + 14 * 60 * 1000, // assume 15min, use 14
          });
          return tokens.accessToken;
        }
      } catch {
        // Refresh failed, fall through to login
      }
    }

    // Login
    const res = await this.client.post('/auth/login', {
      identifier: email,
      password: config.botPassword,
    });

    const data = res.data.data || res.data;
    const tokens = data.tokens;
    if (!tokens?.accessToken) {
      throw new Error(`Login failed for ${email}: no access token in response`);
    }

    this.tokenCache.set(userId, {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      expiresAt: Date.now() + 14 * 60 * 1000,
    });

    return tokens.accessToken;
  }

  async createPost(
    userId: number,
    email: string,
    data: { title: string; content: string; categoryId: number; tags: string[] },
  ): Promise<{ success: boolean; postId?: number; error?: string }> {
    try {
      const token = await this.getToken(userId, email);
      // Stable key: same user+title will not create duplicates on retry
      const idempotencyKey = makeIdempotencyKey('post', userId, data.title, data.categoryId);

      const res = await this.client.post(
        '/posts',
        {
          title: data.title,
          content: data.content,
          category_id: data.categoryId,
          tags: data.tags,
          status: 'PUBLISHED',
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'X-Idempotency-Key': idempotencyKey,
          },
        },
      );

      const post = res.data.data || res.data;
      return { success: true, postId: post.id };
    } catch (error: any) {
      console.error('   [DEBUG] API Error:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        message: error.message,
        code: error.code,
      });

      const status = error.response?.status;
      const responseData = error.response?.data;
      let message = 'Unknown error';

      // Handle connection errors
      if (error.code === 'ECONNREFUSED') {
        return {
          success: false,
          error: `Cannot connect to Forum API at ${config.forumApiUrl}/v1 — backend may not be running`,
        };
      }

      if (responseData?.message) {
        message = responseData.message;
      } else if (responseData?.error) {
        message = responseData.error;
      } else if (error.message) {
        message = error.message;
      }

      if (status === 429) {
        return { success: false, error: `Rate limited: ${message}` };
      }
      if (status === 401) {
        return { success: false, error: `Auth failed (401): ${message}` };
      }
      if (status === 403) {
        return { success: false, error: `Forbidden (403): ${message}` };
      }
      if (status === 400) {
        return { success: false, error: `Bad request (400): ${message}` };
      }

      return { success: false, error: `API error (${status}): ${message}` };
    }
  }

  async createComment(
    userId: number,
    email: string,
    data: { postId: number; content: string; parentId?: number; quotedCommentId?: number },
  ): Promise<{ success: boolean; commentId?: number; error?: string }> {
    try {
      const token = await this.getToken(userId, email);
      const idempotencyKey = makeIdempotencyKey('comment', userId, data.postId, data.parentId ?? '', data.content.slice(0, 40));

      const body: Record<string, any> = { content: data.content };
      if (data.parentId) {
        const quotedCommentId = data.quotedCommentId ?? data.parentId;
        if (quotedCommentId !== data.parentId) {
          return { success: false, error: 'Invalid reply payload: quotedCommentId must match parentId' };
        }
        body.parent_id = data.parentId;
        body.quoted_comment_id = quotedCommentId;
      }

      const res = await this.client.post(
        `/posts/${data.postId}/comments`,
        body,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'X-Idempotency-Key': idempotencyKey,
          },
        },
      );

      const comment = res.data.data || res.data;
      return { success: true, commentId: comment.id };
    } catch (error: any) {
      return this.handleApiError(error, 'createComment');
    }
  }

  async castVote(
    userId: number,
    email: string,
    data: { targetType: 'post' | 'comment'; targetId: number; voteType: 'up' | 'down' },
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const token = await this.getToken(userId, email);
      const idempotencyKey = makeIdempotencyKey('vote', userId, data.targetType, data.targetId, data.voteType);

      const url = data.targetType === 'post'
        ? `/posts/${data.targetId}/vote`
        : `/comments/${data.targetId}/vote`;

      await this.client.post(
        url,
        { voteType: data.voteType },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'X-Idempotency-Key': idempotencyKey,
          },
        },
      );

      return { success: true };
    } catch (error: any) {
      return this.handleApiError(error, 'castVote');
    }
  }

  private handleApiError(error: any, context: string): { success: boolean; error: string } {
    console.error(`   [DEBUG] API Error (${context}):`, {
      status: error.response?.status,
      data: error.response?.data,
      message: error.message,
      code: error.code,
    });

    if (error.code === 'ECONNREFUSED') {
      return { success: false, error: `Cannot connect to Forum API — backend may not be running` };
    }

    const status = error.response?.status;
    const responseData = error.response?.data;
    let message = responseData?.message || responseData?.error || error.message || 'Unknown error';

    return { success: false, error: `API error (${status}): ${message}` };
  }
}
