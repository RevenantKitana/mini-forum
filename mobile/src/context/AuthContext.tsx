import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { User } from '../types';
import { STORAGE_KEYS, getDefaultApiUrl } from '../config/constants';
import { setClientApiUrl, setClientToken, initApiConfig } from '../api/client';
import { authService } from '../api/services';

interface AuthContextType {
  user: User | null;
  token: string | null;
  apiUrl: string;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: { username?: string; email?: string; password: string }) => Promise<void>;
  register: (data: { username: string; email: string; password: string; displayName: string }) => Promise<void>;
  logout: () => Promise<void>;
  updateApiUrl: (url: string) => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const normalizeUser = (u: any): User => {
  if (!u) return u;
  return {
    ...u,
    displayName: u.displayName || u.display_name || u.username || 'User',
    avatarUrl: u.avatarUrl || u.avatar_preview_url || u.avatar_standard_url || null,
  };
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [apiUrl, setApiUrlState] = useState<string>(getDefaultApiUrl());
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Load saved storage on start
  useEffect(() => {
    const bootstrap = async () => {
      try {
        await initApiConfig();
        const savedUrl = await AsyncStorage.getItem(STORAGE_KEYS.API_URL);
        if (savedUrl) {
          setApiUrlState(savedUrl);
          setClientApiUrl(savedUrl);
        }

        const savedToken = await AsyncStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
        const savedUser = await AsyncStorage.getItem(STORAGE_KEYS.USER_DATA);

        if (savedToken) {
          setToken(savedToken);
          setClientToken(savedToken);
          if (savedUser) {
            setUser(normalizeUser(JSON.parse(savedUser)));
          }
          // Refresh user data from server
          try {
            const meRes = await authService.getMe();
            if (meRes.success && meRes.data) {
              const freshUser = normalizeUser(meRes.data);
              setUser(freshUser);
              await AsyncStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(freshUser));
            }
          } catch (e: any) {
            console.log('Failed to refresh user profile:', e?.message || e);
            if (e?.response?.status === 401) {
              setUser(null);
              setToken(null);
              setClientToken(null);
              await AsyncStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
              await AsyncStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
              await AsyncStorage.removeItem(STORAGE_KEYS.USER_DATA);
            }
          }
        }
      } catch (err) {
        console.error('Auth bootstrap error:', err);
      } finally {
        setIsLoading(false);
      }
    };

    bootstrap();
  }, []);

  const login = async (credentials: { identifier?: string; username?: string; email?: string; password: string }) => {
    const res = await authService.login(credentials);
    if (res.success && res.data) {
      const userData = normalizeUser(res.data.user);
      const accessToken = res.data.accessToken || (res.data as any).tokens?.accessToken;
      const refreshToken = res.data.refreshToken || (res.data as any).tokens?.refreshToken;

      if (!accessToken) {
        throw new Error('Không nhận được Access Token từ máy chủ');
      }

      setUser(userData);
      setToken(accessToken);
      setClientToken(accessToken);

      await AsyncStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, accessToken);
      if (refreshToken) {
        await AsyncStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, refreshToken);
      }
      await AsyncStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(userData));
    } else {
      throw new Error(res.message || 'Đăng nhập thất bại');
    }
  };

  const register = async (data: { username: string; email: string; password: string; displayName: string }) => {
    const res = await authService.register(data);
    if (res.success && res.data) {
      const userData = normalizeUser(res.data.user);
      const accessToken = res.data.accessToken || (res.data as any).tokens?.accessToken;
      const refreshToken = res.data.refreshToken || (res.data as any).tokens?.refreshToken;

      if (!accessToken) {
        throw new Error('Không nhận được Access Token từ máy chủ');
      }

      setUser(userData);
      setToken(accessToken);
      setClientToken(accessToken);

      await AsyncStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, accessToken);
      if (refreshToken) {
        await AsyncStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, refreshToken);
      }
      await AsyncStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(userData));
    } else {
      throw new Error(res.message || 'Đăng ký thất bại');
    }
  };

  const logout = async () => {
    try {
      await authService.logout();
    } catch {
      // Ignore
    } finally {
      setUser(null);
      setToken(null);
      setClientToken(null);
      await AsyncStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
      await AsyncStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
      await AsyncStorage.removeItem(STORAGE_KEYS.USER_DATA);
    }
  };

  const updateApiUrl = async (newUrl: string) => {
    const formattedUrl = newUrl.trim().replace(/\/+$/, '');
    setApiUrlState(formattedUrl);
    setClientApiUrl(formattedUrl);
    await AsyncStorage.setItem(STORAGE_KEYS.API_URL, formattedUrl);
  };

  const refreshUser = async () => {
    if (!token) return;
    try {
      const res = await authService.getMe();
      if (res.success && res.data) {
        const freshUser = normalizeUser(res.data);
        setUser(freshUser);
        await AsyncStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(freshUser));
      }
    } catch (err) {
      console.error('Refresh user error:', err);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        apiUrl,
        isAuthenticated: !!token,
        isLoading,
        login,
        register,
        logout,
        updateApiUrl,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
