/**
 * Unified API Client
 * 
 * Single axios instance for all API requests.
 * Handles auth token injection and global error handling.
 */

import axios, { type AxiosInstance, type AxiosRequestConfig } from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Create single axios instance
const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 120000, // 2 minutes timeout for long-running requests
});

// ============================================
// Request Interceptors
// ============================================

// Attach auth token from localStorage
apiClient.interceptors.request.use(
  (config) => {
    let token: string | null = null;
    const stored = localStorage.getItem('auth');
    if (stored) {
      try {
        token = JSON.parse(stored).token;
      } catch {
        // Ignore parse errors
      }
    }
    if (token && config.headers) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Request logging interceptor
apiClient.interceptors.request.use(
  (config) => {
    console.log(`📡 API Request: ${config.method?.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => Promise.reject(error)
);

// ============================================
// Response Interceptors
// ============================================

// Global error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (axios.isAxiosError(error) && error.response) {
      const responseData = error.response.data as { success?: boolean; error?: string; code?: string };
      
      // Auto logout on 401
      if (error.response.status === 401) {
        localStorage.removeItem('auth');
        
        // Check for specific error codes
        if (responseData?.code === 'TOKEN_EXPIRED') {
          // Show session expired message before redirecting
          console.warn('Session expired. Please log in again.');
          window.location.href = '/login?expired=true';
        } else {
          window.location.href = '/login';
        }
      }
      console.error('API Error:', responseData);
      return Promise.reject(responseData);
    }
    return Promise.reject({ success: false, error: 'Network error' });
  }
);

// ============================================
// Auth Token Management
// ============================================

export const setAuthToken = (token: string | null) => {
  if (token) {
    apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  } else {
    delete apiClient.defaults.headers.common['Authorization'];
  }
};

export const removeAuthToken = () => {
  delete apiClient.defaults.headers.common['Authorization'];
};

// ============================================
// Typed Request Methods
// ============================================

export const apiGet = <T>(url: string, config?: AxiosRequestConfig) =>
  apiClient.get<T>(url, config);

export const apiPost = <T>(url: string, data?: unknown, config?: AxiosRequestConfig) =>
  apiClient.post<T>(url, data, config);

export const apiPut = <T>(url: string, data?: unknown, config?: AxiosRequestConfig) =>
  apiClient.put<T>(url, data, config);

export const apiDelete = <T>(url: string, config?: AxiosRequestConfig) =>
  apiClient.delete<T>(url, config);

export const apiPatch = <T>(url: string, data?: unknown, config?: AxiosRequestConfig) =>
  apiClient.patch<T>(url, data, config);

export default apiClient;
