import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as userService from '@/api/services/userService';
import { UpdateProfileData, ChangePasswordData } from '@/api/services/userService';
import { useAuth } from '@/contexts/AuthContext';

/**
 * Hook to get user by ID
 */
export function useUser(userId: number, enabled = true) {
  return useQuery({
    queryKey: ['user', userId],
    queryFn: () => userService.getUserById(userId),
    enabled,
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Hook to get user by username
 */
export function useUserByUsername(username: string, enabled = true) {
  return useQuery({
    queryKey: ['user', 'username', username],
    queryFn: async () => {
      const data = await userService.getUserByUsername(username);
      return { data };
    },
    enabled: enabled && !!username,
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Hook to get user's posts
 */
export function useUserPosts(userId: number, page = 1, limit = 10, enabled = true) {
  return useQuery({
    queryKey: ['userPosts', userId, page, limit],
    queryFn: () => userService.getUserPosts(userId, page, limit),
    enabled,
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Hook to get user's comments
 */
export function useUserComments(userId: number, page = 1, limit = 10, enabled = true) {
  return useQuery({
    queryKey: ['userComments', userId, page, limit],
    queryFn: () => userService.getUserComments(userId, page, limit),
    enabled,
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Hook to update profile (current user)
 */
export function useUpdateProfile() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: (data: UpdateProfileData) => {
      if (!user) throw new Error('User not authenticated');
      return userService.updateProfile(user.id, data);
    },
    onSuccess: () => {
      if (user) {
        queryClient.invalidateQueries({ queryKey: ['user', user.id] });
        queryClient.invalidateQueries({ queryKey: ['user', 'username', user.username] });
      }
    },
  });
}

/**
 * Hook to change username
 */
export function useChangeUsername() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ userId, username }: { userId: number; username: string }) =>
      userService.changeUsername(userId, username),
    onSuccess: (_, { userId }) => {
      queryClient.invalidateQueries({ queryKey: ['user', userId] });
    },
  });
}

/**
 * Hook to change password (current user)
 */
export function useChangePassword() {
  const { user } = useAuth();

  return useMutation({
    mutationFn: (data: { currentPassword: string; newPassword: string }) => {
      if (!user) throw new Error('User not authenticated');
      return userService.changePassword(user.id, {
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
        confirmPassword: data.newPassword,
      });
    },
  });
}

/**
 * Hook to update avatar (current user)
 */
export function useUpdateAvatar() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: (data: { avatar_url: string }) => {
      if (!user) throw new Error('User not authenticated');
      return userService.updateAvatar(user.id, data.avatar_url);
    },
    onSuccess: () => {
      if (user) {
        queryClient.invalidateQueries({ queryKey: ['user', user.id] });
        queryClient.invalidateQueries({ queryKey: ['user', 'username', user.username] });
      }
    },
  });
}
