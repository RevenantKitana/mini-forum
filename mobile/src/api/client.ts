import axios, { AxiosInstance } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getDefaultApiUrl, STORAGE_KEYS } from '../config/constants';

let currentApiUrl = getDefaultApiUrl();
let authToken: string | null = null;

export const setClientToken = (token: string | null) => {
  authToken = token;
};

export const setClientApiUrl = (url: string) => {
  currentApiUrl = url;
  api.defaults.baseURL = url;
};

export const getClientApiUrl = () => currentApiUrl;

export const api: AxiosInstance = axios.create({
  baseURL: currentApiUrl,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

// Initialize from storage
export const initApiConfig = async () => {
  try {
    const savedUrl = await AsyncStorage.getItem(STORAGE_KEYS.API_URL);
    if (savedUrl) {
      currentApiUrl = savedUrl;
      api.defaults.baseURL = savedUrl;
    }
    const savedToken = await AsyncStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
    if (savedToken && savedToken !== 'undefined' && savedToken !== 'null') {
      authToken = savedToken;
    }
  } catch (err) {
    console.error('Failed to init API config:', err);
  }
};

// Request Interceptor: Always attach Bearer token if present
api.interceptors.request.use(
  async (config) => {
    let token = authToken;
    if (!token) {
      token = await AsyncStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
    }

    if (token && token !== 'undefined' && token !== 'null') {
      if (config.headers && typeof config.headers.set === 'function') {
        config.headers.set('Authorization', `Bearer ${token}`);
      } else if (config.headers) {
        config.headers['Authorization'] = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // 401 Unauthorized - token expired or invalid
      authToken = null;
    }
    return Promise.reject(error);
  }
);
