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
  return response.data;
};

export const signup = async (name: string, email: string, password: string): Promise<ApiResponse<AuthResponse>> => {
  const response = await apiPost<ApiResponse<AuthResponse>>('/auth/signup', { name, email, password });
  return response.data;
};

export default {
  login,
  signup,
};
