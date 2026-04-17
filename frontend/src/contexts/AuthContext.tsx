import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import * as authApi from '@/api/services/authService';
import * as userService from '@/api/services/userService';
import { getAccessToken, clearTokens } from '@/api/axios';
import { trackConversion } from '@/utils/analytics';

export interface User {
  id: number;
  username: string;
  displayName: string | null;
  email: string;
  avatarUrl?: string | null;
  role: string;
  bio?: string | null;
  dateOfBirth?: string | null;
  gender?: 'male' | 'female' | 'other' | null;
  reputation: number;
  isVerified?: boolean;
  isActive?: boolean;
  createdAt: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string, displayName?: string, registrationToken?: string) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (data: Partial<User>) => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const STORAGE_KEY = 'forum_auth_user';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Transform API user to local user format
  const transformUser = (apiUser: authApi.AuthUser): User => ({
    id: apiUser.id,
    username: apiUser.username,
    displayName: apiUser.displayName,
    email: apiUser.email,
    avatarUrl: apiUser.avatarUrl,
    bio: apiUser.bio,
    dateOfBirth: apiUser.dateOfBirth,
    gender: apiUser.gender,
    role: apiUser.role,
    reputation: apiUser.reputation,
    isVerified: apiUser.isVerified,
    isActive: apiUser.isActive,
    createdAt: apiUser.createdAt,
  });

  // Load user on mount
  useEffect(() => {
    const initAuth = async () => {
      try {
        const token = getAccessToken();
        if (token) {
          try {
            const apiUser = await authApi.getCurrentUser();
            const userData = transformUser(apiUser);
            setUser(userData);
            localStorage.setItem(STORAGE_KEY, JSON.stringify(userData));
          } catch (apiError: any) {
            // If 401 (Unauthorized), silently clear tokens - this is expected for expired/invalid tokens
            if (apiError?.response?.status === 401) {
              clearTokens();
              localStorage.removeItem(STORAGE_KEY);
              // Don't log error - this is expected behavior
            } else if (apiError?.response?.status === 429) {
              // If 429 (rate limited), try to recover from localStorage
              console.warn('Rate limited during auth init, using cached user data');
              const cached = localStorage.getItem(STORAGE_KEY);
              if (cached) {
                setUser(JSON.parse(cached));
              } else {
                clearTokens();
              }
            } else {
              // Other errors - clear auth and log
              throw apiError;
            }
          }
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
        clearTokens();
        localStorage.removeItem(STORAGE_KEY);
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();
  }, []);

  // Save user to localStorage when it changes
  useEffect(() => {
    if (user) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, [user]);

  const login = async (identifier: string, password: string) => {
    const apiUser = await authApi.login({ identifier, password });
    const userData = transformUser(apiUser);
    setUser(userData);
    trackConversion('login');
  };

  const register = async (username: string, email: string, password: string, displayName?: string, registrationToken?: string) => {
    const apiUser = await authApi.register({ email, username, password, displayName, registrationToken });
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
      display_name: data.displayName ?? undefined,
      bio: data.bio ?? undefined,
      date_of_birth: data.dateOfBirth ?? undefined,
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
