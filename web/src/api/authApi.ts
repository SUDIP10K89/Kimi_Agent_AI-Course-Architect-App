/**
 * Authentication API Service
 *
 * Handles login and signup HTTP requests to the backend.
 * Uses the unified API client from client.ts
 */

import type { ApiResponse, AuthResponse } from '@/types';
import { apiPost } from './client';

export const login = async (email: string, password: string): Promise<ApiResponse<AuthResponse>> => {
  const response = await apiPost<ApiResponse<AuthResponse>>('/auth/login', { email, password });
  const result = response.data;
  // Check if response indicates verification is needed
  if (result && !result.success && result.needsVerification) {
    const error: any = new Error(result.error || 'Please verify your email');
    error.needsVerification = true;
    error.email = result.email;
    throw error;
  }
  return result;
};

export const signup = async (name: string, email: string, password: string): Promise<ApiResponse<AuthResponse>> => {
  const response = await apiPost<ApiResponse<AuthResponse>>('/auth/signup', { name, email, password });
  return response.data;
};

/**
 * Verify email with token
 */
export const verifyEmail = async (token: string): Promise<ApiResponse<AuthResponse>> => {
  const response = await apiPost<ApiResponse<AuthResponse>>('/auth/verify-email', { token });
  return response.data;
};

/**
 * Resend verification email
 */
export const resendVerification = async (email: string): Promise<ApiResponse<{ message: string }>> => {
  const response = await apiPost<ApiResponse<{ message: string }>>('/auth/resend-verification', { email });
  return response.data;
};

export default {
  login,
  signup,
  verifyEmail,
  resendVerification,
};
