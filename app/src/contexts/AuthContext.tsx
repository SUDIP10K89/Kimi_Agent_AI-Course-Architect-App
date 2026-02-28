/**
 * Authentication Context
 *
 * Provides user/token state and helpers for login, signup, logout.
 * Uses the unified API client from client.ts
 */

import React, { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import type { User } from '@/types';
import * as authApi from '@/api/authApi';
import { setAuthToken } from '@/api/client';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem('auth');
      if (stored) {
        const parsed = JSON.parse(stored) as { user: User; token: string };
        setUser(parsed.user);
        setToken(parsed.token);
        setAuthToken(parsed.token);
      }
    } catch (err) {
      console.warn('failed to load auth from storage', err);
    }
  }, []);

  // Persist any change
  useEffect(() => {
    if (token && user) {
      localStorage.setItem('auth', JSON.stringify({ user, token }));
      setAuthToken(token);
    } else {
      localStorage.removeItem('auth');
      setAuthToken(null);
    }
  }, [token, user]);

  const login = async (email: string, password: string) => {
    const response = await authApi.login(email, password);
    if (response.success) {
      setUser(response.data.user);
      setToken(response.data.token);
      localStorage.setItem('auth', JSON.stringify({ user: response.data.user, token: response.data.token }));
      setAuthToken(response.data.token);
    } else {
      throw new Error(response.error || 'Login failed');
    }
  };

  const signup = async (name: string, email: string, password: string) => {
    const response = await authApi.signup(name, email, password);
    if (response.success) {
      setUser(response.data.user);
      setToken(response.data.token);
      localStorage.setItem('auth', JSON.stringify({ user: response.data.user, token: response.data.token }));
      setAuthToken(response.data.token);
    } else {
      throw new Error(response.error || 'Signup failed');
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
  };

  const value: AuthContextType = {
    user,
    token,
    isAuthenticated: !!token,
    login,
    signup,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
