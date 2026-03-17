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
  
  // Check if the response indicates an error (even with 200 status due to validateStatus)
  if (!result.success) {
    // Check if this is a verification required error
    if (result.needsVerification) {
      const error: any = new Error(result.error || 'Please verify your email');
      error.needsVerification = true;
      error.email = result.email;
      throw error;
    }
    // Throw other errors
    throw new Error(result.error || 'Login failed');
  }
  return result;
};

export const signup = async (name: string, email: string, password: string): Promise<ApiResponse<AuthResponse>> => {
  const response = await apiPost<ApiResponse<AuthResponse>>('/auth/signup', { name, email, password });
  return response.data;
};

/**
 * Verify email with OTP
 */
export const verifyEmail = async (email: string, otp: string): Promise<ApiResponse<AuthResponse>> => {
  const response = await apiPost<ApiResponse<AuthResponse>>('/auth/verify-email', { email, otp });
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
