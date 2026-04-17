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
    METRICS: '/admin/metrics',
  },
};
