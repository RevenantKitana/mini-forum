import { api } from './client';
import { ApiResponse, Category, Comment, LoginResponse, Post, Tag, User } from '../types';

export const postService = {
  getPosts: async (params?: {
    page?: number;
    limit?: number;
    category?: string;
    categorySlug?: string;
    categoryId?: number;
    tag?: string;
    sortBy?: 'latest' | 'top' | 'hot' | 'popular' | 'trending' | 'oldest';
    search?: string;
  }) => {
    let sort = 'latest';
    if (params?.sortBy === 'top' || params?.sortBy === 'popular') sort = 'popular';
    else if (params?.sortBy === 'hot' || params?.sortBy === 'trending') sort = 'trending';
    else if (params?.sortBy === 'oldest') sort = 'oldest';

    const queryParams: Record<string, any> = {
      page: params?.page || 1,
      limit: params?.limit || 10,
      sort,
    };

    const catSlug = params?.categorySlug || params?.category;
    if (catSlug && typeof catSlug === 'string' && catSlug.trim()) {
      queryParams.category = catSlug.trim();
    }
    if (params?.tag && params.tag.trim()) {
      queryParams.tag = params.tag.trim();
    }
    if (params?.search && params.search.trim()) {
      queryParams.search = params.search.trim();
    }

    const res = await api.get<ApiResponse<Post[]>>('/posts', {
      params: queryParams,
    });
    return res.data;
  },

  getPostById: async (id: number) => {
    const res = await api.get<ApiResponse<Post>>(`/posts/${id}`);
    return res.data;
  },

  createPost: async (data: {
    title: string;
    content: string;
    categoryId: number;
    tags?: string[];
  }) => {
    const res = await api.post<ApiResponse<Post>>('/posts', {
      title: data.title,
      content: data.content,
      category_id: data.categoryId,
      tags: data.tags || [],
      status: 'PUBLISHED',
      use_block_layout: true,
      blocks: [
        {
          type: 'TEXT',
          content: data.content,
          sort_order: 1,
        },
      ],
    });
    return res.data;
  },

  updatePost: async (id: number, data: {
    title?: string;
    content?: string;
    categoryId?: number;
    tags?: string[];
  }) => {
    const payload: any = {};
    if (data.title) payload.title = data.title;
    if (data.content !== undefined) {
      payload.content = data.content;
      payload.use_block_layout = true;
      payload.blocks = [{ type: 'TEXT', content: data.content, sort_order: 1 }];
    }
    if (data.categoryId) payload.category_id = data.categoryId;
    if (data.tags) payload.tags = data.tags;

    const res = await api.put<ApiResponse<Post>>(`/posts/${id}`, payload);
    return res.data;
  },

  deletePost: async (id: number) => {
    const res = await api.delete<ApiResponse<null>>(`/posts/${id}`);
    return res.data;
  },

  getFeaturedPosts: async (limit: number = 5) => {
    const res = await api.get<ApiResponse<Post[]>>('/posts/featured', { params: { limit } });
    return res.data;
  },

  getPostsByAuthor: async (username: string, page = 1, limit = 10) => {
    const res = await api.get<ApiResponse<Post[]>>(`/users/${username}/posts`, {
      params: { page, limit },
    });
    return res.data;
  },

  uploadPostMedia: async (postId: number, fileUri: string, mimeType: string = 'image/jpeg') => {
    const formData = new FormData();
    const filename = fileUri.split('/').pop() || 'photo.jpg';
    formData.append('media', {
      uri: fileUri,
      name: filename,
      type: mimeType,
    } as any);

    const res = await api.post(`/posts/${postId}/media`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data;
  },
};

export const categoryService = {
  getCategories: async () => {
    const res = await api.get<ApiResponse<Category[]>>('/categories');
    return res.data;
  },
};

export const tagService = {
  getTags: async () => {
    const res = await api.get<ApiResponse<Tag[]>>('/tags');
    return res.data;
  },
};

export const commentService = {
  getPostComments: async (postId: number, page: number = 1, limit: number = 50) => {
    const res = await api.get<ApiResponse<Comment[]>>(`/posts/${postId}/comments`, {
      params: { page, limit },
    });
    return res.data;
  },

  createComment: async (postId: number, content: string, parentId?: number) => {
    const res = await api.post<ApiResponse<Comment>>(`/posts/${postId}/comments`, {
      content,
      parent_id: parentId,
      quoted_comment_id: parentId,
    });
    return res.data;
  },

  updateComment: async (commentId: number, content: string) => {
    const res = await api.put<ApiResponse<Comment>>(`/comments/${commentId}`, { content });
    return res.data;
  },

  deleteComment: async (commentId: number) => {
    const res = await api.delete(`/comments/${commentId}`);
    return res.data;
  },
};

export const voteService = {
  votePost: async (postId: number, type: 'UP' | 'DOWN') => {
    const voteType = type === 'UP' ? 'up' : 'down';
    const res = await api.post<ApiResponse<{ voteScore: number; userVote: 'UP' | 'DOWN' | null }>>(
      `/posts/${postId}/vote`,
      { voteType }
    );
    return res.data;
  },

  removePostVote: async (postId: number) => {
    const res = await api.delete(`/posts/${postId}/vote`);
    return res.data;
  },

  voteComment: async (commentId: number, type: 'UP' | 'DOWN') => {
    const voteType = type === 'UP' ? 'up' : 'down';
    const res = await api.post<ApiResponse<{ voteScore: number; userVote: 'UP' | 'DOWN' | null }>>(
      `/comments/${commentId}/vote`,
      { voteType }
    );
    return res.data;
  },

  removeCommentVote: async (commentId: number) => {
    const res = await api.delete(`/comments/${commentId}/vote`);
    return res.data;
  },
};

export const bookmarkService = {
  toggleBookmark: async (postId: number) => {
    const res = await api.patch<ApiResponse<{ bookmarked: boolean }>>(`/posts/${postId}/bookmark`);
    return res.data;
  },

  getUserBookmarks: async (userId: number, page = 1, limit = 20) => {
    const res = await api.get<ApiResponse<Post[]>>(`/users/${userId}/bookmarks`, {
      params: { page, limit },
    });
    return res.data;
  },
};

export const userService = {
  getUserByUsername: async (username: string) => {
    const res = await api.get<ApiResponse<User>>(`/users/username/${username}`);
    return res.data;
  },

  getUserPosts: async (userId: number, page = 1, limit = 10) => {
    const res = await api.get<ApiResponse<Post[]>>(`/users/${userId}/posts`, {
      params: { page, limit },
    });
    return res.data;
  },

  getUserComments: async (userId: number, page = 1, limit = 10) => {
    const res = await api.get<ApiResponse<Comment[]>>(`/users/${userId}/comments`, {
      params: { page, limit },
    });
    return res.data;
  },

  updateProfile: async (userId: number, data: { displayName?: string; bio?: string }) => {
    const res = await api.put<ApiResponse<User>>(`/users/${userId}`, {
      display_name: data.displayName,
      bio: data.bio,
    });
    return res.data;
  },

  changePassword: async (userId: number, data: { currentPassword: string; newPassword: string }) => {
    const res = await api.patch<ApiResponse<null>>(`/users/${userId}/password`, {
      current_password: data.currentPassword,
      new_password: data.newPassword,
    });
    return res.data;
  },

  uploadAvatar: async (userId: number, fileUri: string) => {
    const formData = new FormData();
    const filename = fileUri.split('/').pop() || 'avatar.jpg';
    formData.append('avatar', {
      uri: fileUri,
      name: filename,
      type: 'image/jpeg',
    } as any);

    const res = await api.post<ApiResponse<{ avatar_standard_url: string; avatar_preview_url: string }>>(
      `/users/${userId}/avatar/upload`,
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } }
    );
    return res.data;
  },
};

