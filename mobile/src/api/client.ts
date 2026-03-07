/**
 * Unified API Client
 *
 * Single axios instance for all API requests.
 * Handles auth token injection and global error handling.
 */

import axios, { AxiosError, type AxiosInstance, type AxiosRequestConfig } from 'axios';
import { NativeModules, Platform } from 'react-native';

const DEFAULT_BACKEND_PORT = '5000';
const DEFAULT_API_PATH = '/api';

const getMetroHost = (): string | null => {
  const scriptURL = NativeModules.SourceCode?.scriptURL as string | undefined;
  if (!scriptURL) {
    return null;
  }

  try {
    return new URL(scriptURL).hostname;
  } catch {
    return null;
  }
};

const normalizeApiUrl = (rawUrl?: string): string => {
  const value = rawUrl?.trim();
  const fallbackHost = getMetroHost();

  if (!value) {
    if (fallbackHost) {
      return `http://${fallbackHost}:${DEFAULT_BACKEND_PORT}${DEFAULT_API_PATH}`;
    }

    const host = Platform.OS === 'android' ? '10.0.2.2' : 'localhost';
    return `http://${host}:${DEFAULT_BACKEND_PORT}${DEFAULT_API_PATH}`;
  }

  try {
    const parsed = new URL(value);
    const hostname = parsed.hostname.toLowerCase();

    if ((hostname === 'localhost' || hostname === '127.0.0.1') && fallbackHost) {
      parsed.hostname = fallbackHost;
      parsed.port = parsed.port || DEFAULT_BACKEND_PORT;
      parsed.pathname = parsed.pathname === '/' ? DEFAULT_API_PATH : parsed.pathname;
    }

    return parsed.toString().replace(/\/$/, '');
  } catch {
    return value.replace(/\/$/, '');
  }
};

const API_BASE_URL = normalizeApiUrl(process.env.EXPO_PUBLIC_API_URL);

const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 120000,
});

apiClient.interceptors.request.use(
  async (config) => {
    try {
      const AsyncStorage = require('@react-native-async-storage/async-storage').default;
      const stored = await AsyncStorage.getItem('auth');
      if (stored) {
        const authData = JSON.parse(stored);
        if (authData.token && config.headers) {
          config.headers.Authorization = `Bearer ${authData.token}`;
        }
      }
    } catch (error) {
      console.log('Error getting auth token:', error);
    }

    console.log(`[API] ${config.method?.toUpperCase()} ${config.baseURL}${config.url}`);
    return config;
  },
  (error) => Promise.reject(error)
);

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    if (error.response) {
      if (error.response.status === 401) {
        try {
          const AsyncStorage = require('@react-native-async-storage/async-storage').default;
          await AsyncStorage.removeItem('auth');
        } catch (storageError) {
          console.log('Error clearing auth state:', storageError);
        }
      }

      console.error('API Error:', error.response.data);
      return Promise.reject(error.response.data);
    }

    return Promise.reject({ success: false, error: 'Network error' });
  }
);

export const apiGet = <T>(url: string, config?: AxiosRequestConfig) => apiClient.get<T>(url, config);

export const apiPost = <T>(url: string, data?: unknown, config?: AxiosRequestConfig) =>
  apiClient.post<T>(url, data, config);

export const apiPut = <T>(url: string, data?: unknown, config?: AxiosRequestConfig) =>
  apiClient.put<T>(url, data, config);

export const apiDelete = <T>(url: string, config?: AxiosRequestConfig) =>
  apiClient.delete<T>(url, config);

export default apiClient;
