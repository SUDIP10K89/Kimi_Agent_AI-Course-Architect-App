import OpenAI from 'openai';

import User from './user.model.js';
import { encryptSecret } from '../../shared/utils/secrets.js';

const DEFAULT_MODEL = 'gemini-2.5-flash';
const DEFAULT_BASE_URL = 'https://generativelanguage.googleapis.com/v1beta/openai/';

export const getUserSettings = async (userId) => {
  const user = await User.findById(userId).select('+apiSettings.apiKey');
  if (!user) {
    const error = new Error('User not found');
    error.statusCode = 404;
    throw error;
  }

  const settings = user.apiSettings || {};
  return {
    model: settings.model || DEFAULT_MODEL,
    baseUrl: settings.baseUrl || DEFAULT_BASE_URL,
    useCustomProvider: settings.useCustomProvider || false,
    hasApiKey: !!settings.apiKey,
  };
};

export const updateUserSettings = async (userId, apiSettings) => {
  const updateFields = {};
  const existingUser = await User.findById(userId).select('+apiSettings.apiKey');
  const existingApiKey = existingUser?.apiSettings?.apiKey;

  if (apiSettings.apiKey !== undefined) {
    if (apiSettings.apiKey !== '') {
      updateFields['apiSettings.apiKey'] = encryptSecret(apiSettings.apiKey.trim());
    } else if (existingApiKey) {
      // Preserve existing key.
    }
  }

  if (apiSettings.model !== undefined) {
    updateFields['apiSettings.model'] = apiSettings.model.trim() || DEFAULT_MODEL;
  }

  if (apiSettings.baseUrl !== undefined) {
    updateFields['apiSettings.baseUrl'] = apiSettings.baseUrl.trim() || DEFAULT_BASE_URL;
  }

  if (apiSettings.useCustomProvider !== undefined) {
    updateFields['apiSettings.useCustomProvider'] = Boolean(apiSettings.useCustomProvider);
  }

  const updatedUser = await User.findByIdAndUpdate(
    userId,
    { $set: updateFields },
    { new: true, runValidators: true }
  ).select('+apiSettings.apiKey');

  if (!updatedUser) {
    const error = new Error('User not found');
    error.statusCode = 404;
    throw error;
  }

  const settings = updatedUser.apiSettings || {};
  return {
    model: settings.model || DEFAULT_MODEL,
    baseUrl: settings.baseUrl || DEFAULT_BASE_URL,
    useCustomProvider: settings.useCustomProvider || false,
    hasApiKey: !!settings.apiKey,
  };
};

export const testUserSettings = async ({ apiKey, model, baseUrl }) => {
  const client = new OpenAI({
    apiKey,
    baseURL: baseUrl,
  });

  const response = await client.models.list();
  return {
    available: true,
    modelsCount: response.data?.length || 0,
    model,
  };
};

export default {
  getUserSettings,
  testUserSettings,
  updateUserSettings,
};
