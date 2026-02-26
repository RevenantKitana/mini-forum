import apiClient from '../axios';

// Admin API endpoints
export const ADMIN_ENDPOINTS = {
  DASHBOARD: '/admin/dashboard',
  USERS: '/admin/users',
  USER_BY_ID: (id: number) => `/admin/users/${id}`,
  USER_ROLE: (id: number) => `/admin/users/${id}/role`,
  USER_STATUS: (id: number) => `/admin/users/${id}/status`,
  REPORTS: '/admin/reports',
  REPORT_BY_ID: (id: number) => `/admin/reports/${id}`,
  POSTS: '/admin/posts',
  POST_STATUS: (id: number) => `/admin/posts/${id}/status`,
  COMMENTS: '/admin/comments',
  COMMENT_STATUS: (id: number) => `/admin/comments/${id}/status`,
};

// Types
export interface DashboardStats {
  overview: {
    totalUsers: number;
    totalPosts: number;
    totalComments: number;
    publishedPosts: number;
    activeUsers: number;
    pendingReports: number;
  };
  today: {
    newUsers: number;
    newPosts: number;
    newComments: number;
  };
  usersByRole: {
    MEMBER: number;
    MODERATOR: number;
    ADMIN: number;
  };
  topCategories: Array<{
    id: number;
    name: string;
    slug: string;
    postCount: number;
    color: string;
  }>;
  recentActivities: Array<{
    type: 'USER_REGISTERED' | 'POST_CREATED' | 'COMMENT_CREATED';
    data: any;
    createdAt: string;
  }>;
}

export interface AdminUser {
  id: number;
  email: string;
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
  role: 'MEMBER' | 'MODERATOR' | 'ADMIN';
  reputation: number;
  isVerified: boolean;
  isActive: boolean;
  lastActiveAt: string | null;
  createdAt: string;
  _count: {
    posts: number;
    comments: number;
  };
}

export interface AdminReport {
  id: number;
  reporterId: number;
  targetType: 'USER' | 'POST' | 'COMMENT';
  targetId: number;
  reason: string;
  description: string | null;
  status: 'PENDING' | 'REVIEWED' | 'RESOLVED' | 'REJECTED';
  reviewedBy: number | null;
  reviewedAt: string | null;
  createdAt: string;
  reporter: {
    id: number;
    username: string;
    displayName: string | null;
    avatarUrl: string | null;
  };
  target: any;
}

export interface AdminPost {
  id: number;
  title: string;
  slug: string;
  status: 'DRAFT' | 'PUBLISHED' | 'HIDDEN' | 'DELETED';
  isPinned: boolean;
  isLocked: boolean;
  viewCount: number;
  upvoteCount: number;
  downvoteCount: number;
  commentCount: number;
  createdAt: string;
  author: {
    id: number;
    username: string;
    displayName: string | null;
  };
  category: {
    id: number;
    name: string;
    slug: string;
  };
}

export interface AdminComment {
  id: number;
  content: string;
  status: 'VISIBLE' | 'HIDDEN' | 'DELETED';
  upvoteCount: number;
  downvoteCount: number;
  createdAt: string;
  author: {
    id: number;
    username: string;
    displayName: string | null;
  };
  post: {
    id: number;
    title: string;
    slug: string;
  };
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// API Functions
export const adminService = {
  // Dashboard
  getDashboardStats: async (): Promise<DashboardStats> => {
    const response = await apiClient.get(ADMIN_ENDPOINTS.DASHBOARD);
    return response.data.data;
  },

  // Users
  getUsers: async (params?: {
    page?: number;
    limit?: number;
    search?: string;
    role?: string;
    status?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }): Promise<PaginatedResponse<AdminUser>> => {
    const response = await apiClient.get(ADMIN_ENDPOINTS.USERS, { params });
    return response.data;
  },

  getUserDetail: async (id: number): Promise<any> => {
    const response = await apiClient.get(ADMIN_ENDPOINTS.USER_BY_ID(id));
    return response.data.data;
  },

  changeUserRole: async (id: number, role: string): Promise<any> => {
    const response = await apiClient.patch(ADMIN_ENDPOINTS.USER_ROLE(id), { role });
    return response.data.data;
  },

  changeUserStatus: async (id: number, isActive: boolean): Promise<any> => {
    const response = await apiClient.patch(ADMIN_ENDPOINTS.USER_STATUS(id), { isActive });
    return response.data.data;
  },

  deleteUser: async (id: number): Promise<void> => {
    await apiClient.delete(ADMIN_ENDPOINTS.USER_BY_ID(id));
  },

  // Reports
  getReports: async (params?: {
    page?: number;
    limit?: number;
    status?: string;
    targetType?: string;
  }): Promise<PaginatedResponse<AdminReport>> => {
    const response = await apiClient.get(ADMIN_ENDPOINTS.REPORTS, { params });
    return response.data;
  },

  getReportDetail: async (id: number): Promise<any> => {
    const response = await apiClient.get(ADMIN_ENDPOINTS.REPORT_BY_ID(id));
    return response.data.data;
  },

  updateReportStatus: async (
    id: number,
    status: string,
    action?: string
  ): Promise<any> => {
    const response = await apiClient.patch(ADMIN_ENDPOINTS.REPORT_BY_ID(id), {
      status,
      action,
    });
    return response.data.data;
  },

  // Posts
  getPosts: async (params?: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
    categoryId?: number;
  }): Promise<PaginatedResponse<AdminPost>> => {
    const response = await apiClient.get(ADMIN_ENDPOINTS.POSTS, { params });
    return response.data;
  },

  updatePostStatus: async (id: number, status: string): Promise<any> => {
    const response = await apiClient.patch(ADMIN_ENDPOINTS.POST_STATUS(id), { status });
    return response.data.data;
  },

  // Comments
  getComments: async (params?: {
    page?: number;
    limit?: number;
    status?: string;
  }): Promise<PaginatedResponse<AdminComment>> => {
    const response = await apiClient.get(ADMIN_ENDPOINTS.COMMENTS, { params });
    return response.data;
  },

  updateCommentStatus: async (id: number, status: string): Promise<any> => {
    const response = await apiClient.patch(ADMIN_ENDPOINTS.COMMENT_STATUS(id), { status });
    return response.data.data;
  },
};

export default adminService;
