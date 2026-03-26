// Types cho Forum Application

export type UserRole = 'MEMBER' | 'MODERATOR' | 'ADMIN' | 'BOT';

export type NotificationType = 'COMMENT' | 'REPLY' | 'UPVOTE' | 'MENTION' | 'SYSTEM';

export interface User {
  id: number;
  username: string;
  displayName: string | null;
  email: string;
  avatar?: string;
  avatarUrl?: string | null;
  role: UserRole | string;
  bio?: string | null;
  dateOfBirth?: string | null;
  gender?: 'male' | 'female' | 'other' | null;
  reputation: number;
  isVerified?: boolean;
  isActive?: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface Category {
  id: number;
  name: string;
  slug: string;
  description: string;
  color?: string | null;
  sortOrder?: number;
  postCount: number;
  isActive?: boolean;
  viewPermission?: 'ALL' | 'MEMBER' | 'MODERATOR' | 'ADMIN';
  postPermission?: 'ALL' | 'MEMBER' | 'MODERATOR' | 'ADMIN';
  commentPermission?: 'ALL' | 'MEMBER' | 'MODERATOR' | 'ADMIN';
  createdAt?: string;
  updatedAt?: string;
}

export interface Tag {
  id: number;
  name: string;
  slug: string;
  description?: string;
  usageCount?: number;
  usePermission?: 'ALL' | 'MEMBER' | 'MODERATOR' | 'ADMIN';
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface Post {
  id: number;
  title: string;
  slug: string;
  content: string;
  excerpt?: string | null;
  authorId: number;
  author?: User;
  categoryId: number;
  category?: Category;
  tags: Tag[];
  viewCount: number;
  upvoteCount: number;
  downvoteCount: number;
  commentCount: number;
  status: 'DRAFT' | 'PUBLISHED' | 'HIDDEN' | 'DELETED';
  isLocked: boolean;
  isPinned: boolean;
  pinType?: 'GLOBAL' | 'CATEGORY' | null;
  createdAt: string;
  updatedAt: string;
}

export interface Comment {
  id: number;
  content: string;
  postId: number;
  authorId: number;
  author?: User;
  parentId?: number | null;
  quotedCommentId?: number | null;
  quotedComment?: {
    id: number;
    content: string;
    author?: User;
  } | null;
  replies?: Comment[];
  upvoteCount: number;
  downvoteCount: number;
  status: 'VISIBLE' | 'HIDDEN' | 'DELETED';
  isEdited?: boolean;
  _count?: {
    replies: number;
  };
  createdAt: string;
  updatedAt: string;
}

export interface Vote {
  id: number;
  userId: number;
  targetId: number;
  targetType: 'POST' | 'COMMENT';
  value: 1 | -1; // 1 for upvote, -1 for downvote
  createdAt: string;
}

export interface Bookmark {
  id: number;
  userId: number;
  postId: number;
  createdAt: string;
}

export interface Notification {
  id: number;
  userId: number;
  type: NotificationType;
  title: string;
  content: string;
  relatedId?: number | null;
  relatedType?: string | null;
  isRead: boolean;
  createdAt: string;
  // Enriched navigation info
  postId?: number | null;
  commentId?: number | null;
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
  categoryId: string;
  tags: string[];
}

export interface CommentFormData {
  content: string;
  parentId?: string;
}

export interface ProfileFormData {
  displayName: string;
  bio: string;
  dateOfBirth?: string;
  gender?: 'male' | 'female' | 'other';
}
