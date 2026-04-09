// API Endpoints configuration

export const API_ENDPOINTS = {
  // Auth
  AUTH: {
    REGISTER: '/auth/register',
    LOGIN: '/auth/login',
    LOGOUT: '/auth/logout',
    REFRESH: '/auth/refresh',
    ME: '/auth/me',
    LOGOUT_ALL: '/auth/logout-all',
    CHECK_EMAIL: '/auth/check-email',
    CHECK_USERNAME: '/auth/check-username',
    SEND_OTP_REGISTER: '/auth/send-otp-register',
    VERIFY_OTP_REGISTER: '/auth/verify-otp-register',
    SEND_OTP_RESET: '/auth/send-otp-reset',
    VERIFY_OTP_RESET: '/auth/verify-otp-reset',
    RESET_PASSWORD: '/auth/reset-password',
  },
  
  // Users
  USERS: {
    BASE: '/users',
    BY_ID: (id: string | number) => `/users/${id}`,
    BY_USERNAME: (username: string) => `/users/username/${username}`,
    PROFILE: '/users/profile',
  },
  
  // Posts
  POSTS: {
    BASE: '/posts',
    BY_ID: (id: string | number) => `/posts/${id}`,
    BY_USER: (userId: string | number) => `/users/${userId}/posts`,
    RELATED: (id: string | number) => `/posts/${id}/related`,
  },
  
  // Comments
  COMMENTS: {
    BASE: '/comments',
    BY_POST: (postId: string | number) => `/posts/${postId}/comments`,
    BY_ID: (id: string | number) => `/comments/${id}`,
  },
  
  // Categories
  CATEGORIES: {
    BASE: '/categories',
    BY_ID: (id: string | number) => `/categories/${id}`,
    BY_SLUG: (slug: string) => `/categories/slug/${slug}`,
  },
  
  // Tags
  TAGS: {
    BASE: '/tags',
    BY_ID: (id: string | number) => `/tags/${id}`,
    BY_SLUG: (slug: string) => `/tags/slug/${slug}`,
  },
  
  // Votes
  VOTES: {
    POST: (postId: string | number) => `/posts/${postId}/vote`,
    COMMENT: (commentId: string | number) => `/comments/${commentId}/vote`,
  },
  
  // Bookmarks
  BOOKMARKS: {
    BASE: '/bookmarks',
    BY_POST: (postId: string | number) => `/posts/${postId}/bookmark`,
  },
  
  // Notifications
  NOTIFICATIONS: {
    BASE: '/notifications',
    MARK_READ: '/notifications/read',
    MARK_ALL_READ: '/notifications/read-all',
  },
  
  // Health
  HEALTH: '/health',
} as const;
