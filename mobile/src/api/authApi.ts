/**
 * Auth API Service
 *
 * Handles authentication HTTP requests to the backend API.
 */

import type { ApiResponse, AuthResponse, LoginForm, SignupForm } from '@/types';
import { apiPost } from './client';

// ============================================
// Auth API Methods
// ============================================

/**
 * Login with email and password
 */
export const login = async (form: LoginForm): Promise<ApiResponse<AuthResponse>> => {
  const response = await apiPost<ApiResponse<AuthResponse>>('/auth/login', form);
  const result = response.data;
  
  // Check if the response indicates an error
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

/**
 * Register a new user
 */
export const signup = async (form: SignupForm): Promise<ApiResponse<AuthResponse>> => {
  const response = await apiPost<ApiResponse<AuthResponse>>('/auth/signup', form);
  return response.data;
};

export const register = signup;

/**
 * Verify email with OTP
 */
export const verifyEmail = async (email: string, otp: string): Promise<ApiResponse<AuthResponse>> => {
  const response = await apiPost<ApiResponse<AuthResponse>>('/auth/verify-email', { email, otp });
  const result = response.data;
  if (!result.success) {
    throw new Error(result.error || 'Email verification failed');
  }
  return result;
};

/**
 * Resend verification email
 */
export const resendVerification = async (email: string): Promise<ApiResponse<{ message: string }>> => {
  const response = await apiPost<ApiResponse<{ message: string }>>('/auth/resend-verification', { email });
  const result = response.data;
  if (!result.success) {
    throw new Error(result.error || 'Failed to resend verification email');
  }
  return result;
};

/**
 * Login with Google
 */
export const googleLogin = async (idToken: string): Promise<ApiResponse<AuthResponse>> => {
  const response = await apiPost<ApiResponse<AuthResponse>>('/auth/google', { idToken });
  return response.data;
};
