/**
 * Settings API Service
 * 
 * Handles all HTTP requests to the backend API for user settings.
 */

import type { ApiResponse } from '@/types';
import { apiGet, apiPost, apiPut } from './client';

// ============================================
// Types
// ============================================

export interface ApiSettings {
  apiKey?: string;
  model: string;
  baseUrl: string;
  useCustomProvider: boolean;
}

export interface SettingsResponse {
  apiSettings: {
    model: string;
    baseUrl: string;
    useCustomProvider: boolean;
    hasApiKey: boolean;
  };
}

export interface TestSettingsResponse {
  available: boolean;
  modelsCount?: number;
}

// ============================================
// Settings API Methods
// ============================================

/**
 * Get current user's settings
 */
export const getSettings = async (): Promise<ApiResponse<SettingsResponse>> => {
  const response = await apiGet<ApiResponse<SettingsResponse>>('/users/settings');
  return response.data;
};

/**
 * Update user's API settings
 */
export const updateSettings = async (
  apiSettings: ApiSettings
): Promise<ApiResponse<SettingsResponse>> => {
  const response = await apiPut<ApiResponse<SettingsResponse>>('/users/settings', {
    apiSettings,
  });
  return response.data;
};

/**
 * Test API settings by making a test API call
 */
export const testSettings = async (
  apiKey: string,
  model: string,
  baseUrl: string
): Promise<ApiResponse<TestSettingsResponse>> => {
  const response = await apiPost<ApiResponse<TestSettingsResponse>>(
    '/users/settings/test',
    { apiKey, model, baseUrl }
  );
  return response.data;
};

export default {
  getSettings,
  updateSettings,
  testSettings,
};
