import axios, { AxiosInstance } from 'axios';
import config from '../config/index.js';

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
      baseURL: `${config.forumApiUrl}/v1`,
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
          headers: { Authorization: `Bearer ${token}` },
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
}
