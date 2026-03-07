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
  return response.data;
};

/**
 * Register a new user
 */
export const signup = async (form: SignupForm): Promise<ApiResponse<AuthResponse>> => {
  const response = await apiPost<ApiResponse<AuthResponse>>('/auth/signup', form);
  return response.data;
};

export const register = signup;
