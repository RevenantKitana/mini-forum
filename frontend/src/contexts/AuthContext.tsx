import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import * as authApi from '@/api/services/authService';
import * as userService from '@/api/services/userService';
import { getAccessToken, setAccessToken, clearTokens } from '@/api/axios';
import { trackConversion } from '@/utils/analytics';

export interface User {
  id: number;
  username: string;
  display_name: string | null;
  avatar_preview_url?: string | null;
  avatar_standard_url?: string | null;
  role: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string, displayName?: string, registrationToken?: string) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (data: Partial<userService.UpdateProfileData>) => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Transform API user to local user format
  const transformUser = (apiUser: authApi.AuthUser): User => ({
    id: apiUser.id,
    username: apiUser.username,
    display_name: apiUser.display_name,
    avatar_preview_url: apiUser.avatar_preview_url,
    avatar_standard_url: apiUser.avatar_standard_url,
    role: apiUser.role,
  });

  // Silent Refresh on App Init
  useEffect(() => {
    const initAuth = async () => {
      try {
        // 1. Silent Refresh using HttpOnly Cookie to get fresh Access Token in RAM
        const refreshData = await authApi.refreshToken();
        if (refreshData?.accessToken) {
          setAccessToken(refreshData.accessToken);
          // 2. Fetch current user profile into RAM
          const apiUser = await authApi.getCurrentUser();
          const userData = transformUser(apiUser);
          setUser(userData);
        } else {
          clearTokens();
          setUser(null);
        }
      } catch (error) {
        // Normal failure when unauthenticated (guest or expired session)
        clearTokens();
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();
  }, []);

  const login = async (identifier: string, password: string) => {
    const apiUser = await authApi.login({ identifier, password });
    const userData = transformUser(apiUser);
    setUser(userData);
    trackConversion('login');
  };

  const register = async (username: string, email: string, password: string, displayName?: string, registrationToken?: string) => {
    const apiUser = await authApi.register({ email, username, password, display_name: displayName, registrationToken });
    const userData = transformUser(apiUser);
    setUser(userData);
    trackConversion('register');
  };

  const logout = useCallback(async () => {
    await authApi.logout();
    clearTokens();
    setUser(null);
  }, []);

  const updateProfile = async (data: Partial<User>) => {
    if (!user) {
      throw new Error('No user logged in');
    }

    const updateData: userService.UpdateProfileData = {
      display_name: data.display_name ?? undefined,
      bio: data.bio ?? undefined,
      date_of_birth: data.date_of_birth ?? undefined,
      gender: data.gender ?? undefined,
    };
    await userService.updateProfile(user.id as number, updateData);
    // Refresh user data from server
    await refreshUser();
  };

  const refreshUser = useCallback(async () => {
    try {
      const apiUser = await authApi.getCurrentUser();
      const userData = transformUser(apiUser);
      setUser(userData);
    } catch (error) {
      console.error('Error refreshing user:', error);
      await logout();
    }
  }, [logout]);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        register,
        logout,
        updateProfile,
        refreshUser,
      }}
    >
      <InvalidationHandler user={user} />
      {children}
    </AuthContext.Provider>
  );
}

/**
 * Internal component to handle React Query invalidation when auth state changes
 * This ensures users don't see cached data from previous user sessions
 * Fixes permission/cache issue where guest users could see admin-cached posts
 */
function InvalidationHandler({ user }: { user: User | null }) {
  const queryClient = useQueryClient();

  useEffect(() => {
    // When user login/logout status or role changes, invalidate all posts-related queries
    // This prevents showing cached data from another user's session
    // Especially important for permission-based content (viewPermission filters)
    queryClient.invalidateQueries({ queryKey: ['posts'] });
    queryClient.invalidateQueries({ queryKey: ['search'] });
    queryClient.invalidateQueries({ queryKey: ['bookmarks'] });
    queryClient.invalidateQueries({ queryKey: ['comments'] });
    queryClient.invalidateQueries({ queryKey: ['categories'] });
  }, [user?.id, user?.role, queryClient]);

  return null;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
