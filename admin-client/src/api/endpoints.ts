export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/auth/login',
    LOGOUT: '/auth/logout',
    REFRESH: '/auth/refresh',
    ME: '/auth/me',
  },
  ADMIN: {
    STATS: '/admin/dashboard',
    USERS: '/admin/users',
    POSTS: '/admin/posts',
    PINNED_POSTS: '/admin/posts/pinned',
    REORDER_PINS: '/admin/posts/reorder-pins',
    COMMENTS: '/admin/comments',
    REPORTS: '/admin/reports',
    CATEGORIES: '/admin/categories',
    TAGS: '/admin/tags',
    AUDIT_LOGS: '/admin/audit-logs',
  },
  USERS: {
    BASE: '/users',
    BY_ID: (id: number | string) => `/users/${id}`,
    BY_USERNAME: (username: string) => `/users/username/${username}`,
  },
  POSTS: {
    BASE: '/posts',
    BY_ID: (id: number | string) => `/posts/${id}`,
  },
  COMMENTS: {
    BASE: '/comments',
    BY_ID: (id: number | string) => `/comments/${id}`,
    BY_POST: (postId: number | string) => `/posts/${postId}/comments`,
  },
  CATEGORIES: {
    BASE: '/categories',
    BY_ID: (id: number | string) => `/categories/${id}`,
  },
  TAGS: {
    BASE: '/tags',
    BY_ID: (id: number | string) => `/tags/${id}`,
  },
  REPORTS: {
    BASE: '/reports',
    BY_ID: (id: number | string) => `/reports/${id}`,
  },
};
