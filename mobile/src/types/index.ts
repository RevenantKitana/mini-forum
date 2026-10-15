export type Role = 'MEMBER' | 'MODERATOR' | 'ADMIN' | 'BOT';

export interface User {
  id: number;
  username: string;
  email: string;
  displayName: string;
  avatarUrl?: string | null;
  role: Role;
  bio?: string | null;
  createdAt: string;
  updatedAt?: string;
  _count?: {
    posts?: number;
    comments?: number;
  };
}

export interface Category {
  id: number;
  name: string;
  slug: string;
  description?: string | null;
  color?: string | null;
  icon?: string | null;
  postCount?: number;
}

export interface Tag {
  id: number;
  name: string;
  slug: string;
  description?: string | null;
  postCount?: number;
}

export interface Post {
  id: number;
  title: string;
  slug: string;
  content: string;
  authorId: number;
  author: User;
  categoryId: number;
  category: Category;
  tags?: { tag: Tag }[] | Tag[];
  viewCount: number;
  voteScore: number;
  commentCount: number;
  pinned: boolean;
  status: 'PUBLISHED' | 'DRAFT' | 'LOCKED' | 'ARCHIVED';
  userVote?: 'UP' | 'DOWN' | null;
  isBookmarked?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Comment {
  id: number;
  content: string;
  postId: number;
  authorId: number;
  author: User;
  parentId?: number | null;
  replies?: Comment[];
  voteScore: number;
  userVote?: 'UP' | 'DOWN' | null;
  createdAt: string;
  updatedAt: string;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
  pagination?: PaginationMeta;
}

export interface LoginResponse {
  user: User;
  accessToken: string;
  refreshToken?: string;
  tokens?: {
    accessToken: string;
    refreshToken?: string;
  };
}
