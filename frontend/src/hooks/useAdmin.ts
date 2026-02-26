import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import adminService, {
  DashboardStats,
  AdminUser,
  AdminReport,
  AdminPost,
  AdminComment,
  PaginatedResponse,
} from '@/api/services/adminService';

// Query keys
export const adminKeys = {
  all: ['admin'] as const,
  dashboard: () => [...adminKeys.all, 'dashboard'] as const,
  users: (params?: any) => [...adminKeys.all, 'users', params] as const,
  userDetail: (id: number) => [...adminKeys.all, 'users', id] as const,
  reports: (params?: any) => [...adminKeys.all, 'reports', params] as const,
  reportDetail: (id: number) => [...adminKeys.all, 'reports', id] as const,
  posts: (params?: any) => [...adminKeys.all, 'posts', params] as const,
  comments: (params?: any) => [...adminKeys.all, 'comments', params] as const,
};

// Dashboard
export function useDashboardStats() {
  return useQuery<DashboardStats>({
    queryKey: adminKeys.dashboard(),
    queryFn: adminService.getDashboardStats,
    staleTime: 1 * 60 * 1000, // 1 minute
  });
}

// Users
export function useAdminUsers(params?: {
  page?: number;
  limit?: number;
  search?: string;
  role?: string;
  status?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}) {
  return useQuery<PaginatedResponse<AdminUser>>({
    queryKey: adminKeys.users(params),
    queryFn: () => adminService.getUsers(params),
  });
}

export function useAdminUserDetail(id: number) {
  return useQuery({
    queryKey: adminKeys.userDetail(id),
    queryFn: () => adminService.getUserDetail(id),
    enabled: !!id,
  });
}

export function useChangeUserRole() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, role }: { id: number; role: string }) =>
      adminService.changeUserRole(id, role),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.users() });
    },
  });
}

export function useChangeUserStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, isActive }: { id: number; isActive: boolean }) =>
      adminService.changeUserStatus(id, isActive),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.users() });
    },
  });
}

export function useDeleteUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => adminService.deleteUser(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.users() });
    },
  });
}

// Reports
export function useAdminReports(params?: {
  page?: number;
  limit?: number;
  status?: string;
  targetType?: string;
}) {
  return useQuery<PaginatedResponse<AdminReport>>({
    queryKey: adminKeys.reports(params),
    queryFn: () => adminService.getReports(params),
  });
}

export function useAdminReportDetail(id: number) {
  return useQuery({
    queryKey: adminKeys.reportDetail(id),
    queryFn: () => adminService.getReportDetail(id),
    enabled: !!id,
  });
}

export function useUpdateReportStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      status,
      action,
    }: {
      id: number;
      status: string;
      action?: string;
    }) => adminService.updateReportStatus(id, status, action),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.reports() });
      queryClient.invalidateQueries({ queryKey: adminKeys.dashboard() });
    },
  });
}

// Posts
export function useAdminPosts(params?: {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  categoryId?: number;
}) {
  return useQuery<PaginatedResponse<AdminPost>>({
    queryKey: adminKeys.posts(params),
    queryFn: () => adminService.getPosts(params),
  });
}

export function useUpdatePostStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) =>
      adminService.updatePostStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.posts() });
    },
  });
}

// Comments
export function useAdminComments(params?: {
  page?: number;
  limit?: number;
  status?: string;
}) {
  return useQuery<PaginatedResponse<AdminComment>>({
    queryKey: adminKeys.comments(params),
    queryFn: () => adminService.getComments(params),
  });
}

export function useUpdateCommentStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) =>
      adminService.updateCommentStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.comments() });
    },
  });
}
