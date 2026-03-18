import OpenAI from 'openai';

import User from './user.model.js';
import { encryptSecret } from '../../shared/utils/secrets.js';

const DEFAULT_MODEL = 'gemini-2.5-flash';
const DEFAULT_BASE_URL = 'https://generativelanguage.googleapis.com/v1beta/openai/';

const isValidTimeZone = (timeZone) => {
  if (!timeZone) return false;
  try {
    new Intl.DateTimeFormat('en-US', { timeZone }).format(new Date());
    return true;
  } catch {
    return false;
  }
};

const formatLocalDate = (date, timeZone) => (
  new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date)
);

const subtractOneDay = (yyyyMmDd) => {
  const [year, month, day] = yyyyMmDd.split('-').map(Number);
  const utcDate = new Date(Date.UTC(year, month - 1, day));
  utcDate.setUTCDate(utcDate.getUTCDate() - 1);
  return utcDate.toISOString().slice(0, 10);
};

const applyStreakDecay = async (user, now = new Date()) => {
  let didChange = false;

  if (!user.timezone) {
    user.timezone = 'UTC';
    didChange = true;
  }

  if (!user.streak) {
    user.streak = { current: 0, longest: 0, lastCompletedDate: null };
    didChange = true;
  }

  const timeZone = isValidTimeZone(user.timezone) ? user.timezone : 'UTC';
  const today = formatLocalDate(now, timeZone);
  const lastCompleted = user.streak?.lastCompletedDate;
  const yesterday = subtractOneDay(today);

  if (lastCompleted && (lastCompleted === today || lastCompleted === yesterday)) {
    if (didChange) {
      await user.save();
    }
    return user;
  }

  if (user.streak?.current !== 0) {
    user.streak.current = 0;
    didChange = true;
  }

  if (didChange) {
    await user.save();
  }

  return user;
};

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

export const getUserProfile = async (userId) => {
  const user = await User.findById(userId);
  if (!user) {
    const error = new Error('User not found');
    error.statusCode = 404;
    throw error;
  }

  await applyStreakDecay(user);
  return user.toJSON();
};

export const updateUserStreak = async (userId, { timeZone, completedAt = new Date() } = {}) => {
  const user = await User.findById(userId);
  if (!user) {
    const error = new Error('User not found');
    error.statusCode = 404;
    throw error;
  }

  const normalizedTimeZone = isValidTimeZone(timeZone) ? timeZone : null;
  const effectiveTimeZone = normalizedTimeZone || (isValidTimeZone(user.timezone) ? user.timezone : 'UTC');

  if (normalizedTimeZone && normalizedTimeZone !== user.timezone) {
    user.timezone = normalizedTimeZone;
  }

  if (!user.streak) {
    user.streak = { current: 0, longest: 0, lastCompletedDate: null };
  }

  const today = formatLocalDate(completedAt, effectiveTimeZone);
  const yesterday = subtractOneDay(today);
  const lastCompleted = user.streak.lastCompletedDate;

  if (lastCompleted === today) {
    await user.save();
    return user.streak;
  }

  if (lastCompleted === yesterday) {
    user.streak.current = (user.streak.current || 0) + 1;
  } else {
    user.streak.current = 1;
  }

  user.streak.longest = Math.max(user.streak.longest || 0, user.streak.current);
  user.streak.lastCompletedDate = today;

  await user.save();
  return user.streak;
};

export default {
  getUserSettings,
  getUserProfile,
  testUserSettings,
  updateUserStreak,
  updateUserSettings,
};
