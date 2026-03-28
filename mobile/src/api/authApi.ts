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

/**
 * Request password reset OTP
 */
export const forgotPassword = async (email: string): Promise<ApiResponse<{ message: string }>> => {
  const response = await apiPost<ApiResponse<{ message: string }>>('/auth/forgot-password', { email });
  const result = response.data;
  if (!result.success) {
    throw new Error(result.error || 'Failed to send reset code');
  }
  return result;
};

/**
 * Verify reset OTP, returns resetToken
 */
export const verifyResetOtp = async (email: string, otp: string): Promise<ApiResponse<{ resetToken: string }>> => {
  const response = await apiPost<ApiResponse<{ resetToken: string }>>('/auth/verify-reset-otp', { email, otp });
  const result = response.data;
  if (!result.success) {
    throw new Error(result.error || 'Invalid or expired OTP');
  }
  return result;
};

/**
 * Reset password using reset token
 */
export const resetPassword = async (
  email: string,
  resetToken: string,
  newPassword: string
): Promise<ApiResponse<AuthResponse>> => {
  const response = await apiPost<ApiResponse<AuthResponse>>('/auth/reset-password', {
    email,
    resetToken,
    newPassword,
  });
  const result = response.data;
  if (!result.success) {
    throw new Error(result.error || 'Password reset failed');
  }
  return result;
};

/**
 * Resend reset OTP
 */
export const resendResetOtp = async (email: string): Promise<ApiResponse<{ message: string }>> => {
  const response = await apiPost<ApiResponse<{ message: string }>>('/auth/resend-reset-otp', { email });
  const result = response.data;
  if (!result.success) {
    throw new Error(result.error || 'Failed to resend reset code');
  }
  return result;
};
