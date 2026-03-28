/**
 * Auth helpers for simulated flow.
 */

import type { AuthResponse, User } from '@/types';

export const isValidEmail = (email: string): boolean => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

export const nameFromEmail = (email: string): string => {
  const prefix = email.split('@')[0] || 'User';
  const cleaned = prefix.replace(/[._-]+/g, ' ').trim();
  if (!cleaned) return 'User';
  return cleaned
    .split(' ')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
};

export const buildMockAuth = (email: string, name?: string): AuthResponse => {
  const now = Date.now();
  const user: User = {
    _id: `mock_${now}`,
    name: name || nameFromEmail(email),
    email,
  };
  return {
    user,
    token: `mock_token_${now}`,
  };
};

