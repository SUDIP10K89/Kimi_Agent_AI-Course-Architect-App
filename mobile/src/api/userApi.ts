/**
 * User API Service
 *
 * Handles user profile requests against the backend API.
 */

import type { ApiResponse, User } from '@/types';
import { apiGet } from './client';

export const getMe = async (): Promise<ApiResponse<{ user: User }>> => {
  const response = await apiGet<ApiResponse<{ user: User }>>('/users/me');
  return response.data;
};
