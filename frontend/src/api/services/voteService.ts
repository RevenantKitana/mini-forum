import apiClient from '../axios';
import { API_ENDPOINTS } from '../endpoints';

// Types
export interface VoteResult {
  action: 'created' | 'changed' | 'removed';
  voteType: 'up' | 'down' | null;
}

export interface VoteStatus {
  hasVoted: boolean;
  voteType: 'up' | 'down' | null;
}

export interface VoteHistoryItem {
  id: number;
  targetType: 'POST' | 'COMMENT';
  targetId: number;
  voteType: 'upvote' | 'downvote';
  createdAt: string;
  target: {
    title?: string;
    slug?: string;
    content?: string;
    author: {
      id: number;
      username: string;
      displayName: string | null;
      avatarUrl: string | null;
    } | null;
    post?: {
      id: number;
      title: string;
      slug: string;
    };
  } | null;
}

export interface VoteHistoryResponse {
  data: VoteHistoryItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

/**
 * Vote on a post
 */
export async function votePost(postId: number, voteType: 'up' | 'down'): Promise<VoteResult> {
  const response = await apiClient.post<ApiResponse<VoteResult>>(
    API_ENDPOINTS.VOTES.POST(postId),
    { voteType }
  );
  return response.data.data;
}

/**
 * Remove vote from a post
 */
export async function removePostVote(postId: number): Promise<void> {
  await apiClient.delete(API_ENDPOINTS.VOTES.POST(postId));
}

/**
 * Get user's vote on a post
 */
export async function getPostVote(postId: number): Promise<VoteStatus> {
  const response = await apiClient.get<ApiResponse<VoteStatus>>(
    API_ENDPOINTS.VOTES.POST(postId)
  );
  return response.data.data;
}

/**
 * Vote on a comment
 */
export async function voteComment(commentId: number, voteType: 'up' | 'down'): Promise<VoteResult> {
  const response = await apiClient.post<ApiResponse<VoteResult>>(
    API_ENDPOINTS.VOTES.COMMENT(commentId),
    { voteType }
  );
  return response.data.data;
}

/**
 * Remove vote from a comment
 */
export async function removeCommentVote(commentId: number): Promise<void> {
  await apiClient.delete(API_ENDPOINTS.VOTES.COMMENT(commentId));
}

/**
 * Get user's vote on a comment
 */
export async function getCommentVote(commentId: number): Promise<VoteStatus> {
  const response = await apiClient.get<ApiResponse<VoteStatus>>(
    API_ENDPOINTS.VOTES.COMMENT(commentId)
  );
  return response.data.data;
}

/**
 * Get current user's vote history (private)
 */
export async function getMyVoteHistory(options: {
  page?: number;
  limit?: number;
  targetType?: 'POST' | 'COMMENT';
  voteType?: 'up' | 'down';
} = {}): Promise<VoteHistoryResponse> {
  const params = new URLSearchParams();
  if (options.page) params.append('page', options.page.toString());
  if (options.limit) params.append('limit', options.limit.toString());
  if (options.targetType) params.append('targetType', options.targetType);
  if (options.voteType) params.append('voteType', options.voteType);

  const response = await apiClient.get<ApiResponse<VoteHistoryItem[]>>(
    `/users/me/votes?${params.toString()}`
  );
  return {
    data: response.data.data,
    pagination: response.data.pagination!,
  };
}
