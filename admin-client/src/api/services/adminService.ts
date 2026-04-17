import apiClient from '../axios';
import { API_ENDPOINTS } from '../endpoints';

// ========================================
// TYPES
// ========================================

export interface DashboardStats {
  overview: {
    totalUsers: number;
    totalPosts: number;
    totalComments: number;
    publishedPosts: number;
    activeUsers: number;
    pendingReports: number;
    pinnedPostsCount?: number;
  };
  dateRange: {
    startDate: string;
    endDate: string;
    newUsers: number;
    newPosts: number;
    newComments: number;
  };
  usersByRole: {
    MEMBER: number;
    MODERATOR: number;
    ADMIN: number;
    BOT: number;
  };
  topCategories: Array<{
    id: number;
    name: string;
    slug: string;
    postCount: number;
    color: string | null;
  }>;
  recentActivities: Array<{
    type: 'USER_REGISTERED' | 'POST_CREATED' | 'COMMENT_CREATED';
    data: any;
    createdAt: string;
  }>;
}

export interface User {
  id: number;
  email: string;
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
  role: string;
  reputation: number;
  isVerified: boolean;
  isActive: boolean;
  lastActiveAt: string | null;
  createdAt: string;
  updatedAt: string;
  _count?: {
    posts: number;
    comments: number;
  };
}

export interface Post {
  id: number;
  title: string;
  slug: string;
  content?: string;
  status: string;
  isPinned: boolean;
  pinType?: 'GLOBAL' | 'CATEGORY' | null;
  isLocked: boolean;
  viewCount: number;
  upvoteCount: number;
  downvoteCount: number;
  commentCount: number;
  createdAt: string;
  updatedAt: string;
  author: {
    id: number;
    username: string;
    displayName: string | null;
    avatarUrl?: string | null;
  };
  category: {
    id: number;
    name: string;
    slug: string;
  } | null;
}