export const reportService = {
  reportPost: async (postId: number, data: { reason: string; details?: string }) => {
    const res = await api.post(`/posts/${postId}/report`, data);
    return res.data;
  },

  reportComment: async (commentId: number, data: { reason: string; details?: string }) => {
    const res = await api.post(`/comments/${commentId}/report`, data);
    return res.data;
  },

  reportUser: async (userId: number, data: { reason: string; details?: string }) => {
    const res = await api.post(`/users/${userId}/report`, data);
    return res.data;
  },
};

export const notificationService = {
  getNotifications: async (page = 1, limit = 20) => {
    const res = await api.get<ApiResponse<any[]>>('/notifications', {
      params: { page, limit },
    });
    return res.data;
  },

  getUnreadCount: async () => {
    const res = await api.get<ApiResponse<{ count: number }>>('/notifications/unread-count');
    return res.data;
  },

  markAsRead: async (id: number) => {
    const res = await api.patch(`/notifications/${id}/read`);
    return res.data;
  },

  markAllAsRead: async () => {
    const res = await api.patch('/notifications/read-all');
    return res.data;
  },
};

export const searchService = {
  search: async (q: string, params?: { category?: string; tag?: string; page?: number; limit?: number }) => {
    const res = await api.get<ApiResponse<Post[]>>('/search', {
      params: {
        q,
        page: params?.page || 1,
        limit: params?.limit || 20,
        category: params?.category,
        tag: params?.tag,
      },
    });
    return res.data;
  },
};

export const authService = {
  login: async (credentials: { identifier?: string; emailOrUsername?: string; username?: string; email?: string; password: string }) => {
    const identifier = credentials.identifier || credentials.emailOrUsername || credentials.username || credentials.email;
    const res = await api.post<ApiResponse<LoginResponse>>('/auth/login', {
      identifier,
      password: credentials.password,
    });
    return res.data;
  },

  sendOtp: async (email: string, type: 'REGISTER' | 'RESET_PASSWORD') => {
    const res = await api.post<ApiResponse<{ message: string; expirationMinutes: number }>>(
      '/auth/send-otp',
      { email, type }
    );
    return res.data;
  },

  verifyOtp: async (email: string, otp: string, type: 'REGISTER' | 'RESET_PASSWORD') => {
    const res = await api.post<ApiResponse<{ registrationToken?: string; resetToken?: string }>>(
      '/auth/verify-otp',
      { email, otp, type }
    );
    return res.data;
  },

  resetPassword: async (data: { email: string; resetToken: string; newPassword: string }) => {
    const res = await api.post<ApiResponse<{ message: string }>>('/auth/reset-password', {
      email: data.email,
      reset_token: data.resetToken,
      new_password: data.newPassword,
    });
    return res.data;
  },

  register: async (data: {
    username: string;
    email: string;
    password: string;
    displayName: string;
    registrationToken?: string;
  }) => {
    const res = await api.post<ApiResponse<LoginResponse>>('/auth/register', {
      username: data.username,
      email: data.email,
      password: data.password,
      display_name: data.displayName,
      registrationToken: data.registrationToken,
    });
    return res.data;
  },

  getMe: async () => {
    const res = await api.get<ApiResponse<User>>('/auth/me');
    return res.data;
  },

  logout: async () => {
    try {
      await api.post('/auth/logout');
    } catch {
      // Ignore logout api errors on client
    }
  },
};
