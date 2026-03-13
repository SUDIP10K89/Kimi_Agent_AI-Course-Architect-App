import { afterEach, expect, jest, test } from '@jest/globals';

import * as userService from '../src/modules/users/user.service.js';
import User from '../src/modules/users/user.model.js';

const originalFindById = User.findById;
const originalFindByIdAndUpdate = User.findByIdAndUpdate;

afterEach(() => {
  User.findById = originalFindById;
  User.findByIdAndUpdate = originalFindByIdAndUpdate;
  jest.restoreAllMocks();
});

test('getUserSettings returns masked settings metadata', async () => {
  User.findById = () => ({
    select: async () => ({
      apiSettings: {
        apiKey: 'enc:v1:iv:tag:data',
        model: 'gpt-test',
        baseUrl: 'https://api.example.com',
        useCustomProvider: true,
      },
    }),
  });

  const result = await userService.getUserSettings('user-1');

  expect(result).toEqual({
    model: 'gpt-test',
    baseUrl: 'https://api.example.com',
    useCustomProvider: true,
    hasApiKey: true,
  });
});

test('updateUserSettings encrypts api keys before persistence', async () => {
  let capturedUpdate;

  User.findById = () => ({
    select: async () => ({
      apiSettings: { apiKey: 'enc:v1:existing:tag:data' },
    }),
  });

  User.findByIdAndUpdate = (userId, update) => ({
    select: async () => {
      capturedUpdate = { userId, update };
      return {
        apiSettings: {
          apiKey: update.$set['apiSettings.apiKey'],
          model: update.$set['apiSettings.model'],
          baseUrl: update.$set['apiSettings.baseUrl'],
          useCustomProvider: update.$set['apiSettings.useCustomProvider'],
        },
      };
    },
  });

  const result = await userService.updateUserSettings('user-2', {
    apiKey: 'plain-secret',
    model: '',
    baseUrl: '',
    useCustomProvider: true,
  });

  expect(capturedUpdate.userId).toBe('user-2');
  expect(capturedUpdate.update.$set['apiSettings.apiKey'].startsWith('enc:v1:')).toBe(true);
  expect(capturedUpdate.update.$set['apiSettings.apiKey']).not.toBe('plain-secret');
  expect(result).toEqual({
    model: 'gemini-2.5-flash',
    baseUrl: 'https://generativelanguage.googleapis.com/v1beta/openai/',
    useCustomProvider: true,
    hasApiKey: true,
  });
});