export interface Comment {
  id: number;
  content: string;
  status: string;
  isContentMasked?: boolean;
  upvoteCount: number;
  downvoteCount: number;
  createdAt: string;
  updatedAt: string;
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

export interface Report {
  id: number;
  targetType: string;
  targetId: number;
  reason: string;
  description: string | null;
  status: string;
  createdAt: string;
  reporter: {
    id: number;
    username: string;
    displayName?: string | null;
    avatarUrl?: string | null;
  };
  target?: any;
  reviewer?: {
    id: number;
    username: string;
  } | null;
  reviewedAt?: string | null;
  reviewNote?: string | null;
}

export interface Category {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  color: string | null;
  sortOrder: number;
  postCount: number;
  actualPostCount?: number;
  isActive: boolean;
  viewPermission?: 'ALL' | 'MEMBER' | 'MODERATOR' | 'ADMIN';
  postPermission?: 'ALL' | 'MEMBER' | 'MODERATOR' | 'ADMIN';
  commentPermission?: 'ALL' | 'MEMBER' | 'MODERATOR' | 'ADMIN';
  createdAt: string;
  updatedAt: string;
}

export interface Tag {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  usageCount: number;
  actualUsageCount?: number;
  postCount: number;
  usePermission?: 'ALL' | 'MEMBER' | 'MODERATOR' | 'ADMIN';
  isActive?: boolean;
  _count?: {
    posts: number;
  };
  createdAt: string;
  updatedAt: string;
}

export interface AuditLog {
  id: number;
  userId: number;
  action: string;
  targetType: string;
  targetId: number | null;
  targetName: string | null;
  oldValue: any;
  newValue: any;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: string;
  user: {
    id: number;
    username: string;
    displayName: string | null;
    avatarUrl: string | null;
  } | null;
}

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

interface PaginatedResponse<T> {
  success: boolean;
  message: string;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// ========================================
// DASHBOARD
// ========================================

export async function getStats(params?: {
  startDate?: string;
  endDate?: string;
}): Promise<DashboardStats> {
  const response = await apiClient.get<ApiResponse<DashboardStats>>(
    API_ENDPOINTS.ADMIN.STATS,
    { params }
  );
  return response.data.data;
}

// ========================================
// USER MANAGEMENT
// ========================================

export async function getUsers(params: {
  page?: number;
  limit?: number;
  search?: string;
  role?: string;
  status?: string;
}): Promise<{ data: User[]; pagination: any }> {
  const response = await apiClient.get<PaginatedResponse<User>>(
    API_ENDPOINTS.ADMIN.USERS,
    { params }
  );
  return {
    data: response.data.data,
    pagination: response.data.pagination,
  };
}

// Note: Generic user update removed - use changeUserRole() or changeUserStatus() instead
// Backend only supports PATCH /admin/users/:id/role and /admin/users/:id/status

export async function changeUserRole(id: number, role: string): Promise<any> {
  const response = await apiClient.patch<ApiResponse<any>>(
    `${API_ENDPOINTS.ADMIN.USERS}/${id}/role`,
    { role }
  );
  return response.data.data;
}

export async function changeUserStatus(id: number, isActive: boolean): Promise<any> {
  const response = await apiClient.patch<ApiResponse<any>>(
    `${API_ENDPOINTS.ADMIN.USERS}/${id}/status`,
    { is_active: isActive }
  );
  return response.data.data;
}

export async function deleteUser(id: number): Promise<void> {
  await apiClient.delete(`${API_ENDPOINTS.ADMIN.USERS}/${id}`);
}

// ========================================
// POST MANAGEMENT
// ========================================

export async function getPosts(params: {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  categoryId?: string;
}): Promise<{ data: Post[]; pagination: any }> {
  // Convert camelCase query params to snake_case for backend
  const queryParams: Record<string, any> = { ...params };
  if (params.categoryId !== undefined) {
    queryParams.category_id = params.categoryId;
    delete queryParams.categoryId;
  }
  const response = await apiClient.get<PaginatedResponse<Post>>(
    API_ENDPOINTS.ADMIN.POSTS,
    { params: queryParams }
  );
  return {
    data: response.data.data,
    pagination: response.data.pagination,
  };
}

export async function updatePostStatus(id: number, status: string): Promise<Post> {
  const response = await apiClient.patch<ApiResponse<Post>>(
    `${API_ENDPOINTS.ADMIN.POSTS}/${id}/status`,
    { status }
  );
  return response.data.data;
}

export async function togglePostPin(id: number): Promise<Post> {
  const response = await apiClient.patch<ApiResponse<Post>>(
    `${API_ENDPOINTS.ADMIN.POSTS}/${id}/pin`
  );
  return response.data.data;
}

export async function pinPost(id: number, pinType: 'GLOBAL' | 'CATEGORY'): Promise<Post> {
  const response = await apiClient.patch<ApiResponse<Post>>(
    `${API_ENDPOINTS.ADMIN.POSTS}/${id}/pin`,
    { pin_type: pinType }
  );
  return response.data.data;
}

export async function togglePostLock(id: number): Promise<Post> {
  const response = await apiClient.patch<ApiResponse<Post>>(
    `${API_ENDPOINTS.ADMIN.POSTS}/${id}/lock`
  );
  return response.data.data;
}

export async function deletePost(id: number): Promise<void> {
  await apiClient.delete(`${API_ENDPOINTS.ADMIN.POSTS}/${id}`);
}

export interface PinnedPost {
  id: number;
  title: string;
  slug: string;
  pinOrder: number;
  isPinned: boolean;
  viewCount: number;
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
    color: string | null;
  } | null;
}

export async function getPinnedPosts(): Promise<PinnedPost[]> {
  const response = await apiClient.get<ApiResponse<PinnedPost[]>>(
    API_ENDPOINTS.ADMIN.PINNED_POSTS
  );
  return response.data.data;
}

export async function updatePinOrder(id: number, pinOrder: number): Promise<any> {
  const response = await apiClient.patch<ApiResponse<any>>(
    `${API_ENDPOINTS.ADMIN.POSTS}/${id}/pin-order`,
    { pin_order: pinOrder }
  );
  return response.data.data;
}

export async function reorderPinnedPosts(orders: { id: number; pinOrder: number }[]): Promise<void> {
  const snakeOrders = orders.map(o => ({ id: o.id, pin_order: o.pinOrder }));
  await apiClient.patch(API_ENDPOINTS.ADMIN.REORDER_PINS, { orders: snakeOrders });
}

// ========================================
// COMMENT MANAGEMENT
// ========================================

export async function getComments(params: {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
}): Promise<{ data: Comment[]; pagination: any }> {
  const response = await apiClient.get<PaginatedResponse<Comment>>(
    API_ENDPOINTS.ADMIN.COMMENTS,
    { params }
  );
  return {
    data: response.data.data,
    pagination: response.data.pagination,
  };
}

export async function updateCommentStatus(id: number, status: string): Promise<Comment> {
  const response = await apiClient.patch<ApiResponse<Comment>>(
    `${API_ENDPOINTS.ADMIN.COMMENTS}/${id}/status`,
    { status }
  );
  return response.data.data;
}

export async function deleteComment(id: number): Promise<void> {
  await apiClient.delete(`${API_ENDPOINTS.ADMIN.COMMENTS}/${id}`);
}

export async function toggleCommentMask(id: number): Promise<any> {
  const response = await apiClient.patch<ApiResponse<any>>(
    `${API_ENDPOINTS.ADMIN.COMMENTS}/${id}/mask`
  );
  return response.data.data;
}

export async function viewMaskedCommentContent(id: number): Promise<Comment> {
  const response = await apiClient.get<ApiResponse<Comment>>(
    `${API_ENDPOINTS.ADMIN.COMMENTS}/${id}/content`
  );
  return response.data.data;
}

// ========================================
// REPORT MANAGEMENT
// ========================================

export async function getReports(params: {
  page?: number;
  limit?: number;
  status?: string;
  targetType?: string;
}): Promise<{ data: Report[]; pagination: any }> {
  const response = await apiClient.get<PaginatedResponse<Report>>(
    API_ENDPOINTS.ADMIN.REPORTS,
    { params }
  );
  return {
    data: response.data.data,
    pagination: response.data.pagination,
  };
}

export async function reviewReport(
  id: number,
  data: { status: string; action?: string; reviewNote?: string }
): Promise<Report> {
  const payload: Record<string, any> = { status: data.status };
  if (data.action) payload.action = data.action;
  if (data.reviewNote !== undefined) payload.review_note = data.reviewNote;
  const response = await apiClient.patch<ApiResponse<Report>>(
    `${API_ENDPOINTS.ADMIN.REPORTS}/${id}`,
    payload
  );
  return response.data.data;
}

// ========================================
// CATEGORY MANAGEMENT
// ========================================

export async function getCategories(includeInactive = true): Promise<Category[]> {
  const response = await apiClient.get<ApiResponse<Category[]>>(
    API_ENDPOINTS.ADMIN.CATEGORIES,
    { params: { includeInactive } }
  );
  return response.data.data;
}

export async function createCategory(data: {
  name: string;
  description?: string;
  icon?: string;
  color?: string;
  sortOrder?: number;
  isActive?: boolean;
  viewPermission?: 'ALL' | 'MEMBER' | 'MODERATOR' | 'ADMIN';
  postPermission?: 'ALL' | 'MEMBER' | 'MODERATOR' | 'ADMIN';
  commentPermission?: 'ALL' | 'MEMBER' | 'MODERATOR' | 'ADMIN';
}): Promise<Category> {
  const payload: Record<string, any> = { name: data.name };
  if (data.description !== undefined) payload.description = data.description;
  if (data.icon !== undefined) payload.icon = data.icon;
  if (data.color !== undefined) payload.color = data.color;
  if (data.sortOrder !== undefined) payload.sort_order = data.sortOrder;
  if (data.isActive !== undefined) payload.is_active = data.isActive;
  if (data.viewPermission !== undefined) payload.view_permission = data.viewPermission;
  if (data.postPermission !== undefined) payload.post_permission = data.postPermission;
  if (data.commentPermission !== undefined) payload.comment_permission = data.commentPermission;
  const response = await apiClient.post<ApiResponse<Category>>(
    API_ENDPOINTS.ADMIN.CATEGORIES,
    payload
  );
  return response.data.data;
}

export async function updateCategory(
  id: number,
  data: Partial<{
    name: string;
    description: string;
    color: string;
    sortOrder: number;
    isActive: boolean;
    viewPermission: 'ALL' | 'MEMBER' | 'MODERATOR' | 'ADMIN';
    postPermission: 'MEMBER' | 'MODERATOR' | 'ADMIN';
    commentPermission: 'MEMBER' | 'MODERATOR' | 'ADMIN';
  }>
): Promise<Category> {
  const payload: Record<string, any> = {};
  if (data.name !== undefined) payload.name = data.name;
  if (data.description !== undefined) payload.description = data.description;
  if (data.color !== undefined) payload.color = data.color;
  if (data.sortOrder !== undefined) payload.sort_order = data.sortOrder;
  if (data.isActive !== undefined) payload.is_active = data.isActive;
  if (data.viewPermission !== undefined) payload.view_permission = data.viewPermission;
  if (data.postPermission !== undefined) payload.post_permission = data.postPermission;
  if (data.commentPermission !== undefined) payload.comment_permission = data.commentPermission;
  const response = await apiClient.patch<ApiResponse<Category>>(
    `${API_ENDPOINTS.ADMIN.CATEGORIES}/${id}`,
    payload
  );
  return response.data.data;
}

export async function deleteCategory(id: number): Promise<void> {
  await apiClient.delete(`${API_ENDPOINTS.ADMIN.CATEGORIES}/${id}`);
}

// ========================================
// TAG MANAGEMENT
// ========================================

export async function getTags(params?: {
  page?: number;
  limit?: number;
  search?: string;
}): Promise<{ data: Tag[]; pagination: any }> {
  const response = await apiClient.get<PaginatedResponse<Tag>>(
    API_ENDPOINTS.ADMIN.TAGS,
    { params }
  );
  return {
    data: response.data.data,
    pagination: response.data.pagination,
  };
}

export async function createTag(data: {
  name: string;
  description?: string;
  usePermission?: 'MEMBER' | 'MODERATOR' | 'ADMIN';
  isActive?: boolean;
}): Promise<Tag> {
  const payload: Record<string, any> = { name: data.name };
  if (data.description !== undefined) payload.description = data.description;
  if (data.usePermission !== undefined) payload.use_permission = data.usePermission;
  if (data.isActive !== undefined) payload.is_active = data.isActive;
  const response = await apiClient.post<ApiResponse<Tag>>(
    API_ENDPOINTS.ADMIN.TAGS,
    payload
  );
  return response.data.data;
}

export async function updateTag(
  id: number,
  data: Partial<{ name: string; description: string; usePermission: 'MEMBER' | 'MODERATOR' | 'ADMIN'; isActive: boolean }>
): Promise<Tag> {
  const payload: Record<string, any> = {};
  if (data.name !== undefined) payload.name = data.name;
  if (data.description !== undefined) payload.description = data.description;
  if (data.usePermission !== undefined) payload.use_permission = data.usePermission;
  if (data.isActive !== undefined) payload.is_active = data.isActive;
  const response = await apiClient.patch<ApiResponse<Tag>>(
    `${API_ENDPOINTS.ADMIN.TAGS}/${id}`,
    payload
  );
  return response.data.data;
}

export async function deleteTag(id: number): Promise<void> {
  await apiClient.delete(`${API_ENDPOINTS.ADMIN.TAGS}/${id}`);
}

// ========================================
// AUDIT LOGS
// ========================================

export async function getAuditLogs(params?: {
  page?: number;
  limit?: number;
  userId?: number;
  action?: string;
  targetType?: string;
}): Promise<{ data: AuditLog[]; pagination: any }> {
  const response = await apiClient.get<PaginatedResponse<AuditLog>>(
    API_ENDPOINTS.ADMIN.AUDIT_LOGS,
    { params }
  );
  return {
    data: response.data.data,
    pagination: response.data.pagination,
  };
}

// ========================================
// OPERATIONAL METRICS
// ========================================

export interface LatencyBucket {
  p50: number;
  p95: number;
  p99: number;
  avg: number;
  max: number;
  samples: number;
}

export interface MetricsWindow {
  windowStart: number;
  requests: number;
  errors: number;
}

export interface LLMProviderMetrics {
  provider: string;
  model?: string;
  success: number;
  failure: number;
  totalLatencyMs: number;
  retries: number;
  lastUpdated: number;
}

export interface OpsMetrics {
  uptime_s: number;
  total_requests: number;
  total_errors: number;
  error_rate: number;
  throughput_rps: number;
  latency: LatencyBucket;
  windows: MetricsWindow[];
  llm: LLMProviderMetrics[];
  alert_active: boolean;
  alerts: string[];
}

export async function getOpsMetrics(): Promise<OpsMetrics> {
  const response = await apiClient.get<{ data: OpsMetrics }>(API_ENDPOINTS.ADMIN.METRICS);
  return response.data.data;
}

// ========================================
// EXPORT SERVICE OBJECT
// ========================================

export type AdminUser = User;
export type AdminPost = Post;
export type AdminComment = Comment;
export type AdminReport = Report;
export type AdminCategory = Category;
export type AdminTag = Tag;
export type AdminAuditLog = AuditLog;

export const adminService = {
  // Dashboard
  getDashboardStats: getStats,
  
  // Users
  getUsers,
  changeUserRole: (id: string, role: string) => changeUserRole(Number(id), role),
  changeUserStatus: (id: string, isActive: boolean) => changeUserStatus(Number(id), isActive),
  banUser: (id: string) => changeUserStatus(Number(id), false),
  unbanUser: (id: string) => changeUserStatus(Number(id), true),
  deleteUser: (id: string) => deleteUser(Number(id)),
  
  // Posts
  getPosts,
  hidePost: (id: string) => updatePostStatus(Number(id), 'HIDDEN'),
  showPost: (id: string) => updatePostStatus(Number(id), 'PUBLISHED'),
  deletePost: (id: string) => deletePost(Number(id)),
  togglePostPin: (id: string) => togglePostPin(Number(id)),
  pinPost: (id: string, pinType: 'GLOBAL' | 'CATEGORY') => pinPost(Number(id), pinType),
  togglePostLock: (id: string) => togglePostLock(Number(id)),
  getPinnedPosts,
  updatePinOrder: (id: string, pinOrder: number) => updatePinOrder(Number(id), pinOrder),
  reorderPinnedPosts,
  
  // Comments
  getComments,
  hideComment: (id: string) => updateCommentStatus(Number(id), 'HIDDEN'),
  showComment: (id: string) => updateCommentStatus(Number(id), 'VISIBLE'),
  deleteComment: (id: string) => deleteComment(Number(id)),
  toggleCommentMask: (id: string) => toggleCommentMask(Number(id)),
  viewMaskedCommentContent: (id: string) => viewMaskedCommentContent(Number(id)),
  
  // Reports
  getReports,
  reviewReport: (id: string, data: { status: string; action?: string; reviewNote?: string }) => 
    reviewReport(Number(id), data),
  
  // Categories
  getCategories,
  createCategory,
  updateCategory: (id: string, data: any) => updateCategory(Number(id), data),
  deleteCategory: (id: string) => deleteCategory(Number(id)),
  
  // Tags
  getTags,
  createTag,
  updateTag: (id: string, data: any) => updateTag(Number(id), data),
  deleteTag: (id: string) => deleteTag(Number(id)),
  
  // Audit Logs
  getAuditLogs,

  // Operational Metrics
  getOpsMetrics,
};
