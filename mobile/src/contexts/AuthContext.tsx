/**
 * Auth Context
 * 
 * Manages authentication state including login, signup, logout, and token management.
 */

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { User, LoginForm, SignupForm, AuthResponse } from '@/types';
import * as authApi from '@/api/authApi';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (form: LoginForm) => Promise<void>;
  signup: (form: SignupForm) => Promise<void>;
  logout: () => Promise<void>;
  registerLogoutCallback: (callback: () => void | Promise<void>) => void;
  error: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const AUTH_STORAGE_KEY = 'auth';

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const logoutCallbacksRef = useRef<Array<() => void | Promise<void>>>([]);

  // Load auth from storage on mount
  useEffect(() => {
    loadStoredAuth();
  }, []);

  const loadStoredAuth = async () => {
    try {
      const stored = await AsyncStorage.getItem(AUTH_STORAGE_KEY);
      if (stored) {
        const authData: AuthResponse = JSON.parse(stored);
        setUser(authData.user);
        setToken(authData.token);
      }
    } catch (error) {
      console.error('Error loading stored auth:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (form: LoginForm) => {
    try {
      setError(null);
      setIsLoading(true);
      const response = await authApi.login(form);
      
      if (response.success) {
        const authData: AuthResponse = {
          user: response.data.user,
          token: response.data.token,
        };
        
        await AsyncStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(authData));
        setUser(authData.user);
        setToken(authData.token);
      } else {
        throw new Error(response.error || 'Login failed');
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || error.message || 'Login failed';
      setError(errorMessage);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const signup = async (form: SignupForm) => {
    try {
      setError(null);
      setIsLoading(true);
      const response = await authApi.signup(form);
      
      if (response.success) {
        const authData: AuthResponse = {
          user: response.data.user,
          token: response.data.token,
        };
        
        await AsyncStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(authData));
        setUser(authData.user);
        setToken(authData.token);
      } else {
        throw new Error(response.error || 'Signup failed');
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || error.message || 'Signup failed';
      setError(errorMessage);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      // Call all registered logout callbacks
      await Promise.all(logoutCallbacksRef.current.map(callback => callback()));
      logoutCallbacksRef.current = [];
      await AsyncStorage.removeItem(AUTH_STORAGE_KEY);
      setUser(null);
      setToken(null);
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  const registerLogoutCallback = useCallback((callback: () => void | Promise<void>) => {
    logoutCallbacksRef.current.push(callback);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!user && !!token,
        isLoading,
        login,
        signup,
        logout,
        registerLogoutCallback,
        error,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
