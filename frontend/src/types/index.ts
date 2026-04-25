// Types cho Forum Application

export type UserRole = 'MEMBER' | 'MODERATOR' | 'ADMIN' | 'BOT';

export type NotificationType = 'COMMENT' | 'REPLY' | 'UPVOTE' | 'MENTION' | 'SYSTEM';

export interface User {
  id: number;
  username: string;
  display_name: string | null;
  email: string;
  avatar?: string;
  /** @deprecated — legacy fallback only. Use avatar_preview_url / avatar_standard_url via getAvatarUrl() helper. */
  avatar_url?: string | null;
  avatar_preview_url?: string | null;
  avatar_standard_url?: string | null;
  role: UserRole | string;
  bio?: string | null;
  date_of_birth?: string | null;
  gender?: 'male' | 'female' | 'other' | null;
  reputation: number;
  is_verified?: boolean;
  is_active?: boolean;
  created_at: string;
  updated_at?: string;
}

export interface Category {
  id: number;
  name: string;
  slug: string;
  description: string;
  color?: string | null;
  icon?: string | null;
  sort_order?: number;
  post_count: number;
  view_count?: number;
  comment_count?: number;
  is_active?: boolean;
  view_permission?: 'ALL' | 'MEMBER' | 'MODERATOR' | 'ADMIN';
  post_permission?: 'ALL' | 'MEMBER' | 'MODERATOR' | 'ADMIN';
  comment_permission?: 'ALL' | 'MEMBER' | 'MODERATOR' | 'ADMIN';
  created_at?: string;
  updated_at?: string;
}

export interface Tag {
  id: number;
  name: string;
  slug: string;
  description?: string;
  usage_count?: number;
  use_permission?: 'ALL' | 'MEMBER' | 'MODERATOR' | 'ADMIN';
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface Post {
  id: number;
  title: string;
  slug: string;
  content: string;
  excerpt?: string | null;
  author_id: number;
  author?: User;
  category_id: number;
  category?: Category;
  tags: Tag[];
  view_count: number;
  upvote_count: number;
  downvote_count: number;
  comment_count: number;
  status: 'DRAFT' | 'PUBLISHED' | 'HIDDEN' | 'DELETED';
  is_locked: boolean;
  is_pinned: boolean;
  pin_type?: 'GLOBAL' | 'CATEGORY' | null;
  created_at: string;
  updated_at: string;
}

export interface Comment {
  id: number;
  content: string;
  post_id: number;
  author_id: number;
  author?: User;
  parent_id?: number | null;
  quoted_comment_id?: number | null;
  quoted_comment?: {
    id: number;
    content: string;
    author?: User;
  } | null;
  replies?: Comment[];
  upvote_count: number;
  downvote_count: number;
  status: 'VISIBLE' | 'HIDDEN' | 'DELETED';
  is_edited?: boolean;
  _count?: {
    replies: number;
  };
  created_at: string;
  updated_at: string;
}

export interface Vote {
  id: number;
  user_id: number;
  target_id: number;
  target_type: 'POST' | 'COMMENT';
  value: 1 | -1; // 1 for upvote, -1 for downvote
  created_at: string;
}

export interface Bookmark {
  id: number;
  user_id: number;
  post_id: number;
  created_at: string;
}

export interface Notification {
  id: number;
  user_id: number;
  type: NotificationType;
  title: string;
  content: string;
  related_id?: number | null;
  related_type?: string | null;
  is_read: boolean;
  created_at: string;
  // Enriched navigation info
  post_id?: number | null;
  comment_id?: number | null;
}

// API Response types
export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Form types
export interface LoginFormData {
  email: string;
  password: string;
}

export interface RegisterFormData {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export interface PostFormData {
  title: string;
  content: string;
  category_id: string;
  tags: string[];
}

export interface CommentFormData {
  content: string;
  parent_id?: string;
}

export interface ProfileFormData {
  display_name: string;
  bio: string;
  date_of_birth?: string;
  gender?: 'male' | 'female' | 'other';
}
