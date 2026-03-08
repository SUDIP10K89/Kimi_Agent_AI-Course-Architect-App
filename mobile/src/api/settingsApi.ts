/**
 * Settings API service for the mobile app.
 */

import type { ApiResponse, ApiSettings, SettingsResponse, TestSettingsResponse } from '@/types';
import { apiGet, apiPost, apiPut } from './client';

export const getSettings = async (): Promise<ApiResponse<SettingsResponse>> => {
  const response = await apiGet<ApiResponse<SettingsResponse>>('/users/settings');
  return response.data;
};

export const updateSettings = async (
  apiSettings: ApiSettings
): Promise<ApiResponse<SettingsResponse>> => {
  const response = await apiPut<ApiResponse<SettingsResponse>>('/users/settings', {
    apiSettings,
  });
  return response.data;
};

export const testSettings = async (
  apiKey: string,
  model: string,
  baseUrl: string
): Promise<ApiResponse<TestSettingsResponse>> => {
  const response = await apiPost<ApiResponse<TestSettingsResponse>>('/users/settings/test', {
    apiKey,
    model,
    baseUrl,
  });
  return response.data;
};

export default {
  getSettings,
  updateSettings,
  testSettings,
};
