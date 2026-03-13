import { afterEach, expect, jest, test } from '@jest/globals';

import * as authService from '../src/modules/auth/auth.service.js';
import User from '../src/modules/users/user.model.js';

const originalFindOne = User.findOne;
const originalCreate = User.create;

afterEach(() => {
  User.findOne = originalFindOne;
  User.create = originalCreate;
  jest.restoreAllMocks();
});

test('signupUser creates a user and returns a token', async () => {
  User.findOne = async () => null;
  User.create = async ({ name, email }) => ({
    _id: 'user-1',
    name,
    email,
    toJSON() {
      return { _id: this._id, name: this.name, email: this.email };
    },
  });

  const result = await authService.signupUser({
    name: 'Test User',
    email: 'test@example.com',
    password: 'secret123',
  });

  expect(result.user.email).toBe('test@example.com');
  expect(typeof result.token).toBe('string');
  expect(result.token.length).toBeGreaterThan(0);
});

test('signupUser rejects duplicate emails', async () => {
  User.findOne = async () => ({ _id: 'existing-user' });

  await expect(authService.signupUser({
    name: 'Duplicate User',
    email: 'dup@example.com',
    password: 'secret123',
  })).rejects.toMatchObject({
    message: 'Email already in use',
    statusCode: 400,
  });
});

test('loginUser returns a token for valid credentials', async () => {
  User.findOne = () => ({
    select: async () => ({
      _id: 'user-2',
      name: 'Valid User',
      email: 'valid@example.com',
      password: 'hashed',
      comparePassword: async () => true,
      toJSON() {
        return { _id: this._id, name: this.name, email: this.email };
      },
    }),
  });

  const result = await authService.loginUser({
    email: 'valid@example.com',
    password: 'secret123',
  });

  expect(result.user.email).toBe('valid@example.com');
  expect(typeof result.token).toBe('string');
  expect(result.token.length).toBeGreaterThan(0);
});

test('loginUser rejects invalid credentials', async () => {
  User.findOne = () => ({
    select: async () => ({
      password: 'hashed',
      comparePassword: async () => false,
    }),
  });

  await expect(authService.loginUser({
    email: 'invalid@example.com',
    password: 'wrong',
  })).rejects.toMatchObject({
    message: 'Invalid credentials',
    statusCode: 401,
  });
});
